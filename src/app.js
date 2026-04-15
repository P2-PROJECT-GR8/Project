import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { validUserName } from "./routes/users.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());

const SECRET_KEY = "rtKaslL6w4B9in";

// returns an object with username and their access level
app.post("/username", function (req, res) {
  console.log("recieved from index.js", req.body);
  const { userName } = req.body;

  // returns an object with access level as located from some sort of DB (yet to be implemented)
  let userObject = validUserName(userName);

  if (userObject.valid) {
    res.json({ username: userName, status: "200", access: userObject.access });
  } else {
    res.json({ status: "404" });
  }
});

// JWT sender for when a new user logs in
app.post("/login", (req, res) => {
  const { username } = req.body;

  // TODO: Check if a user is in the users db (JSON file) and return an error if not.

  if (!username) return res.status(400).send("Username is missing");

  const token = jwt.sign({ userId: `user:${username}` }, SECRET_KEY, {
    expiresIn: "1h",
  });

  console.log(`Created a session for ${username} with Id : user:${username}`);
  res.cookie("sessionToken", token, { httpOnly: true });
  res.send({ message: `Logged in as ${username}` });
});

app.get("/account", (req, res) => {
  const token = req.cookies.sessionToken;
  if (!token) {
    console.log("No session found");
    return res.status(401).send("No active session found, please log in");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log(decoded);
    const userId = decoded.userId;

    console.log(`Account request from ${userId}`);
  } catch (error) {
    res.status(401).send("Invalid session");
  }
});

app.post("/logout", (req, res) => {
  if (!req.cookies.sessionToken) {
    return res
      .status(401)
      .send("No active session found. Log in before loggin out");
  } else {
    res.clearCookie("sessionToken", { httpOnly: true });
    res.send("Session deleted, user logged out");
    console.log("Session deleted");
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
