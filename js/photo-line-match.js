const TOTAL_AVAILABLE_PAIRS = 24;
const FLIP_BACK_DELAY = 1500;
const BACK_IMAGE = "assets/images/photo-line-match/emblem-square-03.webp";
const LEVELS = {
  beginner: { label: "初级", pairs: 8, desktopColumns: 4 },
  intermediate: { label: "中级", pairs: 10, desktopColumns: 5 },
  advanced: { label: "高级", pairs: 12, desktopColumns: 6 }
};
const board = document.querySelector("#match-board");
const matchedCount = document.querySelector("#matched-count");
const totalPairsLabel = document.querySelector("#total-pairs");
const turnCount = document.querySelector("#turn-count");
const restartButton = document.querySelector("#restart-game");
const playAgainButton = document.querySelector("#play-again");
const difficultyButtons = [...document.querySelectorAll("[data-difficulty]")];
const dialog = document.querySelector("#match-dialog");
const finishMessage = document.querySelector("#finish-message");

let cards = [];
let openCards = [];
let locked = false;
let turns = 0;
let matches = 0;
let activeLevel = "advanced";
let flipTimer = null;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createDeck(pairCount) {
  const selectedPairs = shuffle(Array.from({ length: TOTAL_AVAILABLE_PAIRS }, (_, i) => i + 1)).slice(0, pairCount);
  return shuffle(selectedPairs.flatMap(pairId => [
    { pairId, type: "photo", image: `assets/images/photo-line-match/photos/photo-${String(pairId).padStart(2, "0")}.webp`, label: `校园照片 ${pairId}` },
    { pairId, type: "line", image: `assets/images/photo-line-match/line-art/photo-line-${String(pairId).padStart(2, "0")}.webp`, label: `校园线描图 ${pairId}` }
  ])).map((card, index) => ({ ...card, id: index, faceUp: false, matched: false }));
}

function makeCardElement(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "memory-card";
  button.dataset.cardId = String(card.id);
  button.setAttribute("aria-label", "未翻开的校园卡牌");
  button.setAttribute("aria-pressed", "false");

  const inner = document.createElement("span");
  inner.className = "memory-card-inner";
  const back = document.createElement("span");
  back.className = "memory-face memory-back";
  const backImage = document.createElement("img");
  backImage.src = BACK_IMAGE;
  backImage.alt = "校徽牌背";
  backImage.draggable = false;
  back.append(backImage);

  const front = document.createElement("span");
  front.className = `memory-face memory-front ${card.type === "line" ? "line-face" : "photo-face"}`;
  const faceImage = document.createElement("img");
  faceImage.src = card.image;
  faceImage.alt = card.label;
  faceImage.loading = "lazy";
  faceImage.draggable = false;
  front.append(faceImage);
  inner.append(back, front);
  button.append(inner);
  return button;
}

function syncCardStates() {
  matchedCount.textContent = String(matches);
  turnCount.textContent = String(turns);
  cards.forEach(card => {
    const button = board.querySelector(`[data-card-id="${card.id}"]`);
    if (!button) return;
    button.classList.toggle("is-flipped", card.faceUp);
    button.classList.toggle("is-matched", card.matched);
    button.disabled = card.matched || locked;
    button.setAttribute("aria-pressed", String(card.faceUp));
    button.setAttribute("aria-label", card.matched ? "已配对" : (card.faceUp ? card.label : "未翻开的校园卡牌"));
  });
}

function buildBoard() {
  board.replaceChildren();
  const fragment = document.createDocumentFragment();
  cards.forEach(card => fragment.append(makeCardElement(card)));
  board.append(fragment);
}

function updateDifficultySelection() {
  difficultyButtons.forEach(button => {
    const selected = button.dataset.difficulty === activeLevel;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function startGame() {
  if (flipTimer !== null) window.clearTimeout(flipTimer);
  if (dialog.open) dialog.close();
  const level = LEVELS[activeLevel];
  cards = createDeck(level.pairs);
  openCards = [];
  locked = false;
  turns = 0;
  matches = 0;
  totalPairsLabel.textContent = String(level.pairs);
  board.style.setProperty("--desktop-columns", String(level.desktopColumns));
  updateDifficultySelection();
  buildBoard();
  syncCardStates();
}

function flipCard(cardId) {
  if (locked) return;
  const card = cards.find(item => item.id === cardId);
  if (!card || card.faceUp || card.matched) return;
  card.faceUp = true;
  openCards.push(card);
  syncCardStates();

  if (openCards.length < 2) return;
  turns += 1;
  const [first, second] = openCards;
  if (first.pairId === second.pairId && first.type !== second.type) {
    first.matched = true;
    second.matched = true;
    matches += 1;
    openCards = [];
    syncCardStates();
    if (matches === LEVELS[activeLevel].pairs) {
      finishMessage.textContent = `全部配对完成！你用了 ${turns} 次翻牌。`;
      if (!dialog.open) dialog.showModal();
    }
    return;
  }

  locked = true;
  syncCardStates();
  flipTimer = window.setTimeout(() => {
    first.faceUp = false;
    second.faceUp = false;
    openCards = [];
    locked = false;
    flipTimer = null;
    syncCardStates();
  }, FLIP_BACK_DELAY);
}

board.addEventListener("click", event => {
  const button = event.target.closest(".memory-card");
  if (!button || button.disabled) return;
  flipCard(Number(button.dataset.cardId));
});
difficultyButtons.forEach(button => button.addEventListener("click", () => {
  activeLevel = button.dataset.difficulty;
  startGame();
}));
restartButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);
startGame();
