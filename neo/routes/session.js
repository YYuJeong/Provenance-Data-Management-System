var express = require('express');
var router = express.Router();
var session_info ={
    email: '',
    user: '',
    gubun: '',
    password: ''
};

function setSession(email, user, gubun, password){
    session_info ={
        email: email,
        user: user,
        gubun: gubun,
        password: password
    };
}

function getSession(){
    console.log(session_info)
    return session_info;
}

exports.setSession = setSession;
exports.getSession = getSession
