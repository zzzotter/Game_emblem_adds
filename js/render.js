import { COLORS, GRID_SIZE } from "./config.js";

export function renderGame(state, elements) {
  elements.score.textContent = String(state.score);
  elements.board.setAttribute("aria-label", `${GRID_SIZE}乘${GRID_SIZE}合成棋盘，当前得分${state.score}`);
  elements.board.replaceChildren();
  const merged = new Set((state.mergedCells || []).map(({ row, col }) => `${row},${col}`));

  state.board.forEach((row, rowIndex) => row.forEach((level, colIndex) => {
    const cell = document.createElement("div");
    cell.className = "board-cell";
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", level ? `${COLORS[level - 1].name}色校徽` : "空格");
    cell.dataset.row = String(rowIndex);
    cell.dataset.col = String(colIndex);
    if (level > 0) {
      const color = COLORS[level - 1];
      const tile = document.createElement("div");
      tile.className = "tile";
      if (state.lastSpawn?.row === rowIndex && state.lastSpawn?.col === colIndex) tile.classList.add("tile-new");
      if (merged.has(`${rowIndex},${colIndex}`)) tile.classList.add("tile-merged");
      const image = document.createElement("img");
      image.src = color.image;
      image.alt = `${color.name}色校徽`;
      image.draggable = false;
      tile.append(image);
      cell.append(tile);
    }
    elements.board.append(cell);
  }));
}

