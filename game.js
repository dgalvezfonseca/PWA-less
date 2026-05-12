import { guardarScore, obtenerScores } from "./firebase.js";
let playerName = "Jugador";
let customEmoji = "♥️";

try {
    playerName = cleanPlayerName(localStorage.getItem("playerName"));
} catch (e) {
    console.warn("No se pudo acceder a localStorage. Usando valores por defecto.");
}

const settingsModal = document.getElementById("settingsModal");
const startModal = document.getElementById("startModal");
const gameOverModal = document.getElementById("gameOverModal");
const leaderboardModal = document.getElementById("leaderboardModal");
const playerNameInput = document.getElementById("playerNameInput");
const leaderboardList = document.getElementById("leaderboardList");
const scoreElement = document.getElementById("score");
const bestScoreText = document.getElementById("bestScoreText");
const finalScoreText = document.getElementById("finalScoreText");
const startPlayerNameText = document.getElementById("startPlayerNameText");

playerNameInput.value = playerName;
updateBestScoreText();
updatePlayerNameText();

window.startGame = function () {
    startModal.classList.add("hidden");
    gameOverModal.classList.add("hidden");

    if (!playerNameInput.value.trim()) {
        playerNameInput.value = playerName;
    }

    hasStarted = true;
    restartGame();
}

window.retryGame = function () {
    gameOverModal.classList.add("hidden");
    hasStarted = true;
    restartGame();
}

window.openSettings = function () {
    settingsModal.classList.remove("hidden");
}

window.saveSettings = function () {
    try {
        playerName = cleanPlayerName(playerNameInput.value);

        localStorage.setItem("playerName", playerName);
        playerNameInput.value = playerName;
        updatePlayerNameText();
    } catch (e) {
        console.warn("No se pudo guardar en localStorage.");
    }

    settingsModal.classList.add("hidden");

    if (!hasStarted) {
        startModal.classList.remove("hidden");
    } else if (dead) {
        restartGame();
    }
}

window.openLeaderboard = async function () {

    leaderboardModal.classList.remove("hidden");
    gameOverModal.classList.add("hidden");
    leaderboardList.innerHTML = "<li>Cargando...</li>";

    try {

        const scores = await obtenerScores();

        leaderboardList.replaceChildren();

        let rank = 1;

        scores.forEach((data) => {

            let rankClass = rank <= 3 ? `rank-${rank}` : '';

            let emojiRank =
                rank === 1 ? '🥇' :
                    rank === 2 ? '🥈' :
                        rank === 3 ? '🥉' :
                            `${rank}.`;

            const item = document.createElement("li");
            if (rankClass) item.classList.add(rankClass);

            const name = document.createElement("span");
            name.textContent = `${emojiRank} ${data.nombre}`;

            const score = document.createElement("span");
            score.textContent = data.score;

            item.append(name, score);
            leaderboardList.appendChild(item);

            rank++;
        });

        if (scores.length === 0) {
            leaderboardList.innerHTML = "<li>Sin puntajes aún</li>";
        }

    } catch (error) {

        console.error(error);

        leaderboardList.innerHTML =
            "<li>Error cargando leaderboard</li>";
    }
}
window.closeLeaderboard = function () {
    leaderboardModal.classList.add("hidden");

    if (dead && hasStarted) {
        gameOverModal.classList.remove("hidden");
    }
}

async function saveScoreToFirebase(finalScore) {

    if (finalScore <= 0) return;

    try {

        await guardarScore(playerName, finalScore);

    } catch (e) {

        console.error("Error guardando score:", e);
    }
}

function cleanPlayerName(value) {
    return String(value || "Jugador").trim().slice(0, 24) || "Jugador";
}

function getBestScore() {
    try {
        return Math.floor(Number(localStorage.getItem("bestScore")) || 0);
    } catch (e) {
        return 0;
    }
}

function setBestScore(value) {
    const bestScore = Math.max(getBestScore(), Math.floor(Number(value) || 0));

    try {
        localStorage.setItem("bestScore", bestScore);
    } catch (e) { }

    updateBestScoreText();
}

function updateBestScoreText() {
    if (bestScoreText) {
        bestScoreText.textContent = getBestScore();
    }
}

function updatePlayerNameText() {
    if (startPlayerNameText) {
        startPlayerNameText.textContent = playerName;
    }
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const backgroundImage = new Image();
backgroundImage.src = "fondo.png";

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const playerSize = 40;
let score = 0;
let difficulty = 0;
let dead = false;
let hasStarted = false;
let rocketTimer = 0;

const gravity = 0.34;
const baseJumpForce = -13.2;
const springJumpForce = -20;
const rocketJumpForce = -17.5;

let player = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: playerSize,
    height: playerSize,
    vy: 0
};

let platforms = [];
let rockets = [];
let particles = [];
const platformWidth = 80;
const platformHeight = 15;

