import { renderHeader } from "./navRenderer.js";
import { validateString } from "./utils.js";

renderHeader();

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

// renders received filelist to dashboard
function renderFiles(files) {
  const filesList = document.getElementById("filesList");
  filesList.innerHTML = "";

  if (files.length > 0) {
    files.forEach((file) => {
      const listItem = document.createElement("div");
      listItem.className = "listitem";
      listItem.dataset.fileId = file.objectId;
      console.log(file.relations);
      listItem.dataset.relations = (file.relations || []).join(",");

      const fileType = file.objectId.split(":")[0];
      const icon = document.createElement("i");
      icon.className = "material-icons type";
      switch (fileType) {
        case "folder":
          icon.innerText = "folder";
          listItem.addEventListener("click", (event) => {
            const isMoreBtn = event.target.closest(".more-btn");
            if (isMoreBtn) return;

            navigateToFolder(file.objectId);
            console.log("Clicked on folder ", listItem.dataset.fileId);
          });
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
      // display only strongest relation to user
      relation.innerText = dominance(file).toUpperCase();

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

// renders all of a users files
async function renderFileListForUser(folderId = "") {
  if (!folderId) {
    const url = new URL(window.location);
    folderId = url.searchParams.get("folderId") || "";
  }
  const res = await fetch(
    `/api/folderContent?folderId=${encodeURIComponent(folderId)}`,
    {
      credentials: "include",
    },
  );
  const { files } = await res.json();
  renderFiles(files);
}

async function navigateToFolder(folderId) {
  const url = new URL(window.location);
  const newParam = folderId;
  url.searchParams.set("folderId", newParam);
  window.history.pushState({}, "", url);
  renderFileListForUser(newParam);
}

window.addEventListener("popstate", () => {
  const url = new URL(window.location);
  const param = url.searchParams.get("folderId") || "";
  renderFileListForUser(param);
});

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
  const filesList = document.getElementById("filesList");
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
      const urlParams = new URLSearchParams(window.location.search);
      const parentFolder = urlParams.get("folderId") || "";

      const res = await fetch("/api/createNew", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectId: `${formObject.type}:${formObject.name}`,
          parentFolder: parentFolder,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        createNewErrorMsg.innerText = resData.message;
      } else {
        createNewForm.reset();
        createNewModal.close();
        const url = new URL(window.location);
        const param = url.searchParams.get("folderId") || "";
        await renderFileListForUser(param);
      }
    } else {
      createNewErrorMsg.innerText =
        'Please only use letters, numbers and symbols like: ".-_"';
    }
  });

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
  const adminRes = await fetch("/api/isAdmin", {credentials: "include"});
  if (adminRes.ok) {
    // any HTML changes needed for admin should be done here
  } else {
    await renderFileListForUser();
  }

  const inviteInput = document.getElementById("invite-field");
  const inviteBtn = document.getElementById("invite-member");
  inviteBtn.addEventListener("click", async (event) => {
    const errorMessage = document.getElementById("modalErrorMessage");
    // Check the length of the input value, not the value itself.
    if (inviteInput.value.length >= 2 && inviteInput.value.length <= 10) {
    // validate input
    if(!validateString(inviteInput.value)){
      alert("do not use special characters")
      return}
      
    const newId = `user:${inviteInput.value.toLowerCase()}`;
    if (!selectedFile) return;

    // check if they already have a relation
    if (tempMembers.some(u => u.subjectId === newId)) return;

    // remove from deleted if re-added
    deletedUsers = deletedUsers.filter(u => u.subjectId !== newId);

    tempMembers.push({
      subjectId: newId,
      relations: ["viewer"]
    });

    addedUsers.push({
      subjectId: newId,
      relations: ["viewer"]
    });

    renderMembers(selectedFile);
      inviteInput.value = "";
      console.log(tempMembers);
    }});

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
    selectedFile = fileId;

    tempMembers = [];

    addedUsers = [];
    deletedUsers = [];
    changedRelation.clear();

    const relationsArray = relations ? relations.split(",") : [];

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
  
  // fetch the server when saving all changes
  const saveChanges = document.getElementById("save-changes");
      saveChanges.addEventListener("click", async (e) => {
      const changes = Array.from(changedRelation.entries()).map(
    ([subjectId, { oldRel, newRel }]) => ({
      subjectId,
      oldRel,
      newRel
    })
  );
  
// send updates for changed relations
 const res = await fetch("/api/saveAllChanges", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    objectId: selectedFile,
    addRel: addedUsers,
    deleteRel: deletedUsers,
    updateRel: changes
  }),
});

const resData = await res.json();

if (!res.ok) {
  alert("Error: " + resData.message);
  return;
}

changedRelation.clear();
addedUsers=[];
deletedUsers=[];

renderMembers(selectedFile);
document.getElementById("file-details").close();

})

