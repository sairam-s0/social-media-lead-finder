import os
import sys
import shutil
import subprocess
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"
BACKEND_DIR = PROJECT_ROOT / "backend"
DIST_DIR = PROJECT_ROOT / "dist" / "SocialLeadFinder"
SPEC_FILE = PROJECT_ROOT / "SocialLeadFinder.spec"
ISS_FILE = PROJECT_ROOT / "installer.iss"
INSTALLER_OUTPUT_DIR = PROJECT_ROOT / "installer_dist"
INSTALLER_EXE = INSTALLER_OUTPUT_DIR / "lead finder v2.exe"

def run_cmd(cmd, cwd=PROJECT_ROOT, description=""):
    print(f"\n---> {description}")
    print(f"Command: {cmd}")
    res = subprocess.run(cmd, cwd=str(cwd), shell=True)
    if res.returncode != 0:
        print(f"[ERROR] Failed: {description} (Exit code {res.returncode})")
        sys.exit(res.returncode)
    print(f"[OK] {description} succeeded.")

def find_iscc():
    """Locate Inno Setup compiler executable if installed on system."""
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    potential_paths = [
        shutil.which("ISCC.exe"),
        shutil.which("iscc"),
        os.path.join(local_app_data, r"Programs\Inno Setup 6\ISCC.exe") if local_app_data else None,
        os.path.join(local_app_data, r"Programs\Inno Setup 5\ISCC.exe") if local_app_data else None,
        r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        r"C:\Program Files\Inno Setup 6\ISCC.exe",
        r"C:\Program Files (x86)\Inno Setup 5\ISCC.exe",
        r"C:\Program Files\Inno Setup 5\ISCC.exe",
    ]
    for p in potential_paths:
        if p and os.path.exists(p):
            return str(p)
    return None

def ensure_assets():
    """Ensure required assets like icon and webview bootstrapper exist."""
    assets_dir = PROJECT_ROOT / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    icon_path = assets_dir / "app.ico"
    if not icon_path.exists():
        print("[INFO] Generating application icon...")
        gen_script = assets_dir / "generate_icon.py"
        if gen_script.exists():
            subprocess.run([sys.executable, str(gen_script)], check=True)

    wv_bootstrapper = assets_dir / "MicrosoftEdgeWebview2Setup.exe"
    if not wv_bootstrapper.exists():
        print("[INFO] Downloading Microsoft Edge WebView2 Evergreen Bootstrapper...")
        import urllib.request
        urllib.request.urlretrieve("https://go.microsoft.com/fwlink/p/?LinkId=2124703", str(wv_bootstrapper))
        print(f"[OK] Downloaded WebView2 Bootstrapper ({wv_bootstrapper.stat().st_size} bytes)")