function spawnPlatformType() {
    let rand = Math.random();

    if (score < 500) return "normal";

    const spikeChance = Math.min(0.18, 0.08 + difficulty * 0.02);
    const breakChance = Math.min(0.24, 0.12 + difficulty * 0.025);
    const sidewaysChance = Math.min(0.34, 0.18 + difficulty * 0.03);

    if (rand < spikeChance) return "spike";
    if (rand < spikeChance + breakChance) return "break";
    if (rand < spikeChance + breakChance + sidewaysChance) return "sideways";

    return "normal";
}

function createPlatforms() {
    platforms = [];
    rockets = [];
    platforms.push({ x: player.x - platformWidth / 2, y: player.y + playerSize, type: "normal", powerup: null });
    let y = player.y - 100;
    while (y > -canvas.height) {
        addPlatformAtY(y);
        y -= (80 + Math.random() * 50);
    }
}

function addPlatformAtY(y) {
    let x = Math.random() * (canvas.width - platformWidth);
    let type = spawnPlatformType();
    let powerup = null;
    if (type !== "break" && type !== "spike" && Math.random() < 0.05) {
        powerup = "spring";
    }
    platforms.push({
        x: x, y: y, type: type, powerup: powerup,
        direction: Math.random() > 0.5 ? 1 : -1,
        pulse: 0
    });

    if (score >= 500 && Math.random() < 0.055) {
        rockets.push({
            x: Math.random() * Math.max(1, canvas.width - 36),
            y: y - 70,
            width: 36,
            height: 36,
            direction: Math.random() > 0.5 ? 1 : -1
        });
    }
}

createPlatforms();

let touchX = player.x;

canvas.addEventListener("touchmove", (e) => {
    if (!settingsModal.classList.contains("hidden") || !leaderboardModal.classList.contains("hidden")) return;

    const touch = e.touches[0];
    touchX = touch.clientX;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchstart", (e) => {
    if (!settingsModal.classList.contains("hidden") || !leaderboardModal.classList.contains("hidden")) return;

    const touch = e.touches[0];
    touchX = touch.clientX;
    if (dead) restartGame();
}, { passive: true });

canvas.addEventListener("mousemove", (e) => {
    if (!settingsModal.classList.contains("hidden") || !leaderboardModal.classList.contains("hidden")) return;
    touchX = e.clientX;
});
canvas.addEventListener("mousedown", () => {
    if (!settingsModal.classList.contains("hidden") || !leaderboardModal.classList.contains("hidden")) return;
    if (dead) restartGame();
});

