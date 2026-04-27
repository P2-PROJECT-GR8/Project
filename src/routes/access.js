/**
 * @typedef {Object} Tuple
 * @property {string} subject - The subject of the relation (e.g., 'user:alice', 'group:editors').
 * @property {string} relation - The relation the subject has to the object (e.g., 'member', 'owner').
 * @property {string} object - The object of the relation (e.g., 'file:1', 'group:editors').
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
   * @param {string} userName - The name of the user (e.g., 'alice').
   * @param {string} action - The action to be performed (e.g., 'read', 'write').
   * @param {string} objectId - The ID of the object (e.g., 'file:1').
   * @returns {Promise<boolean>} - Whether a user can perform an action.
   * @memberof AccessControl
   */
  async can(userName, action, objectId) {
    const userId = `user:${userName}`;
    // Get all relations this user has to an object
    const relations = await this.expandUserRelations(userId, objectId);
    // Find the type of object the user is trying to access
    const type = objectId.split(":")[0];

    // return whether the set of permissions based on the relation includes the requested action
    return relations.some((rel) => {
      const permissions = this.db.data.schema[type]?.relations[rel];
      return permissions && permissions.includes(action);
    });
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
   * @param {string} subjectId - The ID of the subject (user, group, etc.).
   * @param {string} objectId - The ID of the object.
   * @param {Set<string>} visited - A set to track visited subject-object pairs to prevent cycles.
   * @returns {Promise<string[]>} - An array of discovered relations.
   * @memberof AccessControl
   */
  async _expand(subjectId, objectId) {
    this.db.read();
    const { byObject, bySubject } = this.db.data.tupleStore;

    const discoveredRelations = new Set();
    const visited = new Set();
    const queue = [objectId];

    while (queue.length > 0) {
      const currentTarget = queue.shift();

      if (visited.has(currentTarget)) continue;
      visited.add(currentTarget);

      const tuples = byObject[currentTarget] || [];

      for (const tuple of tuples) {
        // Case A: Direct relation
        if (tuple.subjectId === subjectId) {
          discoveredRelations.add(tuple.relation);
        }

        // Case B: Indirect relation via Folder/Parent inheritance
        else if (tuple.relation === "parent") {
          queue.push(tuple.subjectId);
        }

        // Case C: Indirect relation via Group inheritance
        else {
          const userRelations = bySubject[subjectId] || [];
          const isMember = userRelations.some(
            (r) => r.objectId === tuple.subjectId && r.relation === "member",
          );

          if (isMember) {
            discoveredRelations.add(tuple.relation);
          }
        }
      }
    }

    discoveredRelations.delete("parent");
    return Array.from(discoveredRelations);
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
      if (!subjectId.startsWith("user:")) {
        continue;
      }

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

  addTuple(subjectId, relation, objectId) {
    this.db.read();
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
        "Tried to add a tupple to the bySubject database that already exists",
      );

    this.db.write();
  }

  // This function is maybe a WIP, debating on whether the effeciency of .filter() is fine in this case
  deleteTuple(subjectId, relation, objectId) {
    this.db.read();

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

    this.db.write();
  }

  locatePaths(userId, objectId, maxdepth = 5) {
    const paths = [];
    this.db.read();
    const { bysubject } = this.db.data.tupleStore;

    function DFS(currentNode, path, visited, depth) {
      // if depth exceeded return
      if (depth > maxdepth) {
        return;
      }
      // base case: target hit return path
      if (currentNode === objectId) {
        paths.push([path]);
        return;
      }

      // intilize edges for current node
      const edges = bysubject[currentNode] || [];

      // run through all edges at this node
      for (const edge of edges) {
        const nextNode = edge.objectId;

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

      DFS(userId, [], new Set([userId]), 0);
      return paths;
    }

    // DFS algortihm
  }
}

export { AccessControl };
