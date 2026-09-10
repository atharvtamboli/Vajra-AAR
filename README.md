# Vajra AAR

**Vajra AAR** is a real-time tactical performance and **After Action Review (AAR)** dashboard that combines **computer vision, machine learning, Raspberry Pi video streaming, tactical gesture recognition, telemetry, mapping, audio monitoring, and voice feedback** into a unified interface.

The system detects predefined hand signals through a Raspberry Pi camera, processes them using **MediaPipe + a machine-learning classifier**, and displays and announces the detected command in real time.

---

## Key Features

*  **Real-time Raspberry Pi camera streaming**
*  **AI-powered tactical hand gesture recognition**
*  **MediaPipe hand landmark detection**
*  **Scikit-learn gesture classification**
*  **Automatic voice feedback**
*  **Interactive tactical map**
*  **Real-time telemetry dashboard**
*  **Microphone/audio monitoring**
*  **After Action Review timeline**
*  **REST API + WebSocket communication**
*  **Network-based Raspberry Pi integration**
*  **Browser-based tactical interface**

---

##  Gesture Recognition

The AI pipeline recognizes tactical hand signals such as:

| Gesture | Command |
| ------- | ------- |
| ✋       | STOP    |
| 👉      | MOVE    |
| ⚠️      | ENEMY   |
| ✊       | HOLD    |
| ➡️      | ADVANCE |

### Processing Pipeline

```text
Raspberry Pi Camera
        ↓
    MJPEG Stream
        ↓
      OpenCV
        ↓
    MediaPipe
        ↓
 Hand Landmarks
        ↓
 Landmark Normalization
        ↓
 ML Classifier
        ↓
 Confidence Filtering
        ↓
 Temporal Stabilization
        ↓
 Tactical Command
        ↓
 Dashboard + Voice
```

Temporal stabilization is used to prevent a single noisy frame from immediately triggering a command.

---

## 🏗️ System Architecture

```text
             ┌─────────────────┐
             │  Raspberry Pi   │
             │     Camera      │
             └────────┬────────┘
                      │
                 MJPEG Stream
                      │
                      ▼
             ┌─────────────────┐
             │ Python Backend  │
             │    FastAPI      │
             └────────┬────────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
        OpenCV +            REST API
        MediaPipe          WebSocket
             │                 │
             ▼                 │
       Gesture Model           │
             │                 │
             └────────┬────────┘
                      ▼
             ┌─────────────────┐
             │  Web Dashboard  │
             └───────┬─────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Tactical    Voice     Telemetry
         Map       Output      & AAR
```

---

# 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Leaflet.js
* Canvas API
* Web Audio API
* Web Speech API

### Backend

* Python
* FastAPI
* Uvicorn
* OpenCV
* NumPy
* Requests
* WebSockets

### Machine Learning

* MediaPipe
* Scikit-learn
* Joblib
* Hand landmark features
* Temporal prediction smoothing

### Hardware

* Raspberry Pi
* Raspberry Pi Camera
* Wi-Fi / LAN
* Motion MJPEG streaming

---

# 📁 Project Structure

```text
Vajra AAR/
│
├── backend/
│   ├── server.py
│   ├── sign_engine.py
│   ├── requirements.txt
│   ├── START_AI.bat
│   ├── START_PI_AI.bat
│   │
│   └── models/
│       └── gesture_model.joblib
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── START_DASHBOARD.bat
│
└── README_START_HERE.txt
```

---

# ⚙️ Setup

## 1. Install Dependencies

Navigate to the backend:

```bash
cd backend
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

---

## 2. Add the AI Model

Place the trained model at:

```text
backend/models/gesture_model.joblib
```

---

## 3. Start the AI Backend

Run:

```text
START_AI.bat
```

Or manually:

```bash
python server.py --stream http://<PI_IP>:8081/ --model models/gesture_model.joblib
```

The backend runs on:

```text
http://localhost:8000
```

---

## 4. Start the Dashboard

Open another terminal:

```bash
cd frontend
```

Run:

```text
START_DASHBOARD.bat
```

Then open:

```text
http://localhost:5500
```

---

# 📡 Raspberry Pi Connection

The Raspberry Pi provides the camera stream through Motion/MJPEG.

Example:

```text
http://192.168.1.100:8081/
```

Enter the Raspberry Pi's IP address and port in the dashboard and press **CONNECT**.

The PC and Raspberry Pi must be connected to the same network or otherwise be able to communicate with each other.

---

# 🌐 API

### Health Check

```http
GET /health
```

### Latest Gesture

```http
GET /latest
```

### Connect Camera

```http
POST /connect
```

### Disconnect Camera

```http
POST /disconnect
```

### Processed Video

```http
GET /video
```

### Real-Time Gesture WebSocket

```text
ws://localhost:8000/ws/sign
```

---

# 🔊 Voice Feedback

When a gesture becomes stable, the dashboard uses the browser's **Web Speech API** to announce the command.

```text
Gesture detected
       ↓
Stable prediction
       ↓
Command generated
       ↓
Browser SpeechSynthesis
       ↓
"ADVANCE"
```

Repeated speech is prevented while the same gesture remains active.

---

# 🗺️ Tactical Dashboard

The interface provides a tactical visualization layer containing:

* Interactive map
* Position tracking
* Checkpoints
* Objectives
* Event markers
* Movement information
* Environmental information
* Training timeline

The architecture allows simulated telemetry to be replaced with real sensor data in future versions.

---

# 📊 Telemetry & AAR

The dashboard provides an After Action Review interface for examining training activity.

It can display:

* Heart rate
* Readiness
* Speed
* Distance
* Environmental conditions
* Audio activity
* Gesture events
* Training phases
* Tactical timeline events

---

# 🔬 AI Feature Representation

Each detected hand contains **21 MediaPipe landmarks**, with each landmark represented using:

```text
X
Y
Z
```

For two hands:

```text
21 × 3 × 2 = 126 features
```

These features are normalized before being passed to the trained classifier.

---

# 🧪 Testing

Check whether the backend is running:

```text
http://localhost:8000/health
```

Check the latest AI prediction:

```text
http://localhost:8000/latest
```

Check the processed video:

```text
http://localhost:8000/video
```

---

# 🔮 Future Development

* Real GPS integration
* Wearable sensor integration
* Live heart-rate data
* Multi-camera support
* Persistent AAR database
* Automatic AAR report generation
* Gesture training/retraining interface
* Real-time analytics
* User authentication
* HTTPS deployment
* Edge AI processing directly on Raspberry Pi

---

# 🎯 Objective

Vajra AAR brings multiple tactical-training data sources together into one real-time system:

```text
SENSE → PROCESS → DETECT → DISPLAY → RESPOND → REVIEW
```

The goal is to provide a technology platform for **real-time tactical awareness, gesture-based communication, and post-training performance analysis**.

---

## 👨‍💻 Project

**Vajra AAR**

Built using **Python, FastAPI, OpenCV, MediaPipe, Scikit-learn, JavaScript, Leaflet, Raspberry Pi, and modern Web APIs.**
