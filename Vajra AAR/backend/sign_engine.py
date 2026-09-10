from collections import Counter, deque
from pathlib import Path

import cv2
import joblib
import mediapipe as mp
import numpy as np

TACTICAL_LABELS = {
    "STOP": "STOP",
    "MOVE": "MOVE",
    "ENEMY": "ENEMY",
    "HOLD": "HOLD",
    "ADVANCE": "ADVANCE",
}

class SignEngine:
    def __init__(self, model_path):
        path = Path(model_path)
        if not path.exists():
            raise FileNotFoundError(f"Model not found: {path}")
        self.model = joblib.load(path)
        self.history = deque(maxlen=12)
        self.hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.55,
            min_tracking_confidence=0.55,
        )

    def extract(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.hands.process(rgb)
        if not result.multi_hand_landmarks:
            self.history.clear()
            return None

        pts = []
        for hand in result.multi_hand_landmarks[:2]:
            for p in hand.landmark:
                pts.extend([p.x, p.y, p.z])

        pts += [0.0] * (126 - len(pts))
        pts = np.asarray(pts[:126], dtype=np.float32)

        base = pts[:3].copy()
        for i in range(0, len(pts), 3):
            pts[i:i+3] -= base

        scale = np.max(np.abs(pts))
        if scale > 1e-6:
            pts /= scale

        return pts.reshape(1, -1)

    def predict(self, frame):
        x = self.extract(frame)
        if x is None:
            return {"sign": "NO HAND", "confidence": 0.0}

        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(x)[0]
            i = int(np.argmax(probs))
            return {
                "sign": str(self.model.classes_[i]).upper(),
                "confidence": float(probs[i]),
            }

        return {"sign": str(self.model.predict(x)[0]).upper(), "confidence": 1.0}

    def stable_gesture(self, sign, confidence, threshold=0.82):
        if confidence < threshold or sign in ("NO HAND", "NULL"):
            return None

        self.history.append(sign)
        if len(self.history) < 8:
            return None

        label, count = Counter(self.history).most_common(1)[0]
        if count >= 7:
            return TACTICAL_LABELS.get(label, label)

        return None
