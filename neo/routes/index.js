var express = require('express');
var router = express.Router();
var app = express();
var mysql = require("mysql");
var esession = require('express-session');
var session_value = require('./session');
var Promise = require('promise');
var neo4j = require('neo4j-driver');
var multer = require("multer");
var multiparty = require('multiparty');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const neo4j_connection = require('../public/scripts/config');
const db_info = neo4j_connection.Neo4j;
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(db_info.DB_USR, db_info.DB_PWD));
//const session = driver.session();
const iconv = require('iconv-lite');
var keyResult = require('./keyResult');

var similarityResult = require('./similarityResult');
var fsmResult = require('./fsmResult');
var Cy2NeoD3 = require('../public/scripts/cy2neod3');
const session = require('express-session');

let nameArr5 = [];
let affiliationArr5 = [];
let activityTypeArr5 = [];
let dateArr5 = [];
let dataNameArr5 = [];
let dataTypeArr5 = [];
let priceArr5 = [];
let deviceArr5 = [];
let nameArr6 = [];
let affiliationArr6 = [];
let dataNameArr6 = [];
let dataTypeArr6 = [];
let priceArr6 = [];
let deviceArr6 = [];

let s_nameArr = [];
let s_affiliationArr = [];
let r_nameArr = [];
let r_affiliationArr = [];

let activityTypeArr4 = [];
let dateArr4 = [];
let dataNameArr4 = [];
let dataTypeArr4 = [];
let priceArr4 = [];
let deviceArr4 = [];

let activityTypeArr3 = [];
let dateArr3 = [];
let dataNameArr3 = [];
let dataTypeArr3 = [];
let priceArr3 = [];
let deviceArr3 = [];

let provInfo3 = [];
let provInfo4 = [];
let provInfo5 = [];
let provInfo = [];

let dataN = [];
let datavalue = [];
let datafile = [];
let dataorigin = [];
let datasname = [];

let dataNamesTotal = [];
let dataValuesTotal =[];
let dataFilesTotal =[];
let dataOriginTotal =[];

let modiInsInfo = [];
let modiInsName = [];
let modiInsValue = [];

let addInsName = [];

app.use(esession({
    secret: "asdfasffdas",
    resave: false,
    saveUninitialized: true,
}));

const con = mysql.createConnection({
    host: 'localhost',
    user: "root",
    password: "1234",
    port: 3306,
    database: "iitp",
    insecureAuth: true
});
con.connect();

function promiseFromChildProcess(child) {
    return new Promise(function (resolve, reject) {
        child.addListener("error", reject);
        child.addListener("exit", resolve);
    });
}


router.get('/contact', function (req, res, next) {
    con.query("SELECT * FROM iitp.users;", function (err, result, fields) {
        console.log("err : " + err);
        if (err) {
            console.log(err);
            console.log("QUERY ERROR!");
        }
        else {
            console.log(result);
            res.render('contact', {
                results: result
            });
        }
    });
});

router.post('/contact', function (req, res, next) {
    var body = req.body;

    con.query("INSERT INTO iitp.users (name, email, password, pid, gubun) VALUES (?, ?, ?, ?, ?);", [
        body.name, body.email, body.password, body.pid, '사용자'
    ], function (err, rows, fields) {

        console.log("err : " + err);
        console.log("rows : " + rows);
        //console.log("insertId : " + rows.insertId);

        res.redirect("/contact");
    });
});

router.get('/logout', function (req, res, next) {
    session_value.setSession('', '', '', '', '', false);
    res.redirect('/');
    //res.render('index', {esession: session_value.getSession() });
});

router.route('/search/searchPage').post(
    function (req, res) {
        res.render('search/searchPage', {esession: session_value.getSession()});
    }
)

router.route('/users').post(
    function (req, res) {
        var body = req.body;
        var email = body.email;
        var password = body.password;
        //var gubun = body.gubun;

        var sql = 'SELECT * FROM users WHERE email=?';
        con.query(sql, [email], function (err, results) {
            if (err) {
                console.log(err);
            }
            if (!results[0]) {
                return res.render('users', {message: '아이디를 확인해주십시오', esession: undefined});
            }
            else {
                if (results[0].password === password) {
                    session_value.setSession(body.email, results[0]["name"], body.password, results[0]["pid"], results[0]["gubun"], true);
                    console.log(session_value.getSession());
                    res.render('index', {message: '로그인 되었습니다', esession: session_value.getSession()});
                }
                else {
                    res.render('users', {message: '비밀번호를 확인해주십시오', esession: undefined});
                }
            }
        });
    }
);

router.route('/ins/editIns').post(
    function (req, res) {
        res.render('ins/editIns', {esession: session_value.getSession()});
    }
)

router.post('/insAdd', function (req, res) {
        var insName = req.body.insName;
        var insValue = req.body.insValue;

        console.log(insName, insValue);

        con.query("INSERT INTO iitp.institutions (name, pid) VALUES (?, ?);", [
            insName, insValue
        ], function (err, rows, fields) {
    
            console.log("err : " + err);
            //console.log("rows : " + rows);

            res.render('ins/addIns', {
                esession: session_value.getSession()});
        });
         
});


router.get('/ins/modifyIns', function (req, res) {
    var insNames = [];
    var insValues = [];
    modiInsInfo = [];
    modiInsName = [];
    modiInsValue = [];
    con.query("SELECT * FROM iitp.institutions;", function (err, rows, fields) {
        //console.log("err : " + err);
        if (err) {
            console.log(err);
            console.log("QUERY ERROR!");
        }
        else {
            //console.log(rows[1]["name"]);
            for (var index = 0; index < rows.length; index++) {
                insNames.push(rows[index]["name"]);
                insValues.push(rows[index]["pid"]);

                modiInsName.push(rows[index]["name"]);
                modiInsValue.push(rows[index]["pid"]);

            }
            console.log(insNames);
            console.log(insValues);
            res.render('ins/modifyIns', {
                esession: session_value.getSession(),
                insNames: insNames,
                insValues: insValues
            });
        }
    });
});

router.post('/insGetModifyData', function (req, res) {

    var checkValues = req.body.modifyInsCheck;
    var checkLen;

    console.log(checkValues);

    var modiFlag = false;

    if (checkValues == undefined) {
        checkLen = 0;
    } else if (Array.isArray(checkValues)) {
        checkLen = 0;
    }
    else {
        checkLen = checkValues.length;
    }

    if (Array.isArray(checkValues)) {
        modiFlag = false;
    }

    if (!(checkLen == 0)) {
        console.log("------------check ------------", checkValues, checkValues.length);
        modiFlag = true;
    }

    if (!modiFlag) {
        console.log("false");
        modiFlag = false;
    }

    if (checkLen == 0) 
        modiFlag = false;

    if (modiFlag) {

        modiInsInfo.push(modiInsName[checkValues]);
        modiInsInfo.push(modiInsValue[checkValues]);

        console.log("modiFlag : ", modiFlag);
        console.log("modiInsInfo : ", modiInsInfo);

        res.render('ins/modifyInsResult.ejs', {
            esession: session_value.getSession(),

            modiFlag: modiFlag,
            insNames: modiInsName,
            insValues: modiInsValue,
            modiInsInfo: modiInsInfo,

            authenticated: true
        });  
    } else {
        res.send('<script type="text/javascript">alert("하나의 기관을 선택해주세요."); window.history.go(-1);</script>');
    }
});

router.post('/insModify', function (req, res) {
    var insNames = [];
    var insValues = [];
    var insName = req.body.insName;
    var insValue = req.body.insValue;
    var originName = modiInsInfo[0];
    var sql= 'UPDATE iitp.institutions SET name=?, pid=? WHERE name=?';

    console.log(insName, insValue, originName);

    con.query(sql, [insName, insValue, originName], function (err, rows) {
        console.log("err : " + err);
    });

    con.query("SELECT * FROM iitp.institutions;", function (err, rows) {
        //console.log("err : " + err);
        if (err) {
            console.log(err);
            console.log("QUERY ERROR!");
        }
        else {
            for (var index = 0; index < rows.length; index++) {
                insNames.push(rows[index]["name"]);
                insValues.push(rows[index]["pid"]);

                modiInsName.push(rows[index]["name"]);
                modiInsValue.push(rows[index]["pid"]);

            }
            console.log(insNames);
            console.log(insValues);
            res.render('ins/modifyIns', {
                esession: session_value.getSession(),
                insNames: insNames,
                insValues: insValues
            });
        }
    });
});

let upload = multer({
    dest: "upload/"
});

router.get('/data/uploadData', function (req, res, next) {    
   res.render('data/uploadData', {esession: session_value.getSession()});
});

router.post('/data/uploadData', function (req, res,next) {
    var form = new multiparty.Form();
    var name;
    // get field name & value
    form.on('field', function (name, value) {
        console.log('normal field / name = ' + name + ' , value = ' + value);        
    });

    // file upload handling
    form.on('part', function (part) {
        var filename;
        var size;
        if (part.filename) {
            filename = part.filename;
            name = filename;
            size = part.byteCount;
        } else {
            part.resume();
        }

        console.log("Write Streaming file :" + filename);
        var writeStream = fs.createWriteStream('upload/' + filename);
        writeStream.filename = filename;
        part.pipe(writeStream);

        part.on('data', function (chunk) {
            console.log(filename + ' read ' + chunk.length + 'bytes');
        });

        part.on('end', function () {
            console.log(filename + ' Part read complete');
            writeStream.end();

        });
    });


    // all uploads are completed
    form.on('close', function () {
        var path = __dirname.split("\\");
        var len = path.length
        var tmp = path.splice(0, len - 2)
        path = tmp.join("\\") + "\\"

        var path1 = __dirname.split("\\");
        path1 = path1.splice(0, len - 1)
        path1 = path1.join("\\") + "\\"

        // python
        const iconv = require('iconv-lite');
        var spawn = require("child_process").spawn;
        var uploadPython = __dirname+"\\data\\uploadData.py";
        var uploadPythonArg = path1 + "upload\\"+ name;
        var process = spawn('python', [uploadPython,uploadPythonArg]);
        
        function promiseFromChildProcess(child){
            return new Promise(function (resolve, reject){
                child.addListener('error',reject);
                child.addListener('exit', resolve);
            });
        }
        let uploadFile = '';
        var wrote = 0;
        var uploadJS = require('./uploadJS');
        var debug = require("debug");
        var server = app.listen(app.get('port'),function(){
            debug('express server listening on port '+server.address().port);
        });
        server.timeout = 1000*60*10;


        promiseFromChildProcess(process)
            .then(function (result){
                console.log('promise complete: ',result);
                //req.setTimeout(4 * 60 * 1000);
                process.stdout.on('data',function(data){
                    if(wrote == 0){
                        //console.log(data);
                        uploadFile = iconv.decode(data, 'EUC-KR').toString();
                        uploadJS.setUploadResult(uploadFile);
                        getData().then().catch(function(err) {
                            console.log(err);
                          });
                        //console.log(uploadFile);
                    }
                    wrote += 1;
                });
                
                process.on('close', function (data) {
                    //console.log(uploadFile);
                    //res.render("search/searchKeyword", {esession: session_value.getSession(), data:keyResult.getKeywordResult()});
                    //res.redirect('/data/uploadData');
                    //res.render('data/uploadData', {esession: session_value.getSession()});
                });
                
            }, 
            function (err) {
                console.log('promise rejected: ', err);
                
            });

        res.render('data/uploadData', {esession: session_value.getSession()});
    });

    // track progress
    form.on('progress', function (byteRead, byteExpected) {
        console.log(' Reading total  ' + byteRead + '/' + byteExpected);
    });

    form.parse(req);
})


router.get('/download', function(req, res, next) {
    var name = req.body.name;
    console.log(name);
    var upload_folder = 'upload/';
    var file = upload_folder + 'loan'; // ex) /upload/files/sample.txt
    
    try {
      if (fs.existsSync(file)) { // 파일이 존재하는지 체크
        var filename = path.basename(file); // 파일 경로에서 파일명(확장자포함)만 추출
        var mimetype = mime.getType(file); // 파일의 타입(형식)을 가져옴
      
        res.setHeader('Content-disposition', 'attachment; filename=' + filename); // 다운받아질 파일명 설정
        res.setHeader('Content-type', mimetype); // 파일 형식 지정
      
        var filestream = fs.createReadStream(file);
        filestream.pipe(res);
      } else {
        res.send('해당 파일이 없습니다.');  
        return;
      }
    } catch (e) { // 에러 발생시
      console.log(e);
      res.send('파일을 다운로드하는 중에 에러가 발생하였습니다.');
      return;
    }
  });



let add = multer({
    dest: "add/"
});

router.post('/dataAdd', function (req, res) {

    var session = driver.session();
    var session2 = driver.session();
    var session3 = driver.session();
    var session4 = driver.session();

    var dataName = req.body.dataName;
    var value = req.body.value;
    var origin = req.body.origin;
    var file_path = req.body.file_path;
    var insName = [];

    //console.log(origin);

    if(file_path == undefined)
        file_path = '';

    let today = new Date();
    let year = today.getFullYear(); // 년도
    let month = (today.getMonth() + 1).toString();  // 월
    let day = today.getDate().toString();  // 날짜
    if(month.length == 1){
        month = "0" + month
    }
    if(day.length == 1){
        day = "0" + day
    }
    var date = year.toString() + month + day

    var user_name = session_value.getSession().user; 
    var user_pid = session_value.getSession().pid; //주민번호로 바꾸기
    var user_type;
    if(session_value.getSession().gubun == '사용자'){
        user_type = '개인'
    }
    console.log(file_path)
   // track progress

   var mergeData = "MATCH (d:Data) "
                + "WITH d.name as name, d.value as value, d.file_path as file_path, d.origin as origin, COLLECT(d) AS ns "
                + "WHERE size(ns) > 1 "
                + "CALL apoc.refactor.mergeNodes(ns) YIELD node "
                + "RETURN node"
   var mergePerson = "MATCH (p:Person) "
                   + "WITH toLower(p.name) as name, p.pid as pid, p.p_type as p_type, COLLECT(p) AS ns "
                   + "WHERE size(ns) > 1 "
                   + "CALL apoc.refactor.mergeNodes(ns) YIELD node "
                   + "RETURN node"
   var deleteRel =  "MATCH (s)-[r]->(e) "
                  + "with s,e,type(r) as typ, tail(collect(r)) as coll "
                  + "foreach(x in coll | delete x) "

                  
    session.run("CREATE (d:Data {name: '" + dataName + "' , value: '" + value + "' , origin: '" + origin + "', file_path: '" + file_path + "'})-[:Generate]->(ac:Activity {name: '생성', date: '" + date + "', detail: '' })-[:Act]->(p:Person {name: '" + user_name + "' , pid: '" + user_pid + "', p_type: '" + user_type + "'})")
        .then(function (result) {
        session2.run(mergeData)
            .then(function (result) {
                session2.close()
            })
            .catch(function (err) {
                console.log(err);
            });
        session3.run(mergePerson)
            .then(function (result) {
                session3.close()
            })
            .catch(function (err) {
                console.log(err);
            });
        session4.run(deleteRel)
            .then(function (result) {
                session4.close()
            })
            .catch(function (err) {
                console.log(err);
            });
        session.close()
        })
        .catch(function (err) {
            console.log(err);
        });

    res.render('addPage', {
        esession: session_value.getSession(),
        insNames: addInsName
    });
});

router.get('/addPage', function (req, res, next) {
    var insName = [];
    addInsName = [];
    con.query("SELECT * FROM iitp.institutions;", function (err, rows, fields) {
       if (err) {
           console.log(err);
           console.log("QUERY ERROR!");
       }
       else {
           for (var index = 0; index < rows.length; index++) {
               insName.push(rows[index]["name"]);
           }
           res.render('addPage', {
            esession: session_value.getSession(),
            insNames: insName
            });
       }
   });
})

router.get('/', function (req, res, next) {
    res.render('index', {esession: session_value.getSession()});
});


