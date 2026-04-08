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

class AccessControl {
  constructor(tupleStore, schema) {
    this.tupleStore = tupleStore;
    this.schema = schema;
  }

  // function to check whether a user can perform an action like "view" or "edit"
  async can(userName, action, objectId) {
    const userId = `user:${userName}`;
    // Get all relations this user has to an object
    const relations = await this.expandUserRelations(userId, objectId);

    // Find the type of object the user is trying to access
    const type = objectId.split(":")[0];

    // return whether the set of permissions based on the relation includes the requested action
    return relations.some((rel) => {
      const permissions = this.schema[type]?.relations[rel];
      return permissions && permissions.includes(action);
    });
  }

  // recursively check all the relations a user has to an object and return them as a set
  async expandUserRelations(userId, objectId) {
    // This is the main entry point for a check. We start by expanding access
    // for the user's own ID and ensure the results are unique.
    const relations = await this._expand(userId, objectId, new Set());
    return [...new Set(relations)];
  }

  // A generic recursive expansion function.
  // subjectId can be a user, a group, etc.
  async _expand(subjectId, objectId, visited) {
    const visitKey = `${subjectId}->${objectId}`;
    if (visited.has(visitKey)) {
      return [];
    }
    visited.add(visitKey);

    let discoveredRelations = [];

    for (const tuple of this.tupleStore) {
      // Case A: Direct relation found.
      // e.g., { subject: 'user:alice', relation: 'editor', object: 'file:1' }
      if (tuple.subject === subjectId && tuple.object === objectId) {
        discoveredRelations.push(tuple.relation);
      }

      // Case B: Indirect relation (inheritance).
      // e.g., { subject: 'group:marketing', relation: 'owner', object: 'file:1' }
      // If we are checking for a user on 'file:1', this tuple's object matches.
      // We now recursively check if the user has a relation to the tuple's subject ('group:marketing').
      else if (tuple.object === objectId) {
        const inheritedRelations = await this._expand(
          subjectId,
          tuple.subject,
          visited,
        );

        if (inheritedRelations.length > 0) {
          // The user has a relationship with the intermediate object (e.g., is a 'member' of a group).
          if (tuple.relation === "parent") {
            // If the intermediate object is a parent, the user inherits their existing relations to that parent.
            // e.g., if user is 'viewer' of folder, they become 'viewer' of the file.
            discoveredRelations.push(...inheritedRelations);
          } else {
            // If the intermediate object is a group, the user inherits the group's relation to the target object.
            // e.g., if user is 'member' of group, and group is 'owner' of file, user gets 'owner' relation.
            discoveredRelations.push(tuple.relation);
          }
        }
      }
    }
    // Filter out relations like 'parent' that are used for traversal but aren't permissions themselves.
    return discoveredRelations.filter((rel) => rel !== "parent");
  }
}

const accessControl = new AccessControl(tupleStore, SCHEMA);

console.log(
  "Jeff's relations to file:1:",
  await accessControl.expandUserRelations("user:jeff", "file:1"),
);
console.log(
  "Can Alice edit file:1?",
  await accessControl.can("alice", "edit", "file:1"),
);
console.log(
  "Can Bob delete file:1?",
  await accessControl.can("bob", "delete", "file:1"),
);
