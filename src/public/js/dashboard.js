import { renderHeader } from "./navRenderer.js";
import { validateString } from "./utils.js";

renderHeader();
console.log("dashboard.js executed");

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
  if (!res.ok) {
    console.error("Failed to fetch folder:", await res.text());
    return;
  }

  const { files } = await res.json();
  renderMyFiles(files);
  renderSharedFiles(files);
  renderGroups(files);
}

async function navigateToFolder(folderId) {
  const url = new URL(window.location);
  const newParam = folderId;
  url.searchParams.set("folderId", newParam);
  window.history.pushState({}, "", url);
  renderFileListForUser(newParam);
}

async function navigateToGroup(groupId) {
  const url = new URL(window.location);
  const newParam = groupId;
  url.searchParams.set("groupId", newParam);
  window.history.pushState({}, "", url);
  await renderFileListForGroup(newParam);
}

window.addEventListener("popstate", () => {
  const url = new URL(window.location);
  const folderParam = url.searchParams.get("folderId") || "";
  const groupParam = url.searchParams.get("groupId") || "";

  if (groupParam) {
    renderFileListForGroup(groupParam);
  } else if (folderParam) {
    renderFileListForUser(folderParam || "");
  } else {
    document.getElementById("groups-main-view")?.classList.remove("hidden");
    document.getElementById("groups-deeper-view")?.classList.add("hidden");
    const groupFileList = document.getElementById("groups-files-list");
    if (groupFileList) groupFileList.innerHTML = "";

    renderFileListForUser("");
  }
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

export const getCurrentUser = async () => {
  const me = await fetch("/api/me", { credentials: "include" });
  return await me.json();
};

export let selectedFile;
let groupNames = [];
let selectedFileType;

// When the DOM is fully loaded, set up initial state and event listeners
document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = await getCurrentUser();
  console.log("Current User: ", currentUser);

  const createNewModal = document.getElementById("create-new");
  const createNewForm = document.getElementById("create-new-form");
  const createNewErrorMsg = document.getElementById("create-new-error");
  const filesList = document.getElementById("filesList");
  const uploadNewBtn = document.getElementById("UploadNewbtn");
  if (uploadNewBtn) {
    uploadNewBtn.addEventListener("click", async () => {
      createNewErrorMsg.innerText = "";

      const fileTypeSelect = document.getElementById("new-type-select");

      // Use the new endpoint instead of filtering /api/files
      const res = await fetch("/api/ownedGroups", { credentials: "include" });
      const { ownedGroups } = await res.json();

      ownedGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = `group:${group}`;
        option.innerText = `Group: ${group.charAt(0).toUpperCase() + group.slice(1)}`;
        const ownerSelect = document.getElementById("new-group-owner-select");
        ownerSelect.appendChild(option);
      });

      createNewModal.showModal();
    });
  }
  const createNewCancelBtn = document.getElementById("create-new-cancel");
  if (createNewCancelBtn) {
    createNewCancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      createNewModal.close();
      createNewForm.reset();
    });
  }
  const createNewButton = document.getElementById("create-new-button");
  if (createNewButton) {
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

          const urlParams = new URLSearchParams(window.location.search);
          const currentGroup = urlParams.get("groupId");
          const currentFolder = urlParams.get("folderId") || "";

          if (currentGroup) {
            showPage("#files");
            await renderFileListForGroup(currentGroup);
          } else {
            await renderFileListForUser(currentFolder);
          }
        }
      } else {
        createNewErrorMsg.innerText =
          'Please only use letters, numbers and symbols like: ".-_"';
      }
    });
  }

  const createNewGroupModal = document.getElementById("create-new-group");
  const createNewGroupForm = document.getElementById("create-new-group-form");
  const createNewGroupErrorMsg = document.getElementById(
    "create-new-group-error",
  );
  const groupsList = document.getElementById("GroupsList");
  const newGroupBtn = document.getElementById("newGroupBtn");
  if (newGroupBtn) {
    newGroupBtn.addEventListener("click", async () => {
      createNewGroupErrorMsg.innerText = "";

      const ownerSelect = document.getElementById("new-group-owner-select");
      ownerSelect.innerHTML = '<option value="">Me (personal)</option>';

      // Use the new endpoint instead of filtering /api/files
      const res = await fetch("/api/ownedGroups", { credentials: "include" });
      const { ownedGroups } = await res.json();

      ownedGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = `group:${group}`;
        option.innerText = `Group: ${group.charAt(0).toUpperCase() + group.slice(1)}`;
        ownerSelect.appendChild(option);
      });

      createNewGroupModal.showModal();
    });
  }

  const createNewGroupCancelBtn = document.getElementById(
    "create-new-group-cancel",
  );
  if (createNewGroupCancelBtn) {
    createNewGroupCancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      createNewGroupModal.close();
      createNewGroupForm.reset();
    });
  }
  const createNewGroupButton = document.getElementById(
    "create-new-group-button",
  );
  if (createNewGroupButton) {
    createNewGroupButton.addEventListener("click", async (e) => {
      e.preventDefault();
      const data = new FormData(createNewGroupForm);
      const formObject = Object.fromEntries(data);
      if (validateString(formObject.name)) {
        const res = await fetch("/api/createNew", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objectId: `group:${formObject.name}`,
          }),
        });
        const resData = await res.json();
        if (!res.ok) {
          createNewGroupErrorMsg.innerText = resData.message;
        } else {
          createNewGroupForm.reset();
          createNewGroupModal.close();
          await renderFileListForUser(currentUser.id);
        }
      } else {
        createNewGroupErrorMsg.innerText =
          'Please only use letters, numbers and symbols like: ".-_"';
      }
    });
  }
  // Set the initial active page
  showPage("#files"); // Set "All Files" as the default active page

  const fileDetailsModal = document.getElementById("file-details");
  document.getElementById("cancel-modal").addEventListener("click", () => {
    fileDetailsModal.close();
  });
  // fileDetailsModal.showModal();
  // Attach click listeners to all sidebar links
  document.querySelectorAll(".sidebar li a").forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default anchor link behavior (e.g., jumping to the top)
      const targetPageId = this.getAttribute("href");
      if (targetPageId && targetPageId.startsWith("#")) {
        const url = new URL(window.location);
        url.searchParams.delete("folderId");
        url.searchParams.delete("groupId");
        window.history.pushState({}, "", url);
        document.getElementById("groups-main-view")?.classList.remove("hidden");
        document.getElementById("groups-deeper-view")?.classList.add("hidden");
        const groupFileList = document.getElementById("groups-files-list");
        if (groupFileList) groupFileList.innerHTML = "";
        resetChanges();
        renderFileListForUser("");
        showPage(targetPageId);
      }
    });
  });

  // loads either defualt dashboard or admin dashboard
  const urlParams = new URLSearchParams(window.location.search);
  const currentGroupId = urlParams.get("groupId");
  const currentFolderId = urlParams.get("folderId");

  const adminRes = await fetch("/api/isAdmin", { credentials: "include" });

  if (adminRes.ok) {
    await renderAdminUSerList();
  } else {
    if (currentGroupId) {
      showPage("#files");
      await renderFileListForGroup(currentGroupId);
    } else {
      await renderFileListForUser(currentFolderId || "");
    }
  }

  const inviteBtn = document.getElementById("invite-member");
  inviteBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    inviteMember(event);
  });

  const groupInviteBtn = document.getElementById("invite-group-member");
  groupInviteBtn.addEventListener("click", inviteMember);

  const groupDetailsModal = document.getElementById("group-details");
  groupDetailsModal
    .querySelector(".cancel-modal")
    .addEventListener("click", () => {
      groupDetailsModal.close();
    });

  document.addEventListener("click", async (event) => {
    // Tjek om det klikkede element er en "more_vert" knap
    if (event.target.classList.contains("more-btn")) {
      event.preventDefault();
      const listItem = event.target.closest(".listitem");
      const fileId = listItem.dataset.fileId;

      window.selectedFile = fileId;

      const modal = document.getElementById("file-details");
      await renderMembers(fileId);
      modal.showModal();
    }
  });
});
const groupsList = document.getElementById("GroupsList");
function renderGroups(files) {
  groupsList.innerHTML = "";

  const groups = files.filter((file) => file.objectId.startsWith("group:"));

  if (groups.length === 0) {
    groupsList.innerHTML = "<p style='padding:1rem;'>No groups.</p>";
    return;
  }

  groups.forEach((file) => {
    const item = createFileListItem(file, {
      subtitle: "Group",
    });

    groupsList.appendChild(item);
  });
}

