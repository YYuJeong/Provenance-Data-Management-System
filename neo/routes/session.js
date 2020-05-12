let session_info ={

    email: '',
    user: '',
    password: '',
    pid: '',
    gubun: '',
    authenticated: false,
    message: ''
};

function setSession(email, user, password, pid, gubun, authenticated, message){
    session_info ={
        email: email,
        user: user,
        password: password,
        pid: pid,
        gubun: gubun,
        authenticated: authenticated,
    };
}

function getSession(){
    return session_info;
}

exports.setSession = setSession;
exports.getSession = getSession
