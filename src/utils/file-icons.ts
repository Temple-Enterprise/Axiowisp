import {
    FileText, FileCode, FileJson, FileType, Image, Film, Music,
    File, Folder, FolderOpen, Settings, Package, Database,
    FileSpreadsheet, Globe, Lock, Braces, Hash, Terminal,
    type LucideIcon,
} from 'lucide-react';

interface FileIconInfo {
    icon: LucideIcon;
    color: string;
}

const extensionMap: Record<string, FileIconInfo> = {
    // Web
    ts: { icon: FileCode, color: '#3178c6' },
    tsx: { icon: FileCode, color: '#3178c6' },
    js: { icon: FileCode, color: '#f7df1e' },
    jsx: { icon: FileCode, color: '#61dafb' },
    html: { icon: Globe, color: '#e34f26' },
    css: { icon: Hash, color: '#264de4' },
    scss: { icon: Hash, color: '#cd6799' },
    less: { icon: Hash, color: '#1d365d' },

    // Data
    json: { icon: Braces, color: '#f7df1e' },
    yaml: { icon: FileText, color: '#cb171e' },
    yml: { icon: FileText, color: '#cb171e' },
    toml: { icon: Settings, color: '#9c4121' },
    xml: { icon: FileCode, color: '#e37933' },
    csv: { icon: FileSpreadsheet, color: '#3fb950' },
    sql: { icon: Database, color: '#e38c00' },

    // Languages
    py: { icon: FileCode, color: '#3572a5' },
    rs: { icon: FileCode, color: '#dea584' },
    go: { icon: FileCode, color: '#00add8' },
    java: { icon: FileCode, color: '#b07219' },
    c: { icon: FileCode, color: '#555555' },
    cpp: { icon: FileCode, color: '#f34b7d' },
    cs: { icon: FileCode, color: '#178600' },
    rb: { icon: FileCode, color: '#701516' },
    php: { icon: FileCode, color: '#4f5d95' },
    swift: { icon: FileCode, color: '#f05138' },
    kt: { icon: FileCode, color: '#a97bff' },
    lua: { icon: FileCode, color: '#000080' },

    // Config
    env: { icon: Lock, color: '#ecd53f' },
    sh: { icon: Terminal, color: '#3fb950' },
    bash: { icon: Terminal, color: '#3fb950' },

    // Docs
    md: { icon: FileText, color: '#519aba' },
    txt: { icon: FileText, color: '#8b949e' },
    log: { icon: FileText, color: '#6e7681' },

    // Media
    png: { icon: Image, color: '#a371f7' },
    jpg: { icon: Image, color: '#a371f7' },
    jpeg: { icon: Image, color: '#a371f7' },
    gif: { icon: Image, color: '#a371f7' },
    svg: { icon: Image, color: '#ffb13b' },
    mp4: { icon: Film, color: '#da3633' },
    webm: { icon: Film, color: '#da3633' },
    mp3: { icon: Music, color: '#db61a2' },
    wav: { icon: Music, color: '#db61a2' },

    // Package
    lock: { icon: Lock, color: '#8b949e' },
};

const specialFileMap: Record<string, FileIconInfo> = {
    'package.json': { icon: Package, color: '#3fb950' },
    'tsconfig.json': { icon: Settings, color: '#3178c6' },
    '.gitignore': { icon: Settings, color: '#f85149' },
    'dockerfile': { icon: FileType, color: '#0db7ed' },
    'docker-compose.yml': { icon: FileType, color: '#0db7ed' },
};

export function getFileIcon(fileName: string, isDirectory: boolean, isOpen?: boolean): FileIconInfo {
    if (isDirectory) {
        return { icon: isOpen ? FolderOpen : Folder, color: '#58a6ff' };
    }

    const lowerName = fileName.toLowerCase();

    // Check special file names first
    if (specialFileMap[lowerName]) {
        return specialFileMap[lowerName];
    }

    // Check extension
    const ext = lowerName.split('.').pop() ?? '';
    if (extensionMap[ext]) {
        return extensionMap[ext];
    }

    return { icon: File, color: '#8b949e' };
}
