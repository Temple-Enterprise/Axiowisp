import { create } from 'zustand';
import { ChatMessage } from '../../shared/types';

interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    sendMessage: (content: string) => void;
    clearMessages: () => void;
}

let messageIdCounter = 0;

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
            max_tokens: 2048,
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

        // Get API key from settings store (imported dynamically to avoid circular deps)
        const { useSettingsStore } = await import('./settings-store');
        const { openaiApiKey, openaiModel } = useSettingsStore.getState();

        let aiContent: string;

        if (!openaiApiKey) {
            aiContent = 'Please set your OpenAI API key in Settings (gear icon) to use AI Chat.';
        } else {
            try {
                // Build message history for context
                const history = get().messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

                // Add system message
                const apiMessages = [
                    {
                        role: 'system',
                        content:
                            'You are Axiowisp AI, a helpful coding assistant built into the Axiowisp IDE. ' +
                            'Help users with coding questions, debugging, and code generation. ' +
                            'Be concise and use markdown formatting for code.',
                    },
                    ...history,
                ];

                aiContent = await callOpenAI(apiMessages, openaiApiKey, openaiModel);
            } catch (err: any) {
                aiContent = `Error: ${err.message}`;
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
