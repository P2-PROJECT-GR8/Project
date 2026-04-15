import { readFile, readJSON, writeFile, writeJSON } from "../../data/data-handling/JSONstorage.js";
import { basicRenderHeader, renderHeader } from "./navRenderer.js";
import 'node:fs';
document.addEventListener("DOMContentLoaded", () => {
renderHeader();
const registerBtn = document.getElementById("RegisterBtn");

    async function writeToJSON() {
    readJSON("./data/users.json");
    let regUser= document.getElementById("regInput").value;
    let userObject = {
        username: regUser,
    }
    let data = readJSON("./data/users.json");
    data.users.push(userObject);
    writeJSON("./data/users.json", data);
    console.log(data);
    }
});