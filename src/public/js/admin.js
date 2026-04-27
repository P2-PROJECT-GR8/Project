import { renderHeader } from "./navRenderer.js";

// fix the new html page so admin dash actually exists

//

// wait for DOM load before doing anything
document.addEventListener("DOMContentLoaded", async () => {
  renderHeader();
  const userSelect = document.getElementById("user-Select");
  const userDatalist = document.getElementById("user-Datalist");
  const objectSelect = document.getElementById("object-Datalist");
  const display = document.getElementById("main-Display");


  const usernameres = await fetch("/api/userNames", { credentials: "include" });
  const { userNames } = await usernameres.json();
  console.log(userNames);

  userNames.forEach(user => {
    if (user === "Admin"){
      return
    }
    let element = document.createElement("option");
    element.value = user;
    console.log(element);
    userDatalist.appendChild(element);
    
  });

  // when admin inputs a new name change the  object sleect to contain that users files
  userSelect.addEventListener("change", async () => {
      const filelist = await fetch(`/api/adminFiles?userId=user:${userSelect.value}`, {credentials: "include"});
      if(!filelist.ok){
        console.error("failed to fetch files");
      }
      const { files } = await filelist.json();
      console.log(files.files);
      renderFiles(files);
  });
  const locatePathsBtn = document.getElementById("submit");
  locatePathsBtn.addEventListener("click", async () => {
    const userId = `user:${userSelect.value}`;
    

    const pathsres = await fetch(
    `/api/adminRelations?userId=${userId}&objectId=${objectId}`,
    { credentials: "include" },
    );
    const paths = await pathsres.json();
    console.log(paths.paths);

  });


  
  function renderFiles(files) {
    objectSelect.innerHTML = "";
    files.forEach(file => {
      let element = document.createElement("option");
      
      
    });
    
  }



});



// render path
function renderPathToObject(paths) {}

// render admin dashboard
function adminDash() {



}
