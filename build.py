import subprocess
import sys
import os
import shutil
import time

# ─── ANSI colors ──────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def log(msg, color=CYAN):
    print(f"{color}{BOLD}▸{RESET} {msg}")

def success(msg):
    print(f"{GREEN}{BOLD}✓{RESET} {msg}")

def warn(msg):
    print(f"{YELLOW}{BOLD}⚠{RESET} {msg}")

def error(msg):
    print(f"{RED}{BOLD}✗{RESET} {msg}")

def run_command(command, label=None):
    if label:
        log(label)
    print(f"  {CYAN}${RESET} {command}")
    start = time.time()
    try:
        subprocess.run(command, shell=True, check=True)
        elapsed = time.time() - start
        success(f"Done in {elapsed:.1f}s")
        print()
        return True
    except subprocess.CalledProcessError as e:
        error(f"Command failed with exit code {e.returncode}")
        return False
    except KeyboardInterrupt:
        warn("Interrupted by user.")
        sys.exit(0)

def main():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)

    print()
    print(f"{BOLD}{CYAN}╔══════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{CYAN}║   Axiowisp — Package Build Script        ║{RESET}")
    print(f"{BOLD}{CYAN}╚══════════════════════════════════════════╝{RESET}")
    print()

    total_start = time.time()

    # ── Step 1: Install dependencies ─────────────────────────
    if not run_command("npm install", "Installing dependencies..."):
        error("Failed to install dependencies. Aborting.")
        sys.exit(1)

    # ── Step 2: Build renderer (TypeScript + Vite) ───────────
    if not run_command("npx tsc", "Compiling renderer TypeScript..."):
        error("Renderer TypeScript compilation failed. Aborting.")
        sys.exit(1)

    if not run_command("npx vite build", "Building renderer with Vite..."):
        error("Vite build failed. Aborting.")
        sys.exit(1)

    # ── Step 3: Build Electron main process ──────────────────
    if not run_command("npx tsc -p tsconfig.electron.json", "Compiling Electron main process..."):
        error("Electron TypeScript compilation failed. Aborting.")
        sys.exit(1)

    # ── Step 4: Package with electron-builder (NSIS) ─────────
    if not run_command("npx electron-builder --win", "Packaging with electron-builder (NSIS installer)..."):
        error("Packaging failed. Aborting.")
        sys.exit(1)

    # ── Done ─────────────────────────────────────────────────
    total_elapsed = time.time() - total_start
    print()
    print(f"{GREEN}{BOLD}╔══════════════════════════════════════════╗{RESET}")
    print(f"{GREEN}{BOLD}║   Build complete! ({total_elapsed:.1f}s)                  ║{RESET}")
    print(f"{GREEN}{BOLD}╚══════════════════════════════════════════╝{RESET}")
    print()

    release_dir = os.path.join(project_dir, "release")
    if os.path.isdir(release_dir):
        installers = [f for f in os.listdir(release_dir) if f.endswith((".exe", ".msi"))]
        if installers:
            success("Installer(s) found in /release:")
            for name in installers:
                full = os.path.join(release_dir, name)
                size_mb = os.path.getsize(full) / (1024 * 1024)
                print(f"    📦 {name}  ({size_mb:.1f} MB)")
        else:
            warn("No installer files found in /release. Check electron-builder output.")
    else:
        warn("Release directory not found.")

    print()

if __name__ == "__main__":
    main()
