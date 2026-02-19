import React from 'react';
import { useUiStore } from '../stores/ui-store';
import { X, Copy, Info } from 'lucide-react';
import './AboutModal.css';

export const AboutModal: React.FC = () => {
    const { aboutData, toggleAboutModal } = useUiStore();

    if (!aboutData) return null;

    const copyToClipboard = () => {
        const text = `
Axiowisp Version: ${aboutData.appVersion}
Electron: ${aboutData.electronVersion}
Chrome: ${aboutData.chromeVersion}
Node.js: ${aboutData.nodeVersion}
V8: ${aboutData.v8Version}
OS: ${aboutData.osType} ${aboutData.osRelease} ${aboutData.arch}
        `.trim();
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="about-overlay" onClick={() => toggleAboutModal(false)}>
            <div className="about-modal" onClick={(e) => e.stopPropagation()}>
                <button className="about-modal__close" onClick={() => toggleAboutModal(false)}>
                    <X size={16} />
                </button>
                <div className="about-modal__content">
                    <div className="about-modal__icon">
                        <Info size={48} color="#3b82f6" />
                    </div>
                    <div className="about-modal__info">
                        <h2 className="about-modal__title">Axiowisp</h2>
                        <div className="about-modal__details">
                            <p><strong>Version:</strong> {aboutData.appVersion}</p>
                            <p><strong>Electron:</strong> {aboutData.electronVersion}</p>
                            <p><strong>Chrome:</strong> {aboutData.chromeVersion}</p>
                            <p><strong>Node.js:</strong> {aboutData.nodeVersion}</p>
                            <p><strong>V8:</strong> {aboutData.v8Version}</p>
                            <p><strong>OS:</strong> {aboutData.osType} {aboutData.osRelease} {aboutData.arch}</p>
                        </div>
                    </div>
                </div>
                <div className="about-modal__footer">
                    <button className="about-modal__copy-btn" onClick={copyToClipboard}>
                        <Copy size={14} />
                        Copy
                    </button>
                    <button className="about-modal__ok-btn" onClick={() => toggleAboutModal(false)}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
