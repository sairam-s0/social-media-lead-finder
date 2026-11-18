@echo off
title Social Lead Finder - Flask Backend Server
echo ===================================================
echo Starting Social Lead Finder Backend on 0.0.0.0:5050
echo Local PC: http://127.0.0.1:5050
echo Mobile LAN: http://192.168.1.3:5050
echo ===================================================
cd /d "%~dp0backend"
python app.py
pause
