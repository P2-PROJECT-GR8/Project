/**
 * @typedef {Object} Tuple
 * @property {string} subject - The subject of the relation (e.g., 'user:alice', 'group:editors').
 * @property {string} relation - The relation the subject has to the object (e.g., 'member', 'owner').
 * @property {string} object - The object of the relation (e.g., 'file:1', 'group:editors').
 */

/**
 * @typedef {object} LogEntry
 * @property {string} subjectId
 * @property {string} action
 * @property {string} objectId
 * @property {number} time
 * @property {boolean} allowed
 */

/**
 * @typedef {Object.<string, { relations: Object.<string, string[]> }>} Schema
 * The schema defines the types of objects and the possible relations between them.
 * The keys are object types (e.g., 'file', 'folder').
 * The `relations` object maps a relation name (e.g., 'owner') to a list of permissions it grants (e.g., ['read', 'write']).
 */

/**
 * @typedef {Object} DbData
 * @property {Schema} schema - The access control schema. The `definitions` property is not used in the current schema structure.
 * @property {Object} tupleStore - The indexed relationship tuples.
 * @property {Object.<string, Array<{ subjectId: string, relation: string }>>} tupleStore.byObject - Tuples indexed by objectId.
 * @property {Object.<string, Array<{ relation: string, objectId: string }>>} tupleStore.bySubject - Tuples indexed by subjectId.
 */

/**
 * @typedef {Object} Db
 * @property {DbData} data - The database data.
 */

/**
 * Implements a ReBAC (Relationship-Based Access Control) system.
 * It determines user permissions by traversing a graph of relationships
 * between users, groups, and objects.
 *
 * @class AccessControl
 */
class AccessControl {
  /**
   * Creates an instance of AccessControl.
   * @param {Db} db - The database object containing the schema and tuples.
   * @memberof AccessControl
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Checks if a user can perform a specific action on an object.
   * @param {string} userId - The ID of the user (e.g., 'user:alice').
   * @param {string} action - The action to be performed (e.g., 'read', 'write').
   * @param {string} objectId - The ID of the object (e.g., 'file:1').
   * @returns {Promise<boolean>} - Whether a user can perform an action.
   * @memberof AccessControl
   */
  async can(userId, action, objectId) {
    if (!objectId) {
      console.log("no objectId");
    }
    console.log(".can revieved " + userId + " " + action + " " + objectId);
    await this.db.read();
    // Get all relations this user has to an object
    const relations = await this.expandUserRelations(userId, objectId);
    // Find the type of object the user is trying to access
    const type = objectId.split(":")[0];

    // return whether the set of permissions based on the relation includes the requested action
    const allowed = relations.some((rel) => {
      const permissions = this.db.data.schema[type]?.relations[rel];
      return permissions && permissions.includes(action);
    });
    // log access attempt
    await this.log(userId, action, objectId, allowed);
    console.log("and . can concluded that it was " + allowed);
    return allowed;
  }

  // recursively check all the relations a user has to an object and return them as a set

  /**
   * Expands all relations a user has to an object, both direct and indirect.
   * @param {string} userId - The ID of the user (e.g., 'user:alice').
   * @param {string} objectId - The ID of the object (e.g., 'file:1').
   * @returns {Promise<string[]>} - An array of all unique relations a user has to an object.
   * @memberof AccessControl
   */
  async expandUserRelations(userId, objectId) {
    // This is the main entry point for a check. We start by expanding access
    // for the user's own ID and ensure the results are unique.
    const relations = await this._expand(userId, objectId);
    return [...new Set(relations)];
  }

  // A generic recursive expansion function.
  // subjectId can be a user, a group, etc.

