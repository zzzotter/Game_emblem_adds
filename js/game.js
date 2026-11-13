import { GRID_SIZE, INITIAL_TILE_COUNT, INITIAL_LEVELS, GAME_STATUS } from "./config.js";

export function createInitialState() {
  const board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  for (let i = 0; i < INITIAL_TILE_COUNT; i += 1) {
    placeRandomTile(board, INITIAL_LEVELS[Math.floor(Math.random() * INITIAL_LEVELS.length)]);
  }
  return { board, score: 0, status: GAME_STATUS.PLAYING, lastSpawn: null, mergedCells: [] };
}

function placeRandomTile(board, level) {
  const empty = [];
  board.forEach((row, r) => row.forEach((value, c) => { if (value === 0) empty.push([r, c]); }));
  if (!empty.length) return null;
  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  board[row][col] = level;
  return { row, col };
}

function readLine(board, direction, index) {
  return Array.from({ length: GRID_SIZE }, (_, offset) => {
    if (direction === "left") return board[index][offset];
    if (direction === "right") return board[index][GRID_SIZE - 1 - offset];
    if (direction === "up") return board[offset][index];
    return board[GRID_SIZE - 1 - offset][index];
  });
}

function writeLine(board, direction, index, values) {
  values.forEach((value, offset) => {
    if (direction === "left") board[index][offset] = value;
    else if (direction === "right") board[index][GRID_SIZE - 1 - offset] = value;
    else if (direction === "up") board[offset][index] = value;
    else board[GRID_SIZE - 1 - offset][index] = value;
  });
}

function slideAndMerge(line) {
  const packed = line.filter(value => value !== 0);
  const result = [];
  const mergedOffsets = [];
  let scoreGain = 0;
  for (let i = 0; i < packed.length; i += 1) {
    if (packed[i] === packed[i + 1] && packed[i] < 9) {
      const upgraded = packed[i] + 1;
      result.push(upgraded);
      mergedOffsets.push(result.length - 1);
      scoreGain += upgraded;
      i += 1;
    } else {
      result.push(packed[i]);
    }
  }
  while (result.length < GRID_SIZE) result.push(0);
  return { line: result, mergedOffsets, scoreGain };
}

function hasEmptyCell(board) {
  return board.some(row => row.includes(0));
}

function hasAvailableMerge(board) {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const level = board[row][col];
      if (!level || level >= 9) continue;
      if (col + 1 < GRID_SIZE && board[row][col + 1] === level) return true;
      if (row + 1 < GRID_SIZE && board[row + 1][col] === level) return true;
    }
  }
  return false;
}

/** 每回合整盘滑动合并；金色胜利，满盘且没有可合并卡片时失败。 */
export function move(state, direction) {
  if (!state || state.status !== GAME_STATUS.PLAYING || !["left", "right", "up", "down"].includes(direction)) {
    return { changed: false, state };
  }
  const next = { ...state, board: state.board.map(row => [...row]), lastSpawn: null, mergedCells: [] };
  let changed = false;
  let scoreGain = 0;
  let won = false;

  for (let index = 0; index < GRID_SIZE; index += 1) {
    const original = readLine(state.board, direction, index);
    const { line, mergedOffsets, scoreGain: lineScore } = slideAndMerge(original);
    if (line.some((value, i) => value !== original[i])) changed = true;
    scoreGain += lineScore;
    if (mergedOffsets.some(offset => line[offset] === 9)) won = true;
    writeLine(next.board, direction, index, line);
    for (const offset of mergedOffsets) {
      if (direction === "left") next.mergedCells.push({ row: index, col: offset });
      else if (direction === "right") next.mergedCells.push({ row: index, col: GRID_SIZE - 1 - offset });
      else if (direction === "up") next.mergedCells.push({ row: offset, col: index });
      else next.mergedCells.push({ row: GRID_SIZE - 1 - offset, col: index });
    }
  }
  if (!changed) return { changed: false, state };

  next.score += scoreGain;
  if (won) {
    next.status = GAME_STATUS.WON;
    return { changed: true, state: next };
  }

  next.lastSpawn = placeRandomTile(next.board, INITIAL_LEVELS[Math.floor(Math.random() * INITIAL_LEVELS.length)]);
  if (!hasEmptyCell(next.board) && !hasAvailableMerge(next.board)) {
    next.status = GAME_STATUS.OVER;
  }
  return { changed: true, state: next };
}