function renderMyFiles(files) {
  const filesList = document.getElementById("filesList");

  if (!filesList) {
    console.warn("filesList element not found");
    return;
  }
  filesList.innerHTML = "";

  const ownedFiles = files.filter(
    (file) =>
      file.relations.includes("owner") && !file.objectId.startsWith("group:"),
  );

  ownedFiles.forEach((file) => {
    const item = createFileListItem(file);

    filesList.appendChild(item);
  });
}

function renderSharedFiles(files) {
  const sharedList = document.getElementById("SharedList");

  if (!sharedList) {
    console.warn("Could not find element with id 'SharedList' in HTML");
    return;
  }

  sharedList.innerHTML = "";

  const sharedFiles = files.filter(
    (file) =>
      !file.relations.includes("owner") && !file.objectId.startsWith("group:"),
  );

  if (sharedFiles.length === 0) {
    sharedList.innerHTML = "<p style='padding:1rem;'>No shared files.</p>";

    return;
  }

  sharedFiles.forEach((file) => {
    const item = createFileListItem(file, {
      subtitle: "Shared with you",
    });

    sharedList.appendChild(item);
  });
}

async function renderGroupFiles(files) {
  const groupFileList = document.getElementById("groups-files-list");

  if (!groupFileList) return;

  groupFileList.innerHTML = "";

  if (files.length === 0) {
    groupFileList.innerHTML = "<p style='padding:1rem;'>No files.</p>";
    return;
  }

  files.forEach((file) => {
    const item = createFileListItem(file, {
      subtitle: "Shared with group",
      containerType: "group",
    });

    groupFileList.appendChild(item);
  });
}
// fetch the server when saving all changes
const saveChanges = document.getElementById("save-changes");
saveChanges.addEventListener("click", async (e) => {
  e.preventDefault();
  saveAllChanges(e);
});

