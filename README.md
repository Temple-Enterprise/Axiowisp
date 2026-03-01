<p align="center">
  <img src="github/images/banner.png" alt="Axiowisp" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-29+-1E293B?style=for-the-badge&logo=electron&logoColor=white&labelColor=C08497" />
  <img src="https://img.shields.io/badge/React-19-1E293B?style=for-the-badge&logo=react&logoColor=white&labelColor=C08497" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-1E293B?style=for-the-badge&logo=typescript&logoColor=white&labelColor=C08497" />
  <img src="https://img.shields.io/badge/Vite-6-1E293B?style=for-the-badge&logo=vite&logoColor=white&labelColor=C08497" />
  <img src="https://img.shields.io/badge/Monaco_Editor-✓-1E293B?style=for-the-badge&logo=visualstudiocode&logoColor=white&labelColor=C08497" />
</p>

---

<p align="center">
  A modern, minimal desktop IDE built with Electron, React, and TypeScript.
</p>

---

## Features

- **Monaco Editor** — Full syntax highlighting, IntelliSense, bracket colorization, and custom dark/light themes
- **Inline AI Completions** — Copilot-style ghost text using your own API key (OpenAI, Anthropic, or Gemini)
- **AI Code Review** — Right-click any file for categorized feedback on security, performance, bugs, and style
- **AI Chat** — Multi-provider chat with workspace context, inline code diffs, and accept/reject flow
- **Git Integration** — Source control panel with branch display, staging, commit, push, and pull
- **Find & Replace in Files** — Global content search with grouped results and one-click replace
- **Project Dashboard** — Lines of code, language breakdown, largest files, TODO/FIXME count, and dependencies
- **Integrated Terminal** — PowerShell/Bash via node-pty and xterm.js
- **File Explorer** — Tree view with context menu, drag-to-reorder tabs, auto-save, and unsaved changes prompt
- **Command Palette** — Quick file search and 12+ commands via `Ctrl+P`
- **File Associations** — Register as "Open With" handler for 30+ file types

## Showcase

<p align="center">
  <img src="github/images/showcase.png" alt="Axiowisp IDE" width="900" />
</p>

## Getting Started

```bash
git clone https://github.com/Temple-Enterprise/Axiowisp.git
cd Axiowisp
npm install
npm run dev
```

Requires **Node.js 18+**, **Python 3.x**, and **Visual Studio Build Tools** (for node-pty on Windows).

To build the installer, run `python build.py`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Command Palette |
| `Ctrl+S` | Save File |
| `Ctrl+D` | Project Dashboard |
| `Ctrl+G` | Go to Line |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+J` | Toggle Terminal |
| `Ctrl+W` | Close Tab |
| `Ctrl+,` | Settings |
| `Ctrl+Shift+O` | Open Folder |
| `Ctrl+Shift+L` | Toggle AI Chat |
| `Ctrl+Shift+F` | Search Files |
| `Shift+Alt+F` | Format Document |
| `Ctrl+=` / `Ctrl+-` | Zoom In / Out |

## AI Setup

Open **Settings**, select your provider (OpenAI, Anthropic, or Gemini), enter your API key, and choose a model. Your key is stored locally and sent directly to the provider.

## Security

- Context isolation enabled, node integration disabled
- All IPC goes through a typed contextBridge preload
- Strict Content Security Policy
- No remote scripts or external URLs loaded

---

<p align="center">
  Built by <a href="https://templeenterprise.com"><b>Temple Enterprise LLC</b></a>
</p>
