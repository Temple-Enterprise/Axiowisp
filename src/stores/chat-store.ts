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

async function callAnthropic(
    messages: { role: string; content: string }[],
    apiKey: string,
    model: string,
): Promise<string> {
    // Anthropic expects system prompt to be separate
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'dangerously-allow-browser': 'true', // Needed for local dev if not proxied
        },
        body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: systemMessage?.content,
            messages: userMessages.map(m => ({
                role: m.role,
                content: m.content
            })),
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text ?? 'No response';
}

async function callGemini(
    messages: { role: string; content: string }[],
    apiKey: string,
    model: string,
): Promise<string> {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            })).filter(m => m.role !== 'system'), // Gemini often handles system instructions differently, but basic chat can ignore or merge.
            // For better system prompt handling in Gemini, we can put it in 'systemInstruction' if supported or prepend to first user message.
            // Here we'll map system prompt to systemInstruction if using a model that supports it, or just prepend.
            systemInstruction: messages.find(m => m.role === 'system') ? {
                parts: [{ text: messages.find(m => m.role === 'system')?.content || '' }]
            } : undefined,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response';
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
        const settings = useSettingsStore.getState();
        const { activeProvider } = settings;

        let aiContent: string = '';

        try {
            // Validation
            if (activeProvider === 'openai' && !settings.openaiApiKey) throw new Error('OpenAI API key missing.');
            if (activeProvider === 'anthropic' && !settings.anthropicApiKey) throw new Error('Anthropic API key missing.');
            if (activeProvider === 'gemini' && !settings.geminiApiKey) throw new Error('Gemini API key missing.');

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

            if (activeProvider === 'openai') {
                aiContent = await callOpenAI(apiMessages, settings.openaiApiKey, settings.openaiModel);
            } else if (activeProvider === 'anthropic') {
                aiContent = await callAnthropic(apiMessages, settings.anthropicApiKey, settings.anthropicModel);
            } else if (activeProvider === 'gemini') {
                aiContent = await callGemini(apiMessages, settings.geminiApiKey, settings.geminiModel);
            }

            // Check if the AI response contains file edits and apply them
            const applied = await applyFileEdits(aiContent);
            if (applied.length > 0) {
                aiContent += `\n\n✅ Applied changes to: ${applied.map(f => `\`${f}\``).join(', ')}`;
            }
        } catch (err: any) {
            aiContent = `❌ **Error:** ${err.message}`;
            if (err.message.includes('key missing')) {
                aiContent += ' Please check your Settings.';
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