  /**
   * Recursively expands relations between a subject and an object.
   * @private
   * @param {string} subjectId - The ID of the subject (e.g., 'user:alice').
   * @param {string} objectId - The ID of the object (e.g., 'file:1').
   * @returns {Promise<string[]>} - An array of discovered relations.
   * @memberof AccessControl
   */
  async _expand(subjectId, objectId) {
    await this.db.read();
    const { byObject } = this.db.data.tupleStore;

    // 1. Find all groups the subject belongs to, transitively.
    const subjectAndGroups = this._getSubjectGroups(subjectId);
    subjectAndGroups.add(subjectId);

    const discoveredRelations = new Set();
    const visitedObjects = new Set();
    const queue = [objectId];

    // 2. Traverse up the object hierarchy from the target object.
    while (queue.length > 0) {
      const currentTarget = queue.shift();

      if (visitedObjects.has(currentTarget)) continue;
      visitedObjects.add(currentTarget);

      const tuples = byObject[currentTarget] || [];

      for (const tuple of tuples) {
        // If the tuple defines a parent, add the parent to the queue to check it next.
        if (tuple.relation === "parent") {
          queue.push(tuple.subjectId);
        } else if (subjectAndGroups.has(tuple.subjectId)) {
          // For any other relation, if the subject is the user or one of their groups,
          // they inherit the relation.
          discoveredRelations.add(tuple.relation);
        }
      }
    }

    discoveredRelations.delete("parent");
    return Array.from(discoveredRelations);
  }

  /**
   * Finds all groups a subject is a member of, transitively.
   * @private
   * @param {string} subjectId The ID of the subject (e.g., 'user:alice').
   * @returns {Set<string>} A set of group IDs.
   * @memberof AccessControl
   */
  _getSubjectGroups(subjectId) {
    const { bySubject } = this.db.data.tupleStore;
    const groups = new Set();
    const queue = [subjectId];
    const visited = new Set([subjectId]);

    const groupMembershipRelations = new Set(["member", "owner", "subgroup"]);

    while (queue.length > 0) {
      const current = queue.shift();
      const memberships = bySubject[current] || [];
      for (const tuple of memberships) {
        if (
          groupMembershipRelations.has(tuple.relation) &&
          tuple.objectId.startsWith("group:")
        ) {
          if (!visited.has(tuple.objectId)) {
            visited.add(tuple.objectId);
            groups.add(tuple.objectId);
            queue.push(tuple.objectId);
          }
        }
      }
    }
    return groups;
  }

  /**
   * Finds all objects a user can access and lists the specific relations they have to each.
   * @param {string} userId - The ID of the user (e.g., 'user:alice').
   * @returns {Promise<Array<{objectId: string, relations: string[]}>>} - A promise that resolves to an array of objects,
   * where each object contains an objectId and the user's relations to it.
   * @memberof AccessControl
   */
  async getUserRelations(userId) {
    const accessibleObjects = [];
    // Create a set of all unique object IDs from the tuple store.
    const allObjectIds = new Set(Object.keys(this.db.data.tupleStore.byObject));

    for (const objectId of allObjectIds) {
      // not their membership in groups, so we can skip group objects.
      if (objectId.startsWith("group:")) {
        continue;
      }

      const relations = await this.expandUserRelations(userId, objectId);

      if (relations.length > 0) {
        accessibleObjects.push({
          objectId: objectId,
          relations: relations,
        });
      }
    }

    return accessibleObjects;
  }

  /**
   * Function that returns all the users that have a relation to an object, and what relation that is:
   * @param {String} objectId
   * @return {Promise<Array<Object>>}
   * @memberof AccessControl
   */
  async getObjectRelations(objectId) {
    const relatedUsers = [];
    const allSubjectIds = new Set(
      Object.keys(this.db.data.tupleStore.bySubject),
    );
    for (const subjectId of allSubjectIds) {
      // We only care about users, not groups or other objects

      const relations = await this.expandUserRelations(subjectId, objectId);

      if (relations.length > 0) {
        relatedUsers.push({
          subjectId: subjectId,
          relations: relations,
        });
      }
    }

    return relatedUsers;
  }

  async renderSubjects(objectId) {
    await this.db.read();
    const { byObject, bySubject } = this.db.data.tupleStore;

    const discoveredSubjects = new Map();
    const visitedObjects = new Set();
    const queue = [objectId];

    while (queue.length > 0) {
      const currentTarget = queue.shift();

      if (visitedObjects.has(currentTarget)) continue;
      visitedObjects.add(currentTarget);

      const tuples = byObject[currentTarget] || [];

      for (const tuple of tuples) {
        if (tuple.relation === "parent") {
          queue.push(tuple.subjectId);
        } else {
          if (tuple.subjectId) {
            if (!discoveredSubjects.has(tuple.subjectId)) {
              discoveredSubjects.set(tuple.subjectId, new Set());
            }
            discoveredSubjects.get(tuple.subjectId).add(tuple.relation);
          }
        }
      }
    }
    const relatedSubjects = [];
    const isTargetAGroup = objectId.startsWith("group:");

    for (const [subjectId, relationsSet] of discoveredSubjects.entries()) {
      relationsSet.delete("parent");

      if (!isTargetAGroup) {
        relationsSet.delete("member");
      }

      if (relationsSet.size > 0) {
        relatedSubjects.push({
          subjectId: subjectId,
          relations: Array.from(relationsSet),
        });
      }
    }

    return relatedSubjects;
  }

