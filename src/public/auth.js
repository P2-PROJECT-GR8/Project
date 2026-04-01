function Redirect() {
  const username = document.querySelector("#usernameInput").value.trim();
  const result = validUserName(username);

  if (result.valid) {
    window.location = "dashboard.html";
  } else {
    document.querySelector("#ErrorMsg").textContent =
      "Ukendt bruger. Prøv igen.";
  }
}
