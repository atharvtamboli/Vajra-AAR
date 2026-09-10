// AAR Tactical Dashboard - frontend only.
// All telemetry is simulated until Raspberry Pi sensors/backend are connected.

const state = {
  hr: 84,
  readiness: 85,
  score: 87,
  speed: 4.2,
  distance: 1.84,
  lat: 34.150000,
  lon: 77.580000,
  markers: [],
  markerMode: "incident",
  telemetryData: Array.from({length:60}, (_,i)=>50 + Math.sin(i*.2)*12 + Math.random()*9),
};

const $ = id => document.getElementById(id);

// Readiness segments
const seg = $("readinessSegments");
for(let i=0;i<14;i++){ const el=document.createElement("i"); if(i<12)el.className="on"; seg.appendChild(el); }

// Leaflet map
const map = L.map("map", {zoomControl:true, attributionControl:true}).setView([state.lat,state.lon], 14);

const darkTiles = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {maxZoom:19, attribution:'© OpenStreetMap © CARTO'}
).addTo(map);

const satelliteTiles = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {maxZoom:19, attribution:'Tiles © Esri'}
);

const youIcon = L.divIcon({
  className:"",
  html:'<div style="width:15px;height:15px;border-radius:50%;background:#75c486;border:3px solid #d6f1da;box-shadow:0 0 14px #68b976"></div>',
  iconSize:[15,15], iconAnchor:[7,7]
});
const youMarker = L.marker([state.lat,state.lon],{icon:youIcon}).addTo(map).bindTooltip("YOU · SIMULATED GPS",{permanent:false});
const forces = [
  {id:"P-01", name:"ALPHA", lat:19.0780, lon:72.8745, heading:42, speed:2.8, status:"MOVING"},
  {id:"P-02", name:"BRAVO", lat:19.0738, lon:72.8810, heading:128, speed:2.1, status:"MOVING"},
  {id:"P-03", name:"CHARLIE", lat:19.0800, lon:72.8830, heading:270, speed:0, status:"HOLD"}
];

function forceIcon(force){
  const color = force.status === "HOLD" ? "#c48758" : "#78bc85";
  return L.divIcon({
    className:"",
    html:`<div class="force-marker" style="border-color:${color};color:${color}">
      <span>✦</span><b>${force.id}</b><i style="transform:rotate(${force.heading}deg)">▲</i>
    </div>`,
    iconSize:[42,42], iconAnchor:[21,21]
  });
}

forces.forEach(f=>{
  f.marker=L.marker([f.lat,f.lon],{icon:forceIcon(f),zIndexOffset:300}).addTo(map)
    .bindTooltip(`${f.id} · ${f.name}`,{direction:"top",offset:[0,-18]});
});

function renderForces(){
  const list=$("forceList");
  list.innerHTML="";
  forces.forEach(f=>{
    const card=document.createElement("div");
    card.className="force-card";
    card.innerHTML=`
      <div class="force-card-head"><span>✦ ${f.name}</span><b>${f.id}</b></div>
      <div class="force-card-meta"><span>${f.status}</span><span>${f.speed.toFixed(1)} km/h</span></div>
      <button>${f.status==="HOLD"?"RESUME":"HOLD"}</button>`;
    card.querySelector("button").onclick=(e)=>{
      e.stopPropagation();
      f.status=f.status==="HOLD"?"MOVING":"HOLD";
      if(f.status==="MOVING" && f.speed===0)f.speed=2.2;
      renderForces();
      addEvent(`${f.id} ${f.status==="HOLD"?"halted":"resumed"}`,"Para force simulation state changed");
    };
    card.onclick=()=>map.flyTo([f.lat,f.lon],16,{duration:.7});
    list.appendChild(card);
  });
  $("forceCount").textContent=forces.length;
}
renderForces();

$("addParaBtn").onclick=()=>{
  const center=map.getCenter();
  const f={
    id:`P-${String(forces.length+1).padStart(2,"0")}`,
    name:["DELTA","ECHO","FOXTROT","GOLF"][Math.max(0,forces.length-3)] || "UNIT",
    lat:center.lat+.001*(Math.random()-.5),
    lon:center.lng+.001*(Math.random()-.5),
    heading:Math.floor(Math.random()*360), speed:2.4, status:"MOVING"
  };
  f.marker=L.marker([f.lat,f.lon],{icon:forceIcon(f),zIndexOffset:300}).addTo(map)
    .bindTooltip(`${f.id} · ${f.name}`,{direction:"top",offset:[0,-18]});
  forces.push(f); renderForces();
  addEvent(`${f.id} added`,"Para force added to map");
};

