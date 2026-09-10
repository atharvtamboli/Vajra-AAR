@echo off
cd /d "%~dp0"
python server.py --stream http://10.85.79.83:8081/ --model models/gesture_model.joblib
pause
