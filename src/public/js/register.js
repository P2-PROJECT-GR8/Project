const regHandler = async (event) => {
  event.preventDefault();
  const regName = document.getElementById("regInput").value;
  const errorMsg = document.getElementById("ErrorMsg");

  if (!regName) {
    errorMsg.innerText = "Please type desired username";
    return;
  }
  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: regName }),
  });
  const data = await res.json();

  if (data.message) {
    successMsg.innerText = data.message;
  } else {
    successMsg.innerText = `User registered successfully!, go to <a href="../landing/index.html">login page</a> to login.`;
  }
};
document.getElementById("regBtn").addEventListener("click", regHandler);