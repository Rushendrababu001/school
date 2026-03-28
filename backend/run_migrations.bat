@echo off
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Running makemigrations...
python manage.py makemigrations

echo.
echo Running migrate...
python manage.py migrate

echo.
echo Done! Migrations applied.
pause
