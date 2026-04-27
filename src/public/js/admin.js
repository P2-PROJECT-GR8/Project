import { renderHeader } from "./navRenderer.js";

// fix the new html page so admin dash actually exists

//

// wait for DOM load before doing anything
document.addEventListener("DOMContentLoaded", async () => {
  renderHeader();
  const userSelect = document.getElementById("user-Datalist");
  const objectSelect = document.getElementById("object-Datalist");
  const display = document.getElementById("main-Display");
  const userId = "user:jeff";
  const objectId = "file:1";

  const usernameres = await fetch("/api/userNames", { credentials: "include" });
  const { userNames } = await usernameres.json();

  const pathsres = await fetch(
    `/api/adminRelations?userId=${userId}&objectId=${objectId}`,
    { credentials: "include" },
  );
  const paths = await pathsres.json();
  console.log(paths.paths);
});

// render path
function renderPathToObject(paths) {}

// render admin dashboard
function adminDash() {}