let tempMembers = [];
let addedUsers = [];
let deletedUsers = [];
let changedRelation = new Map();

const renderMembers = async (fileId) => {
  const membersList = document.getElementById("members");
  const currentUser = await getCurrentUser();
  membersList.innerHTML = "";
  if (tempMembers.length === 0) {
  const res = await fetch("/relatedUsers", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objectId: fileId }),
    });

    if (res.ok) {
    const { relatedUsers } = await res.json();
    const normalized = relatedUsers.map(u => ({
      ...u,
      relations: Array.isArray(u.relations) ? u.relations : [u.relations]
    }));

    tempMembers = structuredClone(normalized);
  }
}
    const schemaRes = await fetch("/api/schema", { credentials: "include" });
      const schema = await schemaRes.json();
      window.schema = schema;
      disableDelete();
      // check if tempmember contains the userlist
      if (tempMembers && tempMembers.length > 0) {
      //checking if the current user owns the file
      const ownFile = tempMembers.some(
        (rel) =>
          rel.relations.includes("owner") && rel.subjectId === currentUser.id,
      );

      //create a div element for each member to be displayed 
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
        
        // format it beuatifully
        relationOptions.forEach((r) => {
          const option = document.createElement("option");
          option.value = r;
          option.innerText = r.charAt(0).toUpperCase() + r.slice(1);
        // choose the relation specified in the db, so it displays the correct relation
          if (rel.relations.includes(r)) {
            option.selected = true;
          }
          relationSel.appendChild(option);
        });
        // disable for oneself and non-owners
        if (rel.subjectId === currentUser.id || !ownFile) {
          relationSel.disabled = true;
        }
        // indicate which user you are
        const relation = document.createElement("p");
        const formattedRelations = rel.relations.map((str) => {
          return str.charAt(0).toUpperCase() + str.slice(1);
        });

        // maybe show only strongest relation here aswell although maybe good thing that user can see all their relations to the object here
        relation.innerText = formattedRelations.join(", ");

        if (rel.subjectId === currentUser.id) {
          user.innerText += " (You)";
          user.style.fontWeight = 600;
          relationSel.style.fontWeight = 600;
        }
        // update in client when changes are made in the select
        relationSel.addEventListener("change", async (e) => {
          const assignedRel = e.target.value;
          if (rel.relations.includes(assignedRel)) return;

        changedRelation.set(rel.subjectId, {
          oldRel: [...rel.relations],
          newRel: assignedRel
        });
        rel.relations = [assignedRel];
        });
        member.appendChild(user);
        member.appendChild(relationSel);
        // create an option for an owner to revoke acces from another member
        if (ownFile && rel.subjectId !== currentUser.id) {
          const deleteRel = document.createElement("a");
          deleteRel.innerText = "X";
          deleteRel.href = "#";
          deleteRel.id = "delete-btn";
          deleteRel.addEventListener("click", (event) => {
            event.preventDefault();

            // remove from array that is being rendered
            tempMembers = tempMembers.filter(u => u.subjectId !== rel.subjectId);
            const subjectId = rel.subjectId
            // if user was just invited cancel invite
            if (addedUsers.some(u => u.subjectId === subjectId)) {
              addedUsers = addedUsers.filter(u => u.subjectId !== subjectId);
            } else {
            if (!deletedUsers.some(u => u.subjectId === subjectId)) {
                deletedUsers.push({ subjectId });
                console.log(deletedUsers)
              }
            }

            renderMembers(fileId);
          });
          const helpDelete = document.createElement("span");
          helpDelete.className = "tooltip";
          helpDelete.innerText = "Remove Access";
          deleteRel.appendChild(helpDelete);
          member.appendChild(deleteRel);
        } else if (rel.subjectId === currentUser.id)
          // create an option to revoke own access
          {
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
        document.getElementById("file-details").close();
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
    }
  };