// fetch the server when saving all changes
const saveGroupChanges = document.getElementById("save-group-changes");
if (saveGroupChanges) {
  saveGroupChanges.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log("trykket");
    saveAllChanges(e);
  });
}

const saveAllChanges = async (event) => {
  const changes = Array.from(changedRelation.entries()).map(
    ([subjectId, { oldRel, newRel }]) => ({
      subjectId,
      oldRel,
      newRel,
    }),
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
      updateRel: changes,
    }),
  });

  const resData = await res.json();

  if (!res.ok) {
    alert("Error: " + resData.message);
    return;
  }

  changedRelation.clear();
  addedUsers = [];
  deletedUsers = [];
  document.getElementById("file-details").close();
};

export let tempMembers = [];
let addedUsers = [];
let deletedUsers = [];
let changedRelation = new Map();

export const renderMembers = async (fileId, options = {}) => {
  const {
    membersContainerId = "members",
    inviteContainerId = "invite-container",
    modalId = "file-details",
  } = options;
  console.log("Forsøger at finde container:", membersContainerId);
  const membersList = document.getElementById(membersContainerId);

  if (!membersList) {
    console.error("Kunne ikke finde container med ID:", membersContainerId);
    return;
  }
  selectedFileType = fileId.split(":")[0];

  console.log(selectedFileType);
  const currentUser = await getCurrentUser();
  membersList.innerHTML = "";

  if (tempMembers.length === 0) {
    const res = await fetch("/api/relatedUsers", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectId: fileId }),
    });

    if (res.ok) {
      const { relatedUsers } = await res.json();
      const normalized = relatedUsers.map((u) => ({
        ...u,
        relations: Array.isArray(u.relations) ? u.relations : [u.relations],
      }));

      tempMembers = structuredClone(normalized);
    }
  }
  const schemaRes = await fetch("/api/schema", { credentials: "include" });
  const schema = await schemaRes.json();
  window.schema = schema;

  const inviteContainer = document.getElementById(inviteContainerId);
  const canShare = canPriv(currentUser, tempMembers, schema, "share");
  if (!canShare) {
    inviteContainer.classList.add("hidden");
  } else {
    inviteContainer.classList.remove("hidden");
  }
  console.log(tempMembers);
  // check if tempmember contains the userlist
  if (tempMembers && tempMembers.length > 0) {
    //checking if the current user owns the file
    const ownFile = tempMembers.some(
      (rel) =>
        rel.relations.includes("owner") && rel.subjectId === currentUser.id,
    );
    const canDelRel =
      canPriv(currentUser, tempMembers, schema, "delete") || ownFile;
    const canManageRel =
      canPriv(currentUser, tempMembers, schema, "share") || ownFile;

    //create a div element for each member to be displayed
    tempMembers.forEach((rel) => {
      const isGroup = rel.subjectId.startsWith("group:");
      const ownsGroup = rel.userIsOwner;
      const userEntry = tempMembers.find(
        (rel) => rel.subjectId === currentUser.id,
      );
      const userRelations = userEntry ? userEntry.relations : [];
      const isOwnerOfGroup = userRelations.some(
        (t) => t.objectId === rel.subjectId && t.relation === "owner",
      );
      if (isGroup) console.log(rel);
      const member = document.createElement("div");
      member.className = "member";
      const user = document.createElement("p");
      const userName = rel.subjectId.split(":")[1];
      user.innerText = userName.charAt(0).toUpperCase() + userName.slice(1);

      // relation part of member made to be a dropdown that allows owners to change relation
      const relationSel = document.createElement("select");
      relationSel.className = "changeRelation";
      // Find dette stykke inde i renderMembers:
      let possibleRelationTypes;
      if (selectedFileType === "file" || selectedFileType === "folder") {
        possibleRelationTypes = "file";
      } else {
        possibleRelationTypes = "group";
      }

      // Lige efter dette, når du kalder dominance(rel), skal du sende den rigtige type med:
      const strongest = dominance(rel, possibleRelationTypes);

      const relationOptions = Object.keys(
        schema?.[possibleRelationTypes]?.relations || {},
      );

      // format it beautifully
      relationOptions.forEach((r) => {
        const option = document.createElement("option");
        option.value = r;
        option.innerText = r.charAt(0).toUpperCase() + r.slice(1);

        if (r === strongest) {
          option.selected = true;
        }
        relationSel.appendChild(option);
      });
      // if can't manage relations, disable select
      if (
        !canManageRel ||
        rel.subjectId === currentUser.id ||
        (rel.relations.includes("owner") && currentUser.id !== "user:admin")
      ) {
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
          newRel: assignedRel,
        });
        rel.relations = [assignedRel];
      });
      member.appendChild(user);
      member.appendChild(relationSel);
      const deleteMessage = document.createElement("a");
      deleteMessage.innerText = "delete object";
      deleteMessage.addEventListener("click", (event) => {
        event.preventDefault();
        deleteObject(event);
      });
      // create an option for an owner to revoke acces from another member
      if (canDelRel && rel.subjectId !== currentUser.id) {
        const deleteRel = document.createElement("button");
        deleteRel.innerText = "Revoke";
        deleteRel.className = "btn-lift";
        deleteRel.id = "revoke-btn";
        deleteRel.addEventListener("click", async (event) => {
          event.preventDefault();
          if (tempMembers.length === 1) {
            const modal = document.getElementById("modalErrorMessage");
            modal.innerText =
              "An object must have at least one member. Alternatively ";
            modal.append(deleteMessage);
            return;
          }
          console.log("knap trykket");
          // remove from array that is being rendered
          tempMembers = tempMembers.filter(
            (u) => u.subjectId !== rel.subjectId,
          );
          const subjectId = rel.subjectId;
          // if user was just invited cancel invite
          if (addedUsers.some((u) => u.subjectId === subjectId)) {
            addedUsers = addedUsers.filter((u) => u.subjectId !== subjectId);
          } else {
            if (!deletedUsers.some((u) => u.subjectId === subjectId)) {
              deletedUsers.push({ subjectId });
              console.log(deletedUsers);
            }
          }
          if (selectedFileType === "group") {
            await renderMembers(selectedFile, {
              membersContainerId: "group-members",
              modalId: "group-details",
            });
          } else {
            renderMembers(fileId, options);
          }
        });
        const helpDelete = document.createElement("span");
        helpDelete.className = "tooltip";
        helpDelete.innerText = "Revoke this user's access";
        deleteRel.appendChild(helpDelete);
        member.appendChild(deleteRel);
        if (
          rel.relations.includes("owner") &&
          currentUser.id !== "user:admin"
        ) {
          deleteRel.disabled = true;
        }
      } else if (
        rel.subjectId === currentUser.id ||
        (isGroup && ownsGroup)
      ) // create an option to revoke own access
      {
        const leaveSelectedFile = document.createElement("button");
        leaveSelectedFile.innerText = "Leave";
        leaveSelectedFile.className = "btn-lift";
        leaveSelectedFile.id = "leave-file";
        leaveSelectedFile.classList = "btn-lift";
        const helpLeave = document.createElement("span");
        helpLeave.className = "tooltip-leave";
        helpLeave.innerText = "Revoke own access";

        leaveSelectedFile.addEventListener("click", async (event) => {
          event.preventDefault();

          if (!selectedFile) {
            console.error("No file selected");
            return;
          }

          if (tempMembers.length === 1) {
            const modal = document.getElementById("modalErrorMessage");

            modal.innerText =
              "An object must have at least one member. Alternatively ";

            modal.append(deleteMessage);

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
        leaveSelectedFile.appendChild(helpLeave);
        member.appendChild(leaveSelectedFile);
      }
      membersList.appendChild(member);
    });
  }
};

