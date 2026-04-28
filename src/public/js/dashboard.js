import { renderHeader } from "./navRenderer.js";

renderHeader();

function showPage(pageId) {
  // Deactivate all content pages
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  // Deactivate all sidebar links
  document.querySelectorAll(".sidebar li a").forEach((a) => {
    a.classList.remove("active");
  });

  // Activate the target content page
  document.querySelectorAll(pageId).forEach((elmnt) => {
    elmnt.classList.add("active");
    console.log(elmnt);
  });

  // Activate the corresponding sidebar link
  const sidebarLink = document.querySelector(`.sidebar li a[href="${pageId}"]`);
  if (sidebarLink) {
    sidebarLink.classList.add("active");
  }
}

const getCurrentUser = async () => {
  const me = await fetch("/api/me", { credentials: "include" });
  return await me.json();
};

// When the DOM is fully loaded, set up initial state and event listeners
document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = await getCurrentUser();
  console.log("Current User: ", currentUser);

  const adminResponse = await fetch("/api/isAdmin", { credentials: "include" });
  const isadmin = await adminResponse.json();

  // Set the initial active page
  showPage("#files"); // Set "All Files" as the default active page

  const fileDetailsModal = document.getElementById("file-details");
  document
    .getElementById("cancel-modal")
    .addEventListener("click", () => {
      fileDetailsModal.close();
    });
  // fileDetailsModal.showModal();
  // Attach click listeners to all sidebar links
  document.querySelectorAll(".sidebar li a").forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default anchor link behavior (e.g., jumping to the top)
      const targetPageId = this.getAttribute("href");
      if (targetPageId && targetPageId.startsWith("#")) {
        showPage(targetPageId);
      }
    });
  });

  // loads either defualt dashboard or admin dashboard
  if (isadmin.status) {
    // any HTML changes needed for admin should be done here
    renderAdminUSerList();
  } else {
    renderFileListForUSer(currentUser.id);
  }

  // renders all of a users files
  async function renderFileListForUSer(userId) {
    const res = await fetch("/files", {
      credentials: "include",
    });
    const { files } = await res.json();
    renderFiles(files);
  }

  // renders an overview of all users within the system
  async function renderAdminUSerList() {
    //Qol
    const header = document.getElementById("allFilesHeader");
    header.innerText = "All users";
    const headerdescription = document.getElementById("allFIlesHeaderText");
    headerdescription.innerText =
      "here you will find an ovewrview of all users and their relations";

    const res = await fetch("/api/userNames", { credentials: "include" });
    const { userNames } = await res.json();

    const fileList = document.getElementById("filesList");
    fileList.innerHTML = "";

    userNames.forEach((userName) => {
      if (userName === "Admin") {
        return;
      }
      const item = document.createElement("div");
      item.className = "listitem admin-user";
      item.dataset.userId = `user:${userName.toLowerCase()}`;

      item.innerText = userName;
      item.addEventListener("click", () => {
        renderAdminFilesForUser(item.dataset.userId);
      });

      fileList.appendChild(item);
    });
  }

  // aquires list of files to be rendered for the provided userId
  async function renderAdminFilesForUser(userId) {
    //Qol
    const header = document.getElementById("allFilesHeader");
    header.innerText = `${userId.split(":")[1]}'s files`;
    const headerdescription = document.getElementById("allFIlesHeaderText");
    headerdescription.innerText = `here you will find an overview of ${userId.split(":")[1]}'s relations`;

    const res = await fetch(`/api/adminFiles?userId=${userId}`, {
      credentials: "include",
    });
    const { files } = await res.json();

    const rButton = document.getElementById("UploadNewbtn");
    rButton.innerText = "back";
    rButton.addEventListener("click", () => {
      renderAdminUSerList();
    });

    renderFiles(files);
  }

  // renders received filelist to dahsboard
  function renderFiles(files) {
    const filesList = document.getElementById("filesList");
    filesList.innerHTML = "";

    if (files.length > 0) {
      files.forEach((file) => {
        const listItem = document.createElement("div");
        listItem.className = "listitem";
        listItem.dataset.fileId = file.objectId;
        listItem.dataset.relations = file.relations;

        const icon = document.createElement("i");
        icon.className = "material-icons type";
        icon.innerText = "article";

        const itemTitle = document.createElement("div");
        itemTitle.className = "item-title";

        const h3 = document.createElement("h3");
        h3.innerText = file.objectId.split(":")[1];

        const p = document.createElement("p");
        p.innerText = "Updated by User - 2 Hours ago";

        itemTitle.appendChild(h3);
        itemTitle.appendChild(p);

        const relation = document.createElement("div");
        relation.className = "relation";
        relation.innerText = file.relations.join(", ").toUpperCase();

        const moreLink = document.createElement("a");
        moreLink.href = "#";
        const moreIcon = document.createElement("i");
        moreIcon.className = "material-icons more-btn";
        moreIcon.innerText = "more_vert";
        moreLink.appendChild(moreIcon);

        listItem.appendChild(icon);
        listItem.appendChild(itemTitle);
        listItem.appendChild(relation);
        listItem.appendChild(moreLink);

        filesList.appendChild(listItem);
      });
    }
  }

  // old version

  //const res = await fetch("/files", {
  //  credentials: "include",
  //});
  //const { files } = await res.json();

  let selectedFile;

  const inviteInput = document.getElementById("invite-field");
  const inviteBtn = document.getElementById("invite-member");
  inviteBtn.addEventListener("click", async (event) => {
    const errorMessage = document.getElementById("modalErrorMessage");
    // Check the length of the input value, not the value itself.
    if (inviteInput.value.length >= 2 && inviteInput.value.length <= 10) {
      const newMember = inviteInput.value.toLowerCase();
        if (!selectedFile) throw new Error("No selected file");

        tempMembers.push({ subjectId: `user:${newMember}`, relations: "viewer", objectId: selectedFile });
        tempModified = true;
      }
      renderMembers(selectedFile);
      inviteInput.value = "";
      console.log(tempMembers);
    });

  filesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".more-btn");
    if (!btn) return;

    event.preventDefault();

    const userList = document.getElementById("data-users");
    const userNamesRes = await fetch("/api/userNames", {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const { userNames } = await userNamesRes.json();
    console.log(userNamesRes);

    userList.innerHTML = "";
    userNames.forEach((user) => {
      const option = document.createElement("option");
      option.innerText = user;
      userList.appendChild(option);
    });

    const item = btn.closest(".listitem");
    const { fileId, relations } = item.dataset;
    selectedFile = item.dataset.fileId;

    tempMembers = [];
    originalTempMembers = [];
    deletedUsers = [];
    changedRelation.clear();
    tempModified = false;

    const relationsArray = normalizeRelations(relations);

    const inviteContainer = document.getElementById("invite-container");
    console.log(relationsArray);

    if (!relationsArray.some((el) => el === "owner")) {
      inviteContainer.classList.add("hidden");
    } else {
      inviteContainer.classList.remove("hidden");
    }
    renderMembers(selectedFile);
    fileDetailsModal.showModal();
  });

