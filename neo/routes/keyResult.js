let keyword_result = "";

function setKeywordResult(data) {
    keyword_result = data;
}

function getKeywordResult() {
    let keyword = keyword_result;
    keyword_result = '';
    return keyword;
}

exports.getKeywordResult = getKeywordResult;
exports.setKeywordResult = setKeywordResult;