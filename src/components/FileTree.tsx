import React, { useState } from 'react';
import { FileEntry } from '../../shared/types';
import { useTabsStore } from '../stores/tabs-store';
import { getFileIcon } from '../utils/file-icons';
import { ChevronRight, ChevronDown } from 'lucide-react';
import './FileTree.css';

interface FileTreeProps {
    entries: FileEntry[];
    depth: number;
}

export const FileTree: React.FC<FileTreeProps> = ({ entries, depth }) => {
    return (
        <ul className="file-tree" role="tree">
            {entries.map((entry) => (
                <FileTreeItem key={entry.path} entry={entry} depth={depth} />
            ))}
        </ul>
    );
};

interface FileTreeItemProps {
    entry: FileEntry;
    depth: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ entry, depth }) => {
    const [expanded, setExpanded] = useState(false);
    const openTab = useTabsStore((s) => s.openTab);
    const activeTabId = useTabsStore((s) => s.activeTabId);

    const isActive = !entry.isDirectory && entry.path === activeTabId;
    const iconInfo = getFileIcon(entry.name, entry.isDirectory, expanded);
    const IconComponent = iconInfo.icon;

    const handleClick = () => {
        if (entry.isDirectory) {
            setExpanded(!expanded);
        } else {
            openTab(entry.path);
        }
    };

    return (
        <li className="file-tree__item" role="treeitem">
            <div
                className={`file-tree__row ${isActive ? 'file-tree__row--active' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleClick}
            >
                {entry.isDirectory && (
                    <span className="file-tree__chevron">
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                {!entry.isDirectory && <span className="file-tree__chevron-spacer" />}
                <IconComponent size={15} color={iconInfo.color} className="file-tree__icon" />
                <span className="file-tree__name">{entry.name}</span>
            </div>
            {entry.isDirectory && expanded && entry.children && (
                <FileTree entries={entry.children} depth={depth + 1} />
            )}
        </li>
    );
};
