let session_info ={

    email: 'sw1234',
    user: '이상우',
    password: '1234',
    pid: '980514-1520414',
    gubun: '사용자',
    authenticated: true,
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
