let regUsername = document.getElementById("usernameInput").value;

document
    .getElementById("registerForm")
    .addEventListener("submit", function(event)=>{
        event.preventDeafult();
    })