const createOption = document.getElementById("create-option");
const modal_container = document.getElementById("modal_container");
const close12 = document.getElementById("close12");
 
createOption.addEventListener('click', () => {
  modal_container.classList.add("show");

});


close12.addEventListener('click', () => {
  modal_container.classList.remove("show");

});








  console.log(files);

  const leaveFile = document.getElementById("leave");
  leaveFile.addEventListener("click", async (event)=>{
    event.preventDefault();

    if (!selectedFile) {
      console.error("No file selected");
      return;
    }

    const res = await fetch("/api/leaveFile", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ objectId: selectedFile }),
    });

    if (res.ok) {
      fileDetailsModal.close();
      location.reload();
    } else {
      const data = await res.json();
      const errorMessage = document.getElementById("modalErrorMessage");
      errorMessage.innerText = data.message;
    }

  });
  const saveChanges = document.getElementById("save-changes");
      saveChanges.addEventListener("click", async (e) => {
      const changes = Array.from(changedRelation.entries()).map(
    ([subjectId, { oldRel, newRel }]) => ({
      subjectId,
      oldRel,
      newRel
    })
  );

  const relatedToFile = [...originalTempMembers];

  const newUsers = tempMembers.filter(
  rel => !relatedToFile.some(r => r.subjectId === rel.subjectId)
);
// send updates for changed relations
  const res = await fetch("/api/updateTuple", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      objectId: selectedFile,
      changes
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert("Update error: " + data.message);
    return;
  }

  console.log(newUsers);

  const newUserResponses = await Promise.all(
    newUsers.map((rel) =>
      fetch("/api/newTuple", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        objectId: selectedFile,
        relation: rel.relations,
        subjectId: rel.subjectId,
        }),
      })
    )
  );

  const deleteResponses = await Promise.all(
  deletedUsers.map(({ subjectId, relations }) =>
    fetch("/api/deleteTuple", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objectId: selectedFile,
        relations: Array.isArray(relations) ? relations : [relations],
        subjectId,
      }),
    })
  )
);

  for (const r of newUserResponses) {
    if (!r.ok) {
      const data = await r.json();
      alert("New user error: " + data.message);
      return;
    }
  }

  tempMembers = tempMembers.filter(
    u => !deletedUsers.some(d => d.subjectId === u.subjectId)
  );

  for (const [subjectId, { newRel }] of changedRelation.entries()) {
    const user = tempMembers.find(u => u.subjectId === subjectId);
    if (user) user.relations = [newRel];
  }

changedRelation.clear();
tempModified = false;

