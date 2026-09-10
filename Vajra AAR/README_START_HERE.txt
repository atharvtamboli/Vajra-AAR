AAR TACTICAL COMPLETE v7

1. BACKEND: put your trained models\gesture_model.joblib into backend\models\
2. Start backend with backend\START_AI.bat
3. Start dashboard with frontend\START_DASHBOARD.bat
4. Open http://localhost:5500
5. In dashboard video settings use Pi IP 10.85.79.83 and port 8081.
6. Gesture AI updates automatically in real time; no curl is needed.
7. The dashboard reads http://localhost:8000/latest every 250 ms and speaks new commands.

NOTE: The trained joblib model was not available in the current file workspace, so it could not be embedded in this ZIP. Use the gesture_model.joblib you already trained and place it at backend\models\gesture_model.joblib.
