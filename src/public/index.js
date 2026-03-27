
document.getElementById("loginForm").addEventListener("submit", function (event){
const username = document.getElementById("username").value;

if(username.length <= 2){ 
    event.preventDefault();
    alert("Username skal være længere end 2 bokstaver");

}


}); 