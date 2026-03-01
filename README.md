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

### ✨ Editor
- **Monaco Editor** — Full syntax highlighting, IntelliSense, bracket colorization, and custom dark/light themes
- **Inline AI Completions** — Copilot-style ghost text suggestions using your own API key (OpenAI, Anthropic, or Gemini). Tab to accept, Escape to dismiss
- **AI Code Review** — Right-click any file → "AI Review" for categorized feedback (security, performance, bugs, style) with severity levels
- **Find & Replace in Files** — Global content search with grouped results by file and one-click replace all
- **Go to Line / Format / Zoom** — `Ctrl+G`, `Shift+Alt+F`, `Ctrl+=`/`Ctrl+-` wired directly into Monaco

### 🤖 AI Chat
- **Multi-Provider Support** — OpenAI, Anthropic (Claude), and Google Gemini with model selection
- **Code-Aware Context** — Reads your workspace structure and active file for context-rich responses
- **Inline Code Edits** — AI suggestions shown as diffs with Accept/Reject buttons and line change counts

### 📁 File Explorer
- **Tree View** — Expandable file tree with context menu (create, rename, delete)
- **Tab System** — Drag-to-reorder tabs, unsaved changes prompt, close to right / close saved
- **Auto-Save** — Toggle in settings with configurable delay (500ms–5s)
- **Breadcrumb Navigation** — Clickable path segments above the editor

### 🔀 Git Integration
- **Source Control Panel** — Branch name, staged/unstaged files, one-click stage/unstage
- **Commit, Push & Pull** — Built-in commit message input with push/pull actions
- **Auto-Refresh** — Status refreshes every 10 seconds

### 📊 Project Dashboard
- **Health Overview** — Total files, lines of code, TODO/FIXME count, dependency count
- **Language Breakdown** — Color-coded bars showing lines per language
- **Largest Files & Dependencies** — Top 10 biggest files and full package.json dependency list

### 🖥️ Terminal & Runner
- **Integrated Terminal** — PowerShell/Bash via `node-pty` and `xterm.js` with new/clear/kill actions
- **Code Runner** — Execute commands with streaming output and severity-colored log entries
- **Problems Panel** — Dedicated errors/warnings tab with filtering and badge counts

### ⚡ Productivity
- **Command Palette** — Quick file search and 12+ commands via `Ctrl+P` with shortcut badges
- **Toast Notifications** — Visual feedback for save, error, git, and other operations
- **Keyboard Shortcuts** — Comprehensive shortcuts for all major actions
- **Resizable Panels** — Drag to resize sidebar, terminal, and chat panels
- **Dark and Light Themes** — Full theme engine with CSS variable bindings
- **Persistent Settings** — Editor, terminal, and appearance config saved to local storage

## Showcase

<p align="center">
  <img src="github/images/showcase.png" alt="Axiowisp IDE" width="900" />
</p>

## Getting Started

### Prerequisites

- **Node.js** 18+ — [download](https://nodejs.org/)
- **Python** 3.x and **Visual Studio Build Tools** (for `node-pty` on Windows)

### Quick Start

```bash
git clone https://github.com/Temple-Enterprise/Axiowisp.git
cd Axiowisp

# Option A: Use the run script
python run.py

# Option B: Manual
npm install
npm run dev
```

### Building the Installer

```bash
python build.py
```

This runs the full pipeline — `npm install`, TypeScript compilation, Vite build, and electron-builder — and produces an NSIS installer in the `release/` directory.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 35 |
| Renderer | React 19, Vite 6 |
| Language | TypeScript 5.7 |
| Editor | Monaco Editor |
| Terminal | node-pty, xterm.js |
| State | Zustand |
| Icons | Lucide React |
| AI | OpenAI, Anthropic, Google Gemini |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Command Palette |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+J` | Toggle Terminal |
| `Ctrl+S` | Save File |
| `Ctrl+D` | Project Dashboard |
| `Ctrl+G` | Go to Line |
| `Shift+Alt+F` | Format Document |
| `Ctrl+=` / `Ctrl+-` | Zoom In / Out |
| `Ctrl+Shift+O` | Open Folder |
| `Ctrl+Shift+L` | Toggle AI Chat |
| `Ctrl+Shift+F` | Search Files |
| `Ctrl+W` | Close Tab |
| `Ctrl+,` | Settings |

## AI Setup

1. Open **Settings** → AI / LLM Provider
2. Select your provider (OpenAI, Anthropic, or Gemini)
3. Enter your API key and select a model
4. Open the Chat panel or just start typing for ghost completions

Your key is stored locally and only sent directly to the provider API.

## Security

- Context isolation enabled
- Node integration disabled in renderer
- All IPC goes through a typed `contextBridge` preload
- Strict Content Security Policy
- No remote scripts or external URLs loaded

---

<p align="center">
  Built by <a href="https://templeenterprise.com"><b>Temple Enterprise LLC</b></a>
</p>
