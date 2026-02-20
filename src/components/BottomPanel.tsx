import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useUiStore } from '../stores/ui-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useSettingsStore } from '../stores/settings-store';
import { useOutputStore } from '../stores/output-store';
import { Terminal, FileOutput, X } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import './BottomPanel.css';

export const BottomPanel: React.FC = () => {
    const bottomPanelTab = useUiStore((s) => s.bottomPanelTab);
    const setBottomPanelTab = useUiStore((s) => s.setBottomPanelTab);
    const toggleBottomPanel = useUiStore((s) => s.toggleBottomPanel);
    const rootPath = useWorkspaceStore((s) => s.rootPath);
    const terminalFontSize = useSettingsStore((s) => s.terminalFontSize);

    const termRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitRef = useRef<FitAddon | null>(null);
    const termIdRef = useRef<number | null>(null);
    const initRef = useRef(false);
    const outputEndRef = useRef<HTMLDivElement>(null);

    const logs = useOutputStore((s) => s.logs);

    const focusTerminal = useCallback(() => {
        xtermRef.current?.focus();
    }, []);

    // Initialize terminal
    useEffect(() => {
        if (!termRef.current || initRef.current) return;
        initRef.current = true;

        const xterm = new XTerm({
            theme: {
                background: '#0d1117',
                foreground: '#e6edf3',
                cursor: '#58a6ff',
                selectionBackground: '#264f78',
                black: '#0d1117',
                red: '#f85149',
                green: '#3fb950',
                yellow: '#d29922',
                blue: '#58a6ff',
                magenta: '#bc8cff',
                cyan: '#76e3ea',
                white: '#e6edf3',
                brightBlack: '#6e7681',
                brightRed: '#ffa198',
                brightGreen: '#56d364',
                brightYellow: '#e3b341',
                brightBlue: '#79c0ff',
                brightMagenta: '#d2a8ff',
                brightCyan: '#b3f0ff',
                brightWhite: '#f0f6fc',
            },
            fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
            fontSize: terminalFontSize,
            lineHeight: 1.4,
            cursorBlink: true,
            cursorStyle: 'bar',
            convertEol: true,
        });

        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);
        xterm.open(termRef.current);

        setTimeout(() => {
            try { fitAddon.fit(); } catch { /* skip */ }
            xterm.focus();
        }, 150);

        xtermRef.current = xterm;
        fitRef.current = fitAddon;

        // Create a real terminal process via IPC
        if (window.electronAPI?.createTerminal) {
            window.electronAPI.createTerminal(rootPath || undefined).then((result) => {
                if (result.success && result.data !== undefined) {
                    termIdRef.current = result.data;
                    xterm.writeln('\x1b[32m● Terminal connected\x1b[0m\r\n');
                } else {
                    xterm.writeln(`\x1b[31m✗ Failed to create terminal: ${result.error || 'Unknown error'}\x1b[0m`);
                }
            }).catch((err: any) => {
                xterm.writeln(`\x1b[31m✗ Terminal error: ${err.message}\x1b[0m`);
            });

            // Receive data from the shell process
            window.electronAPI.onTerminalData((_id: number, data: string) => {
                xterm.write(data);
            });

            window.electronAPI.onTerminalExit((_id: number, code: number) => {
                xterm.writeln(`\r\n\x1b[33m● Process exited with code ${code}\x1b[0m`);
                termIdRef.current = null;
            });

            // Send keystrokes to the shell
            xterm.onData((data: string) => {
                if (termIdRef.current !== null) {
                    window.electronAPI.writeTerminal(termIdRef.current, data);
                }
            });
        } else {
            xterm.writeln('\x1b[33mTerminal requires Electron environment.\x1b[0m');
            xterm.writeln('Run the app with: npx tsc -p tsconfig.electron.json && npx electron .');
        }

        // Handle container resize
        const observer = new ResizeObserver(() => {
            try { fitAddon.fit(); } catch { /* ignore */ }
            if (termIdRef.current !== null && window.electronAPI?.resizeTerminal) {
                const dims = fitAddon.proposeDimensions();
                if (dims) {
                    window.electronAPI.resizeTerminal(termIdRef.current, dims.cols, dims.rows);
                }
            }
        });
        if (termRef.current) observer.observe(termRef.current);

        return () => {
            observer.disconnect();
            if (termIdRef.current !== null) {
                window.electronAPI?.disposeTerminal(termIdRef.current);
            }
            xterm.dispose();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Focus terminal when switching to the terminal tab
    useEffect(() => {
        if (bottomPanelTab === 'terminal') {
            setTimeout(focusTerminal, 50);
        }
    }, [bottomPanelTab, focusTerminal]);

    useEffect(() => {
        if (bottomPanelTab === 'output') {
            outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, bottomPanelTab]);

    return (
        <div className="bottom-panel">
            <div className="bottom-panel__header">
                <div className="bottom-panel__tabs">
                    <button
                        className={`bottom-panel__tab ${bottomPanelTab === 'terminal' ? 'bottom-panel__tab--active' : ''}`}
                        onClick={() => { setBottomPanelTab('terminal'); setTimeout(focusTerminal, 50); }}
                    >
                        <Terminal size={13} />
                        Terminal
                    </button>
                    <button
                        className={`bottom-panel__tab ${bottomPanelTab === 'output' ? 'bottom-panel__tab--active' : ''}`}
                        onClick={() => setBottomPanelTab('output')}
                    >
                        <FileOutput size={13} />
                        Output
                    </button>
                </div>
                <button className="bottom-panel__close" onClick={toggleBottomPanel}>
                    <X size={14} />
                </button>
            </div>
            <div className="bottom-panel__content">
                <div
                    ref={termRef}
                    className="bottom-panel__xterm"
                    style={{ display: bottomPanelTab === 'terminal' ? 'block' : 'none' }}
                    onClick={focusTerminal}
                />
                {bottomPanelTab === 'output' && (
                    <div className="bottom-panel__output">
                        {logs.map((log, i) => (
                            <div key={i} className="bottom-panel__output-line">
                                <span className="bottom-panel__timestamp">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                {log.text}
                            </div>
                        ))}
                        <div ref={outputEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
};