// add eventlistener to the costum relations link/button
const customBtn = document
  .getElementById("custom-btn")
  .addEventListener("click", async (event) => {
    createCustomRel(event);
  });
export const createCustomRel = async (event) => {
  event.preventDefault();

  // create dialog for the creation of a new relation
  const customRelation = document.createElement("dialog");
  customRelation.id = "custom-modal";
  customRelation.className = "modal-body";
  const customHeader = document.createElement("h2");
  customHeader.className = "custom-header";
  customHeader.textContent = "Create Custom Relation";
  customRelation.appendChild(customHeader);
  const customRelForm = document.createElement("form");
  customRelForm.id = "custom-form";
  const inputTitle = document.createElement("p");
  inputTitle.className = "input-title";
  inputTitle.textContent = "Name the Custom Relation:";
  const customRelationName = document.createElement("input");
  customRelationName.type = "text";
  customRelationName.id = "relation-name";
  customRelationName.name = "relation-name";
  customRelationName.placeholder = "Type Relation Name";
  const message = document.createElement("div");
  let messageText = document.createElement("p");
  messageText.textContent = "";
  messageText.className = "error-message";
  message.appendChild(messageText);
  customRelForm.appendChild(inputTitle);
  customRelForm.appendChild(customRelationName);
  customRelForm.appendChild(message);

  const privOptionsFile = window.schema?.file?.relations?.owner || [];
  const privOptionsFolder = window.schema?.folder?.relations?.owner || [];
  const privilegeOptions = [...privOptionsFile];
  privOptionsFolder.forEach((pF) => {
    const exists = privilegeOptions.some((pO) => pO === pF);
    if (!exists) {
      privilegeOptions.push(pF);
    }
  });

  privilegeOptions.forEach((p) => {
    const privilegeList = document.createElement("div");
    const privilege = document.createElement("input");
    privilege.type = "checkbox";
    privilege.id = `privilege-${p}`;
    privilege.name = p;
    const privLabel = document.createElement("label");
    privLabel.setAttribute("for", privilege.id);
    privLabel.textContent = p.charAt(0).toUpperCase() + p.slice(1);
    privilegeList.appendChild(privilege);
    privilegeList.appendChild(privLabel);
    customRelForm.appendChild(privilegeList);
  });
  const createRelSubmit = document.createElement("button");
  createRelSubmit.id = "submit-new-rel";
  createRelSubmit.className = "btn-lift";
  createRelSubmit.textContent = "Create Relation";

  const createRelCancel = document.createElement("button");
  createRelCancel.textContent = "cancel";
  createRelCancel.className = "btn-lift";
  createRelCancel.addEventListener("click", (e) => {
    e.preventDefault();
    customRelation.close();
  });
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
    if (!relationName) {
      messageText.textContent = "please enter relation name";
      console.log("attempted to create relation with no name");
      return;
    }
    // validate name
    if (!validateString(relationName)) {
      messageText.textContent = "Please do not use special characters";
      console.log("input invalid");
      return;
    }

    const existingRelationKeys = Object.keys(
      window.schema?.file?.relations || {},
    );
    const existingEntries = Object.entries(
      window.schema?.file?.relations || {},
    );
    // check if a relation with the same name as the input exists
    if (existingRelationKeys.includes(relationName.toLowerCase())) {
      messageText.textContent = `A relation named "${relationName}" already exists!`;
      console.log(
        "attempted to create a relation with the same name as a existing relation",
      );
      return;
    }
    console.log(existingEntries);

    // Find checked relations and push them to the "selectedPrivileges" array
    customRelForm
      .querySelectorAll('input[type="checkbox"]:checked')
      .forEach((checkbox) => {
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
        return false;
      }
      return selectedPrivileges.every((p) => privileges.includes(p));
    });

    // return without creating relation and tell the user the name of
    // the relation that has their exact desired privileges
    if (existingRelation) {
      const duplicateName = existingRelation[0];
      messageText.textContent = `A relation with these exact privileges already exists as "${duplicateName}".`;
      return;
    }

    //create new relation object and send it to the server
    const newRelation = {
      name: relationName.toLowerCase(),
      privileges: selectedPrivileges,
    };

    console.log(newRelation);
    const res = await fetch("/api/newRelationType", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRelation),
    });

    // update the ui so the new relation becomes an option
    // without having to refresh the page

    if (window.schema && window.schema.file && window.schema.file.relations) {
      window.schema.file.relations[relationName.toLowerCase()] =
        selectedPrivileges;
    }

    if (selectedFile) {
      await renderMembers(selectedFile);
    }
    customRelation.close();
    customRelation.remove();
  });
};

