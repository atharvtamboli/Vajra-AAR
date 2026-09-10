# AAR Tactical Sign AI — Pi Final Test

Your trained model should be copied here:

models\gesture_model.joblib

Start with:

START_PI_AI.bat

Or:

python server.py --stream http://10.85.79.83:8081/ --model models/gesture_model.joblib

The laptop reads the Pi Motion MJPEG stream directly.

Test:
http://localhost:8000/health
http://localhost:8000/video
ws://localhost:8000/ws/sign

Expected health:
"connected": true

The classifier recognizes:
STOP
MOVE
ENEMY
HOLD
ADVANCE

Browser speech is intentionally left for the dashboard integration step.
