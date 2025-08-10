const basket = document.getElementById("basket");
const berry = document.getElementById("berry");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartButton = document.getElementById("restartButton");
const finalScoreDisplay = document.getElementById("finalScore");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const comboDisplay = document.getElementById("comboDisplay");
const catchSound = document.getElementById("catchSound");
const missSound = document.getElementById("missSound");
const powerUpSound = document.getElementById("powerUpSound");

const gameConfig = {
  initialTime: 300,
  basketSpeed: 12,
  berryFallSpeed: 2,
  berryFrequency: 1000,
  highScoreKey: "berryCatcherHighScore",
};

const berryTypes = [
  { emoji: "🍓", value: 1, type: "good" },
  { emoji: "🍇", value: 2, type: "good" },
  { emoji: "🫐", value: -2, type: "bad" },
];

let gameState = {
  score: 0,
  timeLeft: gameConfig.initialTime,
  basketLeft: 240,
  moveDirection: null,
  gameOver: true,
  berries: [],
  berryInterval: null,
  timerInterval: null,
};

function handleKey(e) {
  if (e.type === "keydown") {
    if (e.key === "ArrowLeft") gameState.moveDirection = "left";
    if (e.key === "ArrowRight") gameState.moveDirection = "right";
  } else {
    gameState.moveDirection = null;
  }
}

function moveBasket() {
  if (gameState.moveDirection === "left") {
    gameState.basketLeft = Math.max(
      0,
      gameState.basketLeft - gameConfig.basketSpeed
    );
  } else if (gameState.moveDirection === "right") {
    gameState.basketLeft = Math.min(
      480,
      gameState.basketLeft + gameConfig.basketSpeed
    );
  }
  basket.style.left = gameState.basketLeft + "px";

  if (!gameState.gameOver) {
    requestAnimationFrame(moveBasket);
  }
}

function spawnBerry() {
  const berryEl = document.createElement("div");
  const randomBerry = berryTypes[Math.floor(Math.random() * berryTypes.length)];
  berryEl.textContent = randomBerry.emoji;
  berryEl.className = "berry";
  berryEl.style.left = Math.floor(Math.random() * 560) + "px";
  berryEl.style.top = "0px";
  berryEl.dataset.type = randomBerry.type;
  berryEl.dataset.value = randomBerry.value;
  document.getElementById("game").appendChild(berryEl);
  gameState.berries.push({
    el: berryEl,
    top: 0,
    speed: gameConfig.berryFallSpeed,
  });
}

function moveBerries() {
  gameState.berries.forEach((berryObj, index) => {
    berryObj.top += berryObj.speed;
    berryObj.el.style.top = berryObj.top + "px";

    const bLeft = parseInt(berryObj.el.style.left);
    if (
      berryObj.top >= 670 &&
      bLeft + 30 >= gameState.basketLeft &&
      bLeft <= gameState.basketLeft + 120
    ) {
      handleCatch(berryObj);
      berryObj.el.remove();
      gameState.berries.splice(index, 1);
    }

    if (berryObj.top > 700) {
      berryObj.el.remove();
      gameState.berries.splice(index, 1);
    }
  });

  if (!gameState.gameOver) requestAnimationFrame(moveBerries);
}

function handleCatch(berryObj) {
  const type = berryObj.el.dataset.type;
  const value = parseInt(berryObj.el.dataset.value);

  if (type === "good") {
    catchSound.play();
    gameState.score += value;
  } else if (type === "bad") {
    missSound.play();
    gameState.score = Math.max(0, gameState.score + value);
  }

  scoreDisplay.textContent = "Score: " + gameState.score;
}

function updateTimer() {
  if (gameState.timeLeft <= 0) {
    endGame();
    return;
  }
  let min = String(Math.floor(gameState.timeLeft / 60)).padStart(2, "0");
  let sec = String(gameState.timeLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `Time: ${min}:${sec}`;
  gameState.timeLeft--;
}

function initGame() {
  gameState = {
    ...gameState,
    score: 0,
    timeLeft: gameConfig.initialTime,
    basketLeft: 240,
    gameOver: false,
    berries: [],
  };
  scoreDisplay.textContent = "Score: 0";
  timerDisplay.textContent = "Time: 05:00";
  basket.style.left = "240px";

  gameState.berryInterval = setInterval(spawnBerry, gameConfig.berryFrequency);
  gameState.timerInterval = setInterval(updateTimer, 1000);
  moveBasket();
  moveBerries();
}

function endGame() {
  gameState.gameOver = true;
  clearInterval(gameState.berryInterval);
  clearInterval(gameState.timerInterval);

  document.querySelectorAll(".berry").forEach((b) => b.remove());

  const currentHigh = localStorage.getItem(gameConfig.highScoreKey) || 0;
  if (gameState.score > currentHigh) {
    localStorage.setItem(gameConfig.highScoreKey, gameState.score);
  }
  finalScoreDisplay.textContent = gameState.score;
  highScoreDisplay.textContent = `High Score: ${Math.max(
    currentHigh,
    gameState.score
  )}`;
  gameOverScreen.style.display = "flex";
}

function resetGame() {
  gameOverScreen.style.display = "none";
  startScreen.style.display = "none";
  initGame();
}

document.addEventListener("keydown", handleKey);
document.addEventListener("keyup", handleKey);
startButton.addEventListener("click", resetGame);
restartButton.addEventListener("click", resetGame);

window.onload = () => {
  const high = localStorage.getItem(gameConfig.highScoreKey) || 0;
  highScoreDisplay.textContent = `High Score: ${high}`;
};
