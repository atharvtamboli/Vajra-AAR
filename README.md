# Vajra AAR

## Problem Statement

Traditional tactical training often relies on manual observation and post-training analysis, making it difficult to capture real-time hand signals, movement, and performance data in one place.

## Solution Overview

**Vajra AAR** is a real-time tactical training and After Action Review platform that uses a Raspberry Pi camera, computer vision, AI-based gesture recognition, live telemetry, mapping, and voice feedback to monitor and analyze training activities.

The system detects tactical hand signals in real time and displays the recognized command on the dashboard with voice feedback.

---

## Technologies & Tools

* **Python**
* **FastAPI & Uvicorn**
* **OpenCV**
* **MediaPipe**
* **YOLO26n**
* **NCNN** — optimized inference for ARM64/Raspberry Pi
* **Scikit-learn & Joblib**
* **HTML5, CSS3, JavaScript**
* **Leaflet.js**
* **OpenStreetMap**
* **Web Speech API**
* **Web Audio API**
* **Raspberry Pi + Camera**
* **Motion/MJPEG Streaming**
* **REST API & WebSockets**

---

## Architecture / Workflow

```text
Raspberry Pi Camera
        ↓
   MJPEG Stream
        ↓
   Python Backend
        ↓
 OpenCV / MediaPipe
        ↓
 YOLO26n / ML Model
        ↓
 Gesture Recognition
        ↓
 REST API / WebSocket
        ↓
   Web Dashboard
     ↓      ↓
  Tactical  Voice
    Map    Feedback
     ↓
  AAR Timeline
```

---

## Setup & Run

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd "Vajra AAR"
```

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Start the AI backend

```text
START_AI.bat
```

### 4. Start the frontend

Open another terminal:

```bash
cd frontend
```

Run:

```text
START_DASHBOARD.bat
```

Open:

```text
http://localhost:5500
```

### 5. Connect Raspberry Pi

Enter the Raspberry Pi's IP address and camera streaming port in the dashboard and click **CONNECT**.

---

## Team Members

* **[Atharv Tamboli]**
* **[Aman Kumar Chouhan]**
---

## 🎯 Project Objective

Vajra AAR combines **AI, computer vision, edge computing, real-time communication, mapping, and data visualization** to create a unified platform for tactical training monitoring and After Action Review.
