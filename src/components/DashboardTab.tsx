import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../stores/workspace-store';
import {
    BarChart3, FileCode, Package, AlertTriangle, Clock, HardDrive,
    Loader, FolderOpen,
} from 'lucide-react';
import './DashboardTab.css';

interface LanguageStats {
    [lang: string]: { files: number; lines: number };
}

interface DashboardData {
    totalFiles: number;
    totalLines: number;
    languages: LanguageStats;
    largestFiles: { path: string; size: number }[];
    todoCount: number;
    fixmeCount: number;
    dependencies: { name: string; version: string }[];
    devDependencies: { name: string; version: string }[];
}

const EXT_TO_LANG: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TypeScript (JSX)', js: 'JavaScript', jsx: 'JavaScript (JSX)',
    py: 'Python', rs: 'Rust', go: 'Go', java: 'Java', cpp: 'C++', c: 'C',
    cs: 'C#', rb: 'Ruby', php: 'PHP', html: 'HTML', css: 'CSS', scss: 'SCSS',
    json: 'JSON', md: 'Markdown', yaml: 'YAML', yml: 'YAML', toml: 'TOML',
    sql: 'SQL', sh: 'Shell', bat: 'Batch', ps1: 'PowerShell', vue: 'Vue',
    svelte: 'Svelte', dart: 'Dart', kt: 'Kotlin', swift: 'Swift',
};

const BINARY_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'mp4', 'webm', 'exe', 'dll', 'zip', 'woff', 'woff2', 'ttf', 'eot', 'lock']);

