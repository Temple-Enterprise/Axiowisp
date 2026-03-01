import React from 'react';

export function renderMarkdown(text: string): React.ReactNode[] {
    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.trimStart().startsWith('```')) {
            const lang = line.trimStart().slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++;

            elements.push(
                <div key={`code-${elements.length}`} className="md-code-block">
                    {lang && <span className="md-code-lang">{lang}</span>}
                    <pre className="md-pre"><code>{codeLines.join('\n')}</code></pre>
                </div>,
            );
            continue;
        }

        elements.push(
            <p key={`p-${elements.length}`} className="md-paragraph">
                {renderInline(line)}
            </p>,
        );
        i++;
    }

    return elements;
}

function renderInline(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        if (match[1]) {
            nodes.push(<strong key={`b-${key++}`}>{match[2]}</strong>);
        } else if (match[3]) {
            nodes.push(<em key={`i-${key++}`}>{match[4]}</em>);
        } else if (match[5]) {
            nodes.push(<code key={`c-${key++}`} className="md-inline-code">{match[6]}</code>);
        } else if (match[7]) {
            nodes.push(
                <a key={`a-${key++}`} href={match[9]} className="md-link" target="_blank" rel="noopener noreferrer">
                    {match[8]}
                </a>,
            );
        }
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}
