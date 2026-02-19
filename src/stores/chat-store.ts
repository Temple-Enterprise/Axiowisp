import { create } from 'zustand';
import { ChatMessage } from '../../shared/types';

interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    sendMessage: (content: string) => void;
    clearMessages: () => void;
}

let messageIdCounter = 0;

/** Build workspace context: list files and optionally read key files. */
async function buildWorkspaceContext(): Promise<string> {
    if (!window.electronAPI?.listFiles) return '';

    try {
        // Get the workspace store to find the root path
        const { useWorkspaceStore } = await import('./workspace-store');
        const rootPath = useWorkspaceStore.getState().rootPath;
        if (!rootPath) return '';

        const result = await window.electronAPI.listFiles(rootPath);
        if (!result.success || !result.data) return '';

        const files = result.data;
        const fileList = files.map((f: string) => f.replace(rootPath, '').replace(/\\/g, '/')).join('\n');

        // Read currently open tabs for inline context
        const { useTabsStore } = await import('./tabs-store');
        const { tabs, activeTabId } = useTabsStore.getState();
        const activeTab = tabs.find(t => t.id === activeTabId);

        let activeFileContext = '';
        if (activeTab) {
            // Limit to first 200 lines to avoid token overflow
            const lines = activeTab.content.split('\n').slice(0, 200).join('\n');
            activeFileContext = `\n\nCurrently open file (${activeTab.fileName}):\n\`\`\`${activeTab.language}\n${lines}\n\`\`\``;
        }

        return `\n\nWorkspace root: ${rootPath}\n\nProject files:\n${fileList}${activeFileContext}`;
    } catch {
        return '';
    }
}

async function callOpenAI(
    messages: { role: string; content: string }[],
    apiKey: string,
    model: string,
): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 4096,
            temperature: 0.7,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? 'No response';
}

/** Try to apply AI-generated file edits. Format: FILE:path\n```\ncontent\n``` */
async function applyFileEdits(response: string): Promise<string[]> {
    const applied: string[] = [];
    // Match patterns like: **FILE: path/to/file**\n```\ncontent\n```
    const editPattern = /\*\*FILE:\s*(.+?)\*\*\s*\n```[\w]*\n([\s\S]*?)```/g;
    let match;

    while ((match = editPattern.exec(response)) !== null) {
        const filePath = match[1].trim();
        const content = match[2];

        if (window.electronAPI?.writeFile) {
            try {
                const result = await window.electronAPI.writeFile(filePath, content);
                if (result.success) {
                    applied.push(filePath);
                }
            } catch { /* ignore failed writes */ }
        }
    }

    return applied;
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    isLoading: false,

    sendMessage: async (content: string) => {
        const userMsg: ChatMessage = {
            id: `msg-${++messageIdCounter}`,
            role: 'user',
            content,
            timestamp: Date.now(),
        };

        set((state) => ({
            messages: [...state.messages, userMsg],
            isLoading: true,
        }));

        const { useSettingsStore } = await import('./settings-store');
        const { openaiApiKey, openaiModel } = useSettingsStore.getState();

        let aiContent: string;

        if (!openaiApiKey) {
            aiContent = '⚠️ **API key not set.** Please open Settings (gear icon) and enter your OpenAI API key to use AI Chat.';
        } else {
            try {
                // Build workspace context
                const workspaceCtx = await buildWorkspaceContext();

                // Build message history
                const history = get().messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

                const systemPrompt =
                    'You are Axiowisp AI, a powerful coding assistant built into the Axiowisp IDE. ' +
                    'You have full access to the user\'s project files and can view their code. ' +
                    'Help users with coding questions, debugging, code generation, and refactoring. ' +
                    'Use markdown formatting for code blocks. ' +
                    'When the user asks you to modify a file, output the full new file content in this format:\n' +
                    '**FILE: absolute/path/to/file**\n```language\nfull file content here\n```\n' +
                    'Always be concise and helpful.' +
                    workspaceCtx;

                const apiMessages = [
                    { role: 'system', content: systemPrompt },
                    ...history,
                ];

                aiContent = await callOpenAI(apiMessages, openaiApiKey, openaiModel);

                // Check if the AI response contains file edits and apply them
                const applied = await applyFileEdits(aiContent);
                if (applied.length > 0) {
                    aiContent += `\n\n✅ Applied changes to: ${applied.map(f => `\`${f}\``).join(', ')}`;
                }
            } catch (err: any) {
                aiContent = `❌ **Error:** ${err.message}`;
            }
        }

        const aiMsg: ChatMessage = {
            id: `msg-${++messageIdCounter}`,
            role: 'assistant',
            content: aiContent,
            timestamp: Date.now(),
        };

        set((state) => ({
            messages: [...state.messages, aiMsg],
            isLoading: false,
        }));
    },

    clearMessages: () => set({ messages: [] }),
}));
