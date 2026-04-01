import { validUserName } from "./users.js";

let btnClick = document.querySelector("#LoginBtn");

btnClick.addEventListener("click", (e) => {
  const username = document.querySelector("#usernameInput").value.trim();
  const result = validUserName(username);

  if (result.valid) {
    window.location.href = "dashboard.html";
  } else {
    document.querySelector("#ErrorMsg").textContent =
      "Ukendt bruger. Prøv igen.";
  }
});