const deleteGroupBtn = document.getElementById("delete-group");
if (deleteGroupBtn) {
  deleteGroupBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    deleteObject(event);
  });
}
const deleteFileBtn = document.getElementById("delete-file");
deleteFileBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  deleteObject(event);
});

export const deleteObject = async () => {
  if (!selectedFile) {
    alert("No file selected to delete");
    return;
  }
  //send the file attempted to be deleted to the server
  const res = await fetch("/api/deleteFile", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objectId: selectedFile }),
  });
  if (res.ok) {
    location.reload();
  } else {
    const data = await res.json();
    alert("Error: " + data.message);
  }
};

const disableDelete = async () => {
  const currentUser = await getCurrentUser();
  if (!window.schema) {
    console.log("Schema not loaded yet");
    return;
  }
  const userEntry = tempMembers.find((rel) => rel.subjectId === currentUser.id);
  const userRelations = userEntry ? userEntry.relations : [];

  const canDelete =
    (await currentUser.id) === "user:admin" ||
    userRelations.some((rel) =>
      window.schema?.file?.relations?.[rel]?.includes("delete"),
    );
  console.log(currentUser.id);
  console.log(canDelete);
  deleteFileBtn.disabled = !canDelete;
};

export function setSelectedFile(fileId) {
  selectedFile = fileId;
}

