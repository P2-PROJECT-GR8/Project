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
    successMsg.innerText = "";
  }
};

const landingSite = document.getElementById("formContainer");

const attachRegisterListener = () => {
  const registerBtn = document.getElementById("registerLink");
  if (registerBtn) {
    registerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      landingSite.innerHTML = `<label for="regForm"><b>Register here</b></label>
          <form>
            <input
              class="regUser"
              type="text"
              id="regInput"
              placeholder="Enter Username"
              name="regForm"
              required
              minlength="2"
              size="20"
            />
            <button type="submit" class="button" id="regBtn">Register</button>
            <p id="successMsg" class="success"></p>
            <p id="ErrorMsg" class="error"></p>
            <div id="newLogIn" style="display: none;" class="register-link"><a href="">Back to Login</a></div>
            </form>`;
      document.getElementById("regBtn").addEventListener("click", regHandler);
      attachLoginListener();
    });
  }
};

const attachLoginListener = () => {
  const loginSiteBtn = document.getElementById("newLogIn");
  if (loginSiteBtn) {
    loginSiteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      landingSite.innerHTML = `<label for="username"><b>Login here</b></label>
          <form>
            <input
              class="username"
              type="text"
              id="usernameInput"
              placeholder="Enter Username"
              name="username"
              required
              minlength="2"
              size="20"
            />
            <button type="submit" class="button" id="LoginBtn">Login</button>
            <button class="button" id="createSession">Create Session</button>
            <a href="#" class="register-link" id="registerLink">Not in the DB? Register here</a>
            <p id="ErrorMsg" class="error"></p>
            </form>`;
      attachRegisterListener();
    });
  }
};

attachRegisterListener();