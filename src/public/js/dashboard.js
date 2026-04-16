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

// When the DOM is fully loaded, set up initial state and event listeners
document.addEventListener("DOMContentLoaded", async () => {
  // Set the initial active page
  showPage("#files"); // Set "All Files" as the default active page

  const fileDetailsModal = document.getElementById("file-details");
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
      moreIcon.className = "material-icons";
      moreIcon.innerText = "more_vert";
      moreLink.appendChild(moreIcon);

      listItem.appendChild(icon);
      listItem.appendChild(itemTitle);
      listItem.appendChild(relation);
      listItem.appendChild(moreLink);

      filesList.appendChild(listItem);
    });
  }

  console.log(files);
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
