const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('finalScore');
const powerUpMessage = document.getElementById('powerUpMessage');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = { x: 100, y: canvas.height / 2, width: 50, height: 30, speed: 5, bulletSpeed: 10, fireRate: 10 };
let bullets = [];
let enemies = [];
let powerUps = [];
let score = 0;
let gameRunning = false;
let frameCount = 0;
let powerUpActive = false;
let powerUpTimer = 0;

// Audio Context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency, type, duration) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.currentTime);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

function drawPixelJet(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + height / 2);
  ctx.lineTo(x + width * 0.3, y);
  ctx.lineTo(x + width, y + height * 0.3);
  ctx.lineTo(x + width, y + height * 0.7);
  ctx.lineTo(x + width * 0.3, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.stroke();
}

function drawPixelAlien(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.3);
  ctx.lineTo(x + width * 0.5, y);
  ctx.lineTo(x + width, y + height * 0.3);
  ctx.lineTo(x + width * 0.7, y + height);
  ctx.lineTo(x + width * 0.3, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.stroke();
}

function spawnEnemy() {
  const size = 40;
  enemies.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - size),
    width: size,
    height: size,
    speed: Math.random() * 3 + 2,
    amplitude: Math.random() * 50 + 50,
    frequency: Math.random() * 0.02 + 0.01,
    phase: Math.random() * Math.PI * 2
  });
}

function spawnPowerUp() {
  const size = 20;
  powerUps.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - size),
    width: size,
    height: size,
    speed: 2,
    type: Math.random() > 0.5 ? 'speed' : 'bullet'
  });
}

function activatePowerUp(type) {
  powerUpActive = true;
  powerUpTimer = 300; // 5 seconds at 60 FPS
  if (type === 'speed') {
    player.speed = 8;
    powerUpMessage.textContent = 'Speed Boost!';
  } else {
    player.bulletSpeed = 15;
    player.fireRate = 5;
    powerUpMessage.textContent = 'Rapid Fire!';
  }
  powerUpMessage.style.opacity = '1';
  setTimeout(() => {
    powerUpMessage.style.opacity = '0';
  }, 1000);
}

function update() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frameCount++;

  // Draw background stars
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }

  // Draw player jet
  drawPixelJet(player.x, player.y, player.width, player.height, '#00ffff');

  // Handle bullets
  bullets.forEach((bullet, index) => {
    bullet.x += bullet.speed;
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    if (bullet.x > canvas.width) {
      bullets.splice(index, 1);
    }
  });

  // Move and draw enemies
  enemies.forEach((enemy, index) => {
    enemy.x -= enemy.speed;
    enemy.y += Math.sin(frameCount * enemy.frequency + enemy.phase) * enemy.amplitude / 60;
    drawPixelAlien(enemy.x, enemy.y, enemy.width, enemy.height, '#ff00ff');
    if (enemy.x + enemy.width < 0) {
      enemies.splice(index, 1);
      score += 50;
      scoreDisplay.textContent = `Score: ${score}`;
    }
    // Collision with player
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      endGame();
    }
    // Collision with bullets
    bullets.forEach((bullet, bIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemies.splice(index, 1);
        bullets.splice(bIndex, 1);
        score += 100;
        scoreDisplay.textContent = `Score: ${score}`;
        playSound(200, 'square', 0.2); // Explosion sound
      }
    });
  });

  // Move and draw power-ups
  powerUps.forEach((powerUp, index) => {
    powerUp.x -= powerUp.speed;
    ctx.fillStyle = powerUp.type === 'speed' ? '#00ff00' : '#ff0000';
    ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    if (powerUp.x + powerUp.width < 0) {
      powerUps.splice(index, 1);
    }
    // Collision with player
    if (
      player.x < powerUp.x + powerUp.width &&
      player.x + player.width > powerUp.x &&
      player.y < powerUp.y + powerUp.height &&
      player.y + player.height > powerUp.y
    ) {
      activatePowerUp(powerUp.type);
      powerUps.splice(index, 1);
    }
  });

  // Spawn new enemies and power-ups
  if (Math.random() < 0.02) spawnEnemy();
  if (Math.random() < 0.005) spawnPowerUp();

  // Handle power-up timer
  if (powerUpActive) {
    powerUpTimer--;
    if (powerUpTimer <= 0) {
      powerUpActive = false;
      player.speed = 5;
      player.bulletSpeed = 10;
      player.fireRate = 10;
    }
  }

  requestAnimationFrame(update);
}

function movePlayer(event) {
  if (!gameRunning) return;
  if (event.key === 'ArrowUp' && player.y > 0) {
    player.y -= player.speed;
  }
  if (event.key === 'ArrowDown' && player.y < canvas.height - player.height) {
    player.y += player.speed;
  }
  if (event.key === ' ') {
    if (frameCount % player.fireRate === 0) {
      bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 2,
        width: 10,
        height: 4,
        speed: player.bulletSpeed
      });
      playSound(800, 'square', 0.1); // Shoot sound
    }
  }
}

function startGame() {
  startScreen.style.display = 'none';
  gameRunning = true;
  score = 0;
  frameCount = 0;
  bullets = [];
  enemies = [];
  powerUps = [];
  powerUpActive = false;
  player.y = canvas.height / 2;
  player.speed = 5;
  player.bulletSpeed = 10;
  player.fireRate = 10;
  scoreDisplay.textContent = `Score: ${score}`;
  powerUpMessage.style.opacity = '0';
  update();
}

function endGame() {
  gameRunning = false;
  gameOverScreen.style.display = 'flex';
  finalScoreDisplay.textContent = `Score: ${score}`;
}

function restartGame() {
  gameOverScreen.style.display = 'none';
  startGame();
}

window.addEventListener('keydown', movePlayer);
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