router.get('/viewPage', function (req, res) {

    var session = driver.session();
 
    var nameArr = [];
    var affiliationArr = [];
    var pidArr = [];
    var pTypeArr = [];
    var nameArr2 = [];
    var affiliationArr2 = [];

    var s_nameArr = [];
    var s_pidArr = [];
    var s_pTypeArr = [];
    var r_nameArr = [];
    var r_affiliationArr = [];

    var activityTypeArr4 = [];
    var dateArr4 = [];
    var detailArr4 = [];
    var dataNameArr4 = [];

    var valueArr4 = [];
    var file_pathArr4 = [];
    var originArr4 = [];
    var dataNameArr215 = [];
    var valueArr215 = [];
    var file_pathArr215 = [];
    var originArr215 = [];

    var activityTypeArr3 = [];
    var dateArr3 = [];
    var detailArr3 = [];
    var dataNameArr3 = [];
    var dataTypeArr3 = [];
    var priceArr3 = [];
    var deviceArr3 = [];
    var valueArr3 = [];
    var file_pathArr3 = [];
    var originArr3 = [];

    var nameArr10 = [];
    var pidArr10 = [];
    var pTypeArr10 = [];
    var affiliationArr10 = [];

    var activityTypeArr10 = [];
    var dateArr10 = [];
    var detailArr10 = [];

    var APFromArr10 = [];
    var APToArr10 = [];
    var priceArr10 = [];
    var isAgreeArr10 = [];

    var dataNameArr10 = [];
    var valueArr10 = [];
    var file_pathArr10 = [];
    var originArr10 = [];

    var dataNameArr10 = [];
    var dataTypeArr10 = [];
    var priceArr10 = [];
    var deviceArr10 = [];

    var nameArr11 = [];
    var pidArr11 = [];
    var pTypeArr11 = [];

    var dataNameArr11 = [];
    var dataTypeArr11 = [];
    var priceArr11 = [];
    var deviceArr11 = [];

    dataNamesTotal = [];
    dataValuesTotal =[];
    dataFilesTotal =[];
    dataOriginTotal =[];
    datasname = [];

    var fileDownloadPath = [];

    var i = 0;
    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;
    
    if (user_gubun == '사용자') {
        console.log('사용자')
        session
          .run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '생성' AND p.name = '" + user_name + "' AND p.pid = '"+ user_pid +"' RETURN p, d, ac")
          .then(function (result) {
            result.records.forEach(function (record) {
              s_nameArr.push(record._fields[0].properties.name)
              s_pidArr.push(record._fields[0].properties.pid)
              s_pTypeArr.push(record._fields[0].properties.p_type)

              dataNameArr4.push(record._fields[1].properties.name)
              valueArr4.push(record._fields[1].properties.value)
              file_pathArr4.push(record._fields[1].properties.file_path)
              originArr4.push(record._fields[1].properties.origin)
              //dataOwner.push(record._fields[1].properties.owner)
              //dataOwnerAff.push(record._fields[1].properties.owner_aff)

              activityTypeArr4.push(record._fields[2].properties.name)
              dateArr4.push(record._fields[2].properties.date)
              detailArr4.push(record._fields[2].properties.detail)

              dataNamesTotal.push(record._fields[1].properties.name)
              dataValuesTotal.push(record._fields[1].properties.value)
              dataFilesTotal.push(record._fields[1].properties.file_path)
              dataOriginTotal.push(record._fields[1].properties.origin)

              fileDownloadPath.push("upload/" + record._fields[1].properties.file_path)
            });

            session.run("MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '가공' AND ( p.name = '" + user_name + "' ) RETURN p, d2, ac, d1 ")
            .then(function (result) {
            result.records.forEach(function (record) {

              nameArr.push(record._fields[0].properties.name)
              pidArr.push(record._fields[0].properties.pid)
              pTypeArr.push(record._fields[0].properties.p_type)

              dataNameArr3.push(record._fields[1].properties.name)
              valueArr3.push(record._fields[1].properties.value)
              file_pathArr3.push(record._fields[1].properties.file_path)
              originArr3.push(record._fields[1].properties.origin)


              activityTypeArr3.push(record._fields[2].properties.name)
              dateArr3.push(record._fields[2].properties.date)
              detailArr3.push(record._fields[2].properties.detail)

              dataNameArr215.push(record._fields[3].properties.name)
              valueArr215.push(record._fields[3].properties.value)
              file_pathArr215.push(record._fields[3].properties.file_path)
              originArr215.push(record._fields[3].properties.origin)

              dataNamesTotal.push(record._fields[1].properties.name)
              dataValuesTotal.push(record._fields[1].properties.value)
              dataFilesTotal.push(record._fields[1].properties.file_path)
              dataOriginTotal.push(record._fields[1].properties.origin)
            });

              session.run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) WHERE ac.name = '제공' AND p1.name = '" + user_name + "' RETURN p1, d, ac, r, p2 ")
              .then(function (result) {
                result.records.forEach(function (record) {
    
                  nameArr10.push(record._fields[0].properties.name)
                  pidArr10.push(record._fields[0].properties.pid)
                  pTypeArr10.push(record._fields[0].properties.p_type)
    
                  dataNameArr10.push(record._fields[1].properties.name)
                  valueArr10.push(record._fields[1].properties.value)
                  file_pathArr10.push(record._fields[1].properties.file_path)
                  originArr10.push(record._fields[1].properties.origin)

    
                  activityTypeArr10.push(record._fields[2].properties.name)
                  dateArr10.push(record._fields[2].properties.date)
                  detailArr10.push(record._fields[2].properties.detail)

                  APFromArr10.push(record._fields[3].properties.allowed_period_from)
                  APToArr10.push(record._fields[3].properties.allowed_period_to)
                  priceArr10.push(record._fields[3].properties.price)
                  isAgreeArr10.push(record._fields[3].properties.is_agreed)

                  nameArr11.push(record._fields[4].properties.name)
                  pidArr11.push(record._fields[4].properties.pid)
                  pTypeArr11.push(record._fields[4].properties.p_type)

                  dataNamesTotal.push(record._fields[1].properties.name)
                  dataValuesTotal.push(record._fields[1].properties.value)
                  dataFilesTotal.push(record._fields[1].properties.file_path)
                  dataOriginTotal.push(record._fields[1].properties.origin)
                  session.close()
                })

                console.log(fileDownloadPath);
                res.render('viewPage.ejs', {
                    esession: session_value.getSession(),

                    names: nameArr,
                    pids: pidArr,
                    pTypes: pTypeArr,
                    //affiliations: affiliationArr,
                    //dataTypes3: dataTypeArr3,
                    dataNames3: dataNameArr3,
                    values3: valueArr3,
                    filePaths3: file_pathArr3,
                    origins3: originArr3,
                    //devices3: deviceArr3,
                    //prices3: priceArr3,
                    activityTypes3: activityTypeArr3,
                    dates3: dateArr3,
                    details3: detailArr3,
                    dataNames215: dataNameArr215,
                    values215: valueArr215,
                    filePaths215: file_pathArr215,
                    origins215: originArr215,
                    //names2 : nameArr2,
                    //pids2: pidArr2,
                    //pTypes2: pTypeArr2,
                    //affiliations2 : affiliationArr2,

                    s_names: s_nameArr,
                    s_pids: s_pidArr,
                    s_pTypes: s_pTypeArr,
                    //s_affiliations: s_affiliationArr,
                    dataNames4: dataNameArr4,
                    values4: valueArr4,
                    filePaths4: file_pathArr4,
                    origins4: originArr4,
                    activityTypes4: activityTypeArr4,
                    dates4: dateArr4,
                    details4: detailArr4,

                    names10 : nameArr10,
                    pids10: pidArr10,
                    pTypes10: pTypeArr10,
                    //affiliations10 : affiliationArr10,
                    dateNames10 : dataNameArr10,
                    //dateTypes10 : dataTypeArr10,
                    values10: valueArr10,
                    filePaths10: file_pathArr10,
                    origins10: originArr10,
                    activityTypes10 : activityTypeArr10,
                    dates10 : dateArr10,
                    details10: detailArr10,
                    APFroms10: APFromArr10,
                    APTos10: APToArr10,
                    prices10: priceArr10,
                    isAgrees10: isAgreeArr10,
                    names11 : nameArr11,
                    pids11: pidArr11,
                    pTypes11: pTypeArr11,

                    dataNamesTotal: dataNamesTotal,
                    dataValuesTotal: dataValuesTotal,
                    dataFilesTotal: dataFilesTotal,
                    dataOriginTotal: dataOriginTotal,

                    fileDownloadPath: fileDownloadPath,
                    
                    authenticated: true
                });
            });
          });
            
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    
    else if (user_gubun == '관리자') {
        console.log("관리자")
        session
          .run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '생성' RETURN p, d, ac ")
          .then(function (result) {
            result.records.forEach(function (record) {

              s_nameArr.push(record._fields[0].properties.name)
              s_affiliationArr.push(record._fields[0].properties.affiliation)

              dataNameArr4.push(record._fields[1].properties.name)
              dataTypeArr4.push(record._fields[1].properties.d_type)
              deviceArr4.push(record._fields[1].properties.device)
              priceArr4.push(record._fields[1].properties.price)
              //dataOwner.push(record._fields[1].properties.owner)
              //dataOwnerAff.push(record._fields[1].properties.owner_aff)

              activityTypeArr4.push(record._fields[2].properties.name)
              dateArr4.push(record._fields[2].properties.date)
            });

          session.run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) WHERE ac.name IN ['배포', '판매'] RETURN p1, d, ac, p2 ")
          .then(function (result) {
            result.records.forEach(function (record) {

              nameArr.push(record._fields[0].properties.name)
              affiliationArr.push(record._fields[0].properties.affiliation)

              dataNameArr3.push(record._fields[1].properties.name)
              dataTypeArr3.push(record._fields[1].properties.d_type)
              deviceArr3.push(record._fields[1].properties.device)
              priceArr3.push(record._fields[1].properties.price)
              //dataOwner.push(record._fields[1].properties.owner)
              //dataOwnerAff.push(record._fields[1].properties.owner_aff)

              activityTypeArr3.push(record._fields[2].properties.name)
              dateArr3.push(record._fields[2].properties.date)

              nameArr2.push(record._fields[3].properties.name)
              affiliationArr2.push(record._fields[3].properties.affiliation)
            });

              session.run("MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) WHERE ac.name IN ['가공', '변환'] RETURN p, d2, ac, d1 ")
              .then(function (result) {
                result.records.forEach(function (record) {
    
                  nameArr10.push(record._fields[0].properties.name)
                  affiliationArr10.push(record._fields[0].properties.affiliation)
    
                  dataNameArr10.push(record._fields[1].properties.name)
                  dataTypeArr10.push(record._fields[1].properties.d_type)
                  deviceArr10.push(record._fields[1].properties.device)
                  priceArr10.push(record._fields[1].properties.price)
                  //dataOwner.push(record._fields[1].properties.owner)
                  //dataOwnerAff.push(record._fields[1].properties.owner_aff)
    
                  activityTypeArr10.push(record._fields[2].properties.name)
                  dateArr10.push(record._fields[2].properties.date)
    
                  dataNameArr11.push(record._fields[3].properties.name)
                  dataTypeArr11.push(record._fields[3].properties.d_type)
                  deviceArr11.push(record._fields[3].properties.device)
                  priceArr11.push(record._fields[3].properties.price)
                  session.close()
                })

          res.render('viewPage', {
            esession: session_value.getSession(),
            authenticated: true
      });
    });
  });
  //session.close();
 })
 .catch(function (err) {
  console.log(err);
});
    }
    else {
        res.render('viewPage', {
            esession: session_value.getSession(),
            names: undefined,
            affiliations: undefined,
            dataTypes3: undefined,
            dataNames3: undefined,
            devices3: undefined,
            prices3: undefined,
            activityTypes3: undefined,
            dates3: undefined,

            s_names: undefined,
            s_affiliations: undefined,
            dataTypes4: undefined,
            dataNames4: undefined,
            devices4: undefined,
            prices4: undefined,
            activityTypes4: undefined,
            dates4: undefined,
            r_names: undefined,
            r_affiliations: undefined,

            names2 : undefined,
            affiliations2 : undefined,

            names10 : undefined,
            affiliations10 : undefined,
            
            activityTypes10 : undefined,
            dates10 : undefined,
            dateNames10 : undefined,
            dateTypes10 : undefined,
            prices10: undefined,
            devices10: undefined,

            dateNames11 : undefined,
            dateTypes11 : undefined,
            prices11: undefined,
            devices11: undefined,

            authenticated: false
        });
    }
});

router.post('/getViewValues', function (req, res) {

    var session = driver.session();

    var checkValue = req.body.viewCheck;

    console.log("view val: ", checkValue)
    /*
    console.log(dataNamesTotal[checkValue])
    console.log(dataValuesTotal[checkValue])
    console.log(dataFilesTotal[checkValue])
    console.log(dataOriginTotal[checkValue])
    */ 
    var dataName = dataNamesTotal[checkValue]
    var dataValue = dataValuesTotal[checkValue]
    var dataFile = dataFilesTotal[checkValue]
    var dataOrigin = dataOriginTotal[checkValue]

    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;
    var user_type;
    if(session_value.getSession().gubun == '사용자'){
        user_type = '개인'
    }

    //생성
    var nameArr = [];
    var pidArr = [];
    var p_typeArr = [];
    var activityTypeArr3 = [];
    var dateArr3 = [];
    var detailArr3 = [];
    var dataNameArr3 = [];
    var valueArr3 = [];
    var file_pathArr3 = [];
    var originArr3 = [];

    //제공
    var s_nameArr = [];
    var s_pidArr = [];
    var s_pTypeArr = [];
    var activityTypeArr4 = [];
    var dateArr4 = [];
    var detailArr4 = [];
    var dataNameArr4 = [];
    var valueArr4 = [];
    var file_pathArr4 = [];
    var originArr4 = [];
    var APFromArr4 = [];
    var APToArr4 = [];
    var priceArr4 = [];
    var isAgreeArr4 = [];
    var r_nameArr = [];
    var r_pidArr = [];
    var r_pTypeArr = [];

    //가공
    var nameArr5 = [];
    var pidArr5 = [];
    var p_typeArr5 = [];
    var activityTypeArr5 = [];
    var dateArr5 = [];
    var detailArr5 = [];
    var dataNameArr5 = [];
    var valueArr5 = [];
    var file_pathArr5 = [];
    var originArr5 = [];
    var dataNameArr6 = [];
    var valueArr6 = [];
    var file_pathArr6 = [];
    var originArr6 = [];

    var query4resultNum;
    var query3resultNum;
    var query5resultNum;


    var geneCypher = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '생성' "
                    + "AND (p.name = '" + user_name + "' AND p.pid = '" + user_pid + "' AND p.p_type = '" + user_type + "') "
                    + "AND ( d.name = '" + dataName + "' AND d.value = '" + dataValue + "' AND d.file_path = '" + dataFile + "' AND d.origin = '" + dataOrigin + "') "
                    + "RETURN p, d, ac  "

    var manuCypher = "MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '가공' " 
                    + "AND (p.name = '" + user_name + "' AND p.pid = '" + user_pid + "' AND p.p_type = '" + user_type + "') "
                    + "AND (d1.name = '" + dataName + "' AND d1.value = '" + dataValue + "' AND d1.file_path = '" + dataFile + "' AND d1.origin = '" + dataOrigin + "') "
                    + "OR  (d2.name = '" + dataName + "' AND d2.value = '" + dataValue + "' AND d2.file_path = '" + dataFile + "' AND d2.origin = '" + dataOrigin + "') "
                    + "RETURN p, d2, ac, d1 "

    var offCypher = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) WHERE ac.name = '제공' "
                    + "AND (p1.name = '" + user_name + "' AND p1.pid = '" + user_pid + "' AND p1.p_type = '" + user_type + "') "
                    + "AND ( d.name = '" + dataName + "' AND d.value = '" + dataValue + "' AND d.file_path = '" + dataFile + "' AND d.origin = '" + dataOrigin + "') "
                    + "RETURN p1, d, ac, r, p2 "

    //console.log(geneCypher)
    //console.log(manuCypher)
    //console.log(offCypher)

    session.run(manuCypher)
    .then(function (result) {
        query5resultNum = result.records.length;
        if (query5resultNum != 0) {
            result.records.forEach(function (record) {
                //console.log(record)
                nameArr5.push(record._fields[0].properties.name)
                pidArr5.push(record._fields[0].properties.pid)
                p_typeArr5.push(record._fields[0].properties.p_type)

                dataNameArr5.push(record._fields[1].properties.name)
                valueArr5.push(record._fields[1].properties.value)
                file_pathArr5.push(record._fields[1].properties.file_path)
                originArr5.push(record._fields[1].properties.origin)

                activityTypeArr5.push(record._fields[2].properties.name)
                dateArr5.push(record._fields[2].properties.date)
                detailArr5.push(record._fields[2].properties.detail)

                dataNameArr6.push(record._fields[3].properties.name)
                valueArr6.push(record._fields[3].properties.value)
                file_pathArr6.push(record._fields[3].properties.file_path)
                originArr6.push(record._fields[3].properties.origin)
            });
        }
        else {
            nameArr5.push(' ')
            pidArr5.push(' ')
            p_typeArr5.push(' ')

            dataNameArr5.push(' ')
            valueArr5.push(' ')
            file_pathArr5.push(' ')
            originArr5.push(' ')

            activityTypeArr5.push(' ')
            dateArr5.push(' ')
            detailArr5.push(' ')

            dataNameArr6.push(' ')
            valueArr6.push(' ')
            file_pathArr6.push(' ')
            originArr6.push(' ')
        }

        session.run(offCypher)
        .then(function (result) {
            query4resultNum = result.records.length;
            if (query4resultNum != 0) {
                result.records.forEach(function (record) {

                    s_nameArr.push(record._fields[0].properties.name)
                    s_pidArr.push(record._fields[0].properties.pid)
                    s_pTypeArr.push(record._fields[0].properties.p_type)

                    dataNameArr4.push(record._fields[1].properties.name)
                    valueArr4.push(record._fields[1].properties.value)
                    file_pathArr4.push(record._fields[1].properties.file_path)
                    originArr4.push(record._fields[1].properties.origin)

                    activityTypeArr4.push(record._fields[2].properties.name)
                    dateArr4.push(record._fields[2].properties.date)
                    detailArr4.push(record._fields[2].properties.detail)

                    APFromArr4.push(record._fields[3].properties.allowed_period_from)
                    APToArr4.push(record._fields[3].properties.allowed_period_to)
                    priceArr4.push(record._fields[3].properties.price)
                    isAgreeArr4.push(record._fields[3].properties.is_agreed)

                    r_nameArr.push(record._fields[4].properties.name)
                    r_pidArr.push(record._fields[4].properties.pid)
                    r_pTypeArr.push(record._fields[4].properties.p_type)
                });
            }   
            else {
                    s_nameArr.push(' ')
                    s_pidArr.push(' ')
                    s_pTypeArr.push(' ')

                    dataNameArr4.push(' ')
                    valueArr4.push(' ')
                    file_pathArr4.push(' ')
                    originArr4.push(' ')

                    activityTypeArr4.push(' ')
                    dateArr4.push(' ')

                    APFromArr4.push(' ')
                    APToArr4.push(' ')
                    priceArr4.push(' ')
                    isAgreeArr4.push(' ')

                    r_nameArr.push(' ')
                    r_pidArr.push(' ')
                    r_pTypeArr.push(' ')
                }

            session.run(geneCypher)
            .then(function (result) {
                query3resultNum = result.records.length;
                if (query3resultNum != 0) {
                    result.records.forEach(function (record) {
                        //console.log(record)
                        nameArr.push(record._fields[0].properties.name)
                        pidArr.push(record._fields[0].properties.pid)
                        p_typeArr.push(record._fields[0].properties.p_type)

                        dataNameArr3.push(record._fields[1].properties.name)
                        valueArr3.push(record._fields[1].properties.value)
                        file_pathArr3.push(record._fields[1].properties.file_path)
                        originArr3.push(record._fields[1].properties.origin)

                        activityTypeArr3.push(record._fields[2].properties.name)
                        dateArr3.push(record._fields[2].properties.date)
                        detailArr3.push(record._fields[2].properties.detail)
                        session.close()
                    });
                }
                else {
                    nameArr.push(' ')
                    pidArr.push(' ')
                    p_type.push(' ')

                    dataNameArr3.push(' ')
                    valueArr3.push(' ')
                    file_pathArr3.push(' ')
                    originArr3.push(' ')

                    activityTypeArr3.push(' ')
                    dateArr3.push(' ')
                    session.close()
                }
                res.render('viewLink.ejs', {
                    esession: session_value.getSession(),

                    names: nameArr,
                    pids: pidArr,
                    p_types: p_typeArr,
                    dataNames3: dataNameArr3,
                    values3: valueArr3,
                    file_paths3: file_pathArr3,
                    origins3: originArr3,
                    activityTypes3: activityTypeArr3,
                    dates3: dateArr3,
                    details3: detailArr3,

                    s_names: s_nameArr,
                    s_pids: s_pidArr,
                    s_ptypes: s_pTypeArr,
                    dataNames4: dataNameArr4,
                    values4: valueArr4,
                    file_paths4: file_pathArr4,
                    origins4: originArr4,
                    APFroms4: APFromArr4,
                    APTos4: APToArr4,
                    prices4: priceArr4,
                    isAgrees: isAgreeArr4,
                    activityTypes4: activityTypeArr4,
                    dates4: dateArr4,
                    details4: detailArr4,
                    r_names: r_nameArr,
                    r_pids: r_pidArr,
                    r_pTypes: r_pTypeArr,

                    names5 : nameArr5,
                    pids5: pidArr5,
                    p_types5: p_typeArr5,
                    dataNames5: dataNameArr5,
                    values5: valueArr5,
                    file_paths5: file_pathArr5,
                    origins5: originArr5,
                    activityTypes5: activityTypeArr5,
                    dates5: dateArr5,
                    details5: detailArr5,
                    dataNames6: dataNameArr6,
                    values6: valueArr6,
                    file_paths6: file_pathArr6,
                    origins6: originArr6,

                    authenticated: true
                });
            
            });
            //session.close();
        });
        
    })
    .catch(function (err) {
        console.log(err);
    });

});


