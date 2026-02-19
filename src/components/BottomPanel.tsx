import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useUiStore } from '../stores/ui-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useSettingsStore } from '../stores/settings-store';
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
    const pidRef = useRef<number | null>(null);
    const initRef = useRef(false);

    // Focus terminal when switching to terminal tab
    const focusTerminal = useCallback(() => {
        if (xtermRef.current) {
            xtermRef.current.focus();
        }
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
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);
        xterm.open(termRef.current);

        // Fit after a short delay to let DOM render
        setTimeout(() => {
            fitAddon.fit();
            xterm.focus();
        }, 100);

        xtermRef.current = xterm;
        fitRef.current = fitAddon;

        // Create a real terminal process via IPC
        if (window.electronAPI?.createTerminal) {
            window.electronAPI.createTerminal(rootPath || undefined).then((result) => {
                if (result.success && result.data) {
                    pidRef.current = result.data;
                    const dims = fitAddon.proposeDimensions();
                    if (dims) {
                        window.electronAPI.resizeTerminal(result.data, dims.cols, dims.rows);
                    }
                }
            });

            // Receive data from pty
            window.electronAPI.onTerminalData((_pid, data) => {
                xterm.write(data);
            });

            // Send user input to pty
            xterm.onData((data) => {
                if (pidRef.current !== null) {
                    window.electronAPI.writeTerminal(pidRef.current, data);
                }
            });
        } else {
            // Fallback when not in Electron
            xterm.writeln('\x1b[33mTerminal requires Electron environment.\x1b[0m');
            xterm.writeln('Run with: npm run dev');
        }

        // Handle container resize
        const observer = new ResizeObserver(() => {
            try {
                fitAddon.fit();
            } catch { /* ignore fit errors during transitions */ }
            if (pidRef.current !== null) {
                const dims = fitAddon.proposeDimensions();
                if (dims && window.electronAPI?.resizeTerminal) {
                    window.electronAPI.resizeTerminal(pidRef.current, dims.cols, dims.rows);
                }
            }
        });
        observer.observe(termRef.current);

        return () => {
            observer.disconnect();
            if (pidRef.current !== null) {
                window.electronAPI?.disposeTerminal(pidRef.current);
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

    const outputLines = [
        '[info]  Axiowisp IDE started',
        '[info]  Renderer loaded successfully',
        '[info]  Ready.',
    ];

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
                        {outputLines.map((line, i) => (
                            <div key={i} className="bottom-panel__output-line">
                                <span className="bottom-panel__timestamp">
                                    {new Date().toLocaleTimeString()}
                                </span>
                                {line}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
