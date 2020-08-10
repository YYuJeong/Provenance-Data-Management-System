let SimilarityResult = '';

function setSimilarityResult(data) {
    SimilarityResult = data;
}

function getSimilarityResult() {
    let returnValues = SimilarityResult;
    SimilarityResult = '';
    return returnValues;
}

exports.getSimilarityResult = getSimilarityResult;
exports.setSimilarityResult = setSimilarityResult;