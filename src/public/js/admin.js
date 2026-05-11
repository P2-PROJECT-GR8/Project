import { renderHeader } from "./navRenderer.js";

// wait for DOM load before doing anything
document.addEventListener("DOMContentLoaded", async () => {
  renderHeader();
  const userSelect = document.getElementById("user-Select");
  const objectSelect = document.getElementById("object-Select");
  const display = document.getElementById("main-Display");
  const userSelectLabel = document.getElementById("label-user-Select");
  const objectSelectLabel = document.getElementById("label-object-Select");
  const mode = document.getElementById("mode-Select");

  const locatePathsBtn = document.getElementById("paths-submit");
  // hide input field until a traversal mode has been selected
  userSelect.hidden = true;
  objectSelect.hidden = true;
  userSelectLabel.hidden = true;
  objectSelectLabel.hidden = true;

  // dependent on traversal mode load files or users first:
  mode.addEventListener("change", async () => {
    objectSelect.innerHTML = "";
    userSelect.hidden = false;
    objectSelect.hidden = false;
    userSelectLabel.hidden = false;
    objectSelectLabel.hidden = false;
    // if byObject
    if (mode.value === "byObject") {
      userSelect.hidden = true;
      userSelectLabel.hidden = true;
      // fetch objects to display in object select
      const fileList = await fetch("/api/objects");
      if (!fileList.ok) {
        console.log("failed to load object list");
      }
      const { objects } = await fileList.json();
      renderFiles(objects);
    } else if (mode.value === "bySubject") {
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
    }
  });

  //locatepathsbtn handler
  locatePathsBtn.addEventListener("click", async () => {
    let subjectId = null;
    let objectId = null;

    if (mode.value === "bySubject") {
      if (!userSelect.value || !objectSelect.value) {
        console.log("missing user or object");
        return;
      }
      subjectId = `user:${userSelect.value.toLowerCase()}`;
      objectId = objectSelect.value;
    }
    if (mode.value === "byObject") {
      if (!objectSelect.value) {
        return;
      }
      subjectId = objectSelect.value;
      objectId = null;
    }

    const res = await fetch(
      `/api/adminRelations?userId=${subjectId}&objectId=${objectId}`,
      { credentials: "include" },
    );

    if (!res.ok) {
      console.log("paths fetch failed");
    }
    const { paths } = await res.json();

    const titleSubject =
      mode.value === "bySubject" ? subjectId : subjectId.split(":")[1];

    const objectTitle = objectId ? objectId.split(":")[1] : "users";

    renderPathToObject(paths, titleSubject, objectTitle);
  });

  // render files in object select based off of selected user
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
    if (mode.value === "bySubject") {
      Header.innerText = `${user}'s relation paths to ${object}`;
    } else if (mode.value === "byObject") {
      Header.innerText = `${user}'s paths to all `;
    }
    display.appendChild(Header);

    if (!paths || paths.length === 0) {
      Header.innerText = `no paths found to ${object}`;
      return;
    }

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
        if (mode.value === "bySubject") {
          item.textContent = `${step.from} → (${step.relation}) → ${step.to}`;
        } else if ((mode.value = "byObject")) {
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