  async addTuple(subjectId, relation, objectId) {
    await this.db.read();
    const entryByObject = { subjectId, relation };
    const entryBySubject = { relation, objectId };

    // 1. Add tuple to the byObject index IF it doesn't already exist
    // Check if key is in the db
    if (!this.db.data.tupleStore.byObject[objectId])
      this.db.data.tupleStore.byObject[objectId] = [];
    // Only add if the tuple doesnt exits already
    if (
      !this.db.data.tupleStore.byObject[objectId].some(
        (t) => t.subjectId === subjectId && t.relation === relation,
      )
    ) {
      this.db.data.tupleStore.byObject[objectId].push(entryByObject);
    } else
      console.error(
        "Tried to add a tupple to the byObject database that already exists",
        { subjectId, relation, objectId },
      );

    // 2. Add tuple to the bySubject index, same method as step 1
    if (!this.db.data.tupleStore.bySubject[subjectId])
      this.db.data.tupleStore.bySubject[subjectId] = [];
    if (
      !this.db.data.tupleStore.bySubject[subjectId].some(
        (t) => t.relation === relation && t.objectId === objectId,
      )
    ) {
      this.db.data.tupleStore.bySubject[subjectId].push(entryBySubject);
    } else
      console.error(
        "Tried to add a tuple to the bySubject database that already exists",
      );

    await this.db.write();
  }

  // This function is maybe a WIP, debating on whether the effeciency of .filter() is fine in this case
  async deleteTuple(subjectId, relation, objectId) {
    await this.db.read();

    // 1. Remove from the byObject index
    if (this.db.data.tupleStore.byObject[objectId]) {
      this.db.data.tupleStore.byObject[objectId] =
        this.db.data.tupleStore.byObject[objectId].filter(
          (t) => !(t.subjectId === subjectId && t.relation === relation),
        );

      // Clean up empty keys to keep the db.json small
      if (this.db.data.tupleStore.byObject[objectId].length === 0) {
        delete this.db.data.tupleStore.byObject[objectId];
      }
    }

    // 2. Remove from the bySubject index
    if (this.db.data.tupleStore.bySubject[subjectId]) {
      this.db.data.tupleStore.bySubject[subjectId] =
        this.db.data.tupleStore.bySubject[subjectId].filter(
          (t) => !(t.objectId === objectId && t.relation === relation),
        );

      // Clean up empty keys
      if (this.db.data.tupleStore.bySubject[subjectId].length === 0) {
        delete this.db.data.tupleStore.bySubject[subjectId];
      }
    }

    await this.db.write();
  }

