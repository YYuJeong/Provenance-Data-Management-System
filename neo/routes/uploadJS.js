let uploadFile = "";

function setUploadResult(data) {
    uploadFile = data;
}

function getUploadResult() {
    let upload = uploadFile;
    uploadFile = '';
    return upload;
}

exports.getUploadResult = getUploadResult;
exports.setUploadResult = setUploadResult;
