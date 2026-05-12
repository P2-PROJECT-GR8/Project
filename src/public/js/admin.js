import { renderHeader } from "./navRenderer.js";
import { createCustomRel, renderMembers, 
  getCurrentUser, setSelectedFile, 
  resetChanges, inviteMember} from "./dashboard.js";
import { saveAllChanges} from "./dashboard.js";
import { tempMembers, selectedFile } from "./dashboard.js";

// wait for DOM load before doing anything
document.addEventListener("DOMContentLoaded", async () => {
  const userSelect = document.getElementById("user-Select");
  const objectSelect = document.getElementById("object-Select");
  const display = document.getElementById("main-Display");
  const userSelectLabel = document.getElementById("label-user-Select");
  const objectSelectLabel = document.getElementById("label-object-Select");
  const mode = document.getElementById("mode-Select");

  const locatePathsBtn = document.getElementById("paths-submit");

  // default state
  userSelect.hidden = false;
  objectSelect.hidden = true;
  userSelectLabel.hidden = false;
  objectSelectLabel.hidden = true;
  mode.value = "pathsToTarget"

  //get usernames
  const users = await fetch("/api/userNames", { credentials: "include" });
  const { userNames } = await users.json();

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

  // get groups
  const groups = await fetch("/api/adminGetGroups", {credentials: "include"});
  const { groups: groupNames } = await groups.json();

  groupNames.forEach((group) => {
    let element = document.createElement("option");
    element.value = group
    element.innerText = group.split(":")[1] + " - group";
    console.log(element);
    userSelect.appendChild(element);
  });

  // dependent on traversal mode load files or users first:
  mode.addEventListener("change", async () => {
    userSelect.innerHTML = "";
    objectSelect.innerHTML = "";
    userSelect.hidden = false;
    objectSelect.hidden = false;
    userSelectLabel.hidden = false;
    objectSelectLabel.hidden = false;
    
    // new logic

    // user to object
    if (mode.value === "pathsToTarget"){
      objectSelect.hidden = true;
      objectSelectLabel.hidden = true;

      //get usernames
      const users = await fetch("/api/userNames", { credentials: "include" });
      const { userNames } = await users.json();

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

      // get groups
      const groups = await fetch("/api/adminGetGroups", {credentials: "include"});
      const { groups: groupNames } = await groups.json();

      groupNames.forEach((group) => {
        let element = document.createElement("option");
        element.value = group
        element.innerText = group.split(":")[1] + " - group";
        console.log(element);
        userSelect.appendChild(element);
      });

    } 
    // all paths from an object
    else if (mode.value === "pathsFromTargetObject"){
      objectSelect.hidden = false;
      objectSelectLabel.hidden = false;
      userSelect.hidden = true;
      userSelectLabel.hidden = true;

      // get objects to display in select
      const fileList = await fetch("/api/objects");
      if (!fileList.ok) {
        console.log("failed to load object list");
      }
      const { objects } = await fileList.json();
      renderFiles(objects);
      

    } 
    // all paths from a user / group
    else if (mode.value==="pathsFromTargetUser") {
      userSelect.hidden = false;
      userSelectLabel.hidden = false;
      objectSelect.hidden = true;
      objectSelectLabel.hidden = true;

      //get usernames
      const users = await fetch("/api/userNames", { credentials: "include" });
      const { userNames } = await users.json();

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

      // get groups
      const groups = await fetch("/api/adminGetGroups", {credentials: "include"});
      const { groups: groupNames } = await groups.json();

      groupNames.forEach((group) => {
        let element = document.createElement("option");
        element.value = group
        element.innerText = group.split(":")[1] + " - group";
        console.log(element);
        userSelect.appendChild(element);
      });
    }
  });

  //locatepathsbtn handler
  locatePathsBtn.addEventListener("click", async () => {
    let subjectId = null;
    let objectId = null;
    let traversalMode = null;

    // paths from subject to target
    if (mode.value === "pathsToTarget") {
      if (!userSelect.value || !objectSelect.value) return;

      if (userSelect.value.startsWith("group:")){
        subjectId = userSelect.value;
      } else {
        subjectId = `user:${userSelect.value.toLowerCase()}`;
      }
      objectId = objectSelect.value;
      traversalMode = "pathsToTarget"

    } 
    // all paths from object
    else if (mode.value === "pathsFromTargetObject") {
      objectId = objectSelect.value;
      traversalMode = "pathsFromTarget";
    } 
    // all paths from user
    else if (mode.value === "pathsFromTargetUser") {
      if (userSelect.value.startsWith("group:")){
        subjectId = userSelect.value;
      } else {
        subjectId = `user:${userSelect.value.toLowerCase()}`;
      }
      traversalMode = "pathsFromTarget";
    }

    const res = await fetch(
      `/api/adminRelations?userId=${subjectId}&objectId=${objectId}&mode=${traversalMode}`,
      { credentials: "include" },
    );

    if (!res.ok) {
      console.log("paths fetch failed");
    }
    const { paths } = await res.json();
    console.log("paths to follow");
    console.log(paths);
    
  
  renderPathToObject(
    paths,
    subjectId ? subjectId.split(":")[1] : objectId.split(":")[1],
    objectId ? objectId.split(":")[1] : "all"
  );

 
  
  });

  // render files in object select based off of selected user
  userSelect.addEventListener("change", async () => {
    if(mode.value==="pathsToTarget"){
      objectSelect.hidden = false;
      objectSelectLabel.hidden = false;
    } 

    let subjectid;

    if (userSelect.value.startsWith("group:")) {
      subjectid = userSelect.value;
    } else {
      subjectid = `user:${userSelect.value.toLowerCase()}`;
    }
    if(mode.value==="pathsToTarget"){
    const filelist = await fetch(
      `/api/adminFiles?userId=${subjectid}`,
      { credentials: "include" },
    );
    if (!filelist.ok) {
      console.error("failed to fetch files");
    }
    const { files } = await filelist.json();
    renderFiles(files);
  }
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
  function renderPathToObject(paths, subjectLabel, objectLabel) {
    display.innerHTML = "";
    
    const header = document.createElement("h1");
    header.id = "relation-Overview-Header";

    if (mode.value === "pathsToTarget") {
      header.innerText = `${subjectLabel}'s relation paths to ${objectLabel}`;
    } else if (mode.value === "pathsFromTargetObject") {
      header.innerText = `All paths from ${objectLabel}`;
    } else if (mode.value === "pathsFromTargetUser") {
      header.innerText = `All paths from ${subjectLabel}`;
    }

    display.appendChild(header);

    // no paths found
    if (!paths || paths.length === 0) {
      header.innerText = `no paths found`;
      return;
    }

    // render each path
    paths.forEach((path, index) => {
      const pathcontainer = document.createElement("div");
      pathcontainer.className = "path";

      // button to allow deletion of path
      const pathDelete = document.createElement("button");
      pathDelete.id = `delete${index}`;
      pathDelete.innerText = `delete path ${index + 1}`;
      pathDelete.className = "btn-lift";
      pathDelete.classList.add("btn-lift:hover");
      pathDelete.classList.add("btn-lift:active");
      pathDelete.classList.add("btn-style");

      //title
      const title = document.createElement("h3");
      title.className = "path-title";
      title.textContent = `path ${index + 1}`;

      // container for the relation path
      const relationContent = document.createElement("div");
      relationContent.className = "path-relation";

      const list = document.createElement("ul");
      path.forEach((step) => {
        const item = document.createElement("li");
        if (mode.value === "pathsToTarget") {
          item.textContent = `${step.from} → (${step.relation}) → ${step.to}`;
        } else {
          item.textContent = `${step.from} ← (${step.relation}) ← ${step.to}`;
        }

        list.appendChild(item);
      });
      relationContent.appendChild(list);

      // container for delete button
      const pathAction = document.createElement("div");
      pathAction.className = "path-actions";
      pathAction.appendChild(pathDelete);

      // assemble
      pathcontainer.append(title, relationContent, pathAction);
      display.appendChild(pathcontainer);

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

  editObjOptions();

  // logs section
  const logsUserSearch = document.getElementById("logs-user-search");
  const logsObjectSearch = document.getElementById("logs-object-search");
  const logsDisplay = document.getElementById("logs-display");
  //debug
  //console.log(" user select " + logsUserSelect);
  //console.log(" object select " + logsObjectSelect);
  //console.log(" log display " + logsDisplay);
  //console.log(" logs button " + logsSubmit);

  let allLogs = [];

  // fetch all files on page load
  async function loadAllLogs() {
    const res = await fetch("/api/adminLogs", { credentials: "include" });

    if (!res.ok) {
      console.log("failed to load logs");
      return;
    }

    const { logs } = await res.json();

    allLogs = logs;

    renderLogs(allLogs);
  }

  loadAllLogs();

  // live filtering
  logsUserSearch.addEventListener("input", filterLogs);
  logsObjectSearch.addEventListener("input", filterLogs);

  function filterLogs() {
    const userQuery = logsUserSearch.value.toLowerCase();
    const objectQuery = logsObjectSearch.value.toLowerCase();

    const filteredLogs = allLogs.filter((log) => {
      const userMatch = log.subjectId.toLowerCase().includes(userQuery);
      const objectMatch = log.objectId.toLowerCase().includes(objectQuery);

      return userMatch && objectMatch;
    });

    renderLogs(filteredLogs);
  }

  function renderLogs(logs) {
    logsDisplay.innerHTML = "";

    if (!logs.length) {
      logsDisplay.textContent = "No logs found for current search criteria";
    }

    // stats
    const accessCounts = {};

    logs.forEach((log) => {
      accessCounts[log.subjectId] = (accessCounts[log.subjectId] || 0) + 1;
    });

    // sort users by highest request count
    const sortedStats = Object.entries(accessCounts).sort(
      (a, b) => b[1] - a[1],
    );

    const statsContainer = document.createElement("div");
    statsContainer.className = "log-stats";

    const statsTitle = document.createElement("h4");
    statsTitle.className = "log-stats-title";
    statsTitle.textContent = "Access attempts (highest → lowest)";
    statsContainer.appendChild(statsTitle);

    const statsList = document.createElement("ul");
    statsList.className = "log-stats-list";

    sortedStats.forEach(([user, count]) => {
      const li = document.createElement("li");
      li.className = "log-sats-item";
      li.textContent = `${user} - ${count}`;
      statsList.appendChild(li);
    });

    statsContainer.appendChild(statsList);
    logsDisplay.appendChild(statsContainer);

    // log entries

    const ul = document.createElement("ul");
    logs
      .sort((a, b) => b.time - a.time)
      .forEach((log) => {
        const li = document.createElement("li");
        li.textContent =
          `[${new Date(log.time).toLocaleString()}] ` +
          `${log.subjectId} → ${log.action} → ${log.objectId}: Allowed: ${log.allowed}`;
        ul.appendChild(li);
      });

    logsDisplay.appendChild(ul);
  }
});

const currentUser = await getCurrentUser();
const canDelRel=true;
const canManageRel=true;
const canShare=true;

const editObjectSubmit = document.getElementById("admin-edit-submit")
editObjectSubmit.addEventListener("click", ()=>{
loadObjectModal();
})

const fileDetailsModal = document.getElementById("file-details")

async function editObjOptions(){
    const editOptions = document.getElementById("admin-edit")
    const res = await fetch("/api/objects");
    if (!res.ok) {
    const text = await res.text();
    console.error("Error response:", text);
    throw new Error("Request failed");
    }
    const {objects} = await res.json();
    console.log(objects)
      objects.forEach((o) => {
          const option = document.createElement("option");
          const name = o.objectId.split(":")[1];
          console.log(name)
          option.value = o.objectId;
          option.innerText = name.charAt(0).toUpperCase() + name.slice(1);
          editOptions.appendChild(option);
      });
}

const schemaRes = await fetch("/api/schema", { credentials: "include" });
const schema = await schemaRes.json();
window.schema = schema

const userNamesRes = await fetch("/api/userNames", {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
const { userNames } = await userNamesRes.json();

async function loadObjectModal() {
  
  const filedetails = document.getElementById("file-details");

  const userList = document.getElementById("data-users");

  userList.innerHTML = "";

  userNames.forEach((user) => {
    const option = document.createElement("option");
    option.innerText = user;
    userList.appendChild(option);
  });

  const editOptions = document.getElementById("admin-edit");

  const selectedObjectId = editOptions.value

  setSelectedFile(selectedObjectId);

  resetChanges();

  const inviteContainer = document.getElementById("invite-container");

  inviteContainer.classList.remove("hidden");

  renderMembers(selectedObjectId)

  fileDetailsModal.showModal();
}

const cancelModal = document
.getElementById("cancel-modal")
.addEventListener("click", () => {
      fileDetailsModal.close();
    });

const saveChanges = document.getElementById("save-changes");
  saveChanges.addEventListener("click", async (e) => {
    e.preventDefault();
    saveAllChanges(e);
})

const inviteBtn = document.getElementById("invite-member");
  inviteBtn.addEventListener("click", async (event) => {
    event.preventDefault
    inviteMember(event)
  })

let addedUsers=[];
let deletedUsers=[];
let changedRelation = new Map();

const customBtn = document
.getElementById("custom-btn")
.addEventListener("click", async (event)=>{
  createCustomRel(event);
});

