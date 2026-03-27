const btn = document.getElementById("btn");
const counter = document.getElementById("counter");

btn.addEventListener("click", (e) => {
  counter.innerText = (Number(counter.innerText) + 1).toString();
});

loginHandler();
//login handler
function loginHandler() {
  const respone = fetch("http://localhost:3000/get-username", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin" }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    });
}
