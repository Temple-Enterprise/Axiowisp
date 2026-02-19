import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/workspace-store';
import { Play, Square, Trash2 } from 'lucide-react';
import './RunPanel.css';

export const RunPanel: React.FC = () => {
    const rootPath = useWorkspaceStore((s) => s.rootPath);
    const [command, setCommand] = useState('');
    const [output, setOutput] = useState<string[]>([]);
    const [running, setRunning] = useState(false);
    const [pid, setPid] = useState<number | null>(null);
    const outputEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [output]);

    useEffect(() => {
        if (!window.electronAPI?.onRunnerData) return;

        window.electronAPI.onRunnerData((_pid, data) => {
            setOutput((prev) => [...prev, data]);
        });

        window.electronAPI.onRunnerExit((_pid, code) => {
            setOutput((prev) => [...prev, `\n[Process exited with code ${code}]`]);
            setRunning(false);
            setPid(null);
        });
    }, []);

    const handleRun = async () => {
        if (!command.trim() || !window.electronAPI?.runCommand) return;
        setOutput([`$ ${command}\n`]);
        setRunning(true);

        const result = await window.electronAPI.runCommand(command, rootPath || undefined);
        if (result.success && result.data) {
            setPid(result.data);
        } else {
            setOutput((prev) => [...prev, `Error: ${result.error}\n`]);
            setRunning(false);
        }
    };

    const handleKill = () => {
        if (pid !== null && window.electronAPI?.killRunner) {
            window.electronAPI.killRunner(pid);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleRun();
        }
    };

    return (
        <div className="run-panel">
            <div className="run-panel__input-area">
                <input
                    className="run-panel__input"
                    placeholder="Enter command to run…"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="run-panel__buttons">
                    {running ? (
                        <button className="run-panel__btn run-panel__btn--stop" onClick={handleKill} title="Stop">
                            <Square size={14} />
                        </button>
                    ) : (
                        <button className="run-panel__btn run-panel__btn--run" onClick={handleRun} title="Run" disabled={!command.trim()}>
                            <Play size={14} />
                        </button>
                    )}
                    <button className="run-panel__btn" onClick={() => setOutput([])} title="Clear Output">
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
            <div className="run-panel__output">
                {output.length === 0 ? (
                    <div className="run-panel__empty">
                        <p>Run a command to see output here.</p>
                        <p className="run-panel__hint">
                            Examples: <code>npm test</code>, <code>node app.js</code>, <code>python main.py</code>
                        </p>
                    </div>
                ) : (
                    <pre className="run-panel__pre">
                        {output.join('')}
                        <div ref={outputEndRef} />
                    </pre>
                )}
            </div>
        </div>
    );
};
