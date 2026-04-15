import { basicRenderHeader, renderHeader } from "./navRenderer.js";
// renderHeader();

document.addEventListener("DOMContentLoaded", () => {
  const createSessionBtn = document.getElementById("createSession");
  createSessionBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const input = document.getElementById("usernameInput")?.value ?? "";
    const errorMsg = document.getElementById("ErrorMsg");

    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: input }),
    });

    const data = await res.json();

    if (res.ok) window.location.href = "/pages/dashboard";
    else {
      errorMsg.textContent = data.message ?? "";
    }

    console.log(data.message);
  });
});
