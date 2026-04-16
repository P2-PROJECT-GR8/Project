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
              id="userNameInput"
              placeholder="Enter Username"
              name="regUsername"
              required
              minlength="2"
              size="20"
            />
            <button type="submit" class="button" id="loginBtn">Login</button>
            <a href="#" onclick="showRegisterForm()" class="register-link" id="registerPage">Register here</a>
            <p id="ErrorMsg" class="error"></p>
          </form>`;
      }

      const registerForm = document.getElementById("registerForm");
        registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.getElementById("regInput").value;
        if(!input || input.trim() === "" || input.length < 2 || input.length > 10) {
          document.getElementById("ErrorMsg").textContent = "Username must be between 2 and 10 characters long.";
          return;
        }
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regUser: input }),
        });
       
        const data = await res.json();
        console.log(data.message);
      });