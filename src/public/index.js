const btn = document.getElementById("btn");
const btn2 = document.getElementById("btn2");
const counter = document.getElementById("counter");

btn.addEventListener("click", (e) => {
  counter.innerText = (Number(counter.innerText) + 1).toString();
});

btn2.addEventListener("click", (e) => {
  counter.innerText = (Number(counter.innerText) - 1).toString();
});