router.post('/DataSearch', function (req, res) {

    var session = driver.session();

    var dataName = req.body.dataName;
    var origin = req.body.origin;

    var dataNameFlag = true;
    var originFlag = true;

    //생성
    var nameArr = [];
    var pidArr = [];
    var p_typeArr = [];
    var activityTypeArr3 = [];
    var dateArr3 = [];
    var detailArr3 = [];
    var dataNameArr3 = [];
    var valueArr3 = [];
    var file_pathArr3 = [];
    var originArr3 = [];

    //제공
    var s_nameArr = [];
    var s_pidArr = [];
    var s_pTypeArr = [];
    var activityTypeArr4 = [];
    var dateArr4 = [];
    var detailArr4 = [];
    var dataNameArr4 = [];
    var valueArr4 = [];
    var file_pathArr4 = [];
    var originArr4 = [];
    var APFromArr4 = [];
    var APToArr4 = [];
    var priceArr4 = [];
    var isAgreeArr4 = [];
    var r_nameArr = [];
    var r_pidArr = [];
    var r_pTypeArr = [];

    //가공
    var nameArr5 = [];
    var pidArr5 = [];
    var p_typeArr5 = [];
    var activityTypeArr5 = [];
    var dateArr5 = [];
    var detailArr5 = [];
    var dataNameArr5 = [];
    var valueArr5 = [];
    var file_pathArr5 = [];
    var originArr5 = [];
    var dataNameArr6 = [];
    var valueArr6 = [];
    var file_pathArr6 = [];
    var originArr6 = [];

    var query4resultNum;
    var query3resultNum;
    var query5resultNum;

    console.log("dataName: " + dataName);
    console.log("origin: " + origin);

    var nullcount = 0;
    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;

    var dataNameCyper3 = " d.name = ";
    var originCyper3 = " d.origin = ";
    var dataNameCyper4 = " d1.name = ";
    var originCyper4 = " d1.origin = ";
    var dataNameCyper5 = " d2.name = ";
    var originCyper5 = " d2.origin = ";

    if (dataName == '' || dataName == undefined) {
        dataNameFlag = false;
        nullcount++;
    }
    if (origin == '') {
        originFlag = false;
        nullcount++;
    }

    if(dataName == false && origin == false ) {
        res.send('<script type="text/javascript">alert("검색어를 입력해주세요."); window.history.go(-1);</script>');
    }
    
    var matchCyper5;
    var matchCyper4;
    var matchCyper3;

    var returnCyper5 = ") RETURN p, d2, ac, d1 "
    var returnCyper4 = ") RETURN p1, d, ac, r, p2 "
    var returnCyper3 = ") RETURN p, d, ac "
    var whereCyper5 = " WHERE ac.name = '가공' AND ("
    var whereCyper4 = " WHERE ac.name = '제공' AND ("
    var whereCyper3 = " WHERE ac.name = '생성' AND ("
    var newQuery5;
    var newQuery4;
    var newQuery3;

    if (user_gubun == '관리자') {
        matchCyper5 = "MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person)"
        matchCyper4 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person)"
        matchCyper3 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + whereCyper5;
        newQuery4 = matchCyper4 + whereCyper4;
        newQuery3 = matchCyper3 + whereCyper3;
    }
    else {
        matchCyper5 = "MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person)"
        matchCyper4 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person)"
        matchCyper3 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + whereCyper5 + "p.name = '" + user_name + "' AND p.pid = '" + user_pid +"') AND (";
        newQuery4 = matchCyper4 + whereCyper4 + "p1.name = '" + user_name + "' AND p1.pid = '" + user_pid +"' OR p2.name = '" + user_name + "' AND p2.pid = '" + user_pid +"') AND (";
        newQuery3 = matchCyper3 + whereCyper3 + "p.name = '" + user_name + "' AND p.pid = '" + user_pid +"') AND (";
    }

    for (var i = 0; i < (2 - nullcount); i++) {
        if (dataNameFlag) {
            newQuery5 = newQuery5 + dataNameCyper5 + "'" + dataName + "' OR " + dataNameCyper4 + "'" + dataName + "'";
            newQuery4 = newQuery4 + dataNameCyper3 + "'" + dataName + "'";
            newQuery3 = newQuery3 + dataNameCyper3 + "'" + dataName + "'";
            dataNameFlag = false;
        }

        else if (originFlag) {
            newQuery5 = newQuery5 + originCyper5 + "'" + origin + "' OR " + originCyper4 + "'" + origin + "'";
            newQuery4 = newQuery4 + originCyper3 + "'" + origin + "'";
            newQuery3 = newQuery3 + originCyper3 + "'" + origin + "'";
            originFlag = false;
        }

        if ((i + 1) != (2 - nullcount)) {
            newQuery5 = newQuery5 + " AND";
            newQuery4 = newQuery4 + " AND";
            newQuery3 = newQuery3 + " AND";
        }
    }
    newQuery5 = newQuery5 + returnCyper5;
    newQuery4 = newQuery4 + returnCyper4;
    newQuery3 = newQuery3 + returnCyper3;
    console.log(newQuery3)
    console.log(newQuery4)
    console.log(newQuery5)

    session.run(newQuery5)
        .then(function (result) {
            query5resultNum = result.records.length;
            if (query5resultNum != 0) {
                result.records.forEach(function (record) {
                    //console.log(record)
                    nameArr5.push(record._fields[0].properties.name)
                    pidArr5.push(record._fields[0].properties.pid)
                    p_typeArr5.push(record._fields[0].properties.p_type)

                    dataNameArr5.push(record._fields[1].properties.name)
                    valueArr5.push(record._fields[1].properties.value)
                    file_pathArr5.push(record._fields[1].properties.file_path)
                    originArr5.push(record._fields[1].properties.origin)

                    activityTypeArr5.push(record._fields[2].properties.name)
                    dateArr5.push(record._fields[2].properties.date)
                    detailArr5.push(record._fields[2].properties.detail)

                    dataNameArr6.push(record._fields[3].properties.name)
                    valueArr6.push(record._fields[3].properties.value)
                    file_pathArr6.push(record._fields[3].properties.file_path)
                    originArr6.push(record._fields[3].properties.origin)
                });
            }
            else {
                nameArr5.push(' ')
                pidArr5.push(' ')
                p_typeArr5.push(' ')

                dataNameArr5.push(' ')
                valueArr5.push(' ')
                file_pathArr5.push(' ')
                originArr5.push(' ')

                activityTypeArr5.push(' ')
                dateArr5.push(' ')
                detailArr5.push(' ')

                dataNameArr6.push(' ')
                valueArr6.push(' ')
                file_pathArr6.push(' ')
                originArr6.push(' ')
            }

        session.run(newQuery4)
            .then(function (result) {
                query4resultNum = result.records.length;
                if (query4resultNum != 0) {
                    result.records.forEach(function (record) {

                        s_nameArr.push(record._fields[0].properties.name)
                        s_pidArr.push(record._fields[0].properties.pid)
                        s_pTypeArr.push(record._fields[0].properties.p_type)

                        dataNameArr4.push(record._fields[1].properties.name)
                        valueArr4.push(record._fields[1].properties.value)
                        file_pathArr4.push(record._fields[1].properties.file_path)
                        originArr4.push(record._fields[1].properties.origin)

                        activityTypeArr4.push(record._fields[2].properties.name)
                        dateArr4.push(record._fields[2].properties.date)
                        detailArr4.push(record._fields[2].properties.detail)

                        APFromArr4.push(record._fields[3].properties.allowed_period_from)
                        APToArr4.push(record._fields[3].properties.allowed_period_to)
                        priceArr4.push(record._fields[3].properties.price)
                        isAgreeArr4.push(record._fields[3].properties.is_agreed)

                        r_nameArr.push(record._fields[4].properties.name)
                        r_pidArr.push(record._fields[4].properties.pid)
                        r_pTypeArr.push(record._fields[4].properties.p_type)
                    });
                }   
                else {
                        s_nameArr.push(' ')
                        s_pidArr.push(' ')
                        s_pTypeArr.push(' ')

                        dataNameArr4.push(' ')
                        valueArr4.push(' ')
                        file_pathArr4.push(' ')
                        originArr4.push(' ')

                        activityTypeArr4.push(' ')
                        dateArr4.push(' ')

                        APFromArr4.push(' ')
                        APToArr4.push(' ')
                        priceArr4.push(' ')
                        isAgreeArr4.push(' ')

                        r_nameArr.push(' ')
                        r_pidArr.push(' ')
                        r_pTypeArr.push(' ')
                    }

            session.run(newQuery3)
                .then(function (result) {
                    query3resultNum = result.records.length;
                    if (query3resultNum != 0) {
                        result.records.forEach(function (record) {
                            //console.log(record)
                            nameArr.push(record._fields[0].properties.name)
                            pidArr.push(record._fields[0].properties.pid)
                            p_typeArr.push(record._fields[0].properties.p_type)

                            dataNameArr3.push(record._fields[1].properties.name)
                            valueArr3.push(record._fields[1].properties.value)
                            file_pathArr3.push(record._fields[1].properties.file_path)
                            originArr3.push(record._fields[1].properties.origin)

                            activityTypeArr3.push(record._fields[2].properties.name)
                            dateArr3.push(record._fields[2].properties.date)
                            detailArr3.push(record._fields[2].properties.detail)
                            session.close()
                        });
                    }
                    else {
                        nameArr.push(' ')
                        pidArr.push(' ')
                        p_typeArr.push(' ')

                        dataNameArr3.push(' ')
                        valueArr3.push(' ')
                        file_pathArr3.push(' ')
                        originArr3.push(' ')

                        activityTypeArr3.push(' ')
                        dateArr3.push(' ')
                        session.close()
                    }


                        res.render('search/searchDataResult.ejs', {
                            esession: session_value.getSession(),

                            names: nameArr,
                            pids: pidArr,
                            p_types: p_typeArr,
                            dataNames3: dataNameArr3,
                            values3: valueArr3,
                            file_paths3: file_pathArr3,
                            origins3: originArr3,
                            activityTypes3: activityTypeArr3,
                            dates3: dateArr3,
                            details3: detailArr3,

                            s_names: s_nameArr,
                            s_pids: s_pidArr,
                            s_ptypes: s_pTypeArr,
                            dataNames4: dataNameArr4,
                            values4: valueArr4,
                            file_paths4: file_pathArr4,
                            origins4: originArr4,
                            APFroms4: APFromArr4,
                            APTos4: APToArr4,
                            prices4: priceArr4,
                            isAgrees: isAgreeArr4,
                            activityTypes4: activityTypeArr4,
                            dates4: dateArr4,
                            details4: detailArr4,
                            r_names: r_nameArr,
                            r_pids: r_pidArr,
                            r_pTypes: r_pTypeArr,

                            names5 : nameArr5,
                            pids5: pidArr5,
                            p_types5: p_typeArr5,
                            dataNames5: dataNameArr5,
                            values5: valueArr5,
                            file_paths5: file_pathArr5,
                            origins5: originArr5,
                            activityTypes5: activityTypeArr5,
                            dates5: dateArr5,
                            details5: detailArr5,
                            dataNames6: dataNameArr6,
                            values6: valueArr6,
                            file_paths6: file_pathArr6,
                            origins6: originArr6,

                            authenticated: true
                        });
                    });
                });
                //session.close();
            })
        .catch(function (err) {
            console.log(err);
        });
});

router.post('/nameSearch', function (req, res) {

    var session = driver.session();

    var name = req.body.name;
    var nameFlag = true;

    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;

    //생성
    var nameArr = [];
    var pidArr = [];
    var p_typeArr = [];
    var activityTypeArr3 = [];
    var dateArr3 = [];
    var detailArr3 = [];
    var dataNameArr3 = [];
    var valueArr3 = [];
    var file_pathArr3 = [];
    var originArr3 = [];


    //제공
    var s_nameArr = [];
    var s_pidArr = [];
    var s_pTypeArr = [];
    var activityTypeArr4 = [];
    var dateArr4 = [];
    var detailArr4 = [];
    var dataNameArr4 = [];
    var valueArr4 = [];
    var file_pathArr4 = [];
    var originArr4 = [];
    var APFromArr4 = [];
    var APToArr4 = [];
    var priceArr4 = [];
    var isAgreeArr4 = [];
    var r_nameArr = [];
    var r_pidArr = [];
    var r_pTypeArr = [];

    var query4resultNum;
    var query3resultNum; 
    console.log("name: " + name);

    var geneCypher = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '생성' "
                    + "AND (p.name = '" + user_name + "' AND p.pid = '" + user_pid + "') AND ( d.origin = '" + name + "') "
                    + "RETURN p, d, ac  "
    var matchCyper4;

    var returnCyper4 = ") RETURN p1, d, ac, r, p2 "

    var whereCyper4 = " WHERE ac.name = '제공' AND ("
    var newQuery4;

    matchCyper4 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person)"
    newQuery4 = matchCyper4 + whereCyper4 + "p1.name = '" + user_name + "' AND p1.pid = '" + user_pid +"') AND (p2.name = '" + name + "'";

    if (name == '' || name == undefined) {
        console.log("name null");
        nameFlag = false;
    }
    if(nameFlag == false) {
        res.send('<script type="text/javascript">alert("검색어를 입력해주세요."); window.history.go(-1);</script>');
    }

    if(nameFlag == true){
        newQuery4 = newQuery4 + returnCyper4;
    }



    console.log(newQuery4)
    console.log("********************************************")
    console.log(geneCypher)

    session.run(newQuery4)
    .then(function (result) {
        query4resultNum = result.records.length;
        //console.log("query5: ", query5resultNum)
        if (query4resultNum != 0) {
            result.records.forEach(function (record) {

                s_nameArr.push(record._fields[0].properties.name)
                s_pidArr.push(record._fields[0].properties.pid)
                s_pTypeArr.push(record._fields[0].properties.p_type)

                dataNameArr4.push(record._fields[1].properties.name)
                valueArr4.push(record._fields[1].properties.value)
                file_pathArr4.push(record._fields[1].properties.file_path)
                originArr4.push(record._fields[1].properties.origin)

                activityTypeArr4.push(record._fields[2].properties.name)
                dateArr4.push(record._fields[2].properties.date)
                detailArr4.push(record._fields[2].properties.detail)

                APFromArr4.push(record._fields[3].properties.allowed_period_from)
                APToArr4.push(record._fields[3].properties.allowed_period_to)
                priceArr4.push(record._fields[3].properties.price)
                isAgreeArr4.push(record._fields[3].properties.is_agreed)

                r_nameArr.push(record._fields[4].properties.name)
                r_pidArr.push(record._fields[4].properties.pid)
                r_pTypeArr.push(record._fields[4].properties.p_type)
            });
        }
        else {
            s_nameArr.push(' ')
            s_pidArr.push(' ')
            s_pTypeArr.push(' ')

            dataNameArr4.push(' ')
            valueArr4.push(' ')
            file_pathArr4.push(' ')
            originArr4.push(' ')

            activityTypeArr4.push(' ')
            dateArr4.push(' ')
            detailArr4.push(' ')

            APFromArr4.push(' ')
            APToArr4.push(' ')
            priceArr4.push(' ')
            isAgreeArr4.push(' ')

            r_nameArr.push(' ')
            r_pidArr.push(' ')
            r_pTypeArr.push(' ')
        }
        session.run(geneCypher)
        .then(function (result) {
            query3resultNum = result.records.length;
            if (query3resultNum != 0) {
                result.records.forEach(function (record) {
                    //console.log(record)
                    nameArr.push(record._fields[0].properties.name)
                    pidArr.push(record._fields[0].properties.pid)
                    p_typeArr.push(record._fields[0].properties.p_type)

                    dataNameArr3.push(record._fields[1].properties.name)
                    valueArr3.push(record._fields[1].properties.value)
                    file_pathArr3.push(record._fields[1].properties.file_path)
                    originArr3.push(record._fields[1].properties.origin)

                    activityTypeArr3.push(record._fields[2].properties.name)
                    dateArr3.push(record._fields[2].properties.date)
                    detailArr3.push(record._fields[2].properties.detail)
                    session.close()
                });
            }
            else {
                nameArr.push(' ')
                pidArr.push(' ')
                p_typeArr.push(' ')

                dataNameArr3.push(' ')
                valueArr3.push(' ')
                file_pathArr3.push(' ')
                originArr3.push(' ')

                activityTypeArr3.push(' ')
                dateArr3.push(' ')
                session.close()
            }


            res.render('search/searchNameResult.ejs', {
                esession: session_value.getSession(),

                names: nameArr,
                pids: pidArr,
                p_types: p_typeArr,
                dataNames3: dataNameArr3,
                values3: valueArr3,
                file_paths3: file_pathArr3,
                origins3: originArr3,
                activityTypes3: activityTypeArr3,
                dates3: dateArr3,
                details3: detailArr3,

                s_names: s_nameArr,
                s_pids: s_pidArr,
                s_ptypes: s_pTypeArr,
                dataNames4: dataNameArr4,
                values4: valueArr4,
                file_paths4: file_pathArr4,
                origins4: originArr4,
                APFroms4: APFromArr4,
                APTos4: APToArr4,
                prices4: priceArr4,
                isAgrees: isAgreeArr4,
                activityTypes4: activityTypeArr4,
                dates4: dateArr4,
                details4: detailArr4,
                r_names: r_nameArr,
                r_pids: r_pidArr,
                r_pTypes: r_pTypeArr,


                authenticated: true
            });
        });
        //session.close();
    })
    .catch(function (err) {
        console.log(err);
    });

});

