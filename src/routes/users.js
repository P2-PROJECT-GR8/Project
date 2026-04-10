const userList = {
  users: [
    new User("admin", "all"),
    new User("alice", "editor"),
    new User("bob", "viewer"),
    new User("jeff", "none"),
  ],
};

function User(name, access) {
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
