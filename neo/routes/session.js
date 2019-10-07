var express = require('express');
var router = express.Router();
var session_info ={
    email: '',
    user: '',
    gubun: '',
    password: '',
    authenticated:false,
    message: ''
};

function setSession(email, user, gubun, password, authenticated, message){
    session_info ={
        email: email,
        user: user,
        gubun: gubun,
        password: password,
        authenticated: authenticated,
    };
}

function getSession(){
    console.log(session_info)
    return session_info;
}

exports.setSession = setSession;
exports.getSession = getSession
