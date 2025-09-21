const candles = document.getElementById('candles');
const message = document.getElementById('message');
const confettiCanvas = document.getElementById('confetti');
const ctx = confettiCanvas.getContext('2d');
const music = document.getElementById('bg-music');

const btnLight = document.getElementById("btn-light");
const btnBlow = document.getElementById("btn-blow");
const btnMessage = document.getElementById("btn-message");

let typingTimeouts = [];
let confettiPieces = [];
let fireworksParticles = [];
let runningConfetti = false;
let runningFireworks = false;

function lightCandles(){
  candles.classList.add('on');
  btnLight.style.display = "none";
  btnBlow.style.display = "inline-block";
  btnMessage.style.display = "inline-block";
  music.currentTime = 0;
  music.play().catch(() => alert("Click again to allow music 🎵"));
}

function blowCandles(){
  candles.classList.remove('on');
}

function showMessage(){
  typingTimeouts.forEach(timeout => clearTimeout(timeout));
  typingTimeouts = [];

  let lines = [
    "Happy Birthday, Maam Kathleen Mae Vallespin! ❤️",
    "Wishing you an amazing day filled with laughter, joy, and lots of cake! 🍰",
    "May all your dreams come true this year, and may you continue to shine bright like the wonderful person you are.",
    "Cheers to more fun memories, smiles, and adventures ahead! 🥳💖"
  ];

  const containerEl = document.querySelector(".message-container");
  containerEl.classList.add("show");

  const msgEl = document.querySelector(".message");
  msgEl.innerHTML = "";
  let i = 0;

  function typing(){
    if(i < lines.length){
      let line = lines[i];
      let j = 0;

      function typeLine(){
        if(j < line.length){
          msgEl.innerHTML += line.charAt(j);
          j++;
          typingTimeouts.push(setTimeout(typeLine, 50));
        } else {
          msgEl.innerHTML += "<br><br>";
          i++;
          typingTimeouts.push(setTimeout(typing, 100));
        }
      }
      typeLine();
    } else {
      startConfetti();
      startFireworks();
    }
  }
  typing();
}

// CONFETTI
function startConfetti(){
  resizeCanvas();
  runningConfetti = true;
  confettiPieces = [];
  const colors = ['#ff7ab6','#ffd76b','#7ee7fd','#b8ffb0','#ffad7a'];
  for(let i=0;i<150;i++){
    confettiPieces.push({
      x: Math.random()*confettiCanvas.width,
      y: Math.random()*confettiCanvas.height,
      w: 6+Math.random()*6,
      h: 8+Math.random()*8,
      rot: Math.random()*360,
      speed: 1+Math.random()*3,
      color: colors[Math.floor(Math.random()*colors.length)],
      sway: Math.random()*2
    });
  }
}

// FIREWORKS
function startFireworks(){
  resizeCanvas();
  runningFireworks = true;

  function createFirework(){
    let x = Math.random()*confettiCanvas.width;
    let y = Math.random()*(confettiCanvas.height/2);
    let count = 60;
    const colors = ['#ff5c9e','#ffd76b','#7ee7fd','#b8ffb0','#ffad7a','#ffffff'];
    for(let i=0;i<count;i++){
      let angle = (Math.PI*2)*(i/count);
      let speed = Math.random()*5 + 2;
      fireworksParticles.push({
        x:x, y:y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        alpha:1,
        color: colors[Math.floor(Math.random()*colors.length)]
      });
    }
  }

  setInterval(createFirework, 1200);
}

// ANIMATION LOOP
function animate(){
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);

  if(runningConfetti){
    confettiPieces.forEach(p=>{
      p.y += p.speed;
      p.x += Math.sin((p.y+p.sway)*0.05)*2;
      p.rot += p.speed*2;
      if(p.y>confettiCanvas.height) p.y=-10;
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.color;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });
  }

  if(runningFireworks){
    fireworksParticles.forEach((p,index)=>{
      p.x+=p.vx;
      p.y+=p.vy;
      p.alpha-=0.01;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,3,0,Math.PI*2);
      ctx.fill();
      if(p.alpha<=0) fireworksParticles.splice(index,1);
    });
    ctx.globalAlpha=1;
  }

  requestAnimationFrame(animate);
}

function resizeCanvas(){
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
animate();
