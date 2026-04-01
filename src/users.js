const userList = {
  users: [
    new user("admin", "all"),
    new user("alice", "editor"),
    new user("bob", "viewer"),
    new user("jeff", "none"),
  ],
};

function user(name, access) {
  this.name = name;
  this.access = access;
}

// functionality for DB of some kind should probably go in here

function validUserName(userName) {
  const userObject = {
    valid: false,
    access: "placeholder",
  };
  // check whether username exists
  userList.users.forEach((Element) => {
    if (Element.name === userName) {
      userObject.valid = true;
      userObject.access = Element.access;
    }
  });
  return userObject;
}
export { validUserName };