  async locatePaths(subjectId, objectId, mode, maxDepth = 15) {
    const paths = [];
    await this.db.read();
    const { bySubject } = this.db.data.tupleStore;
    const { byObject } = this.db.data.tupleStore;

    const rootId =
      mode === "pathsFromTarget" && subjectId === "null" ? objectId : subjectId;

    if (!rootId) {
      return [];
    }

    const type = rootId.split(":")[0];

    let adjacency;
    let idType;

    if (type === "user" || type === "group") {
      adjacency = this.db.data.tupleStore.bySubject;
      idType = "objectId";
    } else if (type === "file" || type === "folder") {
      adjacency = this.db.data.tupleStore.byObject;
      idType = "subjectId";
    } else {
      return [];
    }

    // all paths to target
    if (mode === "pathsToTarget") {
      // dfs algortihm for bySubject (returns all paths from user to object)
      function DFS(currentNode, path, visited, depth) {
        // if depth exceeded return
        if (depth > maxDepth) {
          return;
        }
        // base case: target hit return path
        if (currentNode === objectId) {
          paths.push([...path]);
          return;
        }

        // intialize edges for current node
        const edges = adjacency[currentNode] || [];

        // run through all edges at this node
        for (const edge of edges) {
          const nextNode = edge[idType];

          // prevent cycles
          if (visited.has(nextNode)) continue;

          // log nodes already visisted
          visited.add(nextNode);
          path.push({
            from: currentNode,
            relation: edge.relation,
            to: nextNode,
          });

          // recursive call
          DFS(nextNode, path, visited, depth + 1);

          //backtracking
          path.pop();
          visited.delete(nextNode);
        }
      }
      DFS(rootId, [], new Set([rootId]), 0);
    } else if (mode === "pathsFromTarget") {
      // all paths from subject/object
      function DFS(currentNode, path, visited, depth) {
        // if depth exceeded return
        if (depth > maxDepth) {
          return;
        }

        // intialize edges for current node
        const edges = adjacency[currentNode] || [];

        // base case

        // Case 1: root is user/group → push path on every file/folder hit
        if (
          (type === "user" || type === "group") &&
          (currentNode.startsWith("file:") ||
            currentNode.startsWith("folder:")) &&
          path.length > 0
        ) {
          paths.push([...path]);
        }

        // Case 2: root is file/folder → push path when traversal ends
        if (
          (type === "file" || type === "folder") &&
          edges.length === 0 &&
          path.length > 0
        ) {
          paths.push([...path]);
          return;
        }

        // run through all edges at this node
        for (const edge of edges) {
          const nextNode = edge[idType];

          // prevent cycles
          if (visited.has(nextNode)) continue;

          // log nodes already visisted
          visited.add(nextNode);
          path.push({
            from: currentNode,
            relation: edge.relation,
            to: nextNode,
          });

          // recursive call
          DFS(nextNode, path, visited, depth + 1);

          //backtracking
          path.pop();
          visited.delete(nextNode);
        }
      }
      DFS(rootId, [], new Set([rootId]), 0);
    }

    return paths;
  }

  async deleteFile(objectId) {
    await this.db.read();

    const objectType = objectId.split(":")[0];

    if (objectType === "folder") {
      const folderContent = this.db.data.tupleStore.bySubject[objectId] || [];

      for (const content of [...folderContent]) {
        await this.deleteFile(content.objectId);

        await this.deleteTuple(
          content.subjectId,
          content.relation,
          content.objectId,
        );
      }
    }

    if (objectType === "group") {
      const groupRelations = this.db.data.tupleStore.bySubject[objectId] || [];

      for (const tuple of [...groupRelations]) {
        await this.deleteTuple(objectId, tuple.relation, tuple.objectId);
      }
    }

    const tuples = this.db.data.tupleStore.byObject[objectId] || [];
    for (const tuple of [...tuples]) {
      await this.deleteTuple(tuple.subjectId, tuple.relation, objectId);
    }
  }

  async log(subjectId, action, objectId, allowed) {
    const now = Date.now();
    const retainDurationMS = 30 * 24 * 60 * 60 * 1000;

    const entry = {
      subjectId: subjectId,
      action: action,
      objectId: objectId,
      time: now,
      allowed: allowed,
    };

    const store = this.db.data.logs;

    store.bySubject[subjectId] ??= [];
    store.byObject[objectId] ??= [];

    store.bySubject[subjectId].push(entry);
    store.byObject[objectId].push(entry);

    // filter for old logs
    this.filterLogs(retainDurationMS);

    await this.db.write();
  }

  filterLogs(retainDurationMS) {
    const now = Date.now();

    for (const subjectId in this.db.data.logs.bySubject) {
      this.db.data.logs.bySubject[subjectId] = this.db.data.logs.bySubject[
        subjectId
      ].filter((e) => {
        return now - e.time <= retainDurationMS;
      });
      if (this.db.data.logs.bySubject[subjectId].length === 0) {
        delete this.db.data.logs.bySubject[subjectId];
      }
    }
    for (const objectId in this.db.data.logs.byObject) {
      this.db.data.logs.byObject[objectId] = this.db.data.logs.byObject[
        objectId
      ].filter((e) => {
        return now - e.time <= retainDurationMS;
      });
      if (this.db.data.logs.byObject[objectId].length === 0) {
        delete this.db.data.logs.byObject[objectId];
      }
    }
  }
}

export { AccessControl };
