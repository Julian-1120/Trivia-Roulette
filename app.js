// Categories with SVG-friendly icon placeholders (you can replace icons with SVG paths later)
const categories = [
  { name: "Sports", color: "rgba(255,119,35,1)", emoji: "🏈" },
  { name: "Geography", color: "rgba(65,156,247,1)", emoji: "🌍" },
  { name: "Science", color: "rgba(28,227,88,1)", emoji: "🧪" },
  { name: "History", color: "rgba(245,210,94,1)", emoji: "🏛️" },
  { name: "Art", color: "rgba(239,51,51,1)", emoji: "🎨" }
];

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resultEl = document.getElementById("result");
const spinSound = document.getElementById("spinSound");
const stopSound = document.getElementById("stopSound");

let DPR = Math.max(window.devicePixelRatio || 1, 1);
let arc = (2 * Math.PI) / categories.length;
let radius = 0;
let center = { x: 0, y: 0 };
let angle = 0;        // current rotation angle (radians)
let spinning = false;

// resize canvas to container with DPR handling
function resizeCanvas(){
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // scale for DPR

  // center and radius in CSS pixels
  radius = Math.min(w, h) / 2;
  center.x = w / 2;
  center.y = h / 2;

  drawWheel();
}

window.addEventListener("resize", () => {
  // small debounce not necessary but ok
  resizeCanvas();
});

// draw wheel and arrow (arrow drawn in canvas to keep perfect alignment)
function drawWheel(){
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0,0,w,h);

  // outer circle shadow
  // sectors
  for(let i=0;i<categories.length;i++){
    const start = i * arc + angle;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.arc(center.x, center.y, radius, start, start + arc, false);
    ctx.closePath();
    ctx.fillStyle = categories[i].color;
    ctx.fill();
  }

  // draw inner subtle ring (like Preguntados)
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius*0.92, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  ctx.fill();

  // draw icons (emoji placeholders centered in each sector)
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = `${Math.max(18, radius * 0.18)}px Arial`;
  for(let i=0;i<categories.length;i++){
    const sectorCenter = i * arc + angle + arc/2;
    // position the icon radially at ~60% of radius
    const iconR = radius * 0.6;
    const x = center.x + Math.cos(sectorCenter) * iconR;
    const y = center.y + Math.sin(sectorCenter) * iconR;
    // Shadow for icon
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillText(categories[i].emoji, x+2, y+2);
    // Icon
    ctx.fillStyle = "rgba(255,255,255,0.95)"; // white-ish for visibility
    ctx.fillText(categories[i].emoji, x, y);
  }

  // draw center circle (the big white button is HTML element on top; this is decorative)
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius*0.30, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fill();

  // draw arrow at top center (pointing down toward center)
  drawArrow();
}

// draws a white triangular arrow at the top center of the wheel (on canvas)
function drawArrow(){
  const arrowW = Math.max(16, radius * 0.12);
  const arrowH = arrowW * 1.1;
  const x = center.x;
  const y = center.y - radius + arrowH*0.5 + 2; // placed just above wheel edge

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x - arrowW/2, y);
  ctx.lineTo(x + arrowW/2, y);
  ctx.lineTo(x, y + arrowH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // little notch/shadow circle under arrow to mimic Preguntados
  ctx.beginPath();
  ctx.arc(x, y + arrowH + 6, 10, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fill();

  ctx.restore();
}

// easing
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

// spin behavior (smooth interpolation)
spinBtn.addEventListener("click", () => {
  if(spinning) return;
  spinning = true;
  spinSound.currentTime = 0;
  spinSound.loop = true;
  spinSound.play();

  const startAngle = angle;
  // choose random number of full rotations and final offset
  const minSpins = 5;
  const extra = Math.random() * 2 * Math.PI; // random offset so stops at different sectors
  const targetAngle = startAngle + (minSpins + Math.random()*3) * Math.PI * 2 + extra;

  const duration = 4500 + Math.random()*1200; // 4.5s - 5.7s

  let startTime = null;
  function animate(now){
    if(!startTime) startTime = now;
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(progress);

    angle = startAngle + (targetAngle - startAngle) * eased;
    drawWheel();

    if(progress < 1){
      requestAnimationFrame(animate);
    } else {
      // finish: small settling bounce (non-blocking)
      spinSound.pause();
      stopSound.currentTime = 0;
      stopSound.play();

      // very small overshoot/back to simulate bounce
      const bounceStart = performance.now();
      const bounceDur = 360;
      const overshoot = (Math.random() * 0.06 + 0.02); // small radians overshoot
      const base = angle;
      function bounceFrame(t){
        const p = Math.min(1, (t - bounceStart) / bounceDur);
        // bounce easing (ease out then slight back)
        const bounce = Math.sin(p * Math.PI) * overshoot * (1 - p);
        angle = base + bounce;
        drawWheel();
        if(p < 1) requestAnimationFrame(bounceFrame);
        else {
          spinning = false;
          showResult();
        }
      }
      requestAnimationFrame(bounceFrame);
    }
  }

  requestAnimationFrame(animate);
});

// compute which category is at the arrow (top). Arrow points down to wheel center (0,-radius direction).
function showResult(){
  const full = 2 * Math.PI;
  let adjusted = ((-Math.PI/2 - angle) % full + full) % full;
  let index = Math.floor(adjusted / arc);
  index = (index % categories.length + categories.length) % categories.length;

  const cat = categories[index];

  showCategoryPopup(cat.name);
  confetti({
  particleCount: 200,
  spread: 90,
  origin: { y: 0.6 }
});

}



function showCategoryPopup(category) {
  const popup = document.getElementById("categoryPopup");
  popup.textContent = "Category: " + category;

  // Mostrar animación
  popup.classList.add("show");

  // Ocultar después de 2.5s
  setTimeout(() => {
    popup.classList.remove("show");
  }, 2500);
}


// initial setup
resizeCanvas();
drawWheel();
