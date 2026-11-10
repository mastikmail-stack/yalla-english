@echo off
cd /d "%~dp0"
echo Yalla English: http://127.0.0.1:8766/
echo Keep this window open. Press Ctrl+C to stop.
python -m http.server 8766 --bind 127.0.0.1
pause
