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
  });

  // Set the initial active page
  showPage("#files"); // Set "All Files" as the default active page

  const fileDetailsModal = document.getElementById("file-details");
  document
    .getElementById("cancel-modal")
    .addEventListener("click", () => fileDetailsModal.close());
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

  // load dahsboard
  renderFileListForUSer(currentUser.id);

  // renders all of a users files
  async function renderFileListForUSer(userId) {
    const res = await fetch("/files", {
      credentials: "include",
    });
    const { files } = await res.json();
    renderFiles(files);
  }

  // renders received filelist to dahsboard
  function renderFiles(files) {
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

  let selectedFile;

  const inviteInput = document.getElementById("invite-field");
  const inviteBtn = document.getElementById("invite-member");
  inviteBtn.addEventListener("click", async (event) => {
    const errorMessage = document.getElementById("modalErrorMessage");
    // Check the length of the input value, not the value itself.
    if (inviteInput.value.length >= 2 && inviteInput.value.length <= 10) {
      const newMember = inviteInput.value.toLowerCase();
      try {
        if (!selectedFile) throw new Error("No selected file");
        const res = await fetch("/api/newTuple", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({
            objectId: selectedFile,
            relation: "viewer",
            subjectId: `user:${newMember}`,
          }),
        });
        if (res.ok) {
          errorMessage.innerText = "";
          inviteInput.value = "";
          renderMembers(selectedFile);
        } else {
          const data = await res.json();
          errorMessage.innerText = data.message;
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      errorMessage.innerText = "Username must be between 2 and 10 characters.";
    }
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

const renderMembers = async (fileId) => {
  const membersList = document.getElementById("members");
  const currentUser = await getCurrentUser();
  const res = await fetch("/relatedUsers", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ objectId: fileId }),
  });
  if (res.ok) {
    membersList.innerHTML = "";
    const { relatedUsers } = await res.json();
    if (relatedUsers && relatedUsers.length > 0) {
      const ownFile = relatedUsers.some(
        (rel) =>
          rel.relations.includes("owner") && rel.subjectId === currentUser.id,
      );
      relatedUsers.forEach((rel) => {
        // Create a member element in the dialog for every related user
        // to provide an overview over users that have access
        const member = document.createElement("div");
        member.className = "member";
        const user = document.createElement("p");
        const userName = rel.subjectId.split(":")[1];
        user.innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
        const relation = document.createElement("p");
        const formattedRelations = rel.relations.map((str) => {
          return str.charAt(0).toUpperCase() + str.slice(1);
        });
        relation.innerText = formattedRelations.join(", ");

        if (rel.subjectId === currentUser.id) {
          user.innerText += " (You)";
          user.style.fontWeight = 600;
          relation.style.fontWeight = 600;
        }

        member.appendChild(user);
        member.appendChild(relation);

        if (ownFile && rel.subjectId !== currentUser.id) {
          const deleteRel = document.createElement("a");
          deleteRel.innerText = "X";
          deleteRel.href = "#";
          deleteRel.id = "delete-btn";
          deleteRel.addEventListener("click", async (event) => {
            event.preventDefault();
            if (!confirm("Remove this user?")) return;
            const res = await fetch("/api/deleteTuple", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                objectId: fileId,
                relations: rel.relations,
                subjectId: rel.subjectId,
              }),
            });
            if (res.ok) {
              renderMembers(fileId);
            }
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
// document
//   .getElementById("confirm-create-folder")
//   .addEventListener("click", async () => {
//     const folderName = document.getElementById("folder-name-input").value;
//     const folderError = document.getElementById("folder-error");

//     if (!folderName) {
//       folderError.innerText = "Please enter a folder name.";
//       return;
//     }

//     const res = await fetch("/api/newFolder", {
//       method: "POST",
//       credentials: "include",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ folderName: folderName.toLowerCase() }),
//     });

//     if (res.ok) {
//       modal_container.classList.remove("show");
//       document.getElementById("folder-name-input").value = "";
//       folderError.innerText = "";
//       location.reload();
//     } else {
//       const data = await res.json();
//       alert(data.message);
//     }
//   });