function drawPlayer() {
    ctx.font = `${playerSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(customEmoji, player.x, player.y);
}

function drawBackground() {
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        const canvasRatio = canvas.width / canvas.height;
        const imageRatio = backgroundImage.naturalWidth / backgroundImage.naturalHeight;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = backgroundImage.naturalWidth;
        let sourceHeight = backgroundImage.naturalHeight;

        if (imageRatio > canvasRatio) {
            sourceWidth = backgroundImage.naturalHeight * canvasRatio;
            sourceX = (backgroundImage.naturalWidth - sourceWidth) / 2;
        } else {
            sourceHeight = backgroundImage.naturalWidth / canvasRatio;
            sourceY = (backgroundImage.naturalHeight - sourceHeight) / 2;
        }

        ctx.drawImage(
            backgroundImage,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );
    } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlatforms() {
    platforms.forEach(p => {
        const lift = p.pulse > 0 ? Math.sin(p.pulse * 0.5) * 2 : 0;
        const height = p.pulse > 0 ? platformHeight + 3 : platformHeight;

        if (p.type === "break") ctx.fillStyle = "#876537";
        else if (p.type === "spike") ctx.fillStyle = "#d7465a";
        else if (p.type === "sideways") ctx.fillStyle = "#14a7c8";
        else ctx.fillStyle = "#6fbb1d";

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(p.x, p.y - lift, platformWidth, height, 5);
        else ctx.rect(p.x, p.y - lift, platformWidth, height);
        ctx.fill();
        ctx.closePath();

        if (p.type === "spike") {
            ctx.fillStyle = "#ffd7df";
            for (let x = p.x + 8; x < p.x + platformWidth - 4; x += 16) {
                ctx.beginPath();
                ctx.moveTo(x, p.y - 2 - lift);
                ctx.lineTo(x + 7, p.y - 18 - lift);
                ctx.lineTo(x + 14, p.y - 2 - lift);
                ctx.closePath();
                ctx.fill();
            }
        }

        if (p.powerup === "spring") {
            ctx.fillStyle = "grey";
            ctx.fillRect(p.x + platformWidth / 2 - 15, p.y - 10, 30, 10);
        }
    });
}

function drawRockets() {
    ctx.font = "34px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    rockets.forEach(rocket => {
        ctx.fillText("🚀", rocket.x + rocket.width / 2, rocket.y + rocket.height / 2);
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
}

function isAnyModalOpen() {
    return !settingsModal.classList.contains("hidden") ||
        !leaderboardModal.classList.contains("hidden") ||
        !startModal.classList.contains("hidden") ||
        !gameOverModal.classList.contains("hidden");
}

function addParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 4,
            size: 2 + Math.random() * 3,
            color,
            life: 24,
            maxLife: 24
        });
    }
}

function updateParticles() {
    particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.12;
        particle.life--;
    });

    particles = particles.filter(particle => particle.life > 0);
}

function endGame() {
    if (dead) return;

    dead = true;
    hasStarted = false;
    rocketTimer = 0;
    finalScoreText.textContent = score;
    setBestScore(score);
    saveScoreToFirebase(score);
    gameOverModal.classList.remove("hidden");
}

function update() {
    updateParticles();

    if (dead || !hasStarted) return;
    if (isAnyModalOpen()) return;

    player.x += (touchX - player.x) * 0.2;
    if (player.x > canvas.width + playerSize / 2) player.x = -playerSize / 2;
    else if (player.x < -playerSize / 2) player.x = canvas.width + playerSize / 2;

    if (rocketTimer > 0) {
        rocketTimer--;
        player.vy = rocketJumpForce;
        addParticles(player.x, player.y + playerSize / 2, "#ff85a2", 2);
    } else {
        player.vy += gravity;
    }

    player.y += player.vy;

    platforms.forEach(p => {
        if (p.pulse > 0) p.pulse--;

        if (p.type === "sideways") {
            p.x += (2.5 + difficulty * 0.45) * p.direction;
            if (p.x >= canvas.width - platformWidth) p.direction = -1;
            else if (p.x <= 0) p.direction = 1;
        }
    });

    rockets.forEach(rocket => {
        rocket.x += (2.8 + difficulty * 0.35) * rocket.direction;

        if (rocket.x >= canvas.width - rocket.width) rocket.direction = -1;
        else if (rocket.x <= 0) rocket.direction = 1;
    });

    rockets = rockets.filter(rocket => {
        const touchingRocket =
            player.x + playerSize / 2 > rocket.x &&
            player.x - playerSize / 2 < rocket.x + rocket.width &&
            player.y + playerSize / 2 > rocket.y &&
            player.y - playerSize / 2 < rocket.y + rocket.height;

        if (touchingRocket) {
            rocketTimer = 95;
            addParticles(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2, "#ffd166", 16);
            return false;
        }

        return rocket.y < canvas.height + 80;
    });

    if (player.vy > 0) {
        for (let i = 0; i < platforms.length; i++) {
            let p = platforms[i];
            if (
                player.x + playerSize / 4 > p.x &&
                player.x - playerSize / 4 < p.x + platformWidth &&
                player.y + playerSize / 2 > p.y &&
                player.y + playerSize / 2 < p.y + platformHeight + player.vy
            ) {
                if (p.type === "spike") {
                    addParticles(player.x, player.y + playerSize / 2, "#ff4d79", 18);
                    endGame();
                    return;
                } else if (p.type === "break") {
                    addParticles(p.x + platformWidth / 2, p.y, "#c08a4a", 10);
                    platforms.splice(i, 1);
                    i--;
                } else {
                    p.pulse = 10;
                    addParticles(player.x, p.y, p.powerup === "spring" ? "#d9d9d9" : "#ffffff", p.powerup === "spring" ? 14 : 6);
                    if (p.powerup === "spring") player.vy = springJumpForce;
                    else player.vy = baseJumpForce;
                }
            }
        }
    }

    if (player.y < canvas.height / 2) {
        let diff = (canvas.height / 2) - player.y;
        player.y = canvas.height / 2;
        platforms.forEach(p => p.y += diff);
        rockets.forEach(rocket => rocket.y += diff);
        particles.forEach(particle => particle.y += diff * 0.35);

        let scoreIncrease = diff * 0.1;
        score += Math.floor(scoreIncrease);
        scoreElement.textContent = score;

        difficulty = Math.min(6, Math.floor(score / 500));
        platforms = platforms.filter(p => p.y < canvas.height);
        rockets = rockets.filter(rocket => rocket.y < canvas.height + 80);

        let highestY = Math.min(...platforms.map(p => p.y));
        while (highestY > 0) {
            let p_y = highestY - (80 + Math.random() * (50 + difficulty * 8));
            addPlatformAtY(p_y);
            highestY = p_y;
        }
    }

    if (player.y > canvas.height + playerSize) {
        endGame();
    }
}

function restartGame() {
    score = 0;
    difficulty = 0;
    dead = false;
    rocketTimer = 0;
    rockets = [];
    particles = [];
    gameOverModal.classList.add("hidden");
    scoreElement.textContent = "0";
    player.y = canvas.height - 150;
    player.x = canvas.width / 2;
    touchX = player.x;
    player.vy = baseJumpForce;
    createPlatforms();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    update();
    drawPlatforms();
    drawRockets();
    drawParticles();
    drawPlayer();

    if (dead) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(draw);
}

player.vy = baseJumpForce;
draw();
