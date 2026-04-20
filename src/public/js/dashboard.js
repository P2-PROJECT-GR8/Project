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

  const res = await fetch("/files", {
    credentials: "include",
  });
  const { files } = await res.json();

  const filesList = document.getElementById("filesList");

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

  console.log(files);
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
      relatedUsers.forEach((rel) => {
        // Create a member element in the dialog for every related user
        // to provide an overview over users that have access
        const member = document.createElement("div");
        member.className = "member";
        const user = document.createElement("p");
        const userName = rel.subjectId.split(":")[1];
        user.innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
        const relation = document.createElement("p");
        rel.relations = rel.relations.map((str) => {
          return str.charAt(0).toUpperCase() + str.slice(1);
        });
        relation.innerText = rel.relations.join(", ");

        if (rel.subjectId === currentUser.id) {
          user.innerText += " (You)";
          user.style.fontWeight = 600;
          relation.style.fontWeight = 600;
        }

        member.appendChild(user);
        member.appendChild(relation);
        membersList.appendChild(member);
      });
    }
  } else {
    // console.log(res.body);
  }
};

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
