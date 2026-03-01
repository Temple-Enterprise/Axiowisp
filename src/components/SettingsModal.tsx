import React, { useState } from 'react';
import { useUiStore } from '../stores/ui-store';
import { useSettingsStore } from '../stores/settings-store';
import { X, Monitor, Palette, Terminal, Key } from 'lucide-react';
import './SettingsModal.css';

export const SettingsModal: React.FC = () => {
    const toggleSettings = useUiStore((s) => s.toggleSettings);
    const settings = useSettingsStore();
    const [apiKeyVisible, setApiKeyVisible] = useState(false);

    return (
        <div className="settings-overlay" onClick={toggleSettings}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-modal__header">
                    <h2 className="settings-modal__title">Settings</h2>
                    <button className="settings-modal__close" onClick={toggleSettings}>
                        <X size={16} />
                    </button>
                </div>

                <div className="settings-modal__body">
                    <section className="settings-modal__section">
                        <div className="settings-modal__section-header">
                            <Monitor size={15} />
                            <span>Editor</span>
                        </div>
                        <div className="settings-modal__option">
                            <label>Font Size</label>
                            <select
                                className="settings-modal__select"
                                value={String(settings.editorFontSize)}
                                onChange={(e) => settings.setEditorFontSize(Number(e.target.value))}
                            >
                                <option value="12">12px</option>
                                <option value="13">13px</option>
                                <option value="14">14px</option>
                                <option value="16">16px</option>
                                <option value="18">18px</option>
                                <option value="20">20px</option>
                            </select>
                        </div>
                        <div className="settings-modal__option">
                            <label>Word Wrap</label>
                            <select
                                className="settings-modal__select"
                                value={settings.wordWrap}
                                onChange={(e) => settings.setWordWrap(e.target.value as any)}
                            >
                                <option value="off">Off</option>
                                <option value="on">On</option>
                                <option value="wordWrapColumn">Wrap at Column</option>
                            </select>
                        </div>
                        <div className="settings-modal__option">
                            <label>Minimap</label>
                            <select
                                className="settings-modal__select"
                                value={settings.minimapEnabled ? 'on' : 'off'}
                                onChange={(e) => settings.setMinimapEnabled(e.target.value === 'on')}
                            >
                                <option value="on">Enabled</option>
                                <option value="off">Disabled</option>
                            </select>
                        </div>
                        <div className="settings-modal__option">
                            <label>Tab Size</label>
                            <select
                                className="settings-modal__select"
                                value={String(settings.tabSize)}
                                onChange={(e) => settings.setTabSize(Number(e.target.value))}
                            >
                                <option value="2">2 spaces</option>
                                <option value="4">4 spaces</option>
                            </select>
                        </div>
                        <div className="settings-modal__option">
                            <label>Auto Save</label>
                            <select
                                className="settings-modal__select"
                                value={settings.autoSave ? 'on' : 'off'}
                                onChange={(e) => settings.setAutoSave(e.target.value === 'on')}
                            >
                                <option value="off">Off</option>
                                <option value="on">After Delay</option>
                            </select>
                        </div>
                        {settings.autoSave && (
                            <div className="settings-modal__option">
                                <label>Auto Save Delay</label>
                                <select
                                    className="settings-modal__select"
                                    value={String(settings.autoSaveDelay)}
                                    onChange={(e) => settings.setAutoSaveDelay(Number(e.target.value))}
                                >
                                    <option value="500">500ms</option>
                                    <option value="1000">1s</option>
                                    <option value="2000">2s</option>
                                    <option value="5000">5s</option>
                                </select>
                            </div>
                        )}
                    </section>

                    <section className="settings-modal__section">
                        <div className="settings-modal__section-header">
                            <Palette size={15} />
                            <span>Appearance</span>
                        </div>
                        <div className="settings-modal__option">
                            <label>Theme</label>
                            <select
                                className="settings-modal__select"
                                value={settings.theme}
                                onChange={(e) => settings.setTheme(e.target.value as 'light' | 'dark')}
                            >
                                <option value="dark">Axiowisp Dark</option>
                                <option value="light">Axiowisp Light</option>
                            </select>
                        </div>
                    </section>

                    <section className="settings-modal__section">
                        <div className="settings-modal__section-header">
                            <Terminal size={15} />
                            <span>Terminal</span>
                        </div>
                        <div className="settings-modal__option">
                            <label>Font Size</label>
                            <select
                                className="settings-modal__select"
                                value={String(settings.terminalFontSize)}
                                onChange={(e) => settings.setTerminalFontSize(Number(e.target.value))}
                            >
                                <option value="11">11px</option>
                                <option value="12">12px</option>
                                <option value="13">13px</option>
                                <option value="14">14px</option>
                                <option value="16">16px</option>
                            </select>
                        </div>
                    </section>

                    <section className="settings-modal__section">
                        <div className="settings-modal__section-header">
                            <Key size={15} />
                            <span>AI / LLM Provider</span>
                        </div>
                        <div className="settings-modal__option">
                            <label>Provider</label>
                            <select
                                className="settings-modal__select"
                                value={settings.activeProvider}
                                onChange={(e) => settings.setActiveProvider(e.target.value as any)}
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="gemini">Google Gemini</option>
                            </select>
                        </div>
                        <div className="settings-modal__option settings-modal__option--col">
                            <label>
                                {settings.activeProvider === 'openai' && 'OpenAI API Key'}
                                {settings.activeProvider === 'anthropic' && 'Anthropic API Key'}
                                {settings.activeProvider === 'gemini' && 'Gemini API Key'}
                            </label>
                            <div className="settings-modal__key-row">
                                <input
                                    className="settings-modal__input"
                                    type={apiKeyVisible ? 'text' : 'password'}
                                    placeholder={
                                        settings.activeProvider === 'openai' ? 'sk-…' :
                                            settings.activeProvider === 'anthropic' ? 'sk-ant-…' :
                                                'AIza…'
                                    }
                                    value={
                                        settings.activeProvider === 'openai' ? settings.openaiApiKey :
                                            settings.activeProvider === 'anthropic' ? settings.anthropicApiKey :
                                                settings.geminiApiKey
                                    }
                                    onChange={(e) => {
                                        if (settings.activeProvider === 'openai') settings.setOpenaiApiKey(e.target.value);
                                        if (settings.activeProvider === 'anthropic') settings.setAnthropicApiKey(e.target.value);
                                        if (settings.activeProvider === 'gemini') settings.setGeminiApiKey(e.target.value);
                                    }}
                                />
                                <button
                                    className="settings-modal__toggle-key"
                                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                                >
                                    {apiKeyVisible ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>
                        <div className="settings-modal__option">
                            <label>Model</label>
                            <select
                                className="settings-modal__select"
                                value={
                                    settings.activeProvider === 'openai' ? settings.openaiModel :
                                        settings.activeProvider === 'anthropic' ? settings.anthropicModel :
                                            settings.geminiModel
                                }
                                onChange={(e) => {
                                    if (settings.activeProvider === 'openai') settings.setOpenaiModel(e.target.value);
                                    if (settings.activeProvider === 'anthropic') settings.setAnthropicModel(e.target.value);
                                    if (settings.activeProvider === 'gemini') settings.setGeminiModel(e.target.value);
                                }}
                            >
                                {settings.activeProvider === 'openai' && (
                                    <>
                                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                                        <option value="gpt-4o">GPT-4o</option>
                                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    </>
                                )}
                                {settings.activeProvider === 'anthropic' && (
                                    <>
                                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (New)</option>
                                        <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                                        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                                        <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                                        <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                                    </>
                                )}
                                {settings.activeProvider === 'gemini' && (
                                    <>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                        <option value="gemini-pro">Gemini 1.0 Pro</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </section>
                </div>

                <div className="settings-modal__footer">
                    <p className="settings-modal__note">
                        Settings are saved to local storage automatically.
                    </p>
                </div>
            </div>
        </div>
    );
};
