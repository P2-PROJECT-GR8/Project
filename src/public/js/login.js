import { basicRenderHeader, renderHeader } from "./navRenderer.js";
renderHeader();

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("LoginBtn");
  const createSessionBtn = document.getElementById("createSession");

  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    let UserInput = document.getElementById("usernameInput");
    let errorMsg = document.getElementById("ErrorMsg");
    let value = UserInput.value;

    if (value.length < 2 || value.length > 10) {
      errorMsg.textContent =
        "Username was either wrong or inputted incorrectly, try again!";
    } else if (value.trim() === "") {
      errorMsg.textContent = "Something went wrong, try again!";
    } else {
      fetch("/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("The Server respondend with:", data);

          if (data.status === "404") {
            errorMsg.textContent = "Invalid Username";
          } else if (data.status === "200") {
            errorMsg.textContent = "";
            console.log("Now redirect to to this access level", data.access);
          }
        });
    }
  });

  createSessionBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const input = document.getElementById("usernameInput")?.value ?? "";
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: input }),
    });

    const data = await res.json();

    console.log(data.message);
  });
});