export function resetChanges() {
  tempMembers.length = 0;
  addedUsers.length = 0;
  deletedUsers.length = 0;
  changedRelation.clear();
}

export const inviteMember = async () => {
  let inviteInput;
  console.log(selectedFile);
  const type = selectedFile.split(":")[0];
  if (type === "group") {
    inviteInput = document.getElementById("invite-group-field");
  } else {
    inviteInput = document.getElementById("invite-field");
  }
  const response = await fetch("/api/validateUserName", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: inviteInput.value }),
  });

  if (!response.ok) {
    document.getElementById("modalErrorMessage").innerText =
      "User or Group not found";
    return;
  }

  const { userName } = await response.json();

  if (tempMembers.some((u) => u.subjectId === `user:${userName}`)) {
    alert("Already invited");
    return;
  }
  let addedRelation;
  if (type === "group") {
    addedRelation = "member";
  } else {
    addedRelation = "viewer";
  }

  tempMembers.push({ subjectId: userName, relations: [addedRelation] });
  addedUsers.push({ subjectId: userName, relations: [addedRelation] });
  if (type === "group") {
    await renderMembers(selectedFile, {
      membersContainerId: "group-members",
      modalId: "group-details",
    });
  } else {
    await renderMembers(selectedFile);
  }

  console.log(userName);
  console.log(tempMembers);
  console.log(addedUsers);
  inviteInput.value = "";
};
const canPriv = (
  currentUser,
  tempMembers,
  schema,
  privilege,
  type = selectedFileType,
) => {
  const userEntry = tempMembers.find((rel) => rel.subjectId === currentUser.id);
  const userRelations = userEntry ? userEntry.relations : [];

  return (
    currentUser.id === "user:admin" ||
    userRelations.some((rel) =>
      schema?.[type]?.relations?.[rel]?.includes(privilege),
    )
  );
};