function moveForces(){
  forces.forEach(f=>{
    if(f.status!=="MOVING")return;
    // Small simulated movement based on heading.
    const metersPerTick=f.speed/3.6;
    const rad=f.heading*Math.PI/180;
    const dLat=(Math.cos(rad)*metersPerTick)/111320;
    const dLon=(Math.sin(rad)*metersPerTick)/(111320*Math.cos(f.lat*Math.PI/180));
    f.lat+=dLat; f.lon+=dLon;
    f.heading=(f.heading + (Math.random()-.5)*8 + 360)%360;
    f.speed=Math.max(.8,Math.min(4.8,f.speed+(Math.random()-.5)*.25));
    f.marker.setLatLng([f.lat,f.lon]).setIcon(forceIcon(f));
  });
  renderForces();
}
setInterval(moveForces,1000);


function markerIcon(type){
  const chars={incident:"!",checkpoint:"⌖",objective:"◇"};
  const colors={incident:"#d4874b",checkpoint:"#79bd86",objective:"#9ba7d0"};
  return L.divIcon({
    className:"",
    html:`<div style="width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#111715;border:2px solid ${colors[type]};color:${colors[type]};font:bold 12px monospace;box-shadow:0 0 10px #000">${chars[type]}</div>`,
    iconSize:[24,24],iconAnchor:[12,12]
  });
}

map.on("click", e=>{
  const m=L.marker(e.latlng,{icon:markerIcon(state.markerMode)}).addTo(map);
  m.bindPopup(`<b>${state.markerMode.toUpperCase()}</b><br>${e.latlng.lat.toFixed(6)}°, ${e.latlng.lng.toFixed(6)}°`);
  state.markers.push(m);
  $("markerCount").textContent=state.markers.length+1;
  addEvent(`${state.markerMode[0].toUpperCase()+state.markerMode.slice(1)} marked`, `${e.latlng.lat.toFixed(4)}°, ${e.latlng.lng.toFixed(4)}°`);
});

document.querySelectorAll(".map-tool").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".map-tool").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    state.markerMode=btn.dataset.type;
  });
});
$("clearMarkers").onclick=()=>{
  state.markers.forEach(m=>map.removeLayer(m));
  state.markers=[];
  $("markerCount").textContent="1";
};
$("terrainBtn").onclick=()=>{if(map.hasLayer(satelliteTiles))map.removeLayer(satelliteTiles); if(!map.hasLayer(darkTiles))darkTiles.addTo(map); $("terrainBtn").classList.add("active");$("satBtn").classList.remove("active")};
$("satBtn").onclick=()=>{if(map.hasLayer(darkTiles))map.removeLayer(darkTiles); satelliteTiles.addTo(map); $("satBtn").classList.add("active");$("terrainBtn").classList.remove("active")};

