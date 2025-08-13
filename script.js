// Elements
const gameEl = document.getElementById("game");
const basket = document.getElementById("basket");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartButton = document.getElementById("restartButton");
const finalScoreDisplay = document.getElementById("finalScore");
const highScoreDisplay = document.getElementById("highScoreDisplay");

const gameConfig = {
  initialTime: 60,
  basketSpeed: 15,
  berryFallSpeed: 4,
  berryFrequency: 400,
  highScoreKey: "berryCatcherHighScore",
  goldenBerryChance: 0.1,
  rottenBerryChance: 0.1,
  blueBerryChance: 0.02,
};

let gameState = {
  score: 0,
  timeLeft: gameConfig.initialTime,
  basketLeft: 0,
  moveDirection: null,
  gameOver: true,
  berries: [],
  berryInterval: null,
  timerInterval: null,
  speedLevel: 0, // New: Track speed increases
};

function handleKey(e) {
  if (e.type === "keydown") {
    if (e.key === "ArrowLeft") gameState.moveDirection = "left";
    if (e.key === "ArrowRight") gameState.moveDirection = "right";
  } else if (e.type === "keyup") {
    if (
      (e.key === "ArrowLeft" && gameState.moveDirection === "left") ||
      (e.key === "ArrowRight" && gameState.moveDirection === "right")
    ) {
      gameState.moveDirection = null;
    }
  }
}

document.addEventListener("keydown", handleKey);
document.addEventListener("keyup", handleKey);

document.addEventListener("mousemove", (e) => {
  if (gameState.gameOver) return;
  const gameRect = gameEl.getBoundingClientRect();
  const basketWidth = basket.offsetWidth;
  let x = e.clientX - gameRect.left - basketWidth / 2;
  x = Math.max(0, Math.min(x, gameRect.width - basketWidth));
  gameState.basketLeft = x;
  basket.style.left = x + "px";
});

gameEl.addEventListener(
  "touchmove",
  (e) => {
    if (gameState.gameOver) return;
    const touch = e.touches[0];
    const rect = gameEl.getBoundingClientRect();
    let x = touch.clientX - rect.left - basket.offsetWidth / 2;
    x = Math.max(0, Math.min(x, gameEl.clientWidth - basket.offsetWidth));
    gameState.basketLeft = x;
    basket.style.left = x + "px";
    e.preventDefault();
  },
  { passive: false }
);

function moveBasket() {
  if (gameState.moveDirection === "left") {
    gameState.basketLeft = Math.max(
      0,
      gameState.basketLeft - gameConfig.basketSpeed
    );
  } else if (gameState.moveDirection === "right") {
    gameState.basketLeft = Math.min(
      gameEl.clientWidth - basket.offsetWidth,
      gameState.basketLeft + gameConfig.basketSpeed
    );
  }
  basket.style.left = gameState.basketLeft + "px";
  if (!gameState.gameOver) requestAnimationFrame(moveBasket);
}

function spawnBerry() {
  const rand = Math.random();
  let berryEl = document.createElement("div");
  let berryType = "normal";

  if (rand < gameConfig.blueBerryChance) {
    berryEl.className = "blue-berry";
    berryType = "blue";
  } else if (rand < gameConfig.blueBerryChance + gameConfig.rottenBerryChance) {
    berryEl.className = "rotten-berry";
    berryType = "rotten";
  } else if (
    rand <
    gameConfig.blueBerryChance +
      gameConfig.rottenBerryChance +
      gameConfig.goldenBerryChance
  ) {
    berryEl.className = "golden-berry";
    berryType = "golden";
  } else {
    berryEl.textContent = "🍓";
    berryEl.className = "berry";
  }

  const maxLeft = gameEl.clientWidth - 30;
  berryEl.style.left = Math.floor(Math.random() * maxLeft) + "px";
  berryEl.style.top = "0px";

  gameEl.appendChild(berryEl);

  gameState.berries.push({
    el: berryEl,
    top: 0,
    speed: gameConfig.berryFallSpeed,
    type: berryType,
  });
}

function moveBerries() {
  const basketRect = basket.getBoundingClientRect();
  const gameRect = gameEl.getBoundingClientRect();

  for (let i = gameState.berries.length - 1; i >= 0; i--) {
    const berryObj = gameState.berries[i];
    berryObj.top += berryObj.speed;
    berryObj.el.style.top = berryObj.top + "px";

    const br = berryObj.el.getBoundingClientRect();

    if (
      br.bottom >= basketRect.top &&
      br.left < basketRect.right &&
      br.right > basketRect.left
    ) {
      catchBerry(berryObj);
      berryObj.el.remove();
      gameState.berries.splice(i, 1);
      continue;
    }

    if (br.top > gameRect.bottom) {
      missBerry(berryObj);
      berryObj.el.remove();
      gameState.berries.splice(i, 1);
    }
  }

  if (!gameState.gameOver) requestAnimationFrame(moveBerries);
}

function catchBerry(berryObj) {
  if (berryObj.type === "golden") {
    addScore(10, berryObj.el);
  } else if (berryObj.type === "rotten") {
    addScore(-10, berryObj.el);
  } else if (berryObj.type === "blue") {
    addTime(2, berryObj.el);
  } else {
    addScore(1, berryObj.el);
  }
}

