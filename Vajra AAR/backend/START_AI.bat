@echo off
cd /d "%~dp0"
if not exist "models\gesture_model.joblib" (
  echo.
  echo ERROR: models\gesture_model.joblib is missing.
  echo Copy your trained model into the models folder first.
  pause
  exit /b 1
)
python server.py --stream http://10.85.79.83:8081/ --model models/gesture_model.joblib
