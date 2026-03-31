export function renderHeader() {
  const header = document.createElement("header");
  header.className = "header";
  header.innerHTML = `
        <a href="/" id="logo">
          <i class="material-icons" id="shield">shield</i>
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
          <a href="#">
            <i class="material-icons md-36" id="gear">settings</i></a
          >
          <a href="#"><i class="material-icons md-36">account_circle</i></a>
        </div>
    `;
  document.body.prepend(header);
}
