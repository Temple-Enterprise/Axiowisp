import { useSettingsStore } from '../stores/settings-store';



let abortController: AbortController | null = null;

const INLINE_PROMPT = `You are an AI code autocomplete engine. Given the code context, predict the NEXT few tokens or lines the developer is most likely to type. Return ONLY the completion text — no explanations, no markdown, no code fences. Just raw code that continues from the cursor position.`;

async function getCompletion(prefix: string, suffix: string, language: string): Promise<string> {
    const settings = useSettingsStore.getState();
    const provider = settings.activeProvider;

    const prompt = `Language: ${language}\n\nCode before cursor:\n${prefix.slice(-1500)}\n\nCode after cursor:\n${suffix.slice(0, 500)}`;

    if (abortController) abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    try {
        if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.openaiApiKey}` },
                body: JSON.stringify({
                    model: settings.openaiModel,
                    messages: [{ role: 'system', content: INLINE_PROMPT }, { role: 'user', content: prompt }],
                    max_tokens: 256,
                    temperature: 0.2,
                    stop: ['\n\n\n'],
                }),
                signal,
            });
            if (!res.ok) return '';
            const data = await res.json();
            return data.choices?.[0]?.message?.content?.trim() ?? '';
        }

        if (provider === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': settings.anthropicApiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'dangerously-allow-browser': 'true',
                },
                body: JSON.stringify({
                    model: settings.anthropicModel,
                    max_tokens: 256,
                    system: INLINE_PROMPT,
                    messages: [{ role: 'user', content: prompt }],
                }),
                signal,
            });
            if (!res.ok) return '';
            const data = await res.json();
            return data.content?.[0]?.text?.trim() ?? '';
        }

        if (provider === 'gemini') {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel}:generateContent?key=${settings.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        systemInstruction: { parts: [{ text: INLINE_PROMPT }] },
                        generationConfig: { maxOutputTokens: 256, temperature: 0.2 },
                    }),
                    signal,
                },
            );
            if (!res.ok) return '';
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
        }
    } catch {
    }

    return '';
}

export function registerGhostTextProvider(monaco: any, editor: any): void {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const provider = {
        provideInlineCompletions: async (model: any, position: any, _context: any, token: any) => {
            if (debounceTimer) clearTimeout(debounceTimer);

            return new Promise<any>((resolve) => {
                debounceTimer = setTimeout(async () => {
                    if (token.isCancellationRequested) {
                        resolve({ items: [] });
                        return;
                    }

                    const settings = useSettingsStore.getState();
                    const hasKey =
                        (settings.activeProvider === 'openai' && settings.openaiApiKey) ||
                        (settings.activeProvider === 'anthropic' && settings.anthropicApiKey) ||
                        (settings.activeProvider === 'gemini' && settings.geminiApiKey);

                    if (!hasKey) {
                        resolve({ items: [] });
                        return;
                    }

                    const textModel = model;
                    const offset = textModel.getOffsetAt(position);
                    const fullText = textModel.getValue();
                    const prefix = fullText.substring(0, offset);
                    const suffix = fullText.substring(offset);
                    const language = textModel.getLanguageId();

                    const completion = await getCompletion(prefix, suffix, language);

                    if (!completion || token.isCancellationRequested) {
                        resolve({ items: [] });
                        return;
                    }

                    resolve({
                        items: [
                            {
                                insertText: completion,
                                range: {
                                    startLineNumber: position.lineNumber,
                                    startColumn: position.column,
                                    endLineNumber: position.lineNumber,
                                    endColumn: position.column,
                                },
                            },
                        ],
                    });
                }, 800);
            });
        },

        freeInlineCompletions: () => { },
    };

    monaco.languages.registerInlineCompletionsProvider({ pattern: '**' }, provider);

    editor.updateOptions({
        inlineSuggest: { enabled: true },
    });
}
