import { renderHeader } from "./navRenderer.js";

// fix the new html page so admin dash actually exists

//

// wait for DOM load before doing anything
document.addEventListener("DOMContentLoaded", async () => {
  renderHeader();
  const userSelect = document.getElementById("user-Select");
  const objectSelect = document.getElementById("object-Select");
  const display = document.getElementById("main-Display");
  const relationDisplay = document.getElementById("relation-Overview-Header");


  const users = await fetch("/api/userNames", { credentials: "include" });
  const { userNames } = await users.json();
  console.log(userNames);

  userNames.forEach(user => {
    if (user === "Admin"){
      return
    }
    let element = document.createElement("option");
    element.value = user;
    element.innerText = user;
    console.log(element);
    userSelect.appendChild(element);
    
  });

  // when admin inputs a new name change the  object sleect to contain that users files
  userSelect.addEventListener("change", async () => {
      const filelist = await fetch(`/api/adminFiles?userId=user:${userSelect.value.toLowerCase()}`, {credentials: "include"});
      if(!filelist.ok){
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
    files.forEach(file => {
      let element = document.createElement("option");
      element.value = file.objectId
      element.innerText = file.objectId.split(":")[1];
      objectSelect.appendChild(element)
    });
    
  }
  function renderRelationOverview(user, object){
    relationDisplay.innerText = "";
    relationDisplay.innerText = `${user}'s acces paths to ${object}`
  }


  // render paths
  function renderPathToObject(paths, user, object) {
  relationDisplay.innerHTML = "";
  const Header= document.getElementById("relation-Overview-Header");
  Header.innerText = "";
  Header.innerText = `${user}'s relation paths to ${object}`

  if (!paths || paths.length === 0) {
    relationDisplay.innerHTML = Header.innerText = `no paths found to ${object}`;
    return;
  }

  paths.forEach((path, index) => {
    const pathcontainer = document.createElement("div");
    pathcontainer.className = "path";

    const title = document.createElement("h3");
    title.textContent = `path ${index +1}`;
    pathcontainer.appendChild(title);

    const list = document.createElement("ul");

    path.forEach(step => {
      const item = document.createElement("li");
      item.textContent = `${step.from} → (${step.relation}) → ${step.to}`;
      list.appendChild(item);
    });

    pathcontainer.appendChild(list);
    display.appendChild(pathcontainer);

  });
  }

  



});




