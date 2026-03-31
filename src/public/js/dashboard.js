import { renderHeader } from "./navRenderer.js";

const btn = document.getElementById("btn");
const counter = document.getElementById("counter");

btn.addEventListener("click", (e) => {
  counter.innerText = (Number(counter.innerText) + 1).toString();
});

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");
}
