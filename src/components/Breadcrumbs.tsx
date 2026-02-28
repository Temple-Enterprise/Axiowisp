import React from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { ChevronRight } from 'lucide-react';
import { getFileIcon } from '../utils/file-icons';
import './Breadcrumbs.css';

export const Breadcrumbs: React.FC = () => {
    const tabs = useTabsStore((s) => s.tabs);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const rootPath = useWorkspaceStore((s) => s.rootPath);

    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || !rootPath) return null;

    // Build relative path segments
    const relativePath = activeTab.filePath
        .replace(rootPath, '')
        .replace(/^[\\/]/, '');
    const segments = relativePath.split(/[\\/]/);

    return (
        <div className="breadcrumbs">
            {segments.map((segment, i) => {
                const isLast = i === segments.length - 1;
                const iconInfo = isLast
                    ? getFileIcon(segment, false)
                    : getFileIcon(segment, true, true);
                const Icon = iconInfo.icon;
                return (
                    <React.Fragment key={i}>
                        <span className={`breadcrumbs__segment ${isLast ? 'breadcrumbs__segment--active' : ''}`}>
                            <Icon size={13} color={iconInfo.color} className="breadcrumbs__icon" />
                            {segment}
                        </span>
                        {!isLast && <ChevronRight size={12} className="breadcrumbs__separator" />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