function missBerry() {
  addScore(-1);
}

function addScore(points, berryEl) {
  gameState.score += points;
  if (gameState.score < 0) gameState.score = 0;
  scoreDisplay.textContent = "Score: " + gameState.score;

  if (berryEl) {
    if (points > 0) {
      showFloatingPoints("+" + points, berryEl);
    } else if (points < 0) {
      showFloatingPoints(points, berryEl, true);
    }
  }

  // Speed increase every 200 points
  const nextThreshold = (gameState.speedLevel + 1) * 200;
  if (gameState.score >= nextThreshold) {
    increaseGameSpeed();
    gameState.speedLevel++;
  }
}

function increaseGameSpeed() {
  gameConfig.berryFallSpeed += 1;
  if (gameConfig.berryFrequency > 100) {
    gameConfig.berryFrequency -= 50;
  }
  clearInterval(gameState.berryInterval);
  gameState.berryInterval = setInterval(spawnBerry, gameConfig.berryFrequency);
}

function addTime(seconds, berryEl) {
  gameState.timeLeft += seconds;
  if (gameState.timeLeft > 120) gameState.timeLeft = 120;

  const m = Math.floor(gameState.timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const s = (gameState.timeLeft % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `Time: ${m}:${s}`;

  if (berryEl) {
    showFloatingPoints("+" + seconds + "s", berryEl, false);
  }
}

function showFloatingPoints(text, element, special = false) {
  const pointsEl = document.createElement("div");
  pointsEl.className = "floating-points";
  pointsEl.textContent = text;

  if (special) {
    pointsEl.style.color = "#a83030";
    pointsEl.style.fontWeight = "900";
    pointsEl.style.textShadow = "0 0 6px #ff4444";
  } else if (text.includes("s")) {
    pointsEl.style.color = "#305fa8";
    pointsEl.style.fontWeight = "700";
    pointsEl.style.textShadow = "0 0 6px #4a79d2";
  }

  const offsetLeft =
    element.offsetLeft + (element.offsetWidth ? element.offsetWidth / 2 : 15);
  const offsetTop = element.offsetTop - 10;

  pointsEl.style.left = offsetLeft + "px";
  pointsEl.style.top = offsetTop + "px";

  gameEl.appendChild(pointsEl);

  pointsEl.addEventListener(
    "animationend",
    () => {
      pointsEl.remove();
    },
    { once: true }
  );
}

function updateTimer() {
  gameState.timeLeft--;
  const m = Math.floor(gameState.timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const s = (gameState.timeLeft % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `Time: ${m}:${s}`;

  if (gameState.timeLeft <= 0) {
    endGame();
  }
}

function startTimer() {
  timerDisplay.textContent = `Time: 01:00`;
  gameState.timerInterval = setInterval(() => {
    updateTimer();
  }, 1000);
}

function initGame() {
  if (gameState.berryInterval) clearInterval(gameState.berryInterval);
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);

  document
    .querySelectorAll(
      ".berry, .golden-berry, .rotten-berry, .blue-berry, .floating-points"
    )
    .forEach((el) => el.remove());
  gameState.berries = [];

  gameState.score = 0;
  gameState.timeLeft = gameConfig.initialTime;
  gameState.basketLeft = Math.floor(
    (gameEl.clientWidth - basket.offsetWidth) / 2
  );
  basket.style.left = gameState.basketLeft + "px";
  gameState.gameOver = false;
  gameState.moveDirection = null;

  // Reset speeds
  gameState.speedLevel = 0;
  gameConfig.berryFallSpeed = 4;
  gameConfig.berryFrequency = 400;

  scoreDisplay.textContent = "Score: 0";
  updateTimer();

  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";

  moveBasket();
  moveBerries();

  gameState.berryInterval = setInterval(spawnBerry, gameConfig.berryFrequency);
  startTimer();
}

function endGame() {
  gameState.gameOver = true;
  clearInterval(gameState.berryInterval);
  clearInterval(gameState.timerInterval);

  document
    .querySelectorAll(".berry, .golden-berry, .rotten-berry, .blue-berry")
    .forEach((b) => b.remove());
  gameState.berries = [];

  const currentHigh = parseInt(
    localStorage.getItem(gameConfig.highScoreKey) || "0",
    10
  );
  if (gameState.score > currentHigh) {
    localStorage.setItem(gameConfig.highScoreKey, String(gameState.score));
  }

  finalScoreDisplay.textContent = gameState.score;
  highScoreDisplay.textContent = `High Score: ${Math.max(
    currentHigh,
    gameState.score
  )}`;
  gameOverScreen.style.display = "flex";
}

startButton.addEventListener("click", initGame);
restartButton.addEventListener("click", initGame);

window.addEventListener("load", () => {
  const high = localStorage.getItem(gameConfig.highScoreKey) || 0;
  highScoreDisplay.textContent = `High Score: ${high}`;

  if (!basket.style.left) {
    gameState.basketLeft = Math.floor(
      (gameEl.clientWidth - basket.offsetWidth) / 2
    );
    basket.style.left = gameState.basketLeft + "px";
  }
});
