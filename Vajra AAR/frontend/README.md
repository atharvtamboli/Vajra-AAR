# AAR Tactical Performance Dashboard

Frontend-only prototype for an After Action Review / combat-training performance interface.

## Run
Open `index.html` in a modern browser.

Internet is needed for:
- Leaflet library
- Leaflet map tiles
- Google Fonts

## Current prototype
- Tactical dark dashboard UI
- Leaflet 2D map
- Click-to-place Incident / Checkpoint / Objective markers
- Simulated GPS latitude/longitude
- Simulated heart-rate telemetry + graph
- Simulated audio level + waveform
- Simulated environment data
- Training event timeline
- Larger Raspberry Pi Motion video area
- Motion HTTP stream URL input
- Fullscreen video
- No backend

## Raspberry Pi Motion
Enter the HTTP/MJPEG stream URL into the input under LIVE VIDEO FEED.
The frontend does not run or configure Motion.

## Later backend
The planned receiving-device pipeline can be added separately:
Video stream -> YOLO inference -> sign/gesture detection -> text -> speech.
