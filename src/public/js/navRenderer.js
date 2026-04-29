export function renderHeader(state = "none") {
  // Add relevant links
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
  document.head.appendChild(link);

  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = "../../css/header.css";
  document.head.appendChild(styleLink);

  // Create the header
  const header = document.createElement("header");
  header.className = "header";

  // Create the logo element
  const logo = document.createElement("a");
  logo.id = "logo";
  logo.addEventListener("click", async (e) => {
    const res = await fetch("/account", { credentials: "include" });
    const data = await res.json();
    if (res.ok) {
      window.location.href = "/pages/dashboard";
    } else {
      alert(data.message);
      window.location.href = "/pages/landing";
    }
  });

  // Create logo text
  const logoText = document.createElement("h2");
  logoText.innerText = "HS Storage";

  // Create icon
  const icon = document.createElement("i");
  icon.id = "shield";
  icon.innerText = "shield";
  icon.className = "material-icons md-36";

  // Add logo to header
  logo.appendChild(icon);
  logo.appendChild(logoText);
  header.appendChild(logo);

  // Add nav element
  const nav = document.createElement("nav");
  const ul = document.createElement("ul");

  if (state === "dash") {
    const navItems = ["Recent", "Shared", "Starred"];
    navItems.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#";
      a.innerText = item;
      li.appendChild(a);
      ul.appendChild(li);
    });
  }
  nav.appendChild(ul);
  header.appendChild(nav);

  // Create settings div
  const settingsDiv = document.createElement("div");
  settingsDiv.className = "settings";

  // Settings icon
  const settingsLink = document.createElement("a");
  settingsLink.href = "#";
  const settingsIcon = document.createElement("i");
  settingsIcon.className = "material-icons md-36";
  settingsIcon.id = "gear";
  settingsIcon.innerText = "settings";
  settingsLink.appendChild(settingsIcon);

  // Account icon + dropdown
  const accountContainer = document.createElement("div");
  accountContainer.className = "account-container";
  const accountLink = document.createElement("a");
  accountLink.href = "#";
  const accountIcon = document.createElement("i");
  accountIcon.className = "material-icons md-36";
  accountIcon.innerText = "account_circle";
  accountIcon.addEventListener("click", (e) => {
    fetch("/account", {
      method: "GET",
      credentials: "include",
    });
  });
  accountLink.appendChild(accountIcon);
  accountContainer.appendChild(accountLink);

  const dropdown = document.createElement("div");
  dropdown.className = "account-dropdown";
  const deleteButton = document.createElement("button");
  deleteButton.innerText = "Delete User";

  dropdown.appendChild(deleteButton);
  accountContainer.appendChild(dropdown);

  // Logout icon
  const logoutLink = document.createElement("a");
  logoutLink.href = "#";
  const logoutIcon = document.createElement("i");
  logoutIcon.className = "material-icons md-36";
  logoutIcon.innerText = "logout";
  logoutIcon.addEventListener("click", async (e) => {
    const response = await fetch("/logout", {
      method: "POST",
      credentials: "include",
    });
    if (response.ok) {
      alert("Logout Succesful");
      window.location.href = "/pages/landing";
    } else {
      alert("Could not log out, check that you are logged in");
    }
  });
  logoutLink.appendChild(logoutIcon);

  settingsDiv.appendChild(settingsLink);

  settingsDiv.appendChild(accountContainer);
  settingsDiv.appendChild(logoutLink);
  header.appendChild(settingsDiv);

  document.body.prepend(header);
}

export function basicRenderHeader() {
  const headerHTML = `
    <header class="header">
      <a href="/" id="logo">
        <i class="material-icons md-36" id="shield">shield</i>
        <h2>HS Storage</h2>
      </a>
      <nav>
        <ul>
          <li><a href="#">Recent</a></li>
          <li><a href="#">Shared</a></li>
          <li><a href="#">Starred</a></li>
        </ul>
      </nav>
      <div class="settings">
        <a href="#"><i class="material-icons md-36" id="gear">settings</i></a>
        <a href="#"><i class="material-icons md-36">account_circle</i></a>
      </div>
    </header>
  `;

  // Inject styles if they don't exist
  if (!document.getElementById("header-fonts")) {
    const fonts = `<link id="header-fonts" rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">`;
    document.head.insertAdjacentHTML("beforeend", fonts);
  }

  document.body.insertAdjacentHTML("afterbegin", headerHTML);
}
