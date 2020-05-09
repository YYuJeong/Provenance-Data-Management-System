let session_info ={
    email: 'admin',
    user: 'admin',
    gubun: '관리자',
    password: '1234',
    authenticated:true,
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
    return session_info;
}

exports.setSession = setSession;
exports.getSession = getSession
