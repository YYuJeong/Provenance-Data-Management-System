let fsm_result = "";

function setfsm_result(data) {
    fsm_result = data;
}

function getfsm_result() {
    let fsmresult = fsm_result;
    fsm_result = '';
    console.log('-------getfsm_result-------')
    console.log(fsmresult)
    console.log('-------getfsm_result-------')
    return fsmresult;
}

exports.getfsm_result = getfsm_result;
exports.setfsm_result = setfsm_result;