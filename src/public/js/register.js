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

const landingSite = document.getElementById("formContainer");

const registerBtn = document.getElementById("regBtn");
registerBtn.addEventListener("click", (e)=> {
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
            <div id="newLogIn" style="display: none;" class="register-link"><a href=""a></div>
            </form>`;});

const loginSiteBtn= document.getElementById("newLogIn");
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
            <nav>
              <a href="" class="register-link">Not in the DB? Register here</a>
            </nav>
            <p id="ErrorMsg" class="error"></p>
            </form>`});
