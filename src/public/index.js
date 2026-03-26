const btn = document.getElementById("btn");
const counter = document.getElementById("counter");

btn.addEventListener('click', (e) => {
    counter.innerText = (Number(counter.innerText) + 1).toString();
})