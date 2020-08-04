let nodeResult = '';

function setnodeResult(data) {
    nodeResult = data;
}

function getnodeResult() {
    let node = nodeResult;
    nodeResult = '';
    return node;
}

exports.getnodeResult = getnodeResult;
exports.setnodeResult = setnodeResult;