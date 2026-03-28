@echo off
cd /d "c:\Users\administrator\Desktop\rushi\inventory\backend"
call venv\Scripts\activate.bat
python apply_migrations.py
pause
