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

- **Monaco Editor** — Syntax highlighting, IntelliSense, bracket colorization, and custom dark/light themes
- **Integrated Terminal** — PowerShell/Bash via `node-pty` and `xterm.js` with new/clear/kill actions
- **File Explorer** — Tree view with right-click context menu (create, rename, delete) and toolbar
- **Breadcrumb Navigation** — File path segments displayed above the editor
- **AI Chat** — Built-in OpenAI assistant (GPT-4o, GPT-3.5, etc.)
- **Command Palette** — Quick file search and 12+ commands via `Ctrl+P`
- **Problems Panel** — Dedicated tab for errors and warnings with severity badges
- **Code Runner** — Execute commands with streaming output
- **Resizable Panels** — Drag to resize sidebar, terminal, and chat panels
- **Settings** — Persistent editor, terminal, and appearance configuration
- **Dark and Light Themes** — Full theme engine with CSS variable bindings

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
| AI | OpenAI API |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Command Palette |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+J` | Toggle Terminal |
| `Ctrl+S` | Save File |
| `Ctrl+Shift+O` | Open Folder |
| `Ctrl+Shift+L` | Toggle AI Chat |
| `Ctrl+Shift+F` | Search Files |
| `Ctrl+W` | Close Tab |
| `Ctrl+,` | Settings |

## AI Chat

1. Open **Settings** from the activity bar
2. Enter your OpenAI API key under the AI section
3. Select a model and open the Chat panel

Your key is stored locally and only sent directly to the OpenAI API.

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
