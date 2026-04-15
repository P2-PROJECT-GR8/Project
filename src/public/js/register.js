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
            <button type="submit" class="button" id="LoginBtn">Login</button>
            <a href="#" onclick="showRegisterForm()" class="register-link" id="registerPage">Register here</a>
            <p id="ErrorMsg" class="error"></p>
          </form>`;
      }