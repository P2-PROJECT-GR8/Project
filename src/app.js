import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This tells Express to serve files from your new /node/public folder
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.post("/get-username", function (req, res) {
  console.log("recieved from index.js", req.body);
  res.json({ username: "admin", status: "recieved", access: "all" });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