// Generic chart drawing
function lineChart(canvasId,data,opts={}){
  const c=$(canvasId), dpr=devicePixelRatio||1, rect=c.getBoundingClientRect();
  c.width=rect.width*dpr;c.height=rect.height*dpr;
  const ctx=c.getContext("2d");ctx.scale(dpr,dpr);
  const w=rect.width,h=rect.height;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle="#252e2a";ctx.lineWidth=1;
  for(let y=10;y<h;y+=22){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  const min=opts.min ?? Math.min(...data)-4,max=opts.max ?? Math.max(...data)+4;
  ctx.beginPath();
  data.forEach((v,i)=>{
    const x=i*(w/(data.length-1)), y=h-8-((v-min)/(max-min))*(h-16);
    i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  });
  ctx.strokeStyle=opts.stroke||"#7db787";ctx.lineWidth=1.7;ctx.stroke();
  const last=data[data.length-1],lx=w,ly=h-8-((last-min)/(max-min))*(h-16);
  ctx.fillStyle=opts.stroke||"#7db787";ctx.beginPath();ctx.arc(lx,ly,3,0,Math.PI*2);ctx.fill();
}
function spark(canvasId,data){
  const c=$(canvasId),ctx=c.getContext("2d"),w=c.clientWidth,h=c.clientHeight;
  c.width=w*devicePixelRatio;c.height=h*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);
  ctx.clearRect(0,0,w,h);ctx.beginPath();
  data.forEach((v,i)=>{const x=i*(w/(data.length-1)),y=h-5-(v-70)/25*(h-10);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
  ctx.strokeStyle="#79b985";ctx.lineWidth=1.5;ctx.stroke();
}
function drawWave(){
  const c=$("waveform"),dpr=devicePixelRatio||1,rect=c.getBoundingClientRect();c.width=rect.width*dpr;c.height=rect.height*dpr;
  const ctx=c.getContext("2d");ctx.scale(dpr,dpr);const w=rect.width,h=rect.height;
  ctx.clearRect(0,0,w,h);ctx.strokeStyle="#26312c";ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();
  ctx.beginPath();
  const t=Date.now()/110;
  for(let x=0;x<w;x++){
    const y=h/2 + Math.sin(x*.08+t)*8 + Math.sin(x*.21+t*1.7)*4 + (Math.random()-.5)*5;
    x?ctx.lineTo(x,y):ctx.moveTo(x,y);
  }
  ctx.strokeStyle="#78ad81";ctx.lineWidth=1.2;ctx.stroke();
}
function updateCharts(){
  lineChart("telemetryChart",state.telemetryData,{min:25,max:85,stroke:"#809c88"});
  drawWave();
}

// Simulated telemetry
setInterval(()=>{
  state.hr=Math.max(68,Math.min(126,state.hr + (Math.random()-.46)*4));
  state.telemetryData.push(45+Math.random()*25+Math.sin(Date.now()/4000)*12);state.telemetryData.shift();
  state.speed=Math.max(1.2,Math.min(7.5,state.speed+(Math.random()-.5)*.5));
  state.distance += state.speed/3600/3;
  const step=state.speed/360000;
  state.lat += Math.cos(Date.now()/6000)*step;
  state.lon += Math.sin(Date.now()/7000)*step;
  state.readiness=Math.round(Math.max(78,Math.min(94,85+(Math.random()-.5)*3)));
  $("readinessValue").textContent=state.readiness+"%";
  $("speed").textContent=state.speed.toFixed(1)+" km/h";
  $("speedBig").textContent=state.speed.toFixed(1)+" km/h";
  $("distance").textContent=state.distance.toFixed(2)+" km";
  const latTxt=state.lat.toFixed(6)+"° N",lonTxt=state.lon.toFixed(6)+"° E";
  $("lat").textContent=latTxt;$("lon").textContent=lonTxt;$("latBig").textContent=latTxt;$("lonBig").textContent=lonTxt;
  youMarker.setLatLng([state.lat,state.lon]);
  if(Math.random()<.12)addEvent("Telemetry update","Vitals / movement data refreshed");
  updateCharts();
},1000);

// Real audio path: microphone -> filter -> analyser -> displayed waveform.
let audioCtx=null, micStream=null, sourceNode=null, filterNode=null, analyser=null, audioRunning=false;
async function startRealAudio(){
  try{
    micStream=await navigator.mediaDevices.getUserMedia({audio:true});
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    sourceNode=audioCtx.createMediaStreamSource(micStream);
    filterNode=audioCtx.createBiquadFilter();
    filterNode.type="lowpass"; filterNode.frequency.value=4200; filterNode.Q.value=.7;
    analyser=audioCtx.createAnalyser(); analyser.fftSize=1024; analyser.smoothingTimeConstant=.75;
    sourceNode.connect(filterNode); filterNode.connect(analyser);
    audioRunning=true;
    $("startAudio").textContent="AUDIO ACTIVE";
    $("audioState").textContent="FILTERED AUDIO RECEIVING";
    $("audioState").style.color="#86bd8e";
    drawRealWave();
  }catch(err){
    $("audioState").textContent="MIC PERMISSION REQUIRED";
    $("audioState").style.color="#d48652";
  }
}
function drawRealWave(){
  if(!analyser)return;
  const c=$("waveform"),dpr=devicePixelRatio||1,rect=c.getBoundingClientRect();
  c.width=rect.width*dpr;c.height=rect.height*dpr;
  const ctx=c.getContext("2d");ctx.scale(dpr,dpr);const w=rect.width,h=rect.height,buf=new Uint8Array(analyser.fftSize);
  function frame(){
    if(!audioRunning)return;
    analyser.getByteTimeDomainData(buf);ctx.clearRect(0,0,w,h);
    ctx.strokeStyle="#26312c";ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();
    ctx.beginPath();let sum=0;
    for(let i=0;i<buf.length;i++){const v=(buf[i]-128)/128;sum+=v*v;const x=i/(buf.length-1)*w,y=h/2+v*h*.39;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.strokeStyle="#78ad81";ctx.lineWidth=1.35;ctx.stroke();
    const rms=Math.sqrt(sum/buf.length),db=rms>0?20*Math.log10(rms):-60;
    $("dbValue").textContent=Math.max(-60,Math.round(db))+" dB";
    $("levelBar").style.width=Math.min(100,Math.max(2,(db+60)/60*100))+"%";
    requestAnimationFrame(frame);
  } frame();
}
$("startAudio").onclick=()=>{if(!audioRunning)startRealAudio()};
$("filterToggle").onchange=e=>{if(filterNode)filterNode.frequency.value=e.target.checked?4200:20000};
setInterval(()=>{if(!audioRunning)drawWave()},120);

// Video clock
let videoSeconds=0;
setInterval(()=>{
  videoSeconds++;
  const h=String(Math.floor(videoSeconds/3600)).padStart(2,"0");
  const m=String(Math.floor(videoSeconds%3600/60)).padStart(2,"0");
  const s=String(videoSeconds%60).padStart(2,"0");
  $("videoClock").textContent=`${h}:${m}:${s}`;
},1000);

// Raspberry Pi Motion HTTP/MJPEG hookup.
// Connect the laptop/receiver to the Pi Wi-Fi, then enter Pi IP + Motion port.
// Example: Pi IP 192.168.4.1 + port 8081.
// If Motion uses another path, paste the full URL instead.
$("connectVideo").onclick=()=>{
  const host=$("piHost").value.trim();
  const port=$("piPort").value.trim() || "8081";
  const pasted=$("streamUrl").value.trim();
  let url=pasted;
  if(!url && host) url=`http://${host}:${port}/`;
  if(!url)return;

  $("videoStatus").textContent="CONNECTING";
  $("feedBadge").textContent="CONNECTING";
  const img=$("motionFeed");
  img.src=url;
  img.onload=()=>{
    document.querySelector(".video-frame").classList.add("connected");
    $("videoStatus").textContent="CONNECTED";
    $("feedBadge").textContent="LIVE";
    $("videoStatus").style.color="#8dc495";
    $("feedBadge").style.color="#86c892";
  };
  img.onerror=()=>{
    $("videoStatus").textContent="CHECK STREAM";
    $("feedBadge").textContent="ERROR";
    $("videoStatus").style.color="#d48652";
    $("feedBadge").style.color="#d48652";
    document.querySelector(".video-frame").classList.remove("connected");
  };
};
$("fullscreenBtn").onclick=()=>{
  const frame=document.querySelector(".video-frame");
  if(frame.requestFullscreen)frame.requestFullscreen();
};

// Event helper
function addEvent(title,detail){
  const container=$("events");
  const time=new Date().toLocaleTimeString("en-GB",{hour12:false});
  const el=document.createElement("div");el.className="event";
  el.innerHTML=`<time>${time}</time><span class="event-dot green"></span><div><b>${title}</b><small>${detail}</small></div>`;
  container.prepend(el);
  while(container.children.length>8)container.lastElementChild.remove();
}
$("addEvent").onclick=()=>addEvent("Manual event","Instructor added event to AAR timeline");

window.addEventListener("resize",updateCharts);
updateCharts();


// ===== Tactical gesture AI — REAL-TIME polling =====
// Reads the backend continuously; no manual curl required.
(function connectTacticalGestureAI() {
  const signEl = document.getElementById("tacticalSign");
  const confEl = document.getElementById("tacticalConfidence");
  if (!signEl || !confEl) return;

  let lastSpoken = "";
  let lastEventAt = 0;

  function speak(text) {
    if (!text || text === "NO HAND" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  }

  async function poll() {
    try {
      const r = await fetch("http://localhost:8000/latest", { cache: "no-store" });
      if (!r.ok) throw new Error("backend");
      const d = await r.json();

      const sign = d.sign || "NO HAND";
      const conf = Number(d.confidence || 0);

      signEl.textContent = sign;
      confEl.textContent = `Confidence: ${(conf * 100).toFixed(0)}%`;

      // Speak once whenever a NEW stable command arrives.
      if (d.spoken_text && d.spoken_text !== lastSpoken) {
        lastSpoken = d.spoken_text;
        speak(d.spoken_text);

        if (typeof addEvent === "function" && Date.now() - lastEventAt > 1500) {
          addEvent(`SIGN: ${d.spoken_text}`, `Gesture AI · ${(conf * 100).toFixed(0)}% confidence`);
          lastEventAt = Date.now();
        }
      }

      // Reset speech latch after the hand disappears.
      if (sign === "NO HAND") lastSpoken = "";
    } catch (_) {
      signEl.textContent = "AI OFFLINE";
      confEl.textContent = "Backend: not connected";
    }
  }

  poll();
  setInterval(poll, 250); // ~4 updates/sec
})();
