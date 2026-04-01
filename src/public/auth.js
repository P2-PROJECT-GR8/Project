function Redirect() {
  const username = document.querySelector("#usernameInput").value.trim();

  fetch("/username", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "200") {
        window.location.replace("dashboard.html");
      } else {
        document.querySelector("#ErrorMsg").textContent =
          "Ukendt bruger. Prøv igen.";
      }
    });
}
