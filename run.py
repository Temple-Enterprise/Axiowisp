import subprocess
import sys
import os

def run_command(command):
    print(f"Running: {command}")
    try:
        # shell=True is required for running npm commands on Windows properly in some environments
        # check=True will raise CalledProcessError if the command fails
        subprocess.run(command, shell=True, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {command}")
        print(f"Return code: {e.returncode}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
        sys.exit(0)

def main():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)

    print("Installing packages...")
    run_command("npm install")

    print("Starting Vite server and running the app...")
    run_command("npm run dev")

if __name__ == "__main__":
    main()
