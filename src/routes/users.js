const userList = {
  users: [
    new User("admin", "all"),
    new User("alice", "editor"),
    new User("bob", "viewer"),
    new User("jeff", "none"),
  ],
};
/**
 * @param {*} name
 * @param {*} access
 */
function User(name, access) {
  this.name = name;
  this.access = access;
}

// functionality for DB of some kind should probably go in here
/**
 * @param {String} userName
 * @return {Object} - Returns a userObject
 */
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

// receive the button press for deleting a users relations
Router.post("/remove-relations", async(req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({error: "userId is required" });
    }
  }

  removeUserRelations(userId);

  res.json({succes:true});
  } catch (err) {
  res.status(500).json({error:err.message});
}
});

export { validUserName };
