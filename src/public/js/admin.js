import { renderHeader } from "./navRenderer.js";

// wait for DOM load before doing anything
document.addEventListener("DOMContentLoaded", async () => {
  renderHeader();
  const userSelect = document.getElementById("user-Select");
  const objectSelect = document.getElementById("object-Select");
  const display = document.getElementById("main-Display");

  const users = await fetch("/api/userNames", { credentials: "include" });
  const { userNames } = await users.json();
  console.log(userNames);

  userNames.forEach((user) => {
    if (user === "Admin") {
      return;
    }
    let element = document.createElement("option");
    element.value = user;
    element.innerText = user;
    console.log(element);
    userSelect.appendChild(element);
  });

  // when admin inputs a new name change the  file selector to contain that users files
  userSelect.addEventListener("change", async () => {
    const filelist = await fetch(
      `/api/adminFiles?userId=user:${userSelect.value.toLowerCase()}`,
      { credentials: "include" },
    );
    if (!filelist.ok) {
      console.error("failed to fetch files");
    }
    const { files } = await filelist.json();
    renderFiles(files);
  });
  const locatePathsBtn = document.getElementById("submit");
  locatePathsBtn.addEventListener("click", async () => {
    const userId = `user:${userSelect.value.toLowerCase()}`;
    const objectId = objectSelect.value;
    console.log(objectId);

    const pathsres = await fetch(
      `/api/adminRelations?userId=${userId}&objectId=${objectId}`,
      { credentials: "include" },
    );
    const paths = await pathsres.json();
    console.log(paths);
    renderPathToObject(paths.paths, userId, objectId.split(":")[1]);
  });

  function renderFiles(files) {
    objectSelect.innerHTML = "";
    files.forEach((file) => {
      let element = document.createElement("option");
      element.value = file.objectId;
      element.innerText = file.objectId.split(":")[1];
      objectSelect.appendChild(element);
    });
  }

  // render paths
  function renderPathToObject(paths, user, object) {
    display.innerHTML = "";
    const Header = document.createElement("h1");
    Header.id = "relation-Overview-Header";
    Header.innerText = `${user}'s relation paths to ${object}`;
    display.appendChild(Header);

    if (!paths || paths.length === 0) {
      relationDisplay.innerHTML = "";
      Header.innerText = `no paths found to ${object}`;
      return;
    }

    paths.forEach((path, index) => {
      console.log(path);
      const pathcontainer = document.createElement("div");
      pathcontainer.className = "path";
      // button to allow deletion of path
      const pathDelete = document.createElement("button");
      pathDelete.id = `delete${index}`;
      pathDelete.innerText = `delete path ${index + 1}`;
      pathDelete.className = "deleteBtn";
      const title = document.createElement("h3");
      title.textContent = `path ${index + 1}`;

      const list = document.createElement("ul");
      const styleWrap = document.createElement("div");
      styleWrap.className = "path-content";
      styleWrap.appendChild(title);
      styleWrap.appendChild(list);
      pathcontainer.appendChild(styleWrap);

      path.forEach((step) => {
        const item = document.createElement("li");
        item.textContent = `${step.from} → (${step.relation}) → ${step.to}`;
        list.appendChild(item);
      });

      display.appendChild(pathcontainer);
      pathcontainer.appendChild(pathDelete);
      // upon delete button press delete path
      pathDelete.addEventListener("click", async () => {
        const del = await fetch("/api/adminDeleteTuple", {
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: path,
            index: index,
          }),
        });
        if (!del.ok) {
          console.log("failed to delete");
        }
        if (del.ok) {
          console.log("deleted succesfully");
        }
      });
    });
  }
});
