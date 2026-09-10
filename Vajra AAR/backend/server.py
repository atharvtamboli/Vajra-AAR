import argparse
import asyncio
import json
import threading
import time

import cv2
import numpy as np
import requests
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn

from sign_engine import SignEngine

app = FastAPI(title="AAR Tactical Sign AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Runtime:
    def __init__(self):
        self.stream_url = ""
        self.engine = None
        self.stop_event = threading.Event()
        self.thread = None
        self.lock = threading.Lock()
        self.frame = None
        self.clients = set()
        self.latest = {
            "sign": "NO SIGNAL",
            "confidence": 0.0,
            "spoken_text": "",
            "connected": False,
            "timestamp": 0,
        }

    def start(self, url, model):
        self.stop()
        self.stream_url = url
        self.engine = SignEngine(model)
        self.stop_event.clear()
        self.thread = threading.Thread(target=self.reader, daemon=True)
        self.thread.start()

    def stop(self):
        self.stop_event.set()
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1)
        self.thread = None

    def reader(self):
        while not self.stop_event.is_set():
            try:
                print(f"[PI] Connecting to {self.stream_url}")
                r = requests.get(
                    self.stream_url,
                    stream=True,
                    timeout=(5, 15),
                    headers={"User-Agent": "AAR-Tactical-AI/1.0"},
                )
                r.raise_for_status()
                print("[PI] STREAM CONNECTED")

                buf = b""
                for chunk in r.iter_content(chunk_size=16384):
                    if self.stop_event.is_set():
                        break
                    if not chunk:
                        continue
                    buf += chunk

                    while True:
                        a = buf.find(b"\xff\xd8")
                        if a < 0:
                            if len(buf) > 2_000_000:
                                buf = buf[-100_000:]
                            break

                        b = buf.find(b"\xff\xd9", a + 2)
                        if b < 0:
                            if a:
                                buf = buf[a:]
                            break

                        jpg = buf[a:b + 2]
                        buf = buf[b + 2:]

                        frame = cv2.imdecode(
                            np.frombuffer(jpg, dtype=np.uint8),
                            cv2.IMREAD_COLOR,
                        )
                        if frame is None:
                            continue

                        result = self.engine.predict(frame)

                        with self.lock:
                            self.frame = frame
                            self.latest.update({
                                "sign": result["sign"],
                                "confidence": round(float(result["confidence"]), 3),
                                "connected": True,
                                "timestamp": time.time(),
                            })

                        stable = self.engine.stable_gesture(
                            result["sign"], result["confidence"]
                        )
                        if stable:
                            with self.lock:
                                self.latest["spoken_text"] = stable
                            asyncio.run_coroutine_threadsafe(
                                self.broadcast(self.latest.copy()), MAIN_LOOP
                            )

                r.close()

            except Exception as e:
                print(f"[PI] Stream error: {e}")
                with self.lock:
                    self.latest["connected"] = False
                    self.latest["sign"] = "NO SIGNAL"
                time.sleep(1)

    async def broadcast(self, data):
        msg = json.dumps(data)
        dead = []
        for ws in list(self.clients):
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.clients.discard(ws)

    def mjpeg(self):
        while not self.stop_event.is_set():
            with self.lock:
                frame = None if self.frame is None else self.frame.copy()
            if frame is None:
                time.sleep(.05)
                continue
            ok, jpg = cv2.imencode(".jpg", frame)
            if ok:
                yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpg.tobytes() + b"\r\n"

runtime = Runtime()
MAIN_LOOP = None

@app.on_event("startup")
async def startup():
    global MAIN_LOOP
    MAIN_LOOP = asyncio.get_running_loop()

@app.get("/health")
def health():
    with runtime.lock:
        return {
            "ok": True,
            "stream_url": runtime.stream_url,
            "latest": runtime.latest.copy(),
        }

@app.get("/latest")
def latest():
    with runtime.lock:
        return runtime.latest.copy()

@app.post("/connect")
def connect(payload: dict):
    url = str(payload.get("stream_url", "")).strip()
    model = str(payload.get("model_path", "models/gesture_model.joblib")).strip()
    if not url:
        return {"ok": False, "error": "stream_url required"}
    try:
        runtime.start(url, model)
        return {"ok": True, "stream_url": url}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/disconnect")
def disconnect():
    runtime.stop()
    return {"ok": True}

@app.get("/video")
def video():
    return StreamingResponse(
        runtime.mjpeg(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )

@app.websocket("/ws/sign")
async def sign_socket(ws: WebSocket):
    await ws.accept()
    runtime.clients.add(ws)
    try:
        with runtime.lock:
            await ws.send_text(json.dumps(runtime.latest.copy()))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        runtime.clients.discard(ws)
    except Exception:
        runtime.clients.discard(ws)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stream", required=True)
    parser.add_argument("--model", default="models/gesture_model.joblib")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    runtime.start(args.stream, args.model)
    uvicorn.run(app, host="0.0.0.0", port=args.port)

if __name__ == "__main__":
    main()
