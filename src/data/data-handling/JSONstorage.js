const fs = require("fs");

function readFile(path) {
  // We want to be able to read a file
  return fs.readFileSync(path, "utf-8"); // the readFileSync stops the execution until it has found what it's searching for
}

function readJSON(path) {
  const text = readFile(path); // we take our readFile function and converts the file into text
  return JSON.parse(text); // we then extract the text from the JSON file to be able to read it.
}

function toJSONtext(data) {
  // It will stringify the JSON into text we can change or add too
  return JSON.stringify(data, null, 2);
}

function writeFile(path, text) {
  // Take a file path and text, and then writes that text into the JSON file.
  return fs.writeFileSync(path, text, "utf-8"); // Will overwrite what was there before and again stops exution until it is finished
}

function writeJSON(path, data) {
  const text = toJSONtext(data); // Here we convert the data to text
  writeFile(path, text); // We then take the path and take the text that was just converted and then writes into the JSON file
}
