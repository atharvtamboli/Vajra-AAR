## Edge AI & Low-Latency Communication

Vajra AAR uses a **Raspberry Pi 4 as an edge-computing and communication node**, allowing camera data, audio, and AI inference to operate close to the training environment.

The edge node is designed to reduce network dependency, improve response time, and enable real-time tactical monitoring.

### ARM64 Edge AI Inference

The Raspberry Pi 4 runs the object/gesture detection model locally using **NCNN**, an optimized neural-network inference framework suitable for ARM64 edge devices.

The trained YOLO26n model is exported to NCNN format and deployed on the Raspberry Pi.

```text
YOLO26n Training
       ↓
    best.pt
       ↓
   NCNN Export
       ↓
 ┌───────────────┐
 │ model.param   │
 │ model.bin     │
 └───────────────┘
       ↓
 Raspberry Pi 4
      ARM64
       ↓
      NCNN
       ↓
 Real-Time Inference
       ↓
 Detection / Gesture Data
       ↓
 FastAPI / WebSocket
       ↓
 Dashboard
```

### Why NCNN?

NCNN allows the AI model to run directly on the Raspberry Pi without requiring the complete PyTorch inference stack.

Benefits include:

* ARM64 optimized inference
* Lower runtime overhead
* Suitable for embedded devices
* Efficient CPU inference
* Reduced deployment size
* Better suitability for real-time edge applications

For real-time operation, the system prioritizes the **latest camera frame** instead of allowing old frames to build up in an inference queue. This prevents increasing latency when inference is slower than the camera frame rate.

---

## Low-Latency Video Streaming

The system initially used **Motion/MJPEG** to stream the Raspberry Pi camera over the local network.

Although Motion successfully provided a live stream, the observed latency was too high for real-time tactical training.

Therefore, the video architecture is being upgraded to:

```text
Lenovo FHD USB Webcam
          ↓
       /dev/video0
          ↓
   MJPEG 1280×720
       @ 30 FPS
          ↓
      GStreamer
          ↓
       H.264
          ↓
      MediaMTX
          ↓
       WebRTC
          ↓
   Laptop / Dashboard
```

The USB webcam was tested using V4L2 and confirmed to support:

```text
MJPEG
1280 × 720 @ 30 FPS
1920 × 1080 @ 30 FPS
640 × 480 @ 30 FPS
```

The initial target configuration is:

```text
1280 × 720
30 FPS
MJPEG camera input
H.264 encoded stream
WebRTC delivery
```

### Why WebRTC?

WebRTC is being used as the target transport for the live dashboard because it is designed for interactive, low-latency audio/video communication.

This is more suitable for tactical training and robotics-style applications than a heavily buffered MJPEG stream.

---

## USB Headset & Audio Communication

A USB headset/microphone can be connected directly to the Raspberry Pi.

The audio device is detected through the Linux audio subsystem.

```text
USB Headset / Microphone
          ↓
      ALSA / PipeWire
          ↓
        Opus
          ↓
      MediaMTX
          ↓
       WebRTC
          ↓
      Laptop
```

The microphone can be verified using:

```bash
lsusb
```

List recording devices:

```bash
arecord -l
```

List playback devices:

```bash
aplay -l
```

A basic microphone test can be performed using:

```bash
arecord -D default \
    -f S16_LE \
    -r 48000 \
    -c 2 \
    test.wav
```

Then play the recording:

```bash
aplay test.wav
```

For network communication, **Opus** is preferred because it is designed for interactive audio communication and provides good voice quality at relatively low bandwidth.

---

## Local Network Video & Audio Sharing

The Raspberry Pi acts as the edge streaming node on the local network.

The Pi and receiving laptop should be connected to the same LAN.

The Pi's IP address can be obtained using:

```bash
hostname -I
```

Example:

```text
192.168.1.50
```

The communication architecture is:

```text
                    Raspberry Pi 4
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
      USB Camera                   USB Microphone
          │                             │
        MJPEG                           │
          │                            PCM
          ▼                             ▼
      H.264 Encoder                Opus Encoder
          │                             │
          └──────────────┬──────────────┘
                         ▼
                      MediaMTX
                         │
                      WebRTC
                         │
                         ▼
                  Local Network
                         │
                         ▼
                  Main Laptop
                         │
                ┌────────┴────────┐
                ▼                 ▼
             Video              Audio
                │                 │
                └────────┬────────┘
                         ▼
                    AAR Dashboard
```

This allows the training team to view the live camera feed and receive audio from the Raspberry Pi through the local network without requiring an external cloud server.

---

## Integrated Edge Pipeline

The complete Vajra AAR edge architecture combines AI inference, video streaming, audio communication, and the web dashboard.

```text
                         VAJRA AAR
                             │
                    ┌────────┴────────┐
                    │ Raspberry Pi 4  │
                    │     ARM64       │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
     USB Camera        USB Microphone       Sensors
          │                  │
       MJPEG                Audio
          │                  │
          ▼                  ▼
       H.264                Opus
          │                  │
          └──────────┬───────┘
                     ▼
                  MediaMTX
                     │
                   WebRTC
                     │
                     ▼
                  Dashboard
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
       Video      Voice      Tactical Map
                               │
                               ▼
                          AAR Timeline

Camera frames
      │
      ▼
   NCNN / YOLO26n
      │
      ▼
 Detection / Gesture Recognition
      │
      ▼
 FastAPI / WebSocket
      │
      ▼
 Dashboard
```

---

## Raspberry Pi Edge Setup

### Check camera devices

```bash
ls /dev/video*
```

List camera devices:

```bash
v4l2-ctl --list-devices
```

Check supported formats:

```bash
v4l2-ctl --list-formats-ext -d /dev/video0
```

### Stop Motion when using the new video pipeline

```bash
sudo systemctl stop motion
```

Check whether another process is using the camera:

```bash
sudo fuser -v /dev/video0
```

This prevents multiple applications from attempting to access the same USB camera simultaneously.

### Check GStreamer

```bash
gst-launch-1.0 --version
```

Check available H.264 components:

```bash
gst-inspect-1.0 | grep -i h264
```

---

## Edge Processing Strategy

The system separates **AI processing from video transport**.

```text
                   USB Camera
                       │
                       ▼
                  Frame Source
                   ┌───┴────┐
                   │        │
                   ▼        ▼
                NCNN      Encoder
                   │        │
                   ▼        ▼
              YOLO26n    H.264
                   │        │
                   ▼        ▼
              Detection  MediaMTX
                   │        │
                   ▼        ▼
              FastAPI     WebRTC
                   │        │
                   └────┬───┘
                        ▼
                    Dashboard
```

This allows the Raspberry Pi to perform AI inference locally while simultaneously providing a live visualization stream to the operator.

---

## Edge Computing Objective

The Raspberry Pi edge node is designed to provide:

* Local AI inference
* Reduced dependence on cloud computing
* Low-latency video communication
* Local voice communication
* ARM64 optimized deployment
* Real-time detection
* Local-network operation
* Integration with the Vajra AAR dashboard

The overall objective is to move computationally important processing closer to the training environment while keeping the operator interface on a laptop or command workstation.
