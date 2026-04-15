function showRegisterForm(){
    document.getElementById('formContainer').innerHTML = `
          <label for="register"><b>Register Here</b></label>
          <form id="registerForm">
            <input
              class="username"
              type="text"
              id="regInput"
              placeholder="Enter Username"
              name="regUsername"
              required
              minlength="2"
              size="20"
            />
            <button type="submit" class="button" id="registerBtn">Register Account</button>
            <a href="#" onclick="showLoginForm()" class="register-link" id="LoginLink">Log in</a>
            <p id="ErrorMsg" class="error"></p>
          </form>
        `;
      }

      function showLoginForm() {
        document.getElementById('formContainer').innerHTML = `
          <label for="username"><b>Login here</b></label>
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
            <button type="submit" class="button" id="LoginBtn" onSubmit="handleLogin(event)">Login</button>
            <a href="#" onclick="showRegisterForm()" class="register-link" id="registerPage">Register here</a>
            <p id="ErrorMsg" class="error"></p>
          </form>`;
      }
async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById("regInput").value.trim();
    const errorEl = document.getElementById("ErrorMsg");

    if (!username) {
        errorEl.textContent = "Please enter a username";
        return;
    }

    const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ username }),
    });

    const data = await response.json();

    if (!response.ok) {
        errorEl.textContent = data.error || "Registration failed";
        return;
    }

  showLoginForm();
}