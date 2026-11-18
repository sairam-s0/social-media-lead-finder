# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from pathlib import Path

block_cipher = None

project_root = Path.cwd().resolve()
backend_dir = project_root / 'backend'
frontend_dist = project_root / 'frontend' / 'dist'

added_files = [
    (str(frontend_dist), 'frontend_dist'),
]

android_apk = project_root / 'android_dist'
if android_apk.exists():
    added_files.append((str(android_apk), 'android_dist'))


hidden_imports = [
    'apscheduler',
    'apscheduler.schedulers.background',
    'apscheduler.triggers.interval',
    'apscheduler.executors.pool',
    'keyring',
    'keyring.backends.Windows',
    'cryptography',
    'requests',
    'openpyxl',
    'openpyxl.styles',
    'openpyxl.utils',
    'openpyxl.worksheet',
    'sqlalchemy',
    'sqlalchemy.dialects.sqlite',
    'sqlalchemy.sql.default_comparator',
    'werkzeug',
    'werkzeug.serving',
    'jinja2',
    'sqlite3',
    'webview',
    'webview.platforms.winforms',
    'clr_loader',
    'pythonnet',
]

excluded_modules = [
    'pytest',
    'unittest',
    'tests',
    'numpy',
    'scipy',
    'pandas',
    'matplotlib',
    'torch',
    'torchvision',
    'torchaudio',
    'tensorflow',
    'tensorboard',
    'transformers',
    'huggingface_hub',
    'onnx',
    'onnxruntime',
    'cv2',
    'sympy',
    'botocore',
    'boto3',
    'sentry_sdk',
    'opentelemetry',
    'grpc',
    'IPython',
    'jupyter',
    'sklearn',
    'xgboost',
    'lightgbm',
    'polars',
    '_polars_runtime_32',
    'pyarrow',
    'faiss',
    'faiss_cpu',
    'pygments',
    'rich',
]

a = Analysis(
    [str(backend_dir / 'launcher.py')],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=added_files,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excluded_modules,
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='SocialLeadFinder',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # GUI application, no console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(project_root / 'assets' / 'app.ico'),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='SocialLeadFinder',
)
