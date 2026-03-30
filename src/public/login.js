document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("LoginBtn");

  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    let UserInput = document.getElementById("usernameInput");
    let errorMsg = document.getElementById("ErrorMsg");
    let value = UserInput.value;

    if (!UserInput) {
      errorMsg.textContent = "Something went wrong, try again";
    }

    if (value.trim() === " ") {
      errorMsg.textContent =
        "Username was either wrong or inputted incorrectly";
    }

    console.log(value);
  });
});
