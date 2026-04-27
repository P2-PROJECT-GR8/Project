// use either BFS DFS or dijkstra algortihm to locate and log the paths user has to a file and display it for an admin
// as you would need to locate every single path from user to designated object utilizing BFS is likely the best solution.
// access.js can already locate all relations a user has

import { renderHeader } from "./navRenderer.js";

// theoretically this should allow for easier understanding of the auditing process by showing where and how users have relations to things
// fix the new html page so admin dash actually exists

//

// wait for DOM load before doing anything
document.addEventListener("DOMContentLoaded", async () => {
  renderHeader();
  const userSelect = document.getElementById("user-Datalist");
  const objectSelect = document.getElementById("object-Datalist");
  const display = document.getElementById("main-Display");
});

// should probably go in acces.js
// db strucutre contains adjacency lsits so you have found all paths to the object
// once youve found all paths to adjacent objects(contained in adjacency list)
function pathFind(userId, objectId) {}

// render path
function renderPathToObject(path) {}

// render admin dashboard
function adminDash() {}
