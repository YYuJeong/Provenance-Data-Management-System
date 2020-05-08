let session_info ={
    
    email: 'sw1234',
    user: '이상우',
    pid: '980514-1520414',
    gubun: '사용자',
    password: 'sw1234',
    authenticated:true,
    /*
    email: '',
    user: '',
    gubun: '',
    password: '',
    authenticated:false,
    message: ''
    */
};

function setSession(email, user, pid, gubun, password, authenticated, message){
    session_info ={
        email: email,
        user: user,
        pid: pid,
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