async function renderFileListForGroup(groupId) {
  if (!groupId) {
    const url = new URL(window.location);
    groupId = url.searchParams.get("groupId") || "";
  }

  try {
    const res = await fetch(
      `/api/folderContent?groupId=${encodeURIComponent(groupId)}`,
      {
        credentials: "include",
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to load group files via server:", errorText);
      return;
    }

    const { files } = await res.json();

    const groupsFilesList = document.getElementById("groups-files-list");
    if (groupsFilesList) groupsFilesList.innerHTML = "";

    document.getElementById("group-files-title")?.classList.remove("hidden");

    document.getElementById("groups-main-view")?.classList.add("hidden");

    document.getElementById("groups-deeper-view")?.classList.remove("hidden");

    if (files.length === 0) {
      if (groupsFilesList) {
        groupsFilesList.innerHTML =
          "<p style='padding: 1rem;'>No files shared with this group.</p>";
      }
      return;
    }

    const filesList = document.getElementById("filesList");
    if (filesList) filesList.innerHTML = "";

    const sharedList = document.getElementById("SharedList");
    if (sharedList) sharedList.innerHTML = "";

    await renderGroupFiles(files);
  } catch (error) {
    console.error("Error fetching group content on frontend:", error);
  }
}

// calculate weight of all roles and return "strongest"
// Tilføj 'type' som et valgfrit parameter til dominance funktionen
function dominance(rel, type = null) {
  const actionWeights = {
    view: 1,
    comment: 2,
    edit: 3,
    create_child: 4,
    share: 5,
    delete: 10,
    delete_folder: 12,
  };

  // Hvis der ikke er givet en type, så find den ud fra rel.objectId (hvis det findes)
  const actualType =
    type ||
    (rel.objectId ? rel.objectId.split(":")[0] : window.selectedFileType);

  let strongest = rel.relations[0];
  let maxscore = 0;

  rel.relations.forEach((relation) => {
    // Slå op i schemaet under den korrekte specifikke type (file, folder eller group)
    const actions = window.schema?.[actualType]?.relations?.[relation] || [];
    const score = actions.reduce(
      (sum, action) => sum + (actionWeights[action] ?? 0),
      0,
    );
    if (score > maxscore) {
      maxscore = score;
      strongest = relation;
    }
  });

  return strongest || "viewer";
}

function createFileListItem(file, options = {}) {
  const { subtitle = "Updated recently", containerType = "default" } = options;

  const listItem = document.createElement("div");
  listItem.className = "listitem";
  listItem.dataset.fileId = file.objectId;
  const relationsArray = Array.isArray(file.relations)
    ? file.relations
    : [file.relations || "viewer"];

  listItem.dataset.relations = relationsArray.join(",");
  const fileType = file.objectId.split(":")[0];

  const icon = document.createElement("i");
  icon.className = "material-icons type";
  switch (fileType) {
    case "folder":
      icon.innerText = "folder";
      break;
    case "group":
      icon.innerText = "people";
      break;
    case "file":
      icon.innerText = "article";
      break;
    default:
      icon.innerText = "question_mark";
  }
  const itemTitle = document.createElement("div");
  itemTitle.className = "item-title";
  const h3 = document.createElement("h3");
  h3.innerText = file.objectId.split(":")[1];
  const p = document.createElement("p");
  p.innerText = subtitle;
  itemTitle.appendChild(h3);
  itemTitle.appendChild(p);
  const relation = document.createElement("div");

  relation.className = "relation";

  relation.innerText = dominance(file, fileType);

  // MORE BUTTON
  const moreLink = document.createElement("a");

  moreLink.href = "#";

  moreLink.className = "more-btn";

  const moreIcon = document.createElement("i");

  moreIcon.className = "material-icons";

  moreIcon.innerText = "more_vert";

  moreLink.appendChild(moreIcon);

  listItem.appendChild(icon);

  listItem.appendChild(itemTitle);

  listItem.appendChild(relation);

  listItem.appendChild(moreLink);

  listItem.addEventListener("click", async (event) => {
    const isMoreBtn = event.target.closest(".more-btn");
    console.log("Clicked:", isMoreBtn ? "More Button" : "Row");
    if (isMoreBtn) {
      event.preventDefault();

      await openDetailsModal(listItem);

      return;
    }

    if (fileType === "group") {
      navigateToGroup(file.objectId);

      return;
    }

    if (fileType === "folder") {
      if (containerType === "group") {
        navigateToGroup(file.objectId);
      } else {
        navigateToFolder(file.objectId);
      }
    }
  });

  return listItem;
}

async function openDetailsModal(listItem) {
  const fileId = listItem.dataset.fileId;
  const type = fileId.split(":")[0];

  const modalId = type === "group" ? "group-details" : "file-details";
  const modal = document.getElementById(modalId);

  if (!modal) {
    console.error(`Fatal: Modal #${modalId} not found in the DOM!`);
    alert("This action is not available on this page.");
    return;
  }

  try {
    selectedFile = fileId;
    selectedFileType = type;

    tempMembers = [];
    addedUsers = [];
    deletedUsers = [];
    changedRelation.clear();

    if (type === "group") {
      await renderMembers(fileId, {
        membersContainerId: "group-members",
        modalId: "group-details",
      });
    } else {
      await renderMembers(fileId);
    }

    modal.showModal();
  } catch (err) {
    console.error("Modal failed:", err);
  }
}
export { saveAllChanges };