router.post('/periodSearch', function (req, res) {

    var session = driver.session();

    var end_date = req.body.start_date;
    var start_date = req.body.end_date;
    var activityType = req.body.activityType;

    //생성
    var nameArr = [];
    var pidArr = [];
    var p_typeArr = [];
    var activityTypeArr3 = [];
    var dateArr3 = [];
    var detailArr3 = [];
    var dataNameArr3 = [];
    var valueArr3 = [];
    var file_pathArr3 = [];
    var originArr3 = [];

    //제공
    var s_nameArr = [];
    var s_pidArr = [];
    var s_pTypeArr = [];
    var activityTypeArr4 = [];
    var dateArr4 = [];
    var detailArr4 = [];
    var dataNameArr4 = [];
    var valueArr4 = [];
    var file_pathArr4 = [];
    var originArr4 = [];
    var APFromArr4 = [];
    var APToArr4 = [];
    var priceArr4 = [];
    var isAgreeArr4 = [];
    var r_nameArr = [];
    var r_pidArr = [];
    var r_pTypeArr = [];

    //가공
    var nameArr5 = [];
    var pidArr5 = [];
    var p_typeArr5 = [];
    var activityTypeArr5 = [];
    var dateArr5 = [];
    var detailArr5 = [];
    var dataNameArr5 = [];
    var valueArr5 = [];
    var file_pathArr5 = [];
    var originArr5 = [];
    var dataNameArr6 = [];
    var valueArr6 = [];
    var file_pathArr6 = [];
    var originArr6 = [];

    var end_dateFlag = true;
    var start_dateFlag = true;
    var activityTypeFlag = true;

    var query4resultNum;
    var query3resultNum;
    var query5resultNum;

    console.log("starDate:  " + start_date);
    console.log("end: " + end_date);

    var nullcount = 0;

    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;

    var matchCyper5;
    var matchCyper4;
    var matchCyper3;

    var returnCyper5 = "RETURN p, d2, ac, d1 "
    var returnCyper4 = "RETURN p1, d, ac, r, p2"
    var returnCyper3 = "RETURN p, d, ac "

    var newQuery5;
    var newQuery4;
    var newQuery3;

    matchCyper5 = "MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person)"
    matchCyper4 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person)"
    if (user_gubun == '관리자') {
        matchCyper3 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + " WHERE "
        newQuery4 = matchCyper4 + " WHERE "
        newQuery3 = matchCyper3 + " WHERE "
    }
    else {
        matchCyper3 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person{name: '" + user_name + "', pid: '" + user_pid + "' })"
        newQuery5 = matchCyper5 + " WHERE (p.name = '" + user_name + "' AND p.pid = '" + user_pid + "') AND";
        newQuery4 = matchCyper4 + " WHERE (p1.name = '" + user_name + "' AND p1.pid = '" + user_pid + "') AND";;
        newQuery3 = matchCyper3 + " WHERE (p.name = '" + user_name + "' AND p.pid = '" + user_pid + "') AND";
    }
    var startDateCyper = " (ac.date >= ";
    var endDateCyper = " ac.date < ";

    if (end_date == '' || end_date == undefined) {
        end_dateFlag = false;

    }
    if (start_date == '' || start_date == undefined) {
        start_dateFlag = false;

    }
    if (start_dateFlag == false || end_dateFlag == false) {
        nullcount++;
    }
    if (activityType == '' || activityType == undefined) {
        activityTypeFlag = false;
        nullcount++;
    }
    if(nullcount == 2) {
        res.send('<script type="text/javascript">alert("검색어를 입력해주세요."); window.history.go(-1);</script>');
    }
    var query3 = false;
    var query4 = false;
    var query5 = false;
    if (nullcount == 0) {
        if (activityType == '생성') {
            newQuery3 = newQuery3 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') AND (ac.name = " + "'" + activityType + "') "
            query3 = true;
        }
        else if (activityType == '제공'){
            newQuery4 = newQuery4 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') AND (ac.name = " + "'" + activityType + "') "
            query4 = true;
        } 
        else {
            newQuery5 = newQuery5 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') AND (ac.name = " + "'" + activityType + "') "
            query5 = true;
        }

    }
    
    else {
        if (end_dateFlag && start_dateFlag && !activityTypeFlag) {
            newQuery5 = newQuery5 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') and ac.name = '가공' " ;
            newQuery4 = newQuery4 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') and ac.name = '제공' ";
            newQuery3 = newQuery3 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') and ac.name = '생성' ";

            end_dateFlag = false;
            start_dateFlag = false;
            query3 = true;
            query4 = true;
            query5 = true;
        }
        else if (activityTypeFlag && !end_dateFlag && !start_dateFlag) {
            activityTypeFlag = false;
            if (activityType == '생성') {
                newQuery3 = newQuery3 + " (ac.name = '생성') "
                query3 = true;
            }
            else if (activityType == '제공'){
                newQuery4 = newQuery4 + " (ac.name = '제공') "
                query4 = true;
            }
            else {
                newQuery5 = newQuery5 + " (ac.name = '가공') "
                query5 = true;
            }
        }
        
    }
    newQuery5 = newQuery5 + returnCyper5;
    newQuery4 = newQuery4 + returnCyper4;
    newQuery3 = newQuery3 + returnCyper3;

    console.log(newQuery3, query3)
    console.log(newQuery4, query4)
    console.log(newQuery5, query5)

    if(query5 && query4 && query3){
    session.run(newQuery5)
        .then(function (result) {
            query5resultNum = result.records.length;
            if (query5resultNum != 0) {
                result.records.forEach(function (record) {
                    //console.log(record)
                    nameArr5.push(record._fields[0].properties.name)
                    pidArr5.push(record._fields[0].properties.pid)
                    p_typeArr5.push(record._fields[0].properties.p_type)

                    dataNameArr5.push(record._fields[1].properties.name)
                    valueArr5.push(record._fields[1].properties.value)
                    file_pathArr5.push(record._fields[1].properties.file_path)
                    originArr5.push(record._fields[1].properties.origin)

                    activityTypeArr5.push(record._fields[2].properties.name)
                    dateArr5.push(record._fields[2].properties.date)
                    detailArr5.push(record._fields[2].properties.detail)

                    dataNameArr6.push(record._fields[3].properties.name)
                    valueArr6.push(record._fields[3].properties.value)
                    file_pathArr6.push(record._fields[3].properties.file_path)
                    originArr6.push(record._fields[3].properties.origin)
                });
            }
            else {
                nameArr5.push(' ')
                pidArr5.push(' ')
                p_typeArr5.push(' ')

                dataNameArr5.push(' ')
                valueArr5.push(' ')
                file_pathArr5.push(' ')
                originArr5.push(' ')

                activityTypeArr5.push(' ')
                dateArr5.push(' ')
                detailArr5.push(' ')

                dataNameArr6.push(' ')
                valueArr6.push(' ')
                file_pathArr6.push(' ')
                originArr6.push(' ')
            }
        
        session.run(newQuery4)
            .then(function (result) {
                query4resultNum = result.records.length;
                if (query4resultNum != 0) {
                    result.records.forEach(function (record) {

                        s_nameArr.push(record._fields[0].properties.name)
                        s_pidArr.push(record._fields[0].properties.pid)
                        s_pTypeArr.push(record._fields[0].properties.p_type)

                        dataNameArr4.push(record._fields[1].properties.name)
                        valueArr4.push(record._fields[1].properties.value)
                        file_pathArr4.push(record._fields[1].properties.file_path)
                        originArr4.push(record._fields[1].properties.origin)

                        activityTypeArr4.push(record._fields[2].properties.name)
                        dateArr4.push(record._fields[2].properties.date)
                        detailArr4.push(record._fields[2].properties.detail)

                        APFromArr4.push(record._fields[3].properties.allowed_period_from)
                        APToArr4.push(record._fields[3].properties.allowed_period_to)
                        priceArr4.push(record._fields[3].properties.price)
                        isAgreeArr4.push(record._fields[3].properties.is_agreed)

                        r_nameArr.push(record._fields[4].properties.name)
                        r_pidArr.push(record._fields[4].properties.pid)
                        r_pTypeArr.push(record._fields[4].properties.p_type)
                    });
                }   
                else {
                        s_nameArr.push(' ')
                        s_pidArr.push(' ')
                        s_pTypeArr.push(' ')

                        dataNameArr4.push(' ')
                        valueArr4.push(' ')
                        file_pathArr4.push(' ')
                        originArr4.push(' ')

                        activityTypeArr4.push(' ')
                        dateArr4.push(' ')
                        detailArr4.push(' ')

                        APFromArr4.push(' ')
                        APToArr4.push(' ')
                        priceArr4.push(' ')
                        isAgreeArr4.push(' ')

                        r_nameArr.push(' ')
                        r_pidArr.push(' ')
                        r_pTypeArr.push(' ')
                    }

            session.run(newQuery3)
                .then(function (result) {
                    query3resultNum = result.records.length;
                    if (query3resultNum != 0) {
                        result.records.forEach(function (record) {
                            
                            nameArr.push(record._fields[0].properties.name)
                            pidArr.push(record._fields[0].properties.pid)
                            p_typeArr.push(record._fields[0].properties.p_type)

                            dataNameArr3.push(record._fields[1].properties.name)
                            valueArr3.push(record._fields[1].properties.value)
                            file_pathArr3.push(record._fields[1].properties.file_path)
                            originArr3.push(record._fields[1].properties.origin)

                            activityTypeArr3.push(record._fields[2].properties.name)
                            dateArr3.push(record._fields[2].properties.date)
                            detailArr3.push(' ')
                            session.close()
                        });
                    }
                    else {
                        nameArr.push(' ')
                        pidArr.push(' ')
                        p_typeArr.push(' ')

                        dataNameArr3.push(' ')
                        valueArr3.push(' ')
                        file_pathArr3.push(' ')
                        originArr3.push(' ')

                        activityTypeArr3.push(' ')
                        dateArr3.push(' ')
                        detailArr3.push(' ')
                        session.close()
                    }
                    console.log("t/f:", query3, query4, query5)
                    console.log(detailArr3)
                    console.log(nameArr)
                    console.log(dataNameArr4)
                    console.log(p_typeArr5)
                    res.render('search/searchPeriodResult.ejs', {
                        esession: session_value.getSession(),
                        query3: query3,
                        query4: query4,
                        query5: query5, 
                
                        names: nameArr,
                        pids: pidArr,
                        p_types: p_typeArr,
                        dataNames3: dataNameArr3,
                        values3: valueArr3,
                        file_paths3: file_pathArr3,
                        origins3: originArr3,
                        activityTypes3: activityTypeArr3,
                        dates3: dateArr3,
                        details3: detailArr3,
                
                        s_names: s_nameArr,
                        s_pids: s_pidArr,
                        s_ptypes: s_pTypeArr,
                        dataNames4: dataNameArr4,
                        values4: valueArr4,
                        file_paths4: file_pathArr4,
                        origins4: originArr4,
                        APFroms4: APFromArr4,
                        APTos4: APToArr4,
                        prices4: priceArr4,
                        isAgrees: isAgreeArr4,
                        activityTypes4: activityTypeArr4,
                        dates4: dateArr4,
                        details4: detailArr4,
                        r_names: r_nameArr,
                        r_pids: r_pidArr,
                        r_pTypes: r_pTypeArr,
                
                        names5 : nameArr5,
                        pids5: pidArr5,
                        p_types5: p_typeArr5,
                        dataNames5: dataNameArr5,
                        values5: valueArr5,
                        file_paths5: file_pathArr5,
                        origins5: originArr5,
                        activityTypes5: activityTypeArr5,
                        dates5: dateArr5,
                        details5: detailArr5,
                        dataNames6: dataNameArr6,
                        values6: valueArr6,
                        file_paths6: file_pathArr6,
                        origins6: originArr6,
                
                        authenticated: true
                    });
                    });
                    //session.close();
                });
                
            })
        .catch(function (err) {
            console.log(err);
        });
    }
    else{
        if(query3){
            console.log(query3)
            session.run(newQuery3)
                .then(function (result) {
                    query3resultNum = result.records.length;
                    if (query3resultNum != 0) {
                        result.records.forEach(function (record) {
                            //console.log(record)
                            nameArr.push(record._fields[0].properties.name)
                            pidArr.push(record._fields[0].properties.pid)
                            p_typeArr.push(record._fields[0].properties.p_type)

                            dataNameArr3.push(record._fields[1].properties.name)
                            valueArr3.push(record._fields[1].properties.value)
                            file_pathArr3.push(record._fields[1].properties.file_path)
                            originArr3.push(record._fields[1].properties.origin)

                            activityTypeArr3.push(record._fields[2].properties.name)
                            dateArr3.push(record._fields[2].properties.date)
                            detailArr3.push(record._fields[2].properties.detail)
                            session.close()
                        });
                    }
                    else {
                        nameArr.push(' ')
                        pidArr.push(' ')
                        p_typeArr.push(' ')

                        dataNameArr3.push(' ')
                        valueArr3.push(' ')
                        file_pathArr3.push(' ')
                        originArr3.push(' ')

                        activityTypeArr3.push(' ')
                        dateArr3.push(' ')
                        session.close()
                    }
                    res.render('search/searchPeriodResult.ejs', {
                        esession: session_value.getSession(),
                        query3: query3,
                        query4: query4,
                        query5: query5, 

                        names: nameArr,
                        pids: pidArr,
                        p_types: p_typeArr,
                        dataNames3: dataNameArr3,
                        values3: valueArr3,
                        file_paths3: file_pathArr3,
                        origins3: originArr3,
                        activityTypes3: activityTypeArr3,
                        dates3: dateArr3,
                        details3: detailArr3,
                        
                        authenticated: true
                    });
                    session.close();
                })

                .catch(function (err) {
                    console.log(err);
                });
        }
        else if(query4){
            console.log("query4")
            session.run(newQuery4)
            .then(function (result) {
                query4resultNum = result.records.length;
                if (query4resultNum != 0) {
                    result.records.forEach(function (record) {

                        s_nameArr.push(record._fields[0].properties.name)
                        s_pidArr.push(record._fields[0].properties.pid)
                        s_pTypeArr.push(record._fields[0].properties.p_type)

                        dataNameArr4.push(record._fields[1].properties.name)
                        valueArr4.push(record._fields[1].properties.value)
                        file_pathArr4.push(record._fields[1].properties.file_path)
                        originArr4.push(record._fields[1].properties.origin)

                        activityTypeArr4.push(record._fields[2].properties.name)
                        dateArr4.push(record._fields[2].properties.date)
                        detailArr4.push(record._fields[2].properties.detail)

                        APFromArr4.push(record._fields[3].properties.allowed_period_from)
                        APToArr4.push(record._fields[3].properties.allowed_period_to)
                        priceArr4.push(record._fields[3].properties.price)
                        isAgreeArr4.push(record._fields[3].properties.is_agreed)

                        r_nameArr.push(record._fields[4].properties.name)
                        r_pidArr.push(record._fields[4].properties.pid)
                        r_pTypeArr.push(record._fields[4].properties.p_type)
                        session.close()
                    });
                }   
                else {
                        s_nameArr.push(' ')
                        s_pidArr.push(' ')
                        s_pTypeArr.push(' ')

                        dataNameArr4.push(' ')
                        valueArr4.push(' ')
                        file_pathArr4.push(' ')
                        originArr4.push(' ')

                        activityTypeArr4.push(' ')
                        dateArr4.push(' ')

                        APFromArr4.push(' ')
                        APToArr4.push(' ')
                        priceArr4.push(' ')
                        isAgreeArr4.push(' ')

                        r_nameArr.push(' ')
                        r_pidArr.push(' ')
                        r_pTypeArr.push(' ')
                        session.close()
                }
                res.render('search/searchPeriodResult.ejs', {
                    esession: session_value.getSession(),
                    query3: query3,
                    query4: query4,
                    query5: query5, 
            
                    s_names: s_nameArr,
                    s_pids: s_pidArr,
                    s_ptypes: s_pTypeArr,
                    dataNames4: dataNameArr4,
                    values4: valueArr4,
                    file_paths4: file_pathArr4,
                    origins4: originArr4,
                    APFroms4: APFromArr4,
                    APTos4: APToArr4,
                    prices4: priceArr4,
                    isAgrees: isAgreeArr4,
                    activityTypes4: activityTypeArr4,
                    dates4: dateArr4,
                    details4: detailArr4,
                    r_names: r_nameArr,
                    r_pids: r_pidArr,
                    r_pTypes: r_pTypeArr,
            
                    authenticated: true
                });
                session.close();
            })

            .catch(function (err) {
                console.log(err);
            });
        }
        else{
            console.log("Qeury5")
            session.run(newQuery5)
            .then(function (result) {
                query5resultNum = result.records.length;
                if (query5resultNum != 0) {
                    result.records.forEach(function (record) {
                        //console.log(record)
                        nameArr5.push(record._fields[0].properties.name)
                        pidArr5.push(record._fields[0].properties.pid)
                        p_typeArr5.push(record._fields[0].properties.p_type)
    
                        dataNameArr5.push(record._fields[1].properties.name)
                        valueArr5.push(record._fields[1].properties.value)
                        file_pathArr5.push(record._fields[1].properties.file_path)
                        originArr5.push(record._fields[1].properties.origin)
    
                        activityTypeArr5.push(record._fields[2].properties.name)
                        dateArr5.push(record._fields[2].properties.date)
                        detailArr5.push(record._fields[2].properties.detail)
    
                        dataNameArr6.push(record._fields[3].properties.name)
                        valueArr6.push(record._fields[3].properties.value)
                        file_pathArr6.push(record._fields[3].properties.file_path)
                        originArr6.push(record._fields[3].properties.origin)
                        session.close()
                    });
                }
                else {
                    nameArr5.push(' ')
                    pidArr5.push(' ')
                    p_typeArr5.push(' ')
    
                    dataNameArr5.push(' ')
                    valueArr5.push(' ')
                    file_pathArr5.push(' ')
                    originArr5.push(' ')
    
                    activityTypeArr5.push(' ')
                    dateArr5.push(' ')
                    detailArr5.push(' ')
    
                    dataNameArr6.push(' ')
                    valueArr6.push(' ')
                    file_pathArr6.push(' ')
                    originArr6.push(' ')
                    session.close()
                }
                res.render('search/searchPeriodResult.ejs', {
                    esession: session_value.getSession(),
                    query3: query3,
                    query4: query4,
                    query5: query5, 
            
                    names5 : nameArr5,
                    pids5: pidArr5,
                    p_types5: p_typeArr5,
                    dataNames5: dataNameArr5,
                    values5: valueArr5,
                    file_paths5: file_pathArr5,
                    origins5: originArr5,
                    activityTypes5: activityTypeArr5,
                    dates5: dateArr5,
                    details5: detailArr5,
                    dataNames6: dataNameArr6,
                    values6: valueArr6,
                    file_paths6: file_pathArr6,
                    origins6: originArr6,
            
                    authenticated: true
                });
                //session.close();
            })
            .catch(function (err) {
                console.log(err);
            });
        }
        console.log("t/f:", query3, query4, query5)
        console.log(detailArr3)
        console.log(nameArr)
        console.log(dataNameArr4)
        console.log(p_typeArr5)

    }

    

});


/*
function getKeyword(keywords) {
    return new Promise(function (resolve, reject) {
        keyword = keywords.split(',');
        if (keyword.length == 1) {
            keyword = keyword[0].split(' ');
        }
        else {
            for (var k in keyword) {
                keyword[k] = keyword[k].trim()
            }
            console.log(keyword)
        }
        resolve(keyword);
    });
}
*/
function getCheckNode(keyword) {
    var nodeType;
    return new Promise(function (resolve, reject) {
        if (!isNaN(parseInt(keyword))) {
            ;
        }
        else {
            session.run('MATCH (a:Person{name:"' + keyword + '"}) RETURN count(a)>=1 as check')
                .then(function (result) {
                    if (result.records[0].get('check')) {
                        nodeType = "Person";
                        resolve('Person');
                    }
                    else {
                        session.run('MATCH (a:Activity{name:"' + keyword + '"}) RETURN count(a)>=1 as check')
                            .then(function (result) {
                                if (result.records[0].get('check')) {
                                    nodeType = "Activity";
                                    resolve('Activity')
                                }
                                else {
                                    session.run('MATCH (a:Data{name:"' + keyword + '"}) RETURN count(a)>=1 as check')
                                        .then(function (result) {
                                            if (result.records[0].get('check')) {
                                                nodeType = "Data";
                                                resolve('Data');
                                            }
                                            else
                                                resolve('NOT EXIST');
                                        });
                                }
                            });
                    }
                    resolve(result);
                    console.log(nodeType);
                   
                });
        }
    });
}

router.post('/keyword', function (req, res) {
    var user = [];
    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;

    user.push(user_name);
    user.push(user_pid);

    //console.log("ON",req.body.keyword.length);
    var keyStr = req.body.keyword;
    var len = keyStr.length;

    keyStr = user_name + " " + user_pid + " " + keyStr
    console.log(user_name + " " + user_pid + " " + keyStr);
    
    var wrote = 0;
    var process = spawn('python', [__dirname + '\\search\\search.py', keyStr]);
    

    var startTime = new Date().getTime();
    if(len == 0) {
        res.send('<script type="text/javascript">alert("검색어를 입력해주세요."); window.history.go(-1);</script>');
    }
    else{
        promiseFromChildProcess(process)
            .then(function (result) {
                console.log('promise complete: ', result);
                process.stdout.on('data', function (data) {
                    if (wrote == 0) {

                        kk = iconv.decode(data, 'EUC-KR').toString();

                        keyResult.setKeywordResult(kk);
                    }
                    wrote += 1;
                });
                var endTime = new Date().getTime();
                console.log("Execution time : ", (endTime - startTime));
                //console.timeEnd('calculatingTime');
                process.on('close', function (data) {
                    //console.log(kk)

                    //res.render("search/searchKeyword.ejs", {esession: session_value.getSession(), data:keyResult.getKeywordResult()});
                    res.redirect('search/searchKeyword');
                });
            }, function (err) {
                console.log('promise rejected: ', err);
        });
    }

});

// fsm post func
router.post('/fsm', function (req, res) {
    var keyStr = req.body.keyword;
    var tableLen = req.body.tableLen;
    var len = keyStr.length;

    var wrote = 0;
    var process = spawn('python', [__dirname + '\\data\\gSpan\\gspan_mining\\main.py', keyStr, tableLen]);
    console.log("처리", keyStr)
    var startTime = new Date().getTime();
    if(len == 0) {
        res.send('<script type="text/javascript">alert("검색어를 입력해주세요."); window.history.go(-1);</script>');
    }
    else{
        process.stdout.on('data', function (data) {
            if (wrote == 0) {
                console.log("-----fsm log start-----")
                kk = iconv.decode(data, 'EUC-KR').toString();
                fsmResult.setfsm_result(kk);
                console.log(kk);
                console.log("-----fsm log end-----");
                }
            wrote += 1;
        });
        var endTime = new Date().getTime();
        console.log("Execution time : ", (endTime - startTime));

        process.on('close', function (data) {
            res.redirect('data/analyzeFreq');
        });
        /*console.log("Path : ",[__dirname + '\\data\\gSpan\\gspan_mining\\main.py']);
        console.log("before process enter")
        promiseFromChildProcess(process)
        .then(function (result){ 
    console.log('promise complete: ', result);
        process.stdout.on('data', function (data) {
            if (wrote == 0) {
                console.log("-----fsm log start-----")
                kk = iconv.decode(data, 'EUC-KR').toString();
                fsmResult.setfsm_result(kk);
                console.log(kk);
                console.log("-----fsm log end-----");
                }
            wrote += 1;
        });
        
        var endTime = new Date().getTime();
        console.log("Execution time : ", (endTime - startTime));

        process.on('close', function (data) {
            res.redirect('data/analyzeFreq');
        });
    });
        /*console.log("Path : ",[__dirname + '\\data\\gSpan\\gspan_mining\\main.py']);
        console.log("before process enter")
        promiseFromChildProcess(process)
        .then(function (result){ 
    console.log('promise complete: ', result);
        process.stdout.on('data', function (data) {
            if (wrote == 0) {
                console.log("-----fsm log start-----")
                kk = iconv.decode(data, 'EUC-KR').toString();
                fsmResult.setfsm_result(kk);
                console.log(kk);
                console.log("-----fsm log end-----");
                }
            wrote += 1;
        });
        
        var endTime = new Date().getTime();
        console.log("Execution time : ", (endTime - startTime));

        process.on('close', function (data) {
            res.redirect('data/analyzeFreq');
        });
    });
        /*console.log("Path : ",[__dirname + '\\data\\gSpan\\gspan_mining\\main.py']);
        console.log("before process enter")
        promiseFromChildProcess(process)
            .then(function (result) {
                console.log('promise complete: ', result);
                process.stdout.on('data', function (data) {
                    if (wrote == 0) {
                        console.log("-----fsm log start-----")
                        kk = iconv.decode(data, 'EUC-KR').toString();
                        fsmResult.setfsm_result(kk);
                        console.log(kk);
                        console.log("-----fsm log end-----");
                    }
                    wrote += 1;
                });
                var endTime = new Date().getTime();
                console.log("Execution time : ", (endTime - startTime));

                process.on('close', function (data) {
                    res.redirect('data/analyzeFreqResult');
                });
            }, function (err) {
                console.log('promise rejected: ', err);
        });*/
    }

});