renderMembers(selectedFile);
fileDetailsModal.close();

});
});
const changedRelation = new Map();
/*
const renderTempMembers = async (fileId) => {
  const membersList = document.getElementById("members");
  membersList.innerHTML = "";
  members.forEach((rel) => {
    const member = document.createElement("div");
    member.className = "member";
    const user = document.createElement("p");
    const userName = rel.subjectId.split(":")[1];
    user.innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
    member.appendChild(user);
    member.appendChild(relation);
    membersList.appendChild(member);
  });
};
*/
let tempMembers=[];
let originalTempMembers = [];
let deletedUsers = [];
let tempModified = false;
function normalizeRelations(rel) {
  if (!rel) return [];
  if (Array.isArray(rel)) return rel;
  if (typeof rel === "string") return rel.split(",").map(r => r.trim());
  return [];
}


const renderMembers = async (fileId) => {
  const membersList = document.getElementById("members");
  const currentUser = await getCurrentUser();
  membersList.innerHTML = "";
if (!tempModified && tempMembers.length === 0) {
  const res = await fetch("/relatedUsers", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objectId: fileId }),
  });

  if (res.ok) {
    const { relatedUsers } = await res.json();
    tempMembers = relatedUsers.map(u => ({...u, relation: normalizeRelations(u.relations)
}));

    originalTempMembers = relatedUsers.map(u => ({...u, relation: normalizeRelations(u.relations)
}));
  }
}
    if (tempMembers && tempMembers.length > 0) {
      const ownFile = tempMembers.some(
        (rel) =>
          rel.relations.includes("owner") && rel.subjectId === currentUser.id,
      );

      let schema = window.schema;
      if (!schema) {
        const schemaRes = await fetch("/api/schema", {
          credentials: "include",
        });
        schema = await schemaRes.json();
        window.schema = schema;
      }

      tempMembers.forEach((rel) => {
        const member = document.createElement("div");
        member.className = "member";
        const user = document.createElement("p");
        const userName = rel.subjectId.split(":")[1];
        user.innerText = userName.charAt(0).toUpperCase() + userName.slice(1);


        // relation part of member made to be a dropdown that allows owners to change relation
        const relationSel = document.createElement("select");
        relationSel.className = "changeRelation";
        const relationOptions = Object.keys(schema?.file?.relations || {});

        
        relationOptions.forEach((r) => {
          const option = document.createElement("option");
          option.value = r;
          option.innerText = r.charAt(0).toUpperCase() + r.slice(1);

          if (rel.relations.includes(r)) {
            option.selected = true;
          }
          relationSel.appendChild(option);
        });

        if (rel.subjectId === currentUser.id || !ownFile) {
          relationSel.disabled = true;
        }

        if (rel.subjectId === currentUser.id) {
          user.innerText += " (You)";
          user.style.fontWeight = 600;
          relationSel.style.fontWeight = 600;
        }

        relationSel.addEventListener("change", async (e) => {
          const assignedRel = e.target.value;
          if (rel.relations.includes(assignedRel)) return;

        changedRelation.set(rel.subjectId, {
          oldRel: rel.relations,
          newRel: assignedRel
        });
        rel.relations = [assignedRel];
        });
        member.appendChild(user);
        

        member.appendChild(relationSel);
        if (ownFile && rel.subjectId !== currentUser.id) {
          const deleteRel = document.createElement("a");
          deleteRel.innerText = "X";
          deleteRel.href = "#";
          deleteRel.id = "delete-btn";
          deleteRel.addEventListener("click", async (event) => {
            event.preventDefault();
            if (!confirm("Remove this user?")) return;
          
            tempMembers = tempMembers.filter(u => u.subjectId !== rel.subjectId);

            deletedUsers.push({
            subjectId: rel.subjectId,
            relations: [...rel.relations],
            objectId: fileId
            });

            renderMembers(fileId);
          
          });
          const helpDelete = document.createElement("span");
          helpDelete.className = "tooltip";
          helpDelete.innerText = "Remove Access";
          deleteRel.appendChild(helpDelete);
          member.appendChild(deleteRel);
        }
        membersList.appendChild(member);
      });
    }
  } else {
    // console.log(res.body);
  }
};







// Create folder button
  document.getElementById("confirm-create-folder").addEventListener("click", async () => {
    const folderName = document.getElementById("folder-name-input").value;
    const folderError = document.getElementById("folder-error");
    
    if (!folderName) {
  folderError.innerText = "Please enter a folder name.";
  return;
}

    const res = await fetch("/api/newFolder", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderName: folderName.toLowerCase() })
    });

    if (res.ok) {
    modal_container.classList.remove("show");
document.getElementById("folder-name-input").value = "";
folderError.innerText = "";
location.reload();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  });










/*
<div class="listitem">
  <i class="material-icons type">article</i>
  <div class="item-title">
    <h3>Project.pdf</h3>
    <p>Updated by User - 2 Hours ago</p>
  </div>
  <div class="relation">OWNER</div>
  <a href="#"><i class="material-icons">more_vert</i></a>
</div>
*/
