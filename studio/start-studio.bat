@echo off
rem Opens the Royal Crest Flyer Studio in your browser.
rem Needs Python (python.org). Keep this window open while you use the studio.
cd /d "%~dp0\.."
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8080/studio/"
where python >nul 2>nul && (python -m http.server 8080) || (py -m http.server 8080)
