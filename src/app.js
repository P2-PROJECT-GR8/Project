import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { validUserName } from "./routes/users.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// returns an object with username and their access level
app.post("/username", function (req, res) {
  console.log("recieved from index.js", req.body);
  let userName = req.body.username;

  // returns an object with access level as located from some sort of DB (yet to be implemented)
  let userObject = validUserName(userName);

  if (userObject.valid) {
    res.json({ username: userName, status: "200", access: userObject.access });
  } else {
    res.json({ status: "404" });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
