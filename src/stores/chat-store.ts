import { create } from 'zustand';
import { ChatMessage } from '../../shared/types';

interface PendingEdit {
    filePath: string;
    content: string;
    language: string;
    lineCount: number;
    status: 'pending' | 'accepted' | 'rejected';
}

interface ChatMessageWithEdits extends ChatMessage {
    edits?: PendingEdit[];
}

interface ChatState {
    messages: ChatMessageWithEdits[];
    isLoading: boolean;
    sendMessage: (content: string) => void;
    clearMessages: () => void;
    acceptEdit: (messageId: string, editIndex: number) => Promise<void>;
    rejectEdit: (messageId: string, editIndex: number) => void;
}

let messageIdCounter = 0;

async function buildWorkspaceContext(): Promise<string> {
    if (!window.electronAPI?.listFiles) return '';

    try {
        const { useWorkspaceStore } = await import('./workspace-store');
        const rootPath = useWorkspaceStore.getState().rootPath;
        if (!rootPath) return '';

        const result = await window.electronAPI.listFiles(rootPath);
        if (!result.success || !result.data) return '';

        const files = result.data;
        const fileList = files.map((f: string) => f.replace(rootPath, '').replace(/\\/g, '/')).join('\n');

        const { useTabsStore } = await import('./tabs-store');
        const { tabs, activeTabId } = useTabsStore.getState();
        const activeTab = tabs.find(t => t.id === activeTabId);

        let activeFileContext = '';
        if (activeTab) {
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
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'dangerously-allow-browser': 'true',
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
            })).filter(m => m.role !== 'system'),
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

function parseFileEdits(response: string): PendingEdit[] {
    const edits: PendingEdit[] = [];
    const editPattern = /\*\*FILE:\s*(.+?)\*\*\s*\n```([\w]*)\n([\s\S]*?)```/g;
    let match;

    while ((match = editPattern.exec(response)) !== null) {
        const filePath = match[1].trim();
        const language = match[2] || 'plaintext';
        const content = match[3];
        const lineCount = content.split('\n').length;

        edits.push({
            filePath,
            content,
            language,
            lineCount,
            status: 'pending',
        });
    }

    return edits;
}

function stripFileBlocks(response: string): string {
    return response.replace(/\*\*FILE:\s*.+?\*\*\s*\n```[\w]*\n[\s\S]*?```/g, '').trim();
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    isLoading: false,

    sendMessage: async (content: string) => {
        const userMsg: ChatMessageWithEdits = {
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
            if (activeProvider === 'openai' && !settings.openaiApiKey) throw new Error('OpenAI API key missing.');
            if (activeProvider === 'anthropic' && !settings.anthropicApiKey) throw new Error('Anthropic API key missing.');
            if (activeProvider === 'gemini' && !settings.geminiApiKey) throw new Error('Gemini API key missing.');

            const workspaceCtx = await buildWorkspaceContext();

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
                'If you need to read a specific file to understand its contents before answering or deciding what to modify, output exactly this line and nothing else:\n' +
                '**READ: absolute/path/to/file**\n' +
                'I will then provide you with the contents of that file so you can respond properly.\n' +
                'Always be concise and helpful.' +
                workspaceCtx;

            let currentApiMessages = [
                { role: 'system', content: systemPrompt },
                ...history,
            ];

            let iterationCount = 0;
            const maxIterations = 3;

            while (iterationCount < maxIterations) {
                iterationCount++;

                if (activeProvider === 'openai') {
                    aiContent = await callOpenAI(currentApiMessages, settings.openaiApiKey, settings.openaiModel);
                } else if (activeProvider === 'anthropic') {
                    aiContent = await callAnthropic(currentApiMessages, settings.anthropicApiKey, settings.anthropicModel);
                } else if (activeProvider === 'gemini') {
                    aiContent = await callGemini(currentApiMessages, settings.geminiApiKey, settings.geminiModel);
                }

                const readMatch = /\*\*READ:\s*(.*?)\*\*/.exec(aiContent);
                if (readMatch && window.electronAPI?.readFile) {
                    const fileToRead = readMatch[1].trim();
                    console.log(`[Axiowisp AI Tool] AI reading file: ${fileToRead}`);

                    try {
                        const readResult = await window.electronAPI.readFile(fileToRead);
                        const fileContent = readResult.success && readResult.data
                            ? readResult.data
                            : `Error: Could not read file or file is empty.`;

                        currentApiMessages.push({ role: 'assistant', content: aiContent });
                        currentApiMessages.push({
                            role: 'system',
                            content: `Here is the requested content for ${fileToRead}:\n\`\`\`\n${fileContent}\n\`\`\`\nNow proceed with the user's request.`
                        });
                        continue;
                    } catch (err: any) {
                        currentApiMessages.push({ role: 'assistant', content: aiContent });
                        currentApiMessages.push({
                            role: 'system',
                            content: `Error reading file ${fileToRead}: ${err.message}`
                        });
                        continue;
                    }
                } else {
                    break;
                }
            }
        } catch (err: any) {
            aiContent = `**Error:** ${err.message}`;
            if (err.message.includes('key missing')) {
                aiContent += ' Please check your Settings.';
            }
        }

        const edits = parseFileEdits(aiContent);
        const cleanContent = edits.length > 0 ? stripFileBlocks(aiContent) : aiContent;

        const aiMsg: ChatMessageWithEdits = {
            id: `msg-${++messageIdCounter}`,
            role: 'assistant',
            content: cleanContent,
            timestamp: Date.now(),
            edits: edits.length > 0 ? edits : undefined,
        };

        set((state) => ({
            messages: [...state.messages, aiMsg],
            isLoading: false,
        }));
    },

    acceptEdit: async (messageId: string, editIndex: number) => {
        const { messages } = get();
        const msg = messages.find((m) => m.id === messageId);
        if (!msg?.edits?.[editIndex]) return;

        const edit = msg.edits[editIndex];

        if (window.electronAPI?.writeFile) {
            const result = await window.electronAPI.writeFile(edit.filePath, edit.content);
            if (result.success) {
                const { useTabsStore } = await import('./tabs-store');
                const refreshTab = useTabsStore.getState().refreshTab;
                await refreshTab(edit.filePath);
            }
        }

        set((state) => ({
            messages: state.messages.map((m) => {
                if (m.id !== messageId || !m.edits) return m;
                const newEdits = [...m.edits];
                newEdits[editIndex] = { ...newEdits[editIndex], status: 'accepted' };
                return { ...m, edits: newEdits };
            }),
        }));
    },

    rejectEdit: (messageId: string, editIndex: number) => {
        set((state) => ({
            messages: state.messages.map((m) => {
                if (m.id !== messageId || !m.edits) return m;
                const newEdits = [...m.edits];
                newEdits[editIndex] = { ...newEdits[editIndex], status: 'rejected' };
                return { ...m, edits: newEdits };
            }),
        }));
    },

    clearMessages: () => set({ messages: [] }),
}));
