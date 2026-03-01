import { create } from 'zustand';
import { useSettingsStore } from './settings-store';

export interface ReviewIssue {
    category: 'security' | 'performance' | 'suggestion' | 'bug' | 'style';
    severity: 'high' | 'medium' | 'low';
    line?: number;
    message: string;
}

interface ReviewState {
    isReviewing: boolean;
    reviewFilePath: string | null;
    reviewFileName: string | null;
    issues: ReviewIssue[];
    summary: string;
    error: string | null;
    reviewFile: (filePath: string) => Promise<void>;
    clearReview: () => void;
}

const REVIEW_PROMPT = `You are an expert code reviewer. Analyze the following file and provide a structured code review.

Return your review in EXACTLY this format — each issue on its own line with the given prefix markers. Do NOT use any other format:

SUMMARY: A 1-2 sentence overall assessment.

ISSUE [category] [severity] [line?]: description
ISSUE [category] [severity] [line?]: description
...

Where:
- category is one of: security, performance, suggestion, bug, style
- severity is one of: high, medium, low
- line is optional (the line number if applicable, or omit)

Example:
SUMMARY: The code is generally well-structured but has a potential SQL injection vulnerability and some performance concerns.

ISSUE [security] [high] [42]: User input is directly interpolated into an SQL query without sanitization.
ISSUE [performance] [medium] [15]: This loop creates a new array on every iteration; consider using a map.
ISSUE [suggestion] [low]: Consider adding JSDoc comments to exported functions.
ISSUE [style] [low] [8]: Inconsistent naming convention — mix of camelCase and snake_case.

Be thorough but concise. Only report real issues, not trivial nitpicks.`;

function parseReviewResponse(text: string): { summary: string; issues: ReviewIssue[] } {
    const lines = text.split('\n');
    let summary = '';
    const issues: ReviewIssue[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('SUMMARY:')) {
            summary = trimmed.substring(8).trim();
        } else if (trimmed.startsWith('ISSUE')) {
            const match = trimmed.match(/ISSUE\s*\[(\w+)\]\s*\[(\w+)\]\s*(?:\[(\d+)\])?\s*:\s*(.+)/);
            if (match) {
                issues.push({
                    category: match[1] as ReviewIssue['category'],
                    severity: match[2] as ReviewIssue['severity'],
                    line: match[3] ? parseInt(match[3]) : undefined,
                    message: match[4],
                });
            }
        }
    }

    if (!summary && issues.length === 0) {
        summary = text.substring(0, 200);
    }

    return { summary, issues };
}

async function callAI(prompt: string, fileContent: string): Promise<string> {
    const settings = useSettingsStore.getState();
    const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: `Review this file:\n\n${fileContent}` },
    ];

    const provider = settings.activeProvider;

    if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.openaiApiKey}` },
            body: JSON.stringify({ model: settings.openaiModel, messages, max_tokens: 4096, temperature: 0.3 }),
        });
        if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content ?? '';
    }

    if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': settings.anthropicApiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'dangerously-allow-browser': 'true' },
            body: JSON.stringify({ model: settings.anthropicModel, max_tokens: 4096, system: prompt, messages: [{ role: 'user', content: `Review this file:\n\n${fileContent}` }] }),
        });
        if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
        const data = await res.json();
        return data.content?.[0]?.text ?? '';
    }

    if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel}:generateContent?key=${settings.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `Review this file:\n\n${fileContent}` }] }],
                systemInstruction: { parts: [{ text: prompt }] },
            }),
        });
        if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    throw new Error('No AI provider configured');
}

export const useReviewStore = create<ReviewState>((set) => ({
    isReviewing: false,
    reviewFilePath: null,
    reviewFileName: null,
    issues: [],
    summary: '',
    error: null,

    reviewFile: async (filePath: string) => {
        const fileName = filePath.split(/[\\/]/).pop() || filePath;
        set({ isReviewing: true, reviewFilePath: filePath, reviewFileName: fileName, issues: [], summary: '', error: null });

        try {
            const result = await window.electronAPI.readFile(filePath);
            if (!result.success || !result.data) throw new Error('Failed to read file');

            const response = await callAI(REVIEW_PROMPT, result.data);
            const { summary, issues } = parseReviewResponse(response);
            set({ isReviewing: false, summary, issues });
        } catch (err: any) {
            set({ isReviewing: false, error: err.message });
        }
    },

    clearReview: () => set({ isReviewing: false, reviewFilePath: null, reviewFileName: null, issues: [], summary: '', error: null }),
}));
