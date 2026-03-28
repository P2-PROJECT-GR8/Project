

// functionality for DB of some kind should probably go in here


function validUserName(userName){
    const userObject = {
    valid: false,
    access: 'placeholder'
}
    // check whether username exists
    // assuming it does
    if (true){
        userObject.valid = true
        // whatever function locates the username should also return that users acces level
        userObject.access = 'all'
    }
    return userObject
}


export {validUserName};