// add eventlistener to the costum relations link/button
const customBtn = document.getElementById("custom-btn")
customBtn.addEventListener("click", async (event)=>{
  event.preventDefault();

  // create dialog for the creation of a new relation
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
  customRelationName.placeholder="Type Relation Name";
const message = document.createElement("div");
let messageText = document.createElement("p");
messageText.textContent="";
messageText.className="error-message"
message.appendChild(messageText);
customRelForm.appendChild(inputTitle);
customRelForm.appendChild(customRelationName);
customRelForm.appendChild(message);

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

  // get the formdata

  const data = new FormData(customRelForm);
  
  const relationName = data.get("relation-name");

  const selectedPrivileges = [];

  // make sure the user has typed a name
  if (!relationName){
    messageText.textContent="please enter relation name"
    console.log("attempted to create relation with no name")
    return
  }
  // validate name
  if (!validateString(relationName)){
    messageText.textContent="Please do not use special characters"
    console.log("input invalid")
    return
  }

  const existingRelationKeys = Object.keys(window.schema?.file?.relations || {});
  const existingEntries = Object.entries(window.schema?.file?.relations || {});
  // check if a relation with the same name as the input exists
  if (existingRelationKeys.includes(relationName.toLowerCase())) {
    messageText.textContent=`A relation named "${relationName}" already exists!`;
    console.log("attempted to create a relation with the same name as a existing relation")
    return;
  }
  console.log(existingEntries);

   // Find checked relations and push them to the "selectedPrivileges" array
  customRelForm.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
    selectedPrivileges.push(checkbox.name);
  });

  if (selectedPrivileges.length === 0) {
    messageText.textContent = "Cannot create relation with no privileges";
    return;
  }

  const existingRelation = existingEntries.find(([name, privileges]) => {
    console.log(`privileges length ${privileges.length}`);
    // check if existing array of privileges for a relation is the same 
    // length as selected privileges
    // if true check if the privileges are the same and return boolean value for true/false

    if (privileges.length !== selectedPrivileges.length) {
      return false}
    return selectedPrivileges.every(p =>  privileges.includes(p))
    });

    // return without creating relation and tell the user the name of
    // the relation that has their exact desired privileges
  if(existingRelation){
    const duplicateName = existingRelation[0];
    messageText.textContent = `A relation with these exact privileges already exists as "${duplicateName}".`;
    return;
  }

  //create new relation object and send it to the server
  const newRelation = {
    name: relationName.toLowerCase(),
    privileges: selectedPrivileges
  };

  console.log(newRelation);
  const res = await fetch("/api/newRelationType", {
    method: "POST",
    credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRelation)
  })

  // update the ui so the new relation becomes an option 
  // without having to refresh the page

  if (window.schema && window.schema.file && window.schema.file.relations) {
      window.schema.file.relations[relationName.toLowerCase()] = selectedPrivileges;
    }
    
    if (selectedFile) {
      renderMembers(selectedFile);
    }
  customRelation.close();
  customRelation.remove();
  });

});

const deleteFileBtn = document.getElementById("delete-file");
deleteFileBtn.addEventListener("click", async (event) =>{

  event.preventDefault();

  if(!confirm("Delete File?")){
    return
  }

  if (!selectedFile) {
    alert("No file selected to delete");
    return;
  }

  //send the file attempted to be deleted to the server
  const res = await fetch("/api/deleteFile", {
    method: "POST",
    credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectId: selectedFile })
  })
  
  if (res.ok) {
    location.reload();
  } else {
    const data = await res.json();
    alert("Error: " + data.message);
  }
});

const disableDelete = async ()=>{
const currentUser = await getCurrentUser();
  if (!window.schema) {
  console.log("Schema not loaded yet");
  return;
  }
  const userEntry = tempMembers.find(rel => rel.subjectId === currentUser.id);
  const userRelations = userEntry ? userEntry.relations : [];

  const canDelete = await userRelations.some(rel => {
  window.schema?.file?.relations?.[rel]?.includes("delete")
  });
  deleteFileBtn.disabled=!canDelete
}
// calculate weight of all roles and return "strongest"
function dominance(files) {
  //  weights for individual actions
  const actionWeights = {
    view: 1,
    comment: 2,
    edit: 3,
    create_child: 4,
    share: 5,
    delete: 10,
    delete_folder: 12,
  };

  let strongest = files.relations[0];
  let maxscore = 0;

  files.relations.forEach((relation) => {
    const score = (files.actionsByRelation[relation] ?? []).reduce(
      (sum, action) => sum + (actionWeights[action] ?? 0),
      0,
    );

    if (score > maxscore) {
      maxscore = score;
      strongest = relation;
    }
  });
  return strongest;
}
