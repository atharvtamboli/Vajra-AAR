The tactical gesture model is generated locally from your own training samples.

Expected file:
models/gesture_model.joblib

Create it with:
1. python capture_data.py --source http://PI_IP:8081/ --samples 250
2. python train_model.py

Classes currently included:
STOP
MOVE
ENEMY
HOLD
ADVANCE

IMPORTANT:
The GitHub ASL project you found is an alphabet recognizer. It is not the
right model for tactical commands like STOP/MOVE/ENEMY, so this backend uses
a dedicated tactical gesture classifier instead.