async function gatherStats(rootPath: string): Promise<DashboardData> {
    const result = await window.electronAPI.listFiles(rootPath);
    if (!result.success || !result.data) throw new Error('Failed to list files');

    const files = result.data;
    const languages: LanguageStats = {};
    const fileSizes: { path: string; size: number }[] = [];
    let totalLines = 0;
    let todoCount = 0;
    let fixmeCount = 0;

    for (const filePath of files) {
        const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
        if (BINARY_EXT.has(ext)) continue;

        try {
            const readResult = await window.electronAPI.readFile(filePath);
            if (!readResult.success || !readResult.data) continue;

            const content = readResult.data;
            const lineCount = content.split('\n').length;
            totalLines += lineCount;

            const lang = EXT_TO_LANG[ext] || ext.toUpperCase() || 'Other';
            if (!languages[lang]) languages[lang] = { files: 0, lines: 0 };
            languages[lang].files++;
            languages[lang].lines += lineCount;

            fileSizes.push({ path: filePath.replace(rootPath, '').replace(/\\/g, '/').replace(/^\//, ''), size: lineCount });

            // Count TODOs and FIXMEs
            const upper = content.toUpperCase();
            const todoMatches = upper.match(/TODO/g);
            const fixmeMatches = upper.match(/FIXME/g);
            if (todoMatches) todoCount += todoMatches.length;
            if (fixmeMatches) fixmeCount += fixmeMatches.length;
        } catch { /* skip */ }
    }

    fileSizes.sort((a, b) => b.size - a.size);

    let dependencies: { name: string; version: string }[] = [];
    let devDependencies: { name: string; version: string }[] = [];
    try {
        const sep = rootPath.includes('/') ? '/' : '\\';
        const pkgResult = await window.electronAPI.readFile(rootPath + sep + 'package.json');
        if (pkgResult.success && pkgResult.data) {
            const pkg = JSON.parse(pkgResult.data);
            if (pkg.dependencies) {
                dependencies = Object.entries(pkg.dependencies).map(([name, version]) => ({ name, version: version as string }));
            }
            if (pkg.devDependencies) {
                devDependencies = Object.entries(pkg.devDependencies).map(([name, version]) => ({ name, version: version as string }));
            }
        }
    } catch { /* no package.json */ }

    return {
        totalFiles: files.length,
        totalLines,
        languages,
        largestFiles: fileSizes.slice(0, 10),
        todoCount,
        fixmeCount,
        dependencies,
        devDependencies,
    };
}

const LANG_COLORS = [
    '#3178c6', '#f1e05a', '#e34c26', '#563d7c', '#2b7489',
    '#89e051', '#dea584', '#b07219', '#4F5D95', '#00ADD8',
    '#A97BFF', '#e44b23', '#375eab', '#f34b7d', '#DA5B0B',
];

export const DashboardTab: React.FC = () => {
    const rootPath = useWorkspaceStore((s) => s.rootPath);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!rootPath) return;
        setLoading(true);
        gatherStats(rootPath)
            .then((d) => { setData(d); setLoading(false); })
            .catch((e) => { setError(e.message); setLoading(false); });
    }, [rootPath]);

    if (!rootPath) {
        return (
            <div className="dashboard">
                <div className="dashboard__empty">
                    <FolderOpen size={32} />
                    <p>Open a folder to see project stats</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="dashboard">
                <div className="dashboard__loading">
                    <Loader size={24} className="dashboard__spinner" />
                    <p>Analyzing project…</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="dashboard">
                <div className="dashboard__empty">
                    <AlertTriangle size={24} />
                    <p>{error || 'Failed to analyze project'}</p>
                </div>
            </div>
        );
    }

    const sortedLangs = Object.entries(data.languages).sort((a, b) => b[1].lines - a[1].lines);
    const maxLines = sortedLangs[0]?.[1]?.lines || 1;

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <BarChart3 size={18} />
                <h2>Project Health Dashboard</h2>
            </div>

            <div className="dashboard__cards">
                <div className="dashboard__card">
                    <FileCode size={20} className="dashboard__card-icon" />
                    <div className="dashboard__card-value">{data.totalFiles.toLocaleString()}</div>
                    <div className="dashboard__card-label">Files</div>
                </div>
                <div className="dashboard__card">
                    <HardDrive size={20} className="dashboard__card-icon" />
                    <div className="dashboard__card-value">{data.totalLines.toLocaleString()}</div>
                    <div className="dashboard__card-label">Lines of Code</div>
                </div>
                <div className="dashboard__card">
                    <AlertTriangle size={20} className="dashboard__card-icon dashboard__card-icon--warn" />
                    <div className="dashboard__card-value">{data.todoCount + data.fixmeCount}</div>
                    <div className="dashboard__card-label">TODO / FIXME</div>
                </div>
                <div className="dashboard__card">
                    <Package size={20} className="dashboard__card-icon" />
                    <div className="dashboard__card-value">{data.dependencies.length + data.devDependencies.length}</div>
                    <div className="dashboard__card-label">Dependencies</div>
                </div>
            </div>

            <div className="dashboard__section">
                <h3 className="dashboard__section-title">Languages</h3>
                <div className="dashboard__langs">
                    {sortedLangs.map(([lang, stats], idx) => (
                        <div key={lang} className="dashboard__lang-row">
                            <span className="dashboard__lang-name">{lang}</span>
                            <div className="dashboard__lang-bar-bg">
                                <div
                                    className="dashboard__lang-bar"
                                    style={{
                                        width: `${(stats.lines / maxLines) * 100}%`,
                                        background: LANG_COLORS[idx % LANG_COLORS.length],
                                    }}
                                />
                            </div>
                            <span className="dashboard__lang-stats">
                                {stats.files} files · {stats.lines.toLocaleString()} lines
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dashboard__section">
                <h3 className="dashboard__section-title">Largest Files</h3>
                <div className="dashboard__table">
                    {data.largestFiles.map((f) => (
                        <div key={f.path} className="dashboard__table-row">
                            <span className="dashboard__table-file">{f.path}</span>
                            <span className="dashboard__table-size">{f.size.toLocaleString()} lines</span>
                        </div>
                    ))}
                </div>
            </div>

            {(data.dependencies.length > 0 || data.devDependencies.length > 0) && (
                <div className="dashboard__section">
                    <h3 className="dashboard__section-title">Dependencies</h3>
                    <div className="dashboard__deps">
                        {data.dependencies.map((d) => (
                            <span key={d.name} className="dashboard__dep">{d.name} <em>{d.version}</em></span>
                        ))}
                    </div>
                    {data.devDependencies.length > 0 && (
                        <>
                            <h4 className="dashboard__subsection-title">Dev Dependencies</h4>
                            <div className="dashboard__deps">
                                {data.devDependencies.map((d) => (
                                    <span key={d.name} className="dashboard__dep">{d.name} <em>{d.version}</em></span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