router.post('/getDeleteValues', function (req, res) {
    var checkValues5 = req.body.deleteCheck5;
    var checkValues4 = req.body.deleteCheck4;
    var checkValues3 = req.body.deleteCheck3;

    var namelst
    var activitylst3
    var dataNamelst3

    var s_namelst
    var r_namelst
    var activitylst4
    var dataNamelst4

    var namelst5
    var activitylst5
    var dataNamelst5
    var dataNamelst6

    // WHERE (a1.name IN ["김태연","임윤아"]) and (ac.name in ["판매", "판매"]) and (e.name in ["data_683", "data_964"])
    var delMatch3 = "MATCH prov = ((d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person)) "
    var delMatch4 = "MATCH prov = (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) "
    var delMatch5 = "MATCH prov = (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) "
    var delDetach = "DETACH DELETE prov"

    var query3;
    var query4;
    var query5;
    var delFlag3 = false;
    var delFlag4 = false;
    var delFlag5 = false;

    if (checkValues3 != undefined) {
        delFlag3 = true;
        namelst = "\"" + nameArr[checkValues3[0]] + "\""
        activitylst3 = "\"" + activityTypeArr3[checkValues3[0]] + "\""
        dataNamelst3 = "\"" + dataNameArr3[checkValues3[0]] + "\""
        for (var i = 1; i < checkValues3.length; i++) {

            console.log("name : ", nameArr[checkValues3[i]]);
            console.log("data : ", dataNameArr3[checkValues3[i]]);

            namelst = namelst + ", \"" + nameArr[checkValues3[i]] + "\""
            activitylst3 = activitylst3 + ", \"" + activityTypeArr3[checkValues3[i]] + "\""
            dataNamelst3 = dataNamelst3 + ", \"" + dataNameArr3[checkValues3[i]] + "\""

        }
        console.log("namelst", namelst)
        console.log("dataNamelst3", dataNamelst3)
        query3 = delMatch3 + "WHERE p.name in [" + namelst + "] AND ac.name in [" + activitylst3 + "] AND d.name in [" + dataNamelst3 + "] "
        query3 = query3 + delDetach
    }

    if (checkValues4 != undefined) {
        delFlag4 = true;
        s_namelst = "\"" + s_nameArr[checkValues4[0]] + "\""
        r_namelst = "\"" + r_nameArr[checkValues4[0]] + "\""
        activitylst4 = "\"" + activityTypeArr4[checkValues4[0]] + "\""
        dataNamelst4 = "\"" + dataNameArr4[checkValues4[0]] + "\""
        for (var i = 1; i < checkValues4.length; i++) {
            s_namelst = s_namelst + ", \"" + s_nameArr[checkValues4[i]] + "\""
            r_namelst = r_namelst + ", \"" + r_nameArr[checkValues4[i]] + "\""
            activitylst4 = activitylst4 + ", \"" + activityTypeArr4[checkValues4[i]] + "\""
            dataNamelst4 = dataNamelst4 + ", \"" + dataNameArr4[checkValues4[i]] + "\""
        }
        console.log("s_namelst", s_namelst)
        console.log("r_namelst", r_namelst)
        console.log("dataNamelst4", dataNamelst4)
        query4 = delMatch4 + "WHERE p1.name in [" + s_namelst + "] AND ac.name in [" + activitylst4 + "] AND d.name in [" + dataNamelst4 + "] AND p2.name in [" + r_namelst + "] "
        query4 = query4 + delDetach
    }

    if (checkValues5 != undefined) {
        delFlag5 = true;
        namelst5 = "\"" + nameArr5[checkValues5[0]] + "\""
        activitylst5 = "\"" + activityTypeArr5[checkValues5[0]] + "\""
        dataNamelst5 = "\"" + dataNameArr5[checkValues5[0]] + "\""
        dataNamelst6 = "\"" + dataNameArr6[checkValues5[0]] + "\""
        for (var i = 1; i < checkValues5.length; i++) {
            namelst5 = namelst5 + ", \"" + nameArr5[checkValues5[i]] + "\""
            activitylst5 = activitylst5 + ", \"" + activityTypeArr5[checkValues5[i]] + "\""
            dataNamelst5 = dataNamelst5 + ", \"" + dataNameArr5[checkValues5[i]] + "\""
            dataNamelst6 = dataNamelst6 + ", \"" + dataNameArr6[checkValues5[i]] + "\""
        }
        console.log("namelst5", namelst5)
        console.log("activitylst5", activitylst5)
        console.log("dataNamelst5", dataNamelst5)
        console.log("dataNamelst6", dataNamelst6)
        query5 = delMatch5 + "WHERE p.name in [" + namelst5 + "] AND ac.name in [" + activitylst5 + "] AND d2.name in [" + dataNamelst5 + "] AND d1.name in [" + dataNamelst6 + "] "
        query5 = query5 + delDetach
    }

    console.log(query3)
    console.log("----------------------------------------------------------")
    console.log(query4)
    console.log("----------------------------------------------------------")
    console.log(query5)
    if (delFlag3 && delFlag4 && delFlag5) {
        session.run(query3)
            .then(function (result) {
                session.run(query4)
                    .then(function (result) {
                        session.run(query5)
                            .then(function (result) {
                                console.log("삭제 완료")
                                res.render('data/deleteData', {esession: session_value.getSession()});
                            });
                        });
                session.close();
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else if (delFlag3 && delFlag4) {
        session.run(query3)
            .then(function (result) {
                session.run(query4)
                    .then(function (result) {
                        console.log("삭제 완료")
                        res.render('data/deleteData', {esession: session_value.getSession()});
                    });
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else if (delFlag3 && delFlag5) {
        session.run(query3)
            .then(function (result) {
                session.run(query5)
                    .then(function (result) {
                        console.log("삭제 완료")
                        res.render('data/deleteData', {esession: session_value.getSession()});
                    });
                session.close();    
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else if (delFlag4 && delFlag5) {
        session.run(query4)
            .then(function (result) {
                session.run(query5)
                    .then(function (result) {
                        console.log("삭제 완료")
                        res.render('data/deleteData', {esession: session_value.getSession()});
                    });
                session.close();
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else {
        if (delFlag4) {
            session.run(query4)
                .then(function (result) {
                    res.render('data/deleteData', {esession: session_value.getSession()});
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });
        }
        else if (delFlag3) {
            session.run(query3)
                .then(function (result) {
                    res.render('data/deleteData', {esession: session_value.getSession()});
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });
        }
        else {
            session.run(query5)
                .then(function (result) {
                    res.render('data/deleteData', {esession: session_value.getSession()});
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });
        }
    }
});

function setArray() {
    nameArr = [];
    affiliationArr = [];
    activityTypeArr3 = [];
    dateArr3 = [];
    dataNameArr3 = [];
    dataTypeArr3 = [];
    priceArr3 = [];
    deviceArr3 = [];

    s_nameArr = [];
    s_affiliationArr = [];
    activityTypeArr4 = [];
    dateArr4 = [];
    dataNameArr4 = [];
    dataTypeArr4 = [];
    priceArr4 = [];
    deviceArr4 = [];
    r_nameArr = [];
    r_affiliationArr = [];

    nameArr5 = [];
    affiliationArr5 = [];
    activityTypeArr5 = [];
    dateArr5 = [];
    dataNameArr5 = [];
    dataTypeArr5 = [];
    priceArr5 = [];
    deviceArr5 = [];
    nameArr6 = [];
    affiliationArr6 = [];
    dataNameArr6 = [];
    dataTypeArr6 = [];
    priceArr6 = [];
    deviceArr6 = [];

    provInfo3 = [];
    provInfo4 = [];
    provInfo5 = [];
    provInfo = [];

    dataN = [];
    datavalue = [];
    datafile = [];
    dataorigin = [];

    modiInsInfo = [];
    modiInsName = [];
    modiInsValue = [];

    addInsName = [];
    
}

router.post('/delete', function (req, res) {
    var dataName = req.body.dataName;
    var name = req.body.name;
    var dataNameFlag = true;
    var nameFlag = true;

    setArray()

    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    console.log("dataName: " + dataName);
    console.log("name: " + name);

    var nullcount = 0;

    var query5resultNum;
    var query4resultNum;
    var query3resultNum;

    var matchCyper5;
    var matchCyper4;
    var matchCyper3;

    var returnCyper5 = ") RETURN p, d2, ac, d1 "
    var returnCyper4 = ") RETURN p1, d, ac, p2 "
    var returnCyper3 = ") RETURN p, d, ac "
    var whereCyper5 = " WHERE ac.name IN ['가공', '변환'] AND ("
    var whereCyper4 = " WHERE ac.name IN ['배포', '판매'] AND ("
    var whereCyper3 = " WHERE ac.name = '생성' AND ("
    var newQuery5;
    var newQuery4;
    var newQuery3;

    if (user_gubun == '관리자') {
        matchCyper5 = "MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person)"
        matchCyper4 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person)"
        matchCyper3 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + whereCyper5;
        newQuery4 = matchCyper4 + whereCyper4;
        newQuery3 = matchCyper3 + whereCyper3;
    }
    else {
        matchCyper5 = "MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person)"
        matchCyper4 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person)"
        matchCyper3 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + whereCyper5 + "p.name = '" + user_name + "' ) AND (";
        newQuery4 = matchCyper4 + whereCyper4 + "p1.name = '" + user_name + "' OR p2.name = '" + user_name + "') AND (";
        newQuery3 = matchCyper3 + whereCyper3 + "p.name = '" + user_name + "' ) AND (";
    }

    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;


    var dataNameCyper = " d.name = ";
    var nameCyper = " p.name = ";

    if (dataName == '' || dataName == undefined) {
        console.log("dataName null");
        dataNameFlag = false;
        nullcount++;
    }
    if (name == '' || name == undefined) {
        console.log("name null");
        nameFlag = false;
        nullcount++;
    }
    if(dataNameFlag == false && nameFlag == false) {
        res.send('<script type="text/javascript">alert("검색어를 입력해주세요."); window.history.go(-1);</script>');
    }

    for (var i = 0; i < (2 - nullcount); i++) {
        if (dataNameFlag) {
            newQuery5 = newQuery5 + " d1.name = '" + dataName + "' OR d2.name = '" + dataName + "'";
            newQuery4 = newQuery4 + dataNameCyper + "'" + dataName + "'";
            newQuery3 = newQuery3 + dataNameCyper + "'" + dataName + "'";
            dataNameFlag = false;
        }
        else if (nameFlag) {
            newQuery5 = newQuery5 + nameCyper + "'" + name + "'";
            newQuery4 = newQuery4 + " p1.name = '" + name + "' OR p2.name = '" + name + "'";
            newQuery3 = newQuery3 + nameCyper + "'" + name + "'";
            nameFlag = false;
        }
        if ((i + 1) != (2 - nullcount)) {
            newQuery5 = newQuery5 + " AND";
            newQuery4 = newQuery4 + " AND";
            newQuery3 = newQuery3 + " AND";
        }
    }
    newQuery5 = newQuery5 + returnCyper5;
    newQuery4 = newQuery4 + returnCyper4;
    newQuery3 = newQuery3 + returnCyper3;
    console.log(newQuery3)
    console.log("******************************************")
    console.log(newQuery4)
    console.log("******************************************")
    console.log(newQuery5)
    session.run(newQuery5)
        .then(function (result) {
            query5resultNum = result.records.length;
            if (query5resultNum != 0) {
                result.records.forEach(function (record) {

                    nameArr5.push(record._fields[0].properties.name)
                    affiliationArr5.push(record._fields[0].properties.affiliation)

                    dataNameArr5.push(record._fields[1].properties.name)
                    dataTypeArr5.push(record._fields[1].properties.d_type)
                    deviceArr5.push(record._fields[1].properties.device)
                    priceArr5.push(record._fields[1].properties.price)

                    activityTypeArr5.push(record._fields[2].properties.name)
                    dateArr5.push(record._fields[2].properties.date)

                    dataNameArr6.push(record._fields[3].properties.name)
                    dataTypeArr6.push(record._fields[3].properties.d_type)
                    deviceArr6.push(record._fields[3].properties.device)
                    priceArr6.push(record._fields[3].properties.price)
                });
            }
            else {
                nameArr5.push(' ')
                affiliationArr5.push(' ')

                dataNameArr5.push(' ')
                dataTypeArr5.push(' ')
                deviceArr5.push(' ')
                priceArr5.push(' ')

                activityTypeArr5.push(' ')
                dateArr5.push(' ')

                dataNameArr6.push(' ')
                dataTypeArr6.push(' ')
                deviceArr6.push(' ')
                priceArr6.push(' ')
            }
    session.run(newQuery4)
        .then(function (result) {
            query4resultNum = result.records.length
            if (query4resultNum != 0) {
                result.records.forEach(function (record) {


                    s_nameArr.push(record._fields[0].properties.name)
                    s_affiliationArr.push(record._fields[0].properties.affiliation)

                    dataNameArr4.push(record._fields[1].properties.name)
                    dataTypeArr4.push(record._fields[1].properties.d_type)
                    deviceArr4.push(record._fields[1].properties.device)
                    priceArr4.push(record._fields[1].properties.price)

                    activityTypeArr4.push(record._fields[2].properties.name)
                    dateArr4.push(record._fields[2].properties.date)

                    r_nameArr.push(record._fields[3].properties.name)
                    r_affiliationArr.push(record._fields[3].properties.affiliation)
                });
            }
            else {
                s_nameArr.push(' ')
                s_affiliationArr.push(' ')

                dataNameArr4.push(' ')
                dataTypeArr4.push(' ')
                deviceArr4.push(' ')
                priceArr4.push(' ')

                activityTypeArr4.push(' ')
                dateArr4.push(' ')

                r_nameArr.push(' ')
                r_affiliationArr.push(' ')
            }
            session.run(newQuery3)
                .then(function (result) {
                    query3resultNum = result.records.length;
                    if (query3resultNum != 0) {
                        result.records.forEach(function (record) {

                            nameArr.push(record._fields[0].properties.name)
                            affiliationArr.push(record._fields[0].properties.affiliation)

                            dataNameArr3.push(record._fields[1].properties.name)
                            dataTypeArr3.push(record._fields[1].properties.d_type)
                            deviceArr3.push(record._fields[1].properties.device)
                            priceArr3.push(record._fields[1].properties.price)

                            activityTypeArr3.push(record._fields[2].properties.name)
                            dateArr3.push(record._fields[2].properties.date)
                        });
                    }
                    else {
                        nameArr.push(' ')
                        affiliationArr.push(' ')

                        dataNameArr3.push(' ')
                        dataTypeArr3.push(' ')
                        deviceArr3.push(' ')
                        priceArr3.push(' ')

                        activityTypeArr3.push(' ')
                        dateArr3.push(' ')
                    }
                    res.render('data/deleteDataResult.ejs', {
                        esession: session_value.getSession(),

                        names: nameArr,
                        affiliations: affiliationArr,
                        dataTypes3: dataTypeArr3,
                        dataNames3: dataNameArr3,
                        devices3: deviceArr3,
                        prices3: priceArr3,
                        activityTypes3: activityTypeArr3,
                        dates3: dateArr3,

                        s_names: s_nameArr,
                        s_affiliations: s_affiliationArr,
                        dataTypes4: dataTypeArr4,
                        dataNames4: dataNameArr4,
                        devices4: deviceArr4,
                        prices4: priceArr4,
                        activityTypes4: activityTypeArr4,
                        dates4: dateArr4,
                        r_names: r_nameArr,
                        r_affiliations: r_affiliationArr,

                        names5 : nameArr5,
                        affiliations5 : affiliationArr5,
                        dataTypes5: dataTypeArr5,
                        dataNames5: dataNameArr5,
                        devices5: deviceArr5,
                        prices5: priceArr5,
                        activityTypes5: activityTypeArr5,
                        dates5: dateArr5,

                        dataTypes6: dataTypeArr6,
                        dataNames6: dataNameArr6,
                        devices6: deviceArr6,
                        prices6: priceArr6,

                        authenticated: true
                    });
                });
            });
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
});

router.get('/data/modifyData', function (req, res) {

    var session = driver.session();

    var nameArr = [];
    var affiliationArr = [];
    var pidArr = [];
    var pTypeArr = [];
    var nameArr2 = [];
    var affiliationArr2 = [];

    var s_nameArr = [];
    var s_pidArr = [];
    var s_pTypeArr = [];
    var r_nameArr = [];
    var r_affiliationArr = [];

    var activityTypeArr4 = [];
    var dateArr4 = [];
    var detailArr4 = [];
    var dataNameArr4 = [];
    //var dataTypeArr4 = [];
    //var priceArr4 = [];
    //var deviceArr4 = [];
    var valueArr4 = [];
    var file_pathArr4 = [];
    var originArr4 = [];
    var dataNameArr215 = [];
    var valueArr215 = [];
    var file_pathArr215 = [];
    var originArr215 = [];

    var activityTypeArr3 = [];
    var dateArr3 = [];
    var detailArr3 = [];
    var dataNameArr3 = [];
    var dataTypeArr3 = [];
    var priceArr3 = [];
    var deviceArr3 = [];
    var valueArr3 = [];
    var file_pathArr3 = [];
    var originArr3 = [];

    var nameArr10 = [];
    var pidArr10 = [];
    var pTypeArr10 = [];
    var affiliationArr10 = [];

    var activityTypeArr10 = [];
    var dateArr10 = [];
    var detailArr10 = [];

    var APFromArr10 = [];
    var APToArr10 = [];
    var priceArr10 = [];
    var isAgreeArr10 = [];

    var dataNameArr10 = [];
    var dataTypeArr10 = [];
    var deviceArr10 = [];

    var dataNameArr10 = [];
    var valueArr10 = [];
    var file_pathArr10 = [];
    var originArr10 = [];
    //var dataTypeArr10 = [];
    //var deviceArr10 = [];

    var nameArr11 = [];
    var pidArr11 = [];
    var pTypeArr11 = [];

    var dataNameArr11 = [];
    var dataTypeArr11 = [];
    var priceArr11 = [];
    var deviceArr11 = [];

    //var dataOwner = [];
    //var dataOwnerAff = [];

    var i = 0;
    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;

    modiInsName = [];
        
     con.query("SELECT * FROM iitp.institutions;", function (err, rows, fields) {
        if (err) {
            console.log(err);
            console.log("QUERY ERROR!");
        }
        else {
            for (var index = 0; index < rows.length; index++) {
                modiInsName.push(rows[index]["name"]);
            }
        }
    });
    
    if (user_gubun == '사용자') {
        console.log('사용자')
        session
          .run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '생성' AND p.name = '" + user_name + "' AND p.pid = '"+ user_pid +"' RETURN p, d, ac")
          .then(function (result) {
            result.records.forEach(function (record) {

              s_nameArr.push(record._fields[0].properties.name)
              s_pidArr.push(record._fields[0].properties.pid)
              s_pTypeArr.push(record._fields[0].properties.p_type)

              dataNameArr4.push(record._fields[1].properties.name)
              valueArr4.push(record._fields[1].properties.value)
              file_pathArr4.push(record._fields[1].properties.file_path)
              originArr4.push(record._fields[1].properties.origin)

              activityTypeArr4.push(record._fields[2].properties.name)
              dateArr4.push(record._fields[2].properties.date)
              detailArr4.push(record._fields[2].properties.detail)

              dataN.push(record._fields[1].properties.name)
              datavalue.push(record._fields[1].properties.value)
              datafile.push(record._fields[1].properties.file_path)
              dataorigin.push(record._fields[1].properties.origin)
              datasname.push(record._fields[0].properties.name)
              session.close();
            });
            /*
            session.run("MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '가공' AND ( p.name = '" + user_name + "' ) RETURN p, d2, ac, d1 LIMIT 10")
          .then(function (result) {
            result.records.forEach(function (record) {

              nameArr.push(record._fields[0].properties.name)
              pidArr.push(record._fields[0].properties.pid)
              pTypeArr.push(record._fields[0].properties.p_type)

              dataNameArr3.push(record._fields[1].properties.name)
              valueArr3.push(record._fields[1].properties.value)
              file_pathArr3.push(record._fields[1].properties.file_path)
              originArr3.push(record._fields[1].properties.origin)


              activityTypeArr3.push(record._fields[2].properties.name)
              dateArr3.push(record._fields[2].properties.date)
              detailArr3.push(record._fields[2].properties.detail)

              dataNameArr215.push(record._fields[3].properties.name)
              valueArr215.push(record._fields[3].properties.value)
              file_pathArr215.push(record._fields[3].properties.file_path)
              originArr215.push(record._fields[3].properties.origin)


              dataN.push(record._fields[1].properties.name)
              datavalue.push(record._fields[1].properties.value)
              datafile.push(record._fields[1].properties.file_path)
              dataorigin.push(record._fields[1].properties.origin)
            });

              session.run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) WHERE ac.name = '제공' AND p1.name = '" + user_name + "' RETURN p1, d, ac, r, p2 LIMIT 10")
              .then(function (result) {
                result.records.forEach(function (record) {
    
                  nameArr10.push(record._fields[0].properties.name)
                  pidArr10.push(record._fields[0].properties.pid)
                  pTypeArr10.push(record._fields[0].properties.p_type)
    
                  dataNameArr10.push(record._fields[1].properties.name)
                  valueArr10.push(record._fields[1].properties.value)
                  file_pathArr10.push(record._fields[1].properties.file_path)
                  originArr10.push(record._fields[1].properties.origin)
    
                  activityTypeArr10.push(record._fields[2].properties.name)
                  dateArr10.push(record._fields[2].properties.date)
                  detailArr10.push(record._fields[2].properties.detail)

                  APFromArr10.push(record._fields[3].properties.allowed_period_from)
                  APToArr10.push(record._fields[3].properties.allowed_period_to)
                  priceArr10.push(record._fields[3].properties.price)
                  isAgreeArr10.push(record._fields[3].properties.is_agreed)

                  nameArr11.push(record._fields[4].properties.name)
                  pidArr11.push(record._fields[4].properties.pid)
                  pTypeArr11.push(record._fields[4].properties.p_type)

                  dataN.push(record._fields[1].properties.name)
                  datavalue.push(record._fields[1].properties.value)
                  datafile.push(record._fields[1].properties.file_path)
                  dataorigin.push(record._fields[1].properties.origin)
    

                });
                res.render('data/modifyData', {
                    esession: session_value.getSession(),

                    names: nameArr,
                    pids: pidArr,
                    pTypes: pTypeArr,
                    dataNames3: dataNameArr3,
                    values3: valueArr3,
                    filePaths3: file_pathArr3,
                    origins3: originArr3,
                    activityTypes3: activityTypeArr3,
                    dates3: dateArr3,
                    details3: detailArr3,
                    dataNames215: dataNameArr215,
                    values215: valueArr215,
                    filePaths215: file_pathArr215,
                    origins215: originArr215,

                    s_names: s_nameArr,
                    s_pids: s_pidArr,
                    s_pTypes: s_pTypeArr,
                    dataNames4: dataNameArr4,
                    values4: valueArr4,
                    filePaths4: file_pathArr4,
                    origins4: originArr4,
                    activityTypes4: activityTypeArr4,
                    dates4: dateArr4,
                    details4: detailArr4,

                    names10 : nameArr10,
                    pids10: pidArr10,
                    pTypes10: pTypeArr10,
                    dateNames10 : dataNameArr10,
                    values10: valueArr10,
                    filePaths10: file_pathArr10,
                    origins10: originArr10,
                    activityTypes10 : activityTypeArr10,
                    dates10 : dateArr10,
                    details10: detailArr10,
                    APFroms10: APFromArr10,
                    APTos10: APToArr10,
                    prices10: priceArr10,
                    isAgrees10: isAgreeArr10,
                    names11 : nameArr11,
                    pids11: pidArr11,
                    pTypes11: pTypeArr11,

                    dataNamesTotal: dataN,
                    dataValuesTotal: datavalue,
                    dataFilesTotal: datafile,
                    dataOriginTotal: dataorigin,
                    
                    authenticated: true
                });
            });
          }); */
            res.render('data/modifyData', {
                esession: session_value.getSession(),


                s_names: s_nameArr,
                s_pids: s_pidArr,
                s_pTypes: s_pTypeArr,
                dataNames4: dataNameArr4,
                values4: valueArr4,
                filePaths4: file_pathArr4,
                origins4: originArr4,
                activityTypes4: activityTypeArr4,
                dates4: dateArr4,
                details4: detailArr4,

                dataNamesTotal: dataN,
                dataValuesTotal: datavalue,
                dataFilesTotal: datafile,
                dataOriginTotal: dataorigin,

                indNames: modiInsName,
                
                authenticated: true
            });
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else if (user_gubun == '관리자') {
        console.log("관리자")
        session
          .run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '생성' RETURN p, d, ac ")
          .then(function (result) {
            result.records.forEach(function (record) {

              s_nameArr.push(record._fields[0].properties.name)
              s_affiliationArr.push(record._fields[0].properties.affiliation)

              dataNameArr4.push(record._fields[1].properties.name)
              dataTypeArr4.push(record._fields[1].properties.d_type)
              deviceArr4.push(record._fields[1].properties.device)
              priceArr4.push(record._fields[1].properties.price)
              //dataOwner.push(record._fields[1].properties.owner)
              //dataOwnerAff.push(record._fields[1].properties.owner_aff)

              activityTypeArr4.push(record._fields[2].properties.name)
              dateArr4.push(record._fields[2].properties.date)
            });


          session.run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) WHERE ac.name IN ['배포', '판매'] RETURN p1, d, ac, p2")
          .then(function (result) {
            result.records.forEach(function (record) {

              nameArr.push(record._fields[0].properties.name)
              affiliationArr.push(record._fields[0].properties.affiliation)

              dataNameArr3.push(record._fields[1].properties.name)
              dataTypeArr3.push(record._fields[1].properties.d_type)
              deviceArr3.push(record._fields[1].properties.device)
              priceArr3.push(record._fields[1].properties.price)
              //dataOwner.push(record._fields[1].properties.owner)
              //dataOwnerAff.push(record._fields[1].properties.owner_aff)

              activityTypeArr3.push(record._fields[2].properties.name)
              dateArr3.push(record._fields[2].properties.date)

              nameArr2.push(record._fields[3].properties.name)
              affiliationArr2.push(record._fields[3].properties.affiliation)
            });

              session.run("MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) WHERE ac.name IN ['가공', '변환'] RETURN p, d2, ac, d1 ")
              .then(function (result) {
                result.records.forEach(function (record) {
    
                  nameArr10.push(record._fields[0].properties.name)
                  affiliationArr10.push(record._fields[0].properties.affiliation)
    
                  dataNameArr10.push(record._fields[1].properties.name)
                  dataTypeArr10.push(record._fields[1].properties.d_type)
                  deviceArr10.push(record._fields[1].properties.device)
                  priceArr10.push(record._fields[1].properties.price)
                  //dataOwner.push(record._fields[1].properties.owner)
                  //dataOwnerAff.push(record._fields[1].properties.owner_aff)
    
                  activityTypeArr10.push(record._fields[2].properties.name)
                  dateArr10.push(record._fields[2].properties.date)
    
                  dataNameArr11.push(record._fields[3].properties.name)
                  dataTypeArr11.push(record._fields[3].properties.d_type)
                  deviceArr11.push(record._fields[3].properties.device)
                  priceArr11.push(record._fields[3].properties.price)
                });


          res.render('data/modifyData', {
            esession: session_value.getSession(),
            names: nameArr,
            affiliations: affiliationArr,
            dataTypes3: dataTypeArr3,
            dataNames3: dataNameArr3,
            devices3: deviceArr3,
            prices3: priceArr3,
            activityTypes3: activityTypeArr3,
            dates3: dateArr3,

            s_names: s_nameArr,
            s_affiliations: s_affiliationArr,
            dataTypes4: dataTypeArr4,
            dataNames4: dataNameArr4,
            devices4: deviceArr4,
            prices4: priceArr4,
            activityTypes4: activityTypeArr4,
            dates4: dateArr4,
            r_names: r_nameArr,
            r_affiliations: r_affiliationArr,

            names2 : nameArr2,
            affiliations2 : affiliationArr2,
            names10 : nameArr10,
            affiliations10 : affiliationArr10,
            activityTypes10 : activityTypeArr10,
            dates10 : dateArr10,
            dateNames10 : dataNameArr10,
            dateTypes10 : dataTypeArr10,
            prices10: priceArr10,
            devices10: deviceArr10,
            dateNames11 : dataNameArr11,
            dateTypes11 : dataTypeArr11,
            prices11: priceArr11,
            devices11: deviceArr11,

            authenticated: true
      });
    });
  });
    //session.close();
 })
 .catch(function (err) {
  console.log(err);
});
    }
    else {
        res.render('data/modifyData', {
            esession: session_value.getSession(),
            names: undefined,
            affiliations: undefined,
            dataTypes3: undefined,
            dataNames3: undefined,
            devices3: undefined,
            prices3: undefined,
            activityTypes3: undefined,
            dates3: undefined,

            s_names: undefined,
            s_affiliations: undefined,
            dataTypes4: undefined,
            dataNames4: undefined,
            devices4: undefined,
            prices4: undefined,
            activityTypes4: undefined,
            dates4: undefined,
            r_names: undefined,
            r_affiliations: undefined,

            names2 : undefined,
            affiliations2 : undefined,

            names10 : undefined,
            affiliations10 : undefined,
            
            activityTypes10 : undefined,
            dates10 : undefined,
            dateNames10 : undefined,
            dateTypes10 : undefined,
            prices10: undefined,
            devices10: undefined,

            dateNames11 : undefined,
            dateTypes11 : undefined,
            prices11: undefined,
            devices11: undefined,

            authenticated: false
        });
    }

    /* 
    var name = req.body.name;
    var affiliation = req.body.affiliation;
    var activityType = req.body.activityType;
    var date = req.body.date;
    var dataName = req.body.dataName;
    var dataType = req.body.dataType;
    var price = req.body.price;
    var device = req.body.device;
    var r_name = req.body.r_name;
    var r_affiliation = req.body.r_affiliation;
    var dataName2 = req.body.dataName2;
    var price2 = req.body.price2;
    var dataType2 = req.body.dataType2;
    var device2 = req.body.device2;
    var modiQuery3;
    var modiQuery4;
    var modiQuery5;
    var modiMatch3 = "(d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) "
    var modiMatch4 = "(d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) "
    var modiMatch5 = "(d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) "
    for (var i = 0; i < 8; i++) {
        console.log("provInfo3[", i, "]: ", provInfo3[i]);
    }
    for (var i = 0; i < 10; i++) {
        console.log("pushInfo4[", i, "]: ", provInfo4[i]);
    }
    for (var i = 0; i < 12; i++) {
        console.log("pushInfo5[", i, "]: ", provInfo5[i]);
    }
    var modiWhere3 = "WHERE p.name = '" + provInfo3[0] + "' AND d.name = '" + provInfo3[4] + "' AND ac.name = '" + provInfo3[2] + "' "
    var modiWhere4 = "WHERE p1.name = '" + provInfo4[0] + "' AND d.name = '" + provInfo4[4] + "' AND ac.name = '" + provInfo4[2] + "' AND p2.name = '" + provInfo4[8] + "' "
    var modiWhere5 = "WHERE p.name = '" + provInfo5[0] + "' AND d2.name = '" + provInfo5[2] + "' AND ac.name = '" + provInfo5[6] + "' AND d1.name = '" + provInfo5[8] + "' "
    var modiSet = "SET p = {name: '" + name + "' , affiliation: '" + affiliation + "'}, d = {name: '" + dataName + "', d_type: '" + dataType + "', price: '" + price + "', device: '" + device + "' }, ac = {name: '" + activityType + "', date: '" + date + "'}"
    var modiSet2 = "SET p1 = {name: '" + name + "' , affiliation: '" + affiliation + "'}, d = {name: '" + dataName + "', d_type: '" + dataType + "', price: '" + price + "', device: '" + device + "' }, ac = {name: '" + activityType + "', date: '" + date + "'}"
    var modiSet3 = "SET p = {name: '" + name + "' , affiliation: '" + affiliation + "'}, d2 = {name: '" + dataName + "', d_type: '" + dataType + "', price: '" + price + "', device: '" + device + "' }, ac = {name: '" + activityType + "', date: '" + date + "'}"
    if (provInfo3.length != 0) {
        console.log(provInfo3.length)
        //if (provInfo3[2] == activityType) {
            modiQuery3 = "MATCH " + modiMatch3 + modiWhere3 + modiSet;
            console.log(modiQuery3);
            session.run(modiQuery3)
                .then(function (result) {
                    res.render('data/modifyData.ejs', {
                        esession: session_value.getSession(),
                        authenticated: true
                    });
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });
                */
        //}
        /* else {
            modiQuery3 = "MATCH prov = (" + modiMatch3 + ") " + modiWhere3 + "DELETE prov CREATE (d12:Data {name: '" + dataName + "' , price: '" + price + "' , d_type: '" + dataType + "', device: '" + device + "'})-[:Generate]-(ac12:Activity {name: '" + activityType + "', date: '" + date + "' })-[:Act]-(p12:Person {name: '" + name + "' , affiliation: '" + affiliation + "'})"
            console.log(modiQuery3);
            session.run(modiQuery3)
                .then(function (result) {
                    res.render('data/modifyData.ejs', {
                        esession: session_value.getSession(),
                        authenticated: true
                    });
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });
        } */
        /*
    } else if (provInfo4.length != 0) {
        console.log(provInfo4.length)
        //if (activityType != "수정") {
            modiQuery4 = "MATCH " + modiMatch4 + modiWhere4 + modiSet2 + " ,p2 = {name: '" + r_name + "' , affiliation: '" + r_affiliation + "'}"
            console.log(modiQuery4);
            session.run(modiQuery4)
                .then(function (result) {
                    res.render('data/modifyData.ejs', {
                        esession: session_value.getSession(),
                        authenticated: true
                    });
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });
            */
        //}
        /* else {
            console.log("수정으로 바꿈")
            modiQuery4 = "MATCH prov = (" + modiMatch4 + ") " + modiWhere4 + "AND p2.name = '" + provInfo4[8] + "' " + "DELETE prov CREATE (d12:Data {name: '" + dataName + "' , price: '" + price + "' , d_type: '" + dataType + "', device: '" + device + "'})-[:Generate]-(ac12:Activity {name: '" + activityType + "', date: '" + date + "' })-[s:Send]-(p12:Person {name: '" + name + "' , affiliation: '" + affiliation + "'}), (ac12:Activity {name: '" + activityType + "', date: '" + date + "' })-[r:Receive]-(p122:Person {name: '" + name + "' , affiliation: '" + affiliation + "'})"
            console.log(modiQuery4);
            session.run(modiQuery4)
                .then(function (result) {
                    res.render('data/modifyData.ejs', {
                        esession: session_value.getSession(),
                        authenticated: true
                    });
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });
        } */
        /*
    }
    else if (provInfo5.length != 0) {
        console.log(provInfo5.length)
        //if (activityType != "수정") {
            modiQuery5 = "MATCH " + modiMatch5 + modiWhere5 + modiSet3 + " , d1 = {name: '" + dataName2 + "' , d_type: '" + dataType2 + "' , price: '" + price2 + "' , device: '" + device2 + "'}"
            console.log(modiQuery5);
            session.run(modiQuery5)
                .then(function (result) {
                    res.render('data/modifyData.ejs', {
                        esession: session_value.getSession(),
                        authenticated: true
                    });
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });*/
        //}
        /* else {
            console.log("수정으로 바꿈")
            modiQuery5 = "MATCH prov = (" + modiMatch5 + ") " + modiWhere5 + "AND d2.name = '" + provInfo5[8] + "' " + "DELETE prov CREATE (d12:Data {name: '" + dataName + "' , price: '" + price + "' , d_type: '" + dataType + "', device: '" + device + "'})<-[:Generate]-(ac12:Activity {name: '" + activityType + "', date: '" + date + "' })<-[:Generate]-(d122:Data {name: '" + dataName2 + "' , price: '" + price2 + "' , d_type: '" + dataType2 + "', device: '" + device2 + "'}), (ac12:Activity {name: '" + activityType + "', date: '" + date + "' })-[:Act]-(p12:Person {name: '" + name + "' , affiliation: '" + affiliation + "'})"
            console.log(modiQuery5);
            session.run(modiQuery5)
                .then(function (result) {
                    res.render('data/modifyData.ejs', {
                        esession: session_value.getSession(),
                        authenticated: true
                    });
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });
        } 
    }*/
});


router.post('/getModifyValues', function (req, res) {

    var checkValues = req.body.modifyCheck;
    var checkLen;

    var modiFlag = false;

    if (checkValues == undefined) {
        checkLen = 0;
    } 
    else {
        checkLen = checkValues.length;
    }
    /*
    if (Array.isArray(checkValues)) {
        modiFlag = false;
    }
    */
    if (!(checkLen == 0)) {
        console.log("------------check ------------", checkValues, checkValues.length);
        modiFlag = true;
    }

    if (!modiFlag) {
        console.log("false");
        modiFlag = false;
    }

    if (checkLen == 0) 
        modiFlag = false;

    if (modiFlag) {
        if(!Array.isArray(checkValues)){
            provInfo.push(dataN[checkValues]);
            provInfo.push(datavalue[checkValues]);
            provInfo.push(datafile[checkValues]);
            provInfo.push(dataorigin[checkValues]);

            console.log("modiFlag : ", modiFlag);
            console.log("provInfo : ", provInfo);
        }
        else{
            for(var i = 0; i < checkLen ; i++){
                provInfo.push(dataN[checkValues[i]]);
                provInfo.push(datavalue[checkValues[i]]);
                provInfo.push(datafile[checkValues[i]]);
                provInfo.push(dataorigin[checkValues[i]]);
    
                console.log("modiFlag : ", modiFlag);
                console.log("provInfo : ", provInfo);
            }
        }
        res.render('data/modifyDataPage.ejs', {
            esession: session_value.getSession(),

            modiFlag: modiFlag,
            provInfo: provInfo,
            insNames: modiInsName,

            authenticated: true
        });  
    } else {
        res.send('<script type="text/javascript">alert("하나의 개인정보를 선택해주세요."); window.history.go(-1);</script>');
    }
});

router.post('/transfer', function (req, res) {

    var session = driver.session();
    var session2 = driver.session();
    var session3 = driver.session();
    var session4 = driver.session();

    var company = req.body.company;
    var allowedPeriodFrom = req.body.allowedPeriodFrom;
    var allowedPeriodTo = req.body.allowedPeriodTo;
    var price = req.body.price;
    var permission = req.body.permission;
    var manuMethod = req.body.manuMethod;

    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;
    var user_type;
    if(session_value.getSession().gubun == '사용자'){
        user_type = '개인'
    }

    let today = new Date();
    let year = today.getFullYear(); 
    let month = (today.getMonth() + 1).toString();  
    let day = today.getDate().toString();  
    if(month.length == 1){
        month = "0" + month
    }
    if(day.length == 1){
        day = "0" + day
    }
    var date = year.toString() + month + day

    console.log("DDD",  provInfo)
    console.log(company, allowedPeriodFrom, allowedPeriodTo, price, permission, manuMethod);
    

    var mergeData = "MATCH (d:Data) "
                    + "WITH d.name as name, d.value as value, d.file_path as file_path, d.origin as origin, COLLECT(d) AS ns "
                    + "WHERE size(ns) > 1 "
                    + "CALL apoc.refactor.mergeNodes(ns) YIELD node "
                    + "RETURN node"
    var mergePerson = "MATCH (p:Person) "
                    + "WITH toLower(p.name) as name, p.pid as pid, p.p_type as p_type, COLLECT(p) AS ns "
                    + "WHERE size(ns) > 1 "
                    + "CALL apoc.refactor.mergeNodes(ns) YIELD node "
                    + "RETURN node"
    var deleteRel = "MATCH (s)-[r]->(e) "
                    + "with s,e,type(r) as typ, tail(collect(r)) as coll "
                    + "foreach(x in coll | delete x) "

    for(var i = 0 ; i < provInfo.length/4; i++){
        if(manuMethod != '미가공') {
            var manuCypher = "CREATE (p:Person), (d1:Data), (d2:Data), (ac:Activity) SET p = {name: '" + user_name + "', pid: '" + user_pid + "', p_type: '" + user_type + "'}, "
                            + "d1 = {name: '" + provInfo[i*4] + "', value: '" + provInfo[i*4+1] + "', file_path:'" + provInfo[i*4+2] + "', origin:'" + provInfo[i*4+3] + "'}, "
                            + "ac = {name: '가공', date:'" + date + "', detail: '" + manuMethod + "' }, "
                            + "d2 = {name: '" + provInfo[i*4] + "', value: '" + provInfo[i*4+1] + "', file_path:'" + provInfo[i*4+2] + "', origin:'" + provInfo[i*4+3] + "'} "
                            + "CREATE (p) <- [a:Act] -(ac), (ac) <- [g1:Generate] -(d2), (d1) <- [g2:Generate] -(ac)"
            console.log(manuCypher)
            session
            .run(manuCypher)
        }
        var receiveCypher = "CREATE (p:Person), (d:Data), (p2:Person), (ac:Activity)"
                            + "SET p = {name: '" + user_name + "', pid: '" + user_pid + "', p_type: '" + user_type + "'}, "
                            + "    d = {name: '" + provInfo[i*4] + "', value: '" + provInfo[i*4+1] + "', file_path:'" + provInfo[i*4+2] + "', origin:'" + provInfo[i*4+3] + "'}, "
                            + "    ac = {name: '제공', date:'" + date + "', detail: ''}, "
                            + "    p2 = {name: '" + company + "' , pid: '111111', p_type: '기관'} "
                            + "CREATE (p) <- [s:Send] -(ac), (p2) <- [r:Receive{allowed_period_from:'" + allowedPeriodFrom + "', allowed_period_to: '" + allowedPeriodTo + "', is_agreed: '" + permission + "', price: '" + price + "'}] -(ac), (ac) <- [g:Generate] -(d)"
        console.log(receiveCypher)
        session.run(receiveCypher)
        .then(function (result) {
        session2.run(mergeData)
            .then(function (result) {
                    session2.close()
            })
            .catch(function (err) {
                console.log(err);
            });
        session3.run(mergePerson)
            .then(function (result) {
                session3.close()
            })
            .catch(function (err) {
                console.log(err);
            });
        session4.run(deleteRel)
            .then(function (result) {
                session4.close()
            })
            .catch(function (err) {
                console.log(err);
            });
        session.close()
        })
        .catch(function (err) {
            console.log(err);
        });
    }
    res.render('data/modifyData.ejs', {
        esession: session_value.getSession(), 
        dataNamesTotal: dataN,
        dataValuesTotal: datavalue,
        dataFilesTotal: datafile,
        dataOriginTotal: dataorigin,
        s_names: datasname,
        authenticated: true
    });
   
});


router.post('/modify', function (req, res) {

    var session = driver.session();

    var dataName = req.body.dataName;
    var name = req.body.name;
    var dataNameFlag = true;
    var nameFlag = true;

    setArray()

    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    console.log("dataName: " + dataName);
    console.log("name: " + name);

    var nullcount = 0;

    var query5resultNum;
    var query4resultNum;
    var query3resultNum;

    var matchCyper5;
    var matchCyper4;
    var matchCyper3;

    var returnCyper5 = ") RETURN p, d2, ac, d1 "
    var returnCyper4 = ") RETURN p1, d, ac, p2 "
    var returnCyper3 = ") RETURN p, d, ac"
    var whereCyper5 = " WHERE ac.name IN ['가공', '변환'] AND ("
    var whereCyper4 = " WHERE ac.name IN ['배포', '판매'] AND ("
    var whereCyper3 = " WHERE ac.name = '생성' AND ("
    var newQuery5;
    var newQuery4;
    var newQuery3;

    if (user_gubun == '관리자') {
        matchCyper5 = "MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person)"
        matchCyper4 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person)"
        matchCyper3 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + whereCyper5;
        newQuery4 = matchCyper4 + whereCyper4;
        newQuery3 = matchCyper3 + whereCyper3;
    }
    else {
        matchCyper5 = "MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person{name: '" + user_name + "' })"
        matchCyper4 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person)"
        matchCyper3 = "MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person{name: '" + user_name + "' })"
        newQuery5 = matchCyper5 + whereCyper5;
        newQuery4 = matchCyper4 + whereCyper4 + "p1.name = '" + user_name + "' OR p2.name = '" + user_name + "') AND (";
        newQuery3 = matchCyper3 + whereCyper3;
    }

    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;

    var dataNameCyper4 = " d1.name = ";
    var dataNameCyper3 = " d.name = ";
    var nameCyper3 = " p.name = ";

    if (dataName == '' || dataName == undefined) {
        console.log("dataName null");
        dataNameFlag = false;
        nullcount++;
    }
    if (name == '' || name == undefined) {
        console.log("name null");
        nameFlag = false;
        nullcount++;
    }
    if (dataNameFlag == false && nameFlag == false) {
        res.send('<script type="text/javascript">alert("검색어를 입력해주세요."); window.history.go(-1);</script>');
    }

    for (var i = 0; i < (2 - nullcount); i++) {
        if (dataNameFlag) {
            newQuery5 = newQuery5 + dataNameCyper4 + "'" + dataName + "' OR d2.name = '" + dataName + "' ";
            newQuery4 = newQuery4 + dataNameCyper3 + "'" + dataName + "' ";
            newQuery3 = newQuery3 + dataNameCyper3 + "'" + dataName + "' ";
            dataNameFlag = false;
        }
        else if (nameFlag) {
            newQuery5 = newQuery5 + nameCyper3 + "'" + name + "'";
            newQuery4 = newQuery4 + " p1.name = '" + name + "' OR p2.name = '" + name + "' ";
            newQuery3 = newQuery3 + nameCyper3 + "'" + name + "'";
            nameFlag = false;
        }
        if ((i + 1) != (2 - nullcount)) {
            newQuery5 = newQuery5 + ") AND (";
            newQuery4 = newQuery4 + ") AND (";
            newQuery3 = newQuery3 + ") AND (";
        }
    }
    newQuery5 = newQuery5 + returnCyper5;
    newQuery4 = newQuery4 + returnCyper4;
    newQuery3 = newQuery3 + returnCyper3;
    console.log(newQuery3)
    console.log("******************************************")
    console.log(newQuery4)
    console.log("******************************************")
    console.log(newQuery5)

    session.run(newQuery5)
        .then(function (result) {
            query5resultNum = result.records.length;
            if (query5resultNum != 0) {
                result.records.forEach(function (record) {

                    nameArr5.push(record._fields[0].properties.name)
                    affiliationArr5.push(record._fields[0].properties.affiliation)

                    dataNameArr5.push(record._fields[1].properties.name)
                    dataTypeArr5.push(record._fields[1].properties.d_type)
                    deviceArr5.push(record._fields[1].properties.device)
                    priceArr5.push(record._fields[1].properties.price)

                    activityTypeArr5.push(record._fields[2].properties.name)
                    dateArr5.push(record._fields[2].properties.date)

                    dataNameArr6.push(record._fields[3].properties.name)
                    dataTypeArr6.push(record._fields[3].properties.d_type)
                    deviceArr6.push(record._fields[3].properties.device)
                    priceArr6.push(record._fields[3].properties.price)
                });
            }
            else {
                nameArr5.push(' ')
                affiliationArr5.push(' ')

                dataNameArr5.push(' ')
                dataTypeArr5.push(' ')
                deviceArr5.push(' ')
                priceArr5.push(' ')

                activityTypeArr5.push(' ')
                dateArr5.push(' ')

                dataNameArr6.push(' ')
                dataTypeArr6.push(' ')
                deviceArr6.push(' ')
                priceArr6.push(' ')
        }

    session
        .run(newQuery4)
        .then(function (result) {
            query4resultNum = result.records.length
            if (query4resultNum != 0) {
                result.records.forEach(function (record) {
                    s_nameArr.push(record._fields[0].properties.name)
                    s_affiliationArr.push(record._fields[0].properties.affiliation)

                    dataNameArr4.push(record._fields[1].properties.name)
                    dataTypeArr4.push(record._fields[1].properties.d_type)
                    deviceArr4.push(record._fields[1].properties.device)
                    priceArr4.push(record._fields[1].properties.price)

                    activityTypeArr4.push(record._fields[2].properties.name)
                    dateArr4.push(record._fields[2].properties.date)

                    r_nameArr.push(record._fields[3].properties.name)
                    r_affiliationArr.push(record._fields[3].properties.affiliation)
                })
            }
            else {
                s_nameArr.push(' ')
                s_affiliationArr.push(' ')

                dataNameArr4.push(' ')
                dataTypeArr4.push(' ')
                deviceArr4.push(' ')
                priceArr4.push(' ')

                activityTypeArr4.push(' ')
                dateArr4.push(' ')

                r_nameArr.push(' ')
                r_affiliationArr.push(' ')
            }
        session.run(newQuery3)
            .then(function (result) {
                query3resultNum = result.records.length;
                if (query3resultNum != 0) {
                    result.records.forEach(function (record) {

                        nameArr.push(record._fields[0].properties.name)
                        affiliationArr.push(record._fields[0].properties.affiliation)

                        dataNameArr3.push(record._fields[1].properties.name)
                        dataTypeArr3.push(record._fields[1].properties.d_type)
                        deviceArr3.push(record._fields[1].properties.device)
                        priceArr3.push(record._fields[1].properties.price)

                        activityTypeArr3.push(record._fields[2].properties.name)
                        dateArr3.push(record._fields[2].properties.date)
                        session.close()
                    });
                }
                else {
                    nameArr.push(' ')
                    affiliationArr.push(' ')

                    dataNameArr3.push(' ')
                    dataTypeArr3.push(' ')
                    deviceArr3.push(' ')
                    priceArr3.push(' ')

                    activityTypeArr3.push(' ')
                    dateArr3.push(' ')
                    session.close()
                }
                res.render('data/modifyDataResult.ejs', {
                        esession: session_value.getSession(),

                        names: nameArr,
                        affiliations: affiliationArr,
                        dataTypes3: dataTypeArr3,
                        dataNames3: dataNameArr3,
                        devices3: deviceArr3,
                        prices3: priceArr3,
                        activityTypes3: activityTypeArr3,
                        dates3: dateArr3,

                        s_names: s_nameArr,
                        s_affiliations: s_affiliationArr,
                        dataTypes4: dataTypeArr4,
                        dataNames4: dataNameArr4,
                        devices4: deviceArr4,
                        prices4: priceArr4,
                        activityTypes4: activityTypeArr4,
                        dates4: dateArr4,
                        r_names: r_nameArr,
                        r_affiliations: r_affiliationArr,

                        names5 : nameArr5,
                        affiliations5 : affiliationArr5,
                        dataTypes5: dataTypeArr5,
                        dataNames5: dataNameArr5,
                        devices5: deviceArr5,
                        prices5: priceArr5,
                        activityTypes5: activityTypeArr5,
                        dates5: dateArr5,

                        dataTypes6: dataTypeArr6,
                        dataNames6: dataNameArr6,
                        devices6: deviceArr6,
                        prices6: priceArr6,

                        authenticated: true
                    });
                });
            });
            //session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
});

router.get('/data/utilizeData', function (req, res) {

    var session = driver.session();

    var nameArr = [];
    var affiliationArr = [];
    var pidArr = [];
    var pTypeArr = [];
    var nameArr2 = [];
    var affiliationArr2 = [];

    var s_nameArr = [];
    var s_pidArr = [];
    var s_pTypeArr = [];
    var r_nameArr = [];
    var r_affiliationArr = [];

    var activityTypeArr4 = [];
    var dateArr4 = [];
    var detailArr4 = [];
    var dataNameArr4 = [];
    //var dataTypeArr4 = [];
    //var priceArr4 = [];
    //var deviceArr4 = [];
    var valueArr4 = [];
    var file_pathArr4 = [];
    var originArr4 = [];
    var dataNameArr215 = [];
    var valueArr215 = [];
    var file_pathArr215 = [];
    var originArr215 = [];

    var activityTypeArr3 = [];
    var dateArr3 = [];
    var detailArr3 = [];
    var dataNameArr3 = [];
    var dataTypeArr3 = [];
    var priceArr3 = [];
    var deviceArr3 = [];
    var valueArr3 = [];
    var file_pathArr3 = [];
    var originArr3 = [];

    var nameArr10 = [];
    var pidArr10 = [];
    var pTypeArr10 = [];
    var affiliationArr10 = [];

    var activityTypeArr10 = [];
    var dateArr10 = [];
    var detailArr10 = [];

    var APFromArr10 = [];
    var APToArr10 = [];
    var priceArr10 = [];
    var isAgreeArr10 = [];

    var dataNameArr10 = [];
    var dataTypeArr10 = [];
    var deviceArr10 = [];

    var dataNameArr10 = [];
    var valueArr10 = [];
    var file_pathArr10 = [];
    var originArr10 = [];
    //var dataTypeArr10 = [];
    //var deviceArr10 = [];

    var nameArr11 = [];
    var pidArr11 = [];
    var pTypeArr11 = [];

    var dataNameArr11 = [];
    var dataTypeArr11 = [];
    var priceArr11 = [];
    var deviceArr11 = [];

    //var dataOwner = [];
    //var dataOwnerAff = [];

    var i = 0;
    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;

    modiInsName = [];
        
     con.query("SELECT * FROM iitp.institutions;", function (err, rows, fields) {
        if (err) {
            console.log(err);
            console.log("QUERY ERROR!");
        }
        else {
            for (var index = 0; index < rows.length; index++) {
                modiInsName.push(rows[index]["name"]);
            }
        }
    });
    
    if (user_gubun == '사용자') {
        console.log('사용자')
        session
          .run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '생성' AND p.name = '" + user_name + "' AND p.pid = '"+ user_pid +"' RETURN p, d, ac")
          .then(function (result) {
            result.records.forEach(function (record) {

              s_nameArr.push(record._fields[0].properties.name)
              s_pidArr.push(record._fields[0].properties.pid)
              s_pTypeArr.push(record._fields[0].properties.p_type)

              dataNameArr4.push(record._fields[1].properties.name)
              valueArr4.push(record._fields[1].properties.value)
              file_pathArr4.push(record._fields[1].properties.file_path)
              originArr4.push(record._fields[1].properties.origin)

              activityTypeArr4.push(record._fields[2].properties.name)
              dateArr4.push(record._fields[2].properties.date)
              detailArr4.push(record._fields[2].properties.detail)

              dataN.push(record._fields[1].properties.name)
              datavalue.push(record._fields[1].properties.value)
              datafile.push(record._fields[1].properties.file_path)
              dataorigin.push(record._fields[1].properties.origin)
              datasname.push(record._fields[0].properties.name)
              session.close()
            });
            
            res.render('data/utilizeData', {
                esession: session_value.getSession(),


                s_names: s_nameArr,
                s_pids: s_pidArr,
                s_pTypes: s_pTypeArr,
                dataNames4: dataNameArr4,
                values4: valueArr4,
                filePaths4: file_pathArr4,
                origins4: originArr4,
                activityTypes4: activityTypeArr4,
                dates4: dateArr4,
                details4: detailArr4,

                dataNamesTotal: dataN,
                dataValuesTotal: datavalue,
                dataFilesTotal: datafile,
                dataOriginTotal: dataorigin,

                indNames: modiInsName,
                
                authenticated: true
            });
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else {
        res.render('data/utilizeData', {
            esession: session_value.getSession(),
            names: undefined,
            affiliations: undefined,
            dataTypes3: undefined,
            dataNames3: undefined,
            devices3: undefined,
            prices3: undefined,
            activityTypes3: undefined,
            dates3: undefined,

            s_names: undefined,
            s_affiliations: undefined,
            dataTypes4: undefined,
            dataNames4: undefined,
            devices4: undefined,
            prices4: undefined,
            activityTypes4: undefined,
            dates4: undefined,
            r_names: undefined,
            r_affiliations: undefined,

            names2 : undefined,
            affiliations2 : undefined,

            names10 : undefined,
            affiliations10 : undefined,
            
            activityTypes10 : undefined,
            dates10 : undefined,
            dateNames10 : undefined,
            dateTypes10 : undefined,
            prices10: undefined,
            devices10: undefined,

            dateNames11 : undefined,
            dateTypes11 : undefined,
            prices11: undefined,
            devices11: undefined,

            authenticated: false
        });
    }


});

router.post('/getUtilizeValues', function (req, res) {

    var checkValues = req.body.modifyCheck;
    var checkLen;

    var modiFlag = false;

    if (checkValues == undefined) {
        checkLen = 0;
    } 
    else {
        checkLen = checkValues.length;
    }
    /*
    if (Array.isArray(checkValues)) {
        modiFlag = false;
    }
    */
    if (!(checkLen == 0)) {
        console.log("------------check ------------", checkValues, checkValues.length);
        modiFlag = true;
    }

    if (!modiFlag) {
        console.log("false");
        modiFlag = false;
    }

    if (checkLen == 0) 
        modiFlag = false;

    if (modiFlag) {
        if(!Array.isArray(checkValues)){
            provInfo.push(dataN[checkValues]);
            provInfo.push(datavalue[checkValues]);
            provInfo.push(datafile[checkValues]);
            provInfo.push(dataorigin[checkValues]);

            console.log("modiFlag : ", modiFlag);
            console.log("provInfo : ", provInfo);
        }
        else{
            for(var i = 0; i < checkLen ; i++){
                provInfo.push(dataN[checkValues[i]]);
                provInfo.push(datavalue[checkValues[i]]);
                provInfo.push(datafile[checkValues[i]]);
                provInfo.push(dataorigin[checkValues[i]]);
    
                console.log("modiFlag : ", modiFlag);
                console.log("provInfo : ", provInfo);
            }
        }
        res.render('data/utilizeDataPage.ejs', {
            esession: session_value.getSession(),

            modiFlag: modiFlag,
            provInfo: provInfo,
            insNames: modiInsName,

            authenticated: true
        });  
    } else {
        res.send('<script type="text/javascript">alert("하나의 개인정보를 선택해주세요."); window.history.go(-1);</script>');
    }
});

router.post('/utilize_transfer', function (req, res) {
    console.log("utilize_Transfer")
    var session = driver.session();
    var session2 = driver.session();
    var session3 = driver.session();
    var session4 = driver.session();

    var company = req.body.company;
    var allowedPeriodFrom = req.body.allowedPeriodFrom;
    var allowedPeriodTo = req.body.allowedPeriodTo;
    var purpose = req.body.purpose;
    var method = req.body.method;
    var item = req.body.item;
    var price = req.body.price;

    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;
    var user_type;
    if(session_value.getSession().gubun == '사용자'){
        user_type = '개인'
    }

    let today = new Date();
    let year = today.getFullYear(); 
    let month = (today.getMonth() + 1).toString();  
    let day = today.getDate().toString();  
    if(month.length == 1){
        month = "0" + month
    }
    if(day.length == 1){
        day = "0" + day
    }
    var date = year.toString() + month + day

    console.log("DDD",  provInfo)
    console.log(company, allowedPeriodFrom, allowedPeriodTo, purpose, method, item);
    

    var mergeData = "MATCH (d:Data) "
                    + "WITH d.name as name, d.value as value, d.file_path as file_path, d.origin as origin, COLLECT(d) AS ns "
                    + "WHERE size(ns) > 1 "
                    + "CALL apoc.refactor.mergeNodes(ns) YIELD node "
                    + "RETURN node"
    var mergePerson = "MATCH (p:Person) "
                    + "WITH toLower(p.name) as name, p.pid as pid, p.p_type as p_type, COLLECT(p) AS ns "
                    + "WHERE size(ns) > 1 "
                    + "CALL apoc.refactor.mergeNodes(ns) YIELD node "
                    + "RETURN node"
    var deleteRel = "MATCH (s)-[r]->(e) "
                    + "with s,e,type(r) as typ, tail(collect(r)) as coll "
                    + "foreach(x in coll | delete x) "

    for(var i = 0 ; i < provInfo.length/4; i++){
        var receiveCypher = "CREATE (p:Person), (d:Data), (p2:Person), (ac:Activity)"
                            + "SET p = {name: '" + user_name + "', pid: '" + user_pid + "', p_type: '" + user_type + "'}, "
                            + "    d = {name: '" + provInfo[i*4] + "', value: '" + provInfo[i*4+1] + "', file_path:'" + provInfo[i*4+2] + "', origin:'" + provInfo[i*4+3] + "'}, "
                            + "    ac = {name: '활용', date:'" + date + "', detail: '', purpose: '" + purpose + "', item: '" + item + "', method: '" + method + "', price: '" + price + "' }, "
                            + "    p2 = {name: '" + company + "' , pid: '111111', p_type: '기관'} "
                            + "CREATE (p) <- [o:Own] -(ac), (p2) <- [u:Use{allowed_period_from:'" + allowedPeriodFrom + "', allowed_period_to: '" + allowedPeriodTo + "'}] -(ac), (ac) <- [g:Generate] -(d)"
        console.log(receiveCypher)
        session.run(receiveCypher)
        .then(function (result) {
        session2.run(mergeData)
            .then(function (result) {
                    session2.close()
            })
            .catch(function (err) {
                console.log(err);
            });
        session3.run(mergePerson)
            .then(function (result) {
                session3.close()
            })
            .catch(function (err) {
                console.log(err);
            });
        session4.run(deleteRel)
            .then(function (result) {
                session4.close()
            })
            .catch(function (err) {
                console.log(err);
            });
        session.close()
        })
        .catch(function (err) {
            console.log(err);
        });
    }
    res.render('data/utilizeData.ejs', {
        esession: session_value.getSession(), 
        dataNamesTotal: dataN,
        dataValuesTotal: datavalue,
        dataFilesTotal: datafile,
        dataOriginTotal: dataorigin,
        s_names: datasname,
        authenticated: true
    });
   
});


router.post('/node2Vec', function (req, res) {

    var range = req.body.range;
    console.log(range);
    var node2VecSession = driver.session();
    var searchSession = driver.session();
    var embeddingSize = 10;
    var nodeProperties = [];
    var nodeEmbeddings = [];
    var nodeLabels = [];
    var nodeLabelsTemp = [];
    var nodeOwners = [];
    var keyNodeIndex;
    var keyNodeProperties;
    var keyEmbeddings = [];
    var comparedProperties = [];
    var comparedEmbeddings = [];
    var comparedOwners = [];
    var comparedLabels = [];
    var searchPersonName;
    var personName;
    var nodeType = req.body.nodeType;
    var nameExceptIns = [];
    var similarityExceptIns = [];

    var warningZero = '<script type="text/javascript">'
                + 'alert("노드 타입을 선택해주세요.");'
                + 'window.history.go(-1);'
                + '</script>'
    var warningNone = '<script type="text/javascript">'
                + 'alert("검색 결과가 없습니다.");'
                + 'window.history.go(-1);'
                + '</script>'

    if(nodeType == 'personNode') {
        var startTime = new Date().getTime();
        console.log('Person');
        var personID = req.body.personID;

        var node2Vec = "CALL gds.alpha.node2vec.stream("
                    + "'Nodes', {"
                 /* + "walkLength: 80,"
                    + "windowSize: 10,"
                    + "inOutFactor: 1.0,"
                    + "returnFactor: 1.0," */
                    + "embeddingSize: " + embeddingSize + ", "
                    + "iterations: 1}) "
                    + "YIELD nodeId as id, embedding "
                    + "RETURN coalesce(gds.util.asNode(id).name + '/' + gds.util.asNode(id).pid) as keys, embedding, labels(gds.util.asNode(id)) as labels "

                    //console.log(node2Vec);
        //var cosineSimilarity = "RETURN gds.alpha.similarity.cosine(" + key1 + ", " + key2 + ") as similarity"
        //console.log(cosineSimilarity);

        node2VecSession.run(node2Vec)
                        .then(function (result) {
                            result.records.forEach(function (record) {
                                nodeProperties.push(String(record._fields[0]));
                                nodeEmbeddings.push(record._fields[1]);
                                nodeLabels.push(record._fields[2]);
                                //console.log("ONEW");
                                //console.log(nodeLabels);
                                //console.log(typeof(nodeLabels));
                                //console.log(nodeLabels[0]);
                                //console.log(nodeLabels[0][0]);
                                //console.log(nodeProperties);
                                //console.log(nodeEmbeddings);

                                searchPersonName = "MATCH (p:Person)"
                                                 + "WHERE p.pid = '" + personID + "'"
                                                 + "RETURN p.name";
                            })

                            /*
                            for (var node = 0; node < nodeEmbeddings.length; node++) {
                                for(var vector = 0; vector< nodeEmbeddings[node].length; vector++) {
                                    nodeEmbeddings[node][vector] = parseFloat(nodeEmbeddings[node][vector]);
                                }
                            }
                            
                            searchPersonName = "MATCH (p:Person)"
                                                + "WHERE p.pid = '" + personID + "'"
                                                + "RETURN p.name";
                            */

                            searchSession.run(searchPersonName)
                                        .then (function (result) {
                                            result.records.forEach(function (record) {
                                            personName = record._fields[0];

                                            //for(i = 0; i < nodeProperties.length; i++) attach labels to nodes
                                                //nodeProperties[i] = nodeLabels[i][0] + '/' + nodeProperties[i];

                                            //console.log("ONEW")
                                            //console.log(nodeProperties)

                                            for(i = 0; i < nodeLabels.length; i++) {
                                                nodeLabelsTemp[i] = nodeLabels[i][0]
                                            }

                                            //console.log("ONEW");
                                            //console.log(nodeLabelsTemp);
                                
                                            for (var node = 0, Index = 0; node < nodeProperties.length; node++, Index++) { 
                                                if(nodeProperties[node].includes(personName + '/' + personID)) {
                                                    keyNodeIndex = node;
                                                    Index = Index - 1;
                                                    //console.log(keyNodeIndex); positon of search keyword
                                                    //console.log(Index); check Index -1
                                                }
                                                else { 
                                                    comparedProperties[Index] = nodeProperties[node];
                                                    comparedEmbeddings[Index] = nodeEmbeddings[node]; 
                                                    comparedLabels[Index] = nodeLabelsTemp[node];
                                                    //else comparedProperties[Index] = { name : nodeProperties[node], similarity: nodeEmbeddings[node] };
                                                }
                                            }

                                            //console.log(comparedLabels);

                                            keyNodeProperties = nodeProperties[keyNodeIndex];
                                            keyEmbeddings = nodeEmbeddings[keyNodeIndex];

                                            // console.log(keyNodeProperties);
                                            //console.log(keyEmbeddings);

                                            /*
                                            console.log(nodeProperties);
                                            console.log(nodeEmbeddings);
                                            console.log(comparedProperties);
                                            console.log("LENGTH");
                                            console.log(nodeProperties.length);
                                            console.log(nodeEmbeddings.length);
                                            console.log(comparedProperties.length);
                                            */
                                            
                                            
                                        //for (var Index = 0; Index < comparedNode.length; Index++) {

                                                //cosineSimilarity = "RETURN gds.alpha.similarity.cosine([" + keyEmbeddings + "], [" + comparedNode[Index].similarity + "]) as similarity"
                                                //console.log(comparedNode);
                                                var process = spawn('python', [__dirname + '\\data\\node2Vec\\computeSimilarity.py', embeddingSize, keyEmbeddings, comparedProperties, comparedEmbeddings, nodeType, comparedLabels]);

                                                promiseFromChildProcess(process)
                                                .then(function (result) {
                                                    console.log('promise complete: ', result);
                                                    process.stdout.on('data', function (data) {
                                                            dataString = iconv.decode(data, 'EUC-KR').toString();
                                                            //dataString = data.toString();
                                                            similarityResult.setSimilarityResult(dataString);
                                                    });
                                                    process.on('close', function (data) {
                                                        //console.log(dataString);
                                                        var NEResult = similarityResult.getSimilarityResult();
                                                        if(NEResult.length < 1)
                                                            res.send(warningNone);
                                                        else {
                                                            var nameAndSimilarity = NEResult.split("+");
                                                            //nameAndSimilarity[1] = nameAndSimilarity[1].replace("(\r\n|\r|\n|\n\r)", "");
                                                            var name = nameAndSimilarity[0].split(",");
                                                            var similarity = nameAndSimilarity[1].split(",");
                                                            console.log(name);
                                                            console.log(similarity);
                                                            for(i = 0; i < similarity.length; i++){
                                                                similarity[i] = Number(similarity[i]);
                                                                similarity[i] = (similarity[i] + 1) / 2;
                                                                similarity[i] = similarity[i] * 10000;
                                                                similarity[i] = Math.floor(similarity[i]);
                                                                similarity[i] = similarity[i] / 100;
                                                                similarity[i] = String(similarity[i]) + '%';
                                                            };
                                                            for(i = 0; i < name.length; i++){
                                                                nameTemp = name[i].split('/');
                                                                nameSentence =  nameTemp[1] + '*' + nameTemp[2];
                                                                name[i] = nameSentence;
                                                            };
                                                            //console.log(name);
                                                            //console.log(similarity);

                                                            var ReturnKeyword = personName + '*' + personID;

                                                            for(i = 0, count = 0; i < name.length; i++) {
                                                                if (!(name[i].split('*'))[1].includes('-')) {
                                                                    nameExceptIns[count] = name[i];
                                                                    similarityExceptIns[count] = similarity[i];
                                                                    count = count + 1;
                                                                }
                                                            }
                                                            
                                                            /*
                                                            console.log(name);
                                                            console.log(nameExceptIns);
                                                            console.log(similarity);
                                                            console.log(similarityExceptIns);
                                                            */

                                                            console.log(nameExceptIns);
                                                            console.log(similarityExceptIns);
                                                            var endTime = new Date().getTime();
                                                            console.log("Execution time : ", (endTime - startTime));
                                                            
                                                            res.render("data/analyzeSimResult", {
                                                                esession: session_value.getSession(),
                                                                ReturnKeyword: ReturnKeyword,
                                                                name: nameExceptIns,
                                                                similarity: similarityExceptIns,
                                                                nodeType: 'personNode',
                                                                range: range
                                                            });
                                                            //res.redirect('data/analyzeSim');
                                                        }   
                                                    });
                                                }, function (err) {
                                                    console.log('promise rejected: ', err);
                                                });
                                                //console.log(cosineSimilarity);
                                                /*
                                                console.log(Index);
                                                cosineSimilaritySession.run(cosineSimilarity)
                                                                        .then (function (result) {
                                                                            result.records.forEach(function (record) {
                                                                                result = record._fields[0];
                                                                                console.log("SIMILARITY");
                                                                                console.log(result);
                                                                                //console.log("Dokja");
                                                                                //console.log(nodeProperties[0]);
                                                                            })
                                                                        })
                                                                        .catch(error => {
                                                                            console.log("WOW:" + error)
                                                                        })
                                                                        .then(() => cosineSimilaritySession.close())
                                                                        */
                                            //}
                                            })
                                        searchSession.close();
                                        })
                        node2VecSession.close();
                        })
    }
    else if(nodeType == 'dataNode') {
        console.log('Data');
        var dataOwnerID = req.body.dataOwnerID;
        var dataName = req.body.dataName;
        var range = req.body.range;
        console.log(range);

        var node2Vec = "CALL gds.alpha.node2vec.stream("
                    + "'Nodes', {"
                /* + "walkLength: 80,"
                    + "windowSize: 10,"
                    + "inOutFactor: 1.0,"
                    + "returnFactor: 1.0," */
                    + "embeddingSize: " + embeddingSize + ", "
                    + "iterations: 1}) "
                    + "YIELD nodeId as id, embedding "
                    + "RETURN coalesce(gds.util.asNode(id).name + '/' + gds.util.asNode(id).pid) as keys, embedding, labels(gds.util.asNode(id)) as labels, gds.util.asNode(id).etc as owner "

                    //console.log(node2Vec);

        //var cosineSimilarity = "RETURN gds.alpha.similarity.cosine(" + key1 + ", " + key2 + ") as similarity"
        //console.log(cosineSimilarity);

        node2VecSession.run(node2Vec)
                        .then(function (result) {
                            result.records.forEach(function (record) {
                                nodeProperties.push(String(record._fields[0]));
                                nodeEmbeddings.push(record._fields[1]);
                                nodeLabels.push(record._fields[2]);
                                nodeOwners.push(record._fields[3]);
                                //console.log("ONEW");
                                //console.log(nodeLabels);
                                //console.log(typeof(nodeLabels));
                                //console.log(nodeLabels[0]);
                                //console.log(nodeLabels[0][0]);
                                //console.log(nodeProperties);
                                //console.log(nodeEmbeddings);

                                searchPersonName = "MATCH (p:Person)"
                                                 + "WHERE p.pid = '" + dataOwnerID + "'"
                                                 + "RETURN p.name";
                            })

                            /*
                            for (var node = 0; node < nodeEmbeddings.length; node++) {
                                for(var vector = 0; vector< nodeEmbeddings[node].length; vector++) {
                                    nodeEmbeddings[node][vector] = parseFloat(nodeEmbeddings[node][vector]);
                                }
                            }
                            
                            searchPersonName = "MATCH (p:Person)"
                                                + "WHERE p.pid = '" + personID + "'"
                                                + "RETURN p.name";
                            */

                            searchSession.run(searchPersonName)
                                        .then (function (result) {
                                            result.records.forEach(function (record) {
                                            personName = record._fields[0];

                                            //for(i = 0; i < nodeProperties.length; i++) attach labels to nodes
                                                //nodeProperties[i] = nodeLabels[i][0] + '/' + nodeProperties[i];

                                           //console.log("ONEW")
                                            //console.log(nodeProperties)

                                            for(i = 0; i < nodeLabels.length; i++) {
                                                nodeLabelsTemp[i] = nodeLabels[i][0]
                                            }

                                            //console.log("ONEW");
                                            //console.log(nodeLabelsTemp);

                                            console.log(dataName + '/' + dataOwnerID);

                                            for (var node = 0, Index = 0; node < nodeProperties.length; node++, Index++) { 
                                                if(nodeProperties[node].includes(dataName + '/' + dataOwnerID)) {
                                                    keyNodeIndex = node;
                                                    Index = Index - 1;
                                                    //console.log(keyNodeIndex); positon of search keyword
                                                    //console.log(Index); check Index -1
                                                }
                                                else { 
                                                    comparedProperties[Index] = nodeProperties[node];
                                                    comparedEmbeddings[Index] = nodeEmbeddings[node];
                                                    comparedOwners[Index] = nodeOwners[node];
                                                    comparedLabels[Index] = nodeLabelsTemp[node];
                                                    //else comparedProperties[Index] = { name : nodeProperties[node], similarity: nodeEmbeddings[node] };
                                                }
                                            }

                                            keyNodeProperties = nodeProperties[keyNodeIndex];
                                            keyEmbeddings = nodeEmbeddings[keyNodeIndex];

                                            //console.log(keyNodeProperties);
                                            //console.log(keyEmbeddings);
                                            //console.log(nodeType);

                                            /*
                                            console.log(nodeProperties);
                                            console.log(nodeEmbeddings);
                                            console.log(comparedProperties);
                                            console.log("LENGTH");
                                            console.log(nodeProperties.length);
                                            console.log(nodeEmbeddings.length);
                                            console.log(comparedProperties.length);
                                            */

                                            
                                        //for (var Index = 0; Index < comparedNode.length; Index++) {

                                                //cosineSimilarity = "RETURN gds.alpha.similarity.cosine([" + keyEmbeddings + "], [" + comparedNode[Index].similarity + "]) as similarity"
                                                /*
                                                console.log(embeddingSize);
                                                console.log(keyEmbeddings);
                                                console.log(comparedProperties);
                                                console.log(comparedEmbeddings);
                                                console.log(nodeType);
                                                */
                                               console.log(comparedOwners);
                                                var process = spawn('python', [__dirname + '\\data\\node2Vec\\computeSimilarity.py', embeddingSize, keyEmbeddings, comparedProperties, comparedEmbeddings, nodeType, comparedLabels, comparedOwners]);

                                                promiseFromChildProcess(process)
                                                .then(function (result) {
                                                    console.log('promise complete: ', result);
                                                    process.stdout.on('data', function (data) {
                                                        dataString = iconv.decode(data, 'EUC-KR').toString();
                                                        //dataString = data.toString();
                                                        similarityResult.setSimilarityResult(dataString);
                                                    });
                                                    process.on('close', function (data) {
                                                        var NEResult = similarityResult.getSimilarityResult();
                                                        if(NEResult.length < 1)
                                                            res.send(warningNone);
                                                        else {
                                                            var nameAndSimilarity = NEResult.split("+");
                                                            //nameAndSimilarity[1] = nameAndSimilarity[1].replace("(\r\n|\r|\n|\n\r)", "");
                                                            //console.log(nameAndSimilarity);
                                                            var name = nameAndSimilarity[0].split(",");
                                                            var similarity = nameAndSimilarity[1].split(",");
                                                            console.log(name);
                                                            console.log(similarity);
                                                            for(i = 0; i < similarity.length; i++){
                                                                similarity[i] = Number(similarity[i]);
                                                                similarity[i] = (similarity[i] + 1) / 2;
                                                                similarity[i] = similarity[i] * 10000;
                                                                similarity[i] = Math.floor(similarity[i]);
                                                                similarity[i] = similarity[i] / 100;
                                                                similarity[i] = String(similarity[i]) + '%';
                                                            };
                                                            for(i = 0; i < name.length; i++){
                                                                nameTemp = name[i].split('/');
                                                                nameSentence =  nameTemp[1] + '*' + nameTemp[2] + '*' + nameTemp[3];
                                                                name[i] = nameSentence;
                                                            };
                                                            //console.log(name);    
                                                            //console.log(similarity);

                                                            var ReturnKeyword = personName + '*' + dataOwnerID + '*' + dataName;

                                                            res.render("data/analyzeSimResult", {
                                                                esession: session_value.getSession(),
                                                                ReturnKeyword: ReturnKeyword,
                                                                name: name,
                                                                similarity: similarity,
                                                                nodeType: 'dataNode',
                                                                range: range
                                                            });
                                                            //res.redirect('data/analyzeSim');
                                                        }
                                                    });
                                                }, function (err) {
                                                    console.log('promise rejected: ', err);
                                                });
                                                //console.log(cosineSimilarity);
                                                /*
                                                console.log(Index);
                                                cosineSimilaritySession.run(cosineSimilarity)
                                                                        .then (function (result) {
                                                                            result.records.forEach(function (record) {
                                                                                result = record._fields[0];
                                                                                console.log("SIMILARITY");
                                                                                console.log(result);
                                                                                //console.log("Dokja");
                                                                                //console.log(nodeProperties[0]);
                                                                            })
                                                                        })
                                                                        .catch(error => {
                                                                            console.log("WOW:" + error)
                                                                        })
                                                                        .then(() => cosineSimilaritySession.close())
                                                                        */
                                            //}
                                            })
                                        searchSession.close();
                                        })
                        node2VecSession.close();
                        })
    }
    else {
        res.send(warningZero);
    }
                    /* .catch(function (err) {
                        console.log(err);
                    })*/

    /* previous version (using gensim)
    if(req.body.nodeType == 'personNode') {
        var nodeKeyword = req.body.personName + ' ' + req.body.personValue;
    }
    else if(req.body.nodeType == 'dataNode') {
        var nodeKeyword = req.body.dataName + ' ' +  req.body.dataValue;
    }

    var nodeKeywords = nodeKeyword.split(' ')

    if(nodeKeywords[0] == '주소') 
        var nodeSentence = nodeKeywords[0] + ',' + nodeKeywords[1] + ' ' + nodeKeywords[2];
    else 
        var nodeSentence = nodeKeywords[0] + ',' + nodeKeywords[1];
    
    if(nodeKeywords[0] == '주소') 
        var ReturnKeyword = nodeKeywords[0] + '*' + nodeKeywords[1] + ' ' + nodeKeywords[2];
    else 
        var ReturnKeyword = nodeKeywords[0] + '*' + nodeKeywords[1];

    //console.log(nodeKeywords);
    //console.log(nodeSentence);

    var warningZero = '<script type="text/javascript">'
                + 'alert("검색어를 입력해주세요.");'
                + 'window.history.go(-1);'
                + '</script>'
    var warningNone = '<script type="text/javascript">'
                + 'alert("검색 결과가 없습니다.");'
                + 'window.history.go(-1);'
                + '</script>'
            
    var wrote = 0;
    var len = nodeKeyword.length;
    var nameTemp = [];

    var process = spawn('python', [__dirname + '\\data\\analyzeNode.py', nodeSentence]);

    if(len == 0) 
        res.send(warningZero);
    else{
        promiseFromChildProcess(process)
            .then(function (result) {
                console.log('promise complete: ', result);
                process.stdout.on('data', function (data) {
                    if (wrote == 0) {
                        dataString = iconv.decode(data, 'EUC-KR').toString();
                        //dataString = data.toString();
                        nodeResult.setnodeResult(dataString);
                    }
                    wrote += 1;
                });
                process.on('close', function (data) {
                    //console.log("dataString");
                    //console.log(dataString);
                    //console.log("nodeResult");
                    //console.log(nodeResult.getnodeResult());
                    var NEResult = nodeResult.getnodeResult();
                    //console.log(NEResult.length);
                    if(NEResult.length < 1)
                        res.send(warningNone);
                    else {
                        var nameAndSimilarity = NEResult.split("+");
                        var name = nameAndSimilarity[0].split("/");
                        var similarity = nameAndSimilarity[1].split("/");
                        for(i = 0; i < similarity.length; i++){
                            similarity[i] = Number(similarity[i]);
                            similarity[i] = similarity[i] * 10000;
                            similarity[i] = Math.floor(similarity[i]);
                            similarity[i] = similarity[i] / 100;
                            similarity[i] = String(similarity[i]) + '%';
                        };
                        for(i = 0; i < name.length; i++){
                            nameTemp = name[i].split(',');
                            nameSentence = nameTemp[0] + '*' + nameTemp[1];
                            name[i] = nameSentence;
                        };
                        console.log(name);
                        console.log(similarity);
                        res.render("data/analyzeSimResult", {
                            esession: session_value.getSession(),
                            ReturnKeyword: ReturnKeyword,
                            name: name,
                            similarity: similarity
                        });
                        //res.redirect('data/analyzeSim');
                    }
                });
            }, function (err) {
                console.log('promise rejected: ', err);
        });
    }
    //console.log(nodeResult.getnodeResult());

    res.redirect('data/analyzeSim');
    */
});

router.post('/downloadData', function (req, res) {

    var name = session_value.getSession().user; 
    var pid = session_value.getSession().pid;
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var actGenerate = req.body.generate;
    var actProcess = req.body.process;
    var actProvide = req.body.provide;
    var dateFlag = true;
    var actFlag = true;
    var datesArgvs = '';
    var actArgvs = '';

    var downloadPath = name + '(' + pid  + ')님의 이력데이터.xlsx'

    if(startDate.length == 0 || endDate.length == 0)
        dateFlag = false;
    else 
        datesArgvs = startDate + ',' + endDate;

    if(actGenerate == undefined && actProcess == undefined && actProvide == undefined)
        actFlag = false;
    else 
        actArgvs = actGenerate + ',' + actProcess + ',' + actProvide;

    //console.log(datesArgvs);
    //console.log(actArgvs);

    var wrote = 0;
    var process = spawn('python', [__dirname + '\\data\\exportProv2CSV.py', name, pid, dateFlag, actFlag, datesArgvs, actArgvs]);
    var startTime = new Date().getTime();

    process.stdout.on('data', function (data) {
        if (wrote == 0) {
            }
        wrote += 1;
    });
    var endTime = new Date().getTime();
    console.log("Execution time : ", (endTime - startTime));
    process.on('close', function (data) {
        res.download(downloadPath, function(err){
            if(err)
                res.json({err:err});
            else
                res.end();
        })
    });
});

router.post('/checkReceipt', function (req, res) {

    var session = driver.session();

    var name = session_value.getSession().user; 
    var pid = session_value.getSession().pid;
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;

    var utilCypher 

    var dataNames = []
    var filePaths = []
    var values = []
    var origins = []

    var dates = []
    var items = []
    var details = []
    var methods = []
    var purposes = []
    var prices = []
    
    var insts = []

    var APFroms = []
    var APTos = []
    var dateFlag;
    if(startDate == '' || endDate == ''){
        utilCypher = "MATCH (p)-[o:Own]-(ac), (p2)-[u:Use]-(ac), (ac)-[g:Generate]-(d) WHERE ac.name = '활용' AND p.name = '"+ name +"' AND p.pid = '"+ pid +"' RETURN d, ac, p2, u"
        dateFlag = false
    }
    else{
        utilCypher = "MATCH (p)-[o:Own]-(ac), (p2)-[u:Use]-(ac), (ac)-[g:Generate]-(d) WHERE ac.name = '활용' AND (ac.date >= '"+ startDate +"' AND ac.date <= '" + endDate + "') AND p.name = '"+ name +"' AND p.pid = '"+ pid +"' RETURN d, ac, p2, u"
        dateFlag = true
    }
    
    session.run(utilCypher)
    .then(function (result){
        result.records.forEach(function (record){

            dataNames.push(record._fields[0].properties.name)
            filePaths.push(record._fields[0].properties.file_path)
            values.push(record._fields[0].properties.value)
            origins.push(record._fields[0].properties.origin)

          
            dates.push(record._fields[1].properties.date)
            items.push(record._fields[1].properties.item)
            details.push(record._fields[1].properties.detail)
            methods.push(record._fields[1].properties.method)
            purposes.push(record._fields[1].properties.purpose)
            prices.push(record._fields[1].properties.price)
           
            insts.push(record._fields[2].properties.name)
           
            APFroms.push(record._fields[3].properties.allowed_period_from)
            APTos.push(record._fields[3].properties.allowed_period_to)
            session.close()
        })

        let unique = [...new Set(dataNames)];

        var dataResults = []
        var countResults = []
        var pricesResults = []

        var count;
        var indexs;
        var total;
        for(var i = 0; i<unique.length; i++){
            console.log(i)
            console.log(unique[i])
            dataResults.push(unique[i])
            
            count = 0;
            indexs = []
            for(var j = 0; j<dataNames.length ; j++){
                if(dataNames[j] == unique[i]){
                    count++;
                    indexs.push(j)
                }
            }
            countResults.push(count);
            
            total = 0;
            for(var k = 0; k<indexs.length; k++){
                total = total + parseInt(prices[indexs[k]])
            }
            pricesResults.push(total) 
            
        }
        
        var priceResult = 0
        for (var i = 0; i<pricesResults.length ; i++){
            priceResult = priceResult + pricesResults[i]
        }
        //var totalPrice = priceResult*1.1
        
        console.log(dataResults)
        console.log(countResults)
        console.log(pricesResults)

        console.log(priceResult)
        //console.log(totalPrice)
        res.render("data/utilizeDataReceiptResult", {
            esession: session_value.getSession(),
            
            dateFlag : dateFlag,
            startDate : startDate,
            endDate : endDate,

            dataResults: dataResults,
            countResults: countResults,
            pricesResults: pricesResults,
            priceResult: priceResult,
            //totalPrice: totalPrice,
            startDate: startDate,
            endDate: endDate,
            authenticated: true
        });
    })
    .catch(function (err){  
        console.log(err);
    });
});

router.post('/getReceiptTable', function (req, res) {
    var session = driver.session();
    var dataNameKey = req.body.dataName;
    console.log(req.body.dataName);
    console.log(req.body.startDateTemp);
    console.log(req.body.endDateTemp);
    //console.log("HI!");

    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;
    var user_type;

    var dataNames = []
    var filePaths = []
    var values = []
    var origins = []

    var dates = []
    var items = []
    var details = []
    var methods = []
    var purposes = []
    var prices = []
    
    var insts = []

    var APFroms = []
    var APTos = []



    if(session_value.getSession().gubun == '사용자'){
        user_type = '개인'
    }

    var utilCypher;
    utilCypher = "MATCH (p)-[o:Own]-(ac), (p2)-[u:Use]-(ac), (ac)-[g:Generate]-(d) "
                +"WHERE ac.name = '활용' AND p.name = '"+ user_name +"' AND p.pid = '"+ user_pid +"' "
                +"AND d.name = '" + dataNameKey + "' RETURN d, ac, p2, u"

    session.run(utilCypher)
    .then(function (result){
        result.records.forEach(function (record){

            dataNames.push(record._fields[0].properties.name)
            filePaths.push(record._fields[0].properties.file_path)
            values.push(record._fields[0].properties.value)
            origins.push(record._fields[0].properties.origin)

            
            dates.push(record._fields[1].properties.date)
            items.push(record._fields[1].properties.item)
            details.push(record._fields[1].properties.detail)
            methods.push(record._fields[1].properties.method)
            purposes.push(record._fields[1].properties.purpose)
            prices.push(record._fields[1].properties.price)
            
            insts.push(record._fields[2].properties.name)
            
            APFroms.push(record._fields[3].properties.allowed_period_from)
            APTos.push(record._fields[3].properties.allowed_period_to)
            session.close()
        })

        res.render("data/utilizeDataReceiptTable.ejs", {
            esession: session_value.getSession(),
            dataNames : dataNames,
            filePaths : filePaths,
            values : values,
            origins : origins,
        
            dates : dates,
            items : items,
            details : details,
            methods : methods,
            purposes : purposes,
            prices : prices,
            
            insts : insts,
        
            APFroms : APFroms,
            APTos : APTos,
            authenticated: true
        });
    })
    .catch(function (err){  
        console.log(err);
    });

            
});

module.exports = router;