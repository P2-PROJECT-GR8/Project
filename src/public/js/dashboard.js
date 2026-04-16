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
document.addEventListener("DOMContentLoaded", () => {
  // Set the initial active page
  showPage("#files"); // Set "All Files" as the default active page

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
});
// Show "Share file" button only if admin
  const access = sessionStorage.getItem("access");
  if (access === "all") {
    document.getElementById("share-file-btn").style.display = "block";
  }

  // Open popup
  document.getElementById("share-file-btn").addEventListener("click", () => {
    document.getElementById("popup-overlay").style.display = "block";
  });

  // Close popup
  document.getElementById("share-close-btn").addEventListener("click", () => {
    document.getElementById("popup-overlay").style.display = "none";
  });

  // Save tuple when clicking "Share"
  document.getElementById("share-save-btn").addEventListener("click", async () => {
    const filename = document.getElementById("share-filename").value;
    const user     = document.getElementById("share-user").value;
    const relation = document.getElementById("share-relation").value;

    // Check that all fields are filled
    if (!filename || !user) {
      document.getElementById("share-message").textContent = "Please fill in all fields!";
      return;
    }

    // Send tuple to server
    await fetch("/api/tuples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `user:${user}`,
        relation: relation,
        object: `file:${filename}`
      })
    });

    // Show confirmation and close popup
    document.getElementById("share-message").textContent = "File shared! ✓";
    setTimeout(() => {
      document.getElementById("popup-overlay").style.display = "none";
      document.getElementById("share-filename").value = "";
      document.getElementById("share-user").value = "";
      document.getElementById("share-message").textContent = "";
    }, 1000);
  });