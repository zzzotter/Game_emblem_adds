import { createInitialState, move } from "./game.js";
import { renderGame } from "./render.js";
import { GAME_STATUS } from "./config.js";

const el = {
  welcome: document.querySelector("#welcome-screen"), game: document.querySelector("#game-screen"),
  start: document.querySelector("#start-button"), restart: document.querySelector("#restart-button"),
  home: document.querySelector("#home-button"), score: document.querySelector("#score"),
  board: document.querySelector("#board"), dialog: document.querySelector("#result-dialog"),
  resultTitle: document.querySelector("#result-title"), resultMessage: document.querySelector("#result-message"),
  playAgain: document.querySelector("#play-again-button"), dialogHome: document.querySelector("#dialog-home-button"),
  backdrop: document.querySelector("#board-backdrop"), backdropImages: [document.querySelector("#backdrop-a"), document.querySelector("#backdrop-b")],
  backgroundToggle: document.querySelector("#background-toggle")
};
const backgroundFiles = [
  "Screenshot 2026-11-12 213531.png", "Screenshot 2026-11-12 213600.png", "Screenshot 2026-11-12 213624.png",
  "Screenshot 2026-11-12 213640.png", "Screenshot 2026-11-12 213702.png", "Screenshot 2026-11-12 213718.png",
  "Screenshot 2026-11-12 213730.png", "Screenshot 2026-11-12 213812.png", "Screenshot 2026-11-12 213836.png",
  "Screenshot 2026-11-12 213916.png", "Screenshot 2026-11-12 213933.png", "Screenshot 2026-11-12 214004.png",
  "Screenshot 2026-11-12 214026.png", "Screenshot 2026-11-12 214044.png", "Screenshot 2026-11-12 214108.png",
  "Screenshot 2026-11-12 214142.png", "Screenshot 2026-11-12 214241.png", "Screenshot 2026-11-12 214257.png",
  "Screenshot 2026-11-12 214309.png", "Screenshot 2026-11-12 214326.png", "Screenshot 2026-11-12 214346.png",
  "Screenshot 2026-11-12 214358.png", "Screenshot 2026-11-12 214419.png"
].map(name => `assets/images/backgrounds/${encodeURIComponent(name)}`);
let state = { board: [], score: 0, status: GAME_STATUS.WELCOME };
let backgroundIndex = 0;
let visibleLayer = 0;
let backgroundTimer = null;
let backgroundEnabled = true;

function setBackgroundSource(image, index) {
  image.src = backgroundFiles[index];
}
function showNextBackground() {
  if (!backgroundEnabled) return;
  const nextLayer = 1 - visibleLayer;
  const image = el.backdropImages[nextLayer];
  const nextIndex = backgroundIndex;
  image.onload = () => {
    image.classList.add("is-visible");
    el.backdropImages[visibleLayer].classList.remove("is-visible");
    visibleLayer = nextLayer;
    backgroundIndex = (backgroundIndex + 1) % backgroundFiles.length;
  };
  image.onerror = () => {
    backgroundIndex = (backgroundIndex + 1) % backgroundFiles.length;
    showNextBackground();
  };
  image.src = backgroundFiles[nextIndex];
}
function beginBackgrounds() {
  stopBackgrounds();
  backgroundEnabled = true;
  el.backdrop.hidden = false;
  el.backgroundToggle.textContent = "关闭背景";
  el.backgroundToggle.setAttribute("aria-pressed", "true");
  backgroundIndex = 0;
  visibleLayer = 0;
  el.backdropImages.forEach(image => { image.classList.remove("is-visible"); image.onload = null; image.onerror = null; });
  el.backdropImages[0].src = backgroundFiles[0];
  el.backdropImages[0].classList.add("is-visible");
  backgroundIndex = 1;
  backgroundTimer = window.setInterval(showNextBackground, 5000);
}
function stopBackgrounds() {
  if (backgroundTimer !== null) window.clearInterval(backgroundTimer);
  backgroundTimer = null;
}
function toggleBackground() {
  backgroundEnabled = !backgroundEnabled;
  if (backgroundEnabled) beginBackgrounds();
  else {
    stopBackgrounds();
    el.backdrop.hidden = true;
    el.backgroundToggle.textContent = "开启背景";
    el.backgroundToggle.setAttribute("aria-pressed", "false");
  }
}
function draw() { renderGame(state, el); }
function startGame() {
  state = createInitialState();
  el.welcome.hidden = true;
  el.game.hidden = false;
  if (el.dialog.open) el.dialog.close();
  beginBackgrounds();
  draw();
}
function goHome() {
  if (el.dialog.open) el.dialog.close();
  stopBackgrounds();
  el.game.hidden = true;
  el.welcome.hidden = false;
  state = { board: [], score: 0, status: GAME_STATUS.WELCOME };
}
function showResult() {
  if (state.status === GAME_STATUS.WON) {
    el.resultTitle.textContent = "调出金色！";
    el.resultMessage.textContent = `恭喜合成金色校徽，本局得分 ${state.score}。`;
  } else if (state.status === GAME_STATUS.OVER) {
    el.resultTitle.textContent = "棋盘已满";
    el.resultMessage.textContent = `没有可移动或合并的卡片了，本局得分 ${state.score}。`;
  } else return;
  if (!el.dialog.open) el.dialog.showModal();
}
function handleMove(direction) {
  if (el.game.hidden || state.status !== GAME_STATUS.PLAYING) return;
  const result = move(state, direction);
  if (!result.changed) return;
  state = result.state;
  draw();
  showResult();
}

el.start.addEventListener("click", startGame);
el.restart.addEventListener("click", startGame);
el.playAgain.addEventListener("click", startGame);
el.home.addEventListener("click", goHome);
el.dialogHome.addEventListener("click", goHome);
el.backgroundToggle.addEventListener("click", toggleBackground);
window.addEventListener("keydown", event => {
  const direction = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }[event.key];
  if (!direction || el.game.hidden) return;
  event.preventDefault();
  handleMove(direction);
});

let pointerStart = null;
el.board.addEventListener("pointerdown", event => {
  if (el.game.hidden || state.status !== GAME_STATUS.PLAYING) return;
  pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  el.board.setPointerCapture(event.pointerId);
});
el.board.addEventListener("pointerup", event => {
  if (!pointerStart || pointerStart.id !== event.pointerId) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  handleMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
});
el.board.addEventListener("pointercancel", () => { pointerStart = null; });



