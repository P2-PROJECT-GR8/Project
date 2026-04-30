import { renderHeader } from "./navRenderer.js";
import { validateString } from "./utils.js";

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

let selectedFile;

// When the DOM is fully loaded, set up initial state and event listeners
document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = await getCurrentUser();
  console.log("Current User: ", currentUser);

  const createNewModal = document.getElementById("create-new");
  const createNewForm = document.getElementById("create-new-form");
  const createNewErrorMsg = document.getElementById("create-new-error");
  const uploadNewBtn = document.getElementById("UploadNewbtn");
  uploadNewBtn.addEventListener("click", () => {
    createNewErrorMsg.innerText = "";
    createNewModal.showModal();
  });

  const createNewCancelBtn = document.getElementById("create-new-cancel");
  createNewCancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createNewModal.close();
    createNewForm.reset();
  });

  const createNewButton = document.getElementById("create-new-button");
  createNewButton.addEventListener("click", async (e) => {
    e.preventDefault();
    const data = new FormData(createNewForm);
    const formObject = Object.fromEntries(data);
    if (validateString(formObject.name)) {
      const res = await fetch("/api/createNew", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectId: `${formObject.type}:${formObject.name}`,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        createNewErrorMsg.innerText = resData.message;
      } else {
        createNewForm.reset();
        createNewModal.close();
        await renderFileListForUSer(currentUser.id);
      }
    } else {
      createNewErrorMsg.innerText =
        'Please only use letters, numbers and symbols like: ".-_"';
    }
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

        const fileType = file.objectId.split(":")[0];
        const icon = document.createElement("i");
        icon.className = "material-icons type";
        switch (fileType) {
          case "folder":
            icon.innerText = "folder";
            break;
          case "file":
            icon.innerText = "article";
            break;
          default:
            icon.innerText = "question_mark";
            break;
        }

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
 const res = await fetch("/api/saveAllChanges", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    objectId: selectedFile,
    addRel: newUsers,
    deleteRel: deletedUsers,
    updateRel: changes
  }),
});

if (!res.ok) {
  const data = await res.json();
  alert("Error: " + data.message);
  return;
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
document.getElementById("file-details").close();

})
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
        rel.relations = assignedRel;
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
        } else {
          const leaveSelectedFile = document.createElement("a")
          leaveSelectedFile.innerText = "Leave";
          leaveSelectedFile.href = "#";
          leaveSelectedFile.id="leave-file";
          const helpLeave = document.createElement("span");
          helpLeave.className = "tooltip";
          helpLeave.innerText = "Revoke own access";

          leaveSelectedFile.addEventListener("click", async (event)=>{
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
          leaveSelectedFile.appendChild(helpLeave)
          member.appendChild(leaveSelectedFile)
      }
        membersList.appendChild(member);
      });
    } else {
    console.log(res.body);
    }

  };


const customBtn = document.getElementById("custom-btn")
customBtn.addEventListener("click", async (event)=>{
  event.preventDefault();

const customRelation = document.createElement("dialog");
  customRelation.id= "custom-modal";
  customRelation.className="modal-body"
const customHeader = document.createElement("h2");
customHeader.className="custom-header";
  customHeader.textContent="Create Custom Relation";
  customRelation.appendChild(customHeader);
const customRelForm = document.createElement("form");
  customRelForm.id= "custom-form";
const inputTitle = document.createElement("p");
  inputTitle.className = "input-title";
  inputTitle.textContent= "Name the Custom Relation:";
const customRelationName = document.createElement("input");
  customRelationName.type="text";
  customRelationName.id="relation-name";
  customRelationName.name="relation-name";
  customRelationName.placeholder="Type Relation Name"
customRelForm.appendChild(inputTitle);
customRelForm.appendChild(customRelationName);

const privilegeOptions = window.schema?.file?.relations?.owner || [];
privilegeOptions.forEach((p) => {
  const privilegeList = document.createElement("div");
  const privilege = document.createElement("input");
  privilege.type="checkbox";
  privilege.id=`privilege-${p}`;
  privilege.name=p;
  const privLabel = document.createElement("label");
  privLabel.setAttribute("for", privilege.id);
  privLabel.textContent = p.charAt(0).toUpperCase() + p.slice(1);
  privilegeList.appendChild(privilege);
  privilegeList.appendChild(privLabel);
  customRelForm.appendChild(privilegeList);
});
const createRelSubmit = document.createElement("button")
createRelSubmit.id="submit-new-rel"
createRelSubmit.className="btn-lift";
createRelSubmit.textContent= "Create Relation"

const createRelCancel = document.createElement("button")
createRelCancel.textContent="cancel"
createRelCancel.className="btn-lift"
createRelCancel.addEventListener("click", (e)=>{
  e.preventDefault();
  customRelation.close();
})
customRelation.appendChild(customRelForm);
customRelation.appendChild(createRelCancel);
customRelation.appendChild(createRelSubmit);
document.body.appendChild(customRelation);
await customRelation.showModal();

createRelSubmit.addEventListener("click", async (e) => {
  e.preventDefault();

  const data = new FormData(customRelForm);
  
  const relationName = data.get("relation-name");
  

  // Find checked relations and push them to the "selectedPrivileges" array
  const selectedPrivileges = [];
  customRelForm.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
    selectedPrivileges.push(checkbox.name);
  });

  const newRelation = {
    name: relationName,
    privileges: selectedPrivileges
  };

  console.log(newRelation);
  const res = await fetch("/api/newRelationType", {
    method: "POST",
    credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRelation)
  })
  if (window.schema && window.schema.file && window.schema.file.relations) {
      window.schema.file.relations[relationName] = selectedPrivileges;
    }
    
    if (selectedFile) {
      renderMembers(selectedFile);
    }
  customRelation.close();
  });

});

const deleteFileBtn = document.getElementById("delete-file");
deleteFileBtn.addEventListener("click", async (event) =>{
  event.preventDefault();

  if (!selectedFile) {
    alert("No file selected to delete");
    return;
  }
  const res = await fetch("/api/deleteFile", {
    method: "POST",
    credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectId: selectedFile })
  })
  
  if (res.ok) {
    alert("File deleted");
    location.reload();
  } else {
    const data = await res.json();
    alert("Error: " + data.message);
  }
})
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
