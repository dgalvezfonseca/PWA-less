import { guardarScore, obtenerScores } from "./firebase.js";
let playerName = "Jugador";
let customEmoji = "♥️";

try {
    playerName = cleanPlayerName(localStorage.getItem("playerName"));
} catch (e) {
    console.warn("No se pudo acceder a localStorage. Usando valores por defecto.");
}

const settingsModal = document.getElementById("settingsModal");
const leaderboardModal = document.getElementById("leaderboardModal");
const playerNameInput = document.getElementById("playerNameInput");
const leaderboardList = document.getElementById("leaderboardList");
const scoreElement = document.getElementById("score");

playerNameInput.value = playerName;

window.openSettings = function () {
    settingsModal.classList.remove("hidden");
}

window.saveSettings = function () {
    try {
        playerName = cleanPlayerName(playerNameInput.value);

        localStorage.setItem("playerName", playerName);
        playerNameInput.value = playerName;
    } catch (e) {
        console.warn("No se pudo guardar en localStorage.");
    }

    settingsModal.classList.add("hidden");

    if (dead) {
        restartGame();
    }
}

window.openLeaderboard = async function () {

    leaderboardModal.classList.remove("hidden");
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

let isFirstTime = true;
try {
    if (localStorage.getItem("playerName")) {
        isFirstTime = false;
    }
} catch (e) { }

if (isFirstTime) {
    window.openSettings();
} else {
    settingsModal.classList.add("hidden");
}


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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

const gravity = 0.34;
const baseJumpForce = -13.2;
const springJumpForce = -20;

let player = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: playerSize,
    height: playerSize,
    vy: 0
};

let platforms = [];
const platformWidth = 80;
const platformHeight = 15;

function spawnPlatformType() {
    let rand = Math.random();
    if (difficulty > 2 && rand < 0.1) return "break";
    if (difficulty > 1 && rand < 0.3) return "sideways";
    return "normal";
}

function createPlatforms() {
    platforms = [];
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
    if (type !== "break" && Math.random() < 0.05) {
        powerup = "spring";
    }
    platforms.push({
        x: x, y: y, type: type, powerup: powerup,
        direction: Math.random() > 0.5 ? 1 : -1
    });
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

function drawPlatforms() {
    platforms.forEach(p => {
        if (p.type === "break") ctx.fillStyle = "#876537";
        else if (p.type === "sideways") ctx.fillStyle = "#14a7c8";
        else ctx.fillStyle = "#6fbb1d";

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(p.x, p.y, platformWidth, platformHeight, 5);
        else ctx.rect(p.x, p.y, platformWidth, platformHeight);
        ctx.fill();
        ctx.closePath();

        if (p.powerup === "spring") {
            ctx.fillStyle = "grey";
            ctx.fillRect(p.x + platformWidth / 2 - 15, p.y - 10, 30, 10);
        }
    });
}

function update() {
    if (dead) return;
    if (!settingsModal.classList.contains("hidden") || !leaderboardModal.classList.contains("hidden")) return;

    player.x += (touchX - player.x) * 0.2;
    if (player.x > canvas.width + playerSize / 2) player.x = -playerSize / 2;
    else if (player.x < -playerSize / 2) player.x = canvas.width + playerSize / 2;

    player.vy += gravity;
    player.y += player.vy;

    platforms.forEach(p => {
        if (p.type === "sideways") {
            p.x += 2.5 * p.direction;
            if (p.x >= canvas.width - platformWidth) p.direction = -1;
            else if (p.x <= 0) p.direction = 1;
        }
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
                if (p.type === "break") {
                    platforms.splice(i, 1);
                    i--;
                } else {
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

        let scoreIncrease = diff * 0.1;
        score += Math.floor(scoreIncrease);
        scoreElement.textContent = score;

        difficulty = Math.min(6, Math.floor(score / 500));
        platforms = platforms.filter(p => p.y < canvas.height);

        let highestY = Math.min(...platforms.map(p => p.y));
        while (highestY > 0) {
            let p_y = highestY - (80 + Math.random() * (50 + difficulty * 10));
            addPlatformAtY(p_y);
            highestY = p_y;
        }
    }

    if (player.y > canvas.height + playerSize) {
        dead = true;
        saveScoreToFirebase(score);
    }
}

function restartGame() {
    score = 0;
    difficulty = 0;
    dead = false;
    scoreElement.textContent = "0";
    player.y = canvas.height - 150;
    player.x = canvas.width / 2;
    touchX = player.x;
    player.vy = baseJumpForce;
    createPlatforms();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    update();
    drawPlatforms();
    drawPlayer();

    if (dead) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 40px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("¡Game Over!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "20px 'Outfit', sans-serif";
        ctx.fillText("Toca la pantalla para reiniciar", canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText("Puntos: " + score, canvas.width / 2, canvas.height / 2 + 60);
    }

    requestAnimationFrame(draw);
}

player.vy = baseJumpForce;
draw();
