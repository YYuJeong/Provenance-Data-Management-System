let fsm_result = "";

function setfsm_result(data) {
    fsm_result = data;
    console.log(fsm_result)
}

function getfsm_result() {
    let fsmresult = fsm_result;
    fsm_result = '';
    console.log(fsmresult)
    return fsmresult;
}

exports.getfsm_result = getfsm_result;
exports.setfsm_result = setfsm_result;
