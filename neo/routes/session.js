//let session_info ={
//    email: '',
//    user: '',
//    gubun: '',
//    password: '',
//    authenticated:false,
//    message: ''
//};

var LocalStorage = require('node-localstorage').LocalStorage;

function setSession(email, user, gubun, password, authenticated, message){
    //session_info ={
    //    email: email,
    //    user: user,
    //    gubun: gubun,
    //    password: password,
    //    authenticated: authenticated,
    //};

    // session unused. local storage added.

    if (typeof localStorage === "undefined" || localStorage === null) {
        localStorage = new LocalStorage('./scratch');
        console.log("create localStorage complete");
    }

    localStorage.setItem('email', email);
    localStorage.setItem('user', user);
    localStorage.setItem('gubun', gubun);
    localStorage.setItem('password', password);
    localStorage.setItem('authenticated', authenticated);

    console.log("===setSession sessioninfo log print===");
    console.log(localStorage.getItem('email'));
    console.log(localStorage.getItem('user'));
    console.log(localStorage.getItem('gubun'));
    console.log(localStorage.getItem('password'));
    console.log(localStorage.getItem('authenticated'));
    console.log("+++setSession sessioninfo log print+++");
}

function getSession(){
    if (typeof localStorage === "undefined" || localStorage === null){
        localStorage = new LocalStorage('./scratch');
        console.log("create localStorage complete");
    }

    var return_session_info = {
        email: localStorage.getItem('email'),
        user: localStorage.getItem('user'),
        gubun: localStorage.getItem('gubun'),
        password: localStorage.getItem('password'),
        authenticated: localStorage.getItem('authenticated'),
    };

    console.log("===getSession sessioninfo log print===");
    console.log(localStorage.getItem('email'));
    console.log(localStorage.getItem('user'));
    console.log(localStorage.getItem('gubun'));
    console.log(localStorage.getItem('password'));
    console.log(localStorage.getItem('authenticated'));
    console.log("===getSession sessioninfo log print end===");

    return return_session_info;
}

exports.setSession = setSession;
exports.getSession = getSession
