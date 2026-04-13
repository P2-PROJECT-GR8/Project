let fs = require('fs');


function replaceDiv(){
    document.getElementById('registerBtn').addEventListener('click', function(){
        document.getElementById('register').style.display = 'none';
        document.getElementById('login').style.display = 'block';
    })
}
