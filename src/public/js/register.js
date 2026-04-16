const regHandler = async (event) => {
  event.preventDefault();
  const regName = document.getElementById("regInput").value;
  const errorMsg = document.getElementById("ErrorMsg");
  const successMsg = document.getElementById("successMsg");

  if (!regName) {
    errorMsg.innerText = "Please type desired username!";
    return;
  } else if (regName.length < 2 || regName.length > 10) {
    errorMsg.innerText =
      "Invalid username. Usernames must be between 2 and 10 characters long.";
    return;
  }
  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: regName }),
  });
  const data = await res.json();

  if (data.message === "User registered successfully!") {
    successMsg.innerText = data.message;
    errorMsg.innerText = "";
    document.getElementById("newLogIn").style.display = "block";
  } else {
    errorMsg.innerText = data.message;
    successMsg.innerText = "";}
  }
document.getElementById("regBtn").addEventListener("click", regHandler);