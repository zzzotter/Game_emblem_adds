const home = document.querySelector("#hub-home");
const picker = document.querySelector("#game-picker");
const openGames = document.querySelector("#open-games");
const backHome = document.querySelector("#back-home");

function showPicker() {
  home.hidden = true;
  picker.hidden = false;
  if (window.location.hash !== "#games") history.replaceState(null, "", "#games");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showHome() {
  picker.hidden = true;
  home.hidden = false;
  if (window.location.hash) history.replaceState(null, "", window.location.pathname);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

openGames.addEventListener("click", showPicker);
backHome.addEventListener("click", showHome);
if (window.location.hash === "#games") showPicker();
