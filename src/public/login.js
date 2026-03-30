document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("LoginBtn");

  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    let UserInput = document.getElementById("usernameInput");
    let errorMsg = document.getElementById("ErrorMsg");
    let value = UserInput.value;

    if (value.length < 2 || value.length > 10) {
      errorMsg.textContent =
        "Username was either wrong or inputted incorrectly";
    } else if (value.trim() === "") {
      errorMsg.textContent = "Something went wrong, try again!";
    } else {
      console.log(value);
    }
  });
});