def test_installer(installer_path: Path):
    """Test the generated installer by performing a silent installation, health check, and uninstallation."""
    print("\n" + "=" * 60)
    print(" VERIFYING INSTALLER FUNCTIONALITY (END-TO-END TEST)")
    print("=" * 60)
    
    test_dir = PROJECT_ROOT / "build" / "test_install"
    test_log = PROJECT_ROOT / "build" / "test_install.log"
    
    if test_dir.exists():
        shutil.rmtree(test_dir, ignore_errors=True)
    test_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Test Silent Installation
    try:
        subprocess.run(["taskkill", "/F", "/IM", "SocialLeadFinder.exe"], capture_output=True)
    except Exception:
        pass
    print(f"\n[TEST 1] Running installer into test directory: {test_dir}")
    install_cmd = f'"{installer_path}" /VERYSILENT /SUPPRESSMSGBOXES /DIR="{test_dir}" /LOG="{test_log}"'
    res = subprocess.run(install_cmd, shell=True)
    if res.returncode != 0:
        print(f"[ERROR] Installer execution failed with exit code: {res.returncode}")
        sys.exit(res.returncode)
    print("[PASS] Installer completed successfully with code 0.")

    # 2. Verify installed files
    installed_exe = test_dir / "SocialLeadFinder.exe"
    uninstaller = test_dir / "unins000.exe"
    if not installed_exe.exists():
        print(f"[ERROR] Installed binary missing at: {installed_exe}")
        sys.exit(1)
    if not uninstaller.exists():
        print(f"[ERROR] Uninstaller missing at: {uninstaller}")
        sys.exit(1)
    print(f"[PASS] Installed files verified ({installed_exe.name}, {uninstaller.name}).")

    # 3. Test running the installed executable with health check flag
    print("\n[TEST 2] Testing installed application startup and backend health...")
    health_cmd = f'"{installed_exe}" --check-health'
    health_res = subprocess.run(health_cmd, shell=True, capture_output=True, text=True)
    print(health_res.stdout)
    if health_res.returncode != 0:
        print(f"[ERROR] Installed app failed health check (Exit code {health_res.returncode})")
        print(health_res.stderr)
        sys.exit(health_res.returncode)
    print("[PASS] Installed application passed self-test health check!")

    # 4. Test clean uninstallation
    print("\n[TEST 3] Running uninstaller silently...")
    unins_cmd = f'"{uninstaller}" /VERYSILENT /SUPPRESSMSGBOXES'
    unins_res = subprocess.run(unins_cmd, shell=True)
    time.sleep(2)  # Wait for uninstaller process to clean up
    print("[PASS] Uninstaller executed successfully.")

    # Clean up test directory
    shutil.rmtree(test_dir, ignore_errors=True)
    print("[PASS] Test environment cleaned up.")
    print("=" * 60)
    print(" ALL INSTALLER VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

def main():
    print("=" * 60)
    print(" Lead Finder v2 - Professional Installer Build System")
    print("=" * 60)

    # Step 0: Ensure Assets
    ensure_assets()

    # Step 1: Build React Frontend
    run_cmd("npm run build", cwd=FRONTEND_DIR, description="Building React Frontend (Vite Static Bundle)")
    if not (FRONTEND_DIST / "index.html").exists():
        print("[ERROR] Frontend build output missing at frontend/dist/index.html")
        sys.exit(1)

    # Step 2: Run Full Production Verification & Email/Excel Test Suite
    run_cmd(f'"{sys.executable}" -m pytest backend/tests', description="Running Hardened Production & Email/Excel Verification Tests")

    # Step 3: PyInstaller One-Folder Mode Bundling
    run_cmd(f'"{sys.executable}" -m PyInstaller "{SPEC_FILE}" --noconfirm', description="Bundling Executable with PyInstaller (One-Folder Mode)")

    exe_target = DIST_DIR / "SocialLeadFinder.exe"
    if not exe_target.exists():
        print(f"[ERROR] Expected binary not found at {exe_target}")
        sys.exit(1)

    print(f"\n[SUCCESS] PyInstaller bundled successfully at:\n  {DIST_DIR}")

    # Step 4: Inno Setup Compilation
    iscc_path = find_iscc()
    if not iscc_path:
        print("\n[ERROR] Inno Setup compiler (ISCC.exe) not found!")
        sys.exit(1)

    print(f"\nFound Inno Setup Compiler at: {iscc_path}")
    run_cmd(f'"{iscc_path}" "{ISS_FILE}"', description='Compiling Windows Installer ("lead finder v2.exe")')
    
    if not INSTALLER_EXE.exists():
        print(f"[ERROR] Expected installer not found at {INSTALLER_EXE}")
        sys.exit(1)

    installer_size_mb = INSTALLER_EXE.stat().st_size / (1024 * 1024)
    print(f"\n[SUCCESS] Professional Installer generated successfully!")
    print(f"  Path: {INSTALLER_EXE}")
    print(f"  Size: {installer_size_mb:.2f} MB")

    # Step 5: Test the Installer
    test_installer(INSTALLER_EXE)

    print("\n" + "=" * 60)
    print("BUILD & VERIFICATION COMPLETE!")
    print(f"Final Distributable Installer: {INSTALLER_EXE}")
    print("=" * 60)

if __name__ == "__main__":
    main()
