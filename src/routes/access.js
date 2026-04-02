const SCHEMA = {
  file: {
    relations: {
      owner: ["view", "edit", "delete", "share", "comment"],
      editor: ["view", "edit", "comment"],
      viewer: ["view", "comment"],
      commenter: ["view", "comment"],
    },
  },
  folder: {
    relations: {
      owner: ["view", "create_child", "delete_folder"],
      viewer: ["view"],
    },
  },
};

const tupleStore = [
  { subject: "user:alice", relation: "editor", object: "file:1" },
  { subject: "user:bob", relation: "viewer", object: "file:1" },
  { subject: "user:jeff", relation: "member", object: "group:marketing" },
  { subject: "group:marketing", relation: "owner", object: "file:1" },
  { subject: "folder:marketing_assets", relation: "parent", object: "file:1" },
  {
    subject: "user:jeff",
    relation: "viewer",
    object: "folder:marketing_assets",
  },
];

class User {
  constructor(name, tupleStore, schema) {
    this.name = name;
    this.id = `user:${name}`;
    this.tupleStore = tupleStore;
    this.schema = schema;
  }

  // function to check whether a user can perform an action like "view" or "edit"
  async can(action, objectId) {
    // Get all relations this user has to an object
    const relations = await this.expandAccess(objectId);

    // Find the type of object the user is trying to access
    const type = objectId.split(":")[0];

    // return whether the set of permissions based on the relation includes the requested action
    return relations.some((rel) => {
      const permissions = this.schema[type].relations[rel];
      return permissions && permissions.includes(action);
    });
  }

  // boolean function should return whether this user has access to an object
  async hasAccess(objectId, requiredPermission) {
    // Get all the relations this user has to any object
    // Check if any of the relations include the required permission
  }

  // recursively check all the relations this user has to an object and return them as a set
  async expandAccess(objectId, visited = new Set()) {
    // Base case
    if (visited.has(objectId)) {
      return [];
    }

    // Add object to visited
    visited.add(objectId);

    let discoveredRelations = [];

    // iterate through relations

    for (const tuple of this.tupleStore) {
      //Case A: Direct relations from subject to object
      if (tuple.subject === this.id && tuple.object === objectId) {
        discoveredRelations.push(tuple.relation);
      }
      //Case B: Indirect relations e.g. from subject to group to object
      else if (tuple.object === objectId) {
        const inherited = await this.expandAccess(tuple.subject, visited);

        if (inherited.length > 0) {
          if (tuple.relation === "parent") {
            // If the subject is a parent folder, the user should inherit whatever relation they had to that folder.
            discoveredRelations.push(...inherited);
          } else {
            discoveredRelations.push(tuple.relation);
          }
        }
      }
    }
    // we return the final list of relations, but filter out "parent" relations, since they have no effect on final access decisions
    return [...new Set(discoveredRelations)].filter((rel) => rel !== "parent");
  }
}

const alice = new User("alice", tupleStore, SCHEMA);
const bob = new User("bob", tupleStore, SCHEMA);
const jeff = new User("jeff", tupleStore, SCHEMA);

console.log(await jeff.expandAccess("file:1"));
console.log(await alice.can("edit", "file:1"));
console.log(await bob.can("delete", "file:1"));
