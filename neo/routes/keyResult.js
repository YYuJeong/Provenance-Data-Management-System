let keyword_result = "";

function setKeywordResult(data) {
    keyword_result = data;
}

function getKeywordResult() {
    return keyword_result;
}

exports.getKeywordResult = getKeywordResult;
exports.setKeywordResult = setKeywordResult;