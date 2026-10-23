@echo off
cd /d "%~dp0"
where py >nul 2>nul && (py make_voices.py) || (python make_voices.py)
