import { basicRenderHeader, renderHeader } from "./navRenderer.js";
// renderHeader();

document.addEventListener("DOMContentLoaded", () => {
  const logInBtn = document.getElementById("createSession");
  logInBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const input = document.getElementById("usernameInput")?.value ?? "";
    const errorMsg = document.getElementById("ErrorMsg");

    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: input }),
    });

    const data = await res.json();

    if (res.ok) window.location.href = "/";
    else {
      errorMsg.textContent = data.message ?? "";
    }

    console.log(data.message);
  });

  const registerBtn = document.getElementById("createUser");
  registerBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const input = document.getElementById("registerUserNameInput").value ?? "";
    console.log(input);
    const errorMsg = document.getElementById("ErrorMsg");

    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: input, login: true }),
    });

    const data = await res.json();

    if (res.ok) window.location.href = "/";
    else {
      errorMsg.textContent = data.message ?? "";
    }
  });

  const redirects = document.querySelectorAll(".redirect-link");
  const forms = document.querySelectorAll(".form");
  redirects.forEach((link, index) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      forms.forEach((form) => {
        form.classList.toggle("hidden");
      });
    });
  });
});
