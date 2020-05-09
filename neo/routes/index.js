var express = require('express');
var router = express.Router();
var app = express();
var mysql = require("mysql");
var esession = require('express-session');
var session_value = require('./session');
var Promise = require('promise');
var neo4j = require('neo4j-driver').v1;
var multer = require("multer");
var multiparty = require('multiparty');
var fs = require('fs');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const neo4j_connection = require('../public/scripts/config');
const db_info = neo4j_connection.Neo4j;
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(db_info.DB_USR, db_info.DB_PWD));
const session = driver.session();
const iconv = require('iconv-lite');
var keyResult = require('./keyResult');
var Cy2NeoD3 = require('../public/scripts/cy2neod3')

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

let add = multer({
    dest: "add/"
});

router.post('/dataAdd', function (req, res) {
    var dataName = req.body.dataName;
    var value = req.body.value;
    var origin = req.body.origin;
    var file_path = req.body.file_path;

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

   // track progress

    session
        .run("CREATE (d:Data {name: '" + dataName + "' , value: '" + value + "' , origin: '" + origin + "', file_path: '" + file_path + "'})-[:Generate]->(ac:Activity {name: '생성', date: '" + date + "', detail: '' })-[:Act]->(p:Person {name: '" + user_name + "' , pid: '" + user_pid + "', p_type: '" + user_type + "'})")
        .then(function (result) {
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.render('addPage', {esession: session_value.getSession()});
});

router.get('/addPage', function (req, res, next) {
    res.render('addPage', {esession: session_value.getSession()});
})

router.get('/', function (req, res, next) {
    res.render('index', {esession: session_value.getSession()});
});


router.get('/viewPage', function (req, res) {
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

    var dataNamesTotal = [];
    var dataValuesTotal =[];
    var dataFilesTotal =[];
    var dataOriginTotal =[];


    //var dataOwner = [];
    //var dataOwnerAff = [];

    var i = 0;
    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    
    if (user_gubun == '사용자') {
        console.log('사용자')
        session
          .run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '생성' AND p.name = '" + user_name + "' RETURN p, d, ac LIMIT 10")
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
            });
            
            session.run("MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '가공' AND ( p.name = '" + user_name + "' ) RETURN p, d2, ac, d1 LIMIT 10")
          .then(function (result) {
            result.records.forEach(function (record) {

              nameArr.push(record._fields[0].properties.name)
              pidArr.push(record._fields[0].properties.pid)
              pTypeArr.push(record._fields[0].properties.p_type)
              //affiliationArr.push(record._fields[0].properties.affiliation)

              dataNameArr3.push(record._fields[1].properties.name)
              valueArr3.push(record._fields[1].properties.value)
              file_pathArr3.push(record._fields[1].properties.file_path)
              originArr3.push(record._fields[1].properties.origin)
              //deviceArr3.push(record._fields[1].properties.device)
              //priceArr3.push(record._fields[1].properties.price)
              //dataOwner.push(record._fields[1].properties.owner)
              //dataOwnerAff.push(record._fields[1].properties.owner_aff)

              activityTypeArr3.push(record._fields[2].properties.name)
              dateArr3.push(record._fields[2].properties.date)
              detailArr3.push(record._fields[2].properties.detail)

              dataNameArr215.push(record._fields[3].properties.name)
              valueArr215.push(record._fields[3].properties.value)
              file_pathArr215.push(record._fields[3].properties.file_path)
              originArr215.push(record._fields[3].properties.origin)

              //nameArr2.push(record._fields[3].properties.name)
              //pidArr2.push(record._fields[3].properties.pid)
              //pTypeArr2.push(record._fields[3].properties.p_type)
              //affiliationArr2.push(record._fields[3].properties.affiliation)

              dataNamesTotal.push(record._fields[1].properties.name)
              dataValuesTotal.push(record._fields[1].properties.value)
              dataFilesTotal.push(record._fields[1].properties.file_path)
              dataOriginTotal.push(record._fields[1].properties.origin)
            });

              session.run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) WHERE ac.name = '제공' AND p1.name = '" + user_name + "' RETURN p1, d, ac, r, p2 LIMIT 10")
              .then(function (result) {
                result.records.forEach(function (record) {
    
                  nameArr10.push(record._fields[0].properties.name)
                  pidArr10.push(record._fields[0].properties.pid)
                  pTypeArr10.push(record._fields[0].properties.p_type)
                  //affiliationArr10.push(record._fields[0].properties.affiliation)
    
                  dataNameArr10.push(record._fields[1].properties.name)
                  valueArr10.push(record._fields[1].properties.value)
                  file_pathArr10.push(record._fields[1].properties.file_path)
                  originArr10.push(record._fields[1].properties.origin)
                  //dataTypeArr10.push(record._fields[1].properties.d_type)
                  //deviceArr10.push(record._fields[1].properties.device)
                  //priceArr10.push(record._fields[1].properties.price)
                  //dataOwner.push(record._fields[1].properties.owner)
                  //dataOwnerAff.push(record._fields[1].properties.owner_aff)
    
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
    

                });
                res.render('viewPage', {
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
                    //devices10: deviceArr10,
                    //dateNames11 : dataNameArr11,
                    //dateTypes11 : dataTypeArr11,
                    //prices11: priceArr11,
                    //devices11: deviceArr11,

                    dataNamesTotal: dataNamesTotal,
                    dataValuesTotal: dataValuesTotal,
                    dataFilesTotal: dataFilesTotal,
                    dataOriginTotal: dataOriginTotal,
                    
                    authenticated: true
                });
            });
          });
                session.close();
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else if (user_gubun == '관리자') {
        console.log("관리자")
        session
          .run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) WHERE ac.name = '생성' RETURN p, d, ac LIMIT 10")
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


          session.run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) WHERE ac.name IN ['배포', '판매'] RETURN p1, d, ac, p2 LIMIT 10")
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

              session.run("MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) WHERE ac.name IN ['가공', '변환'] RETURN p, d2, ac, d1 LIMIT 10")
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


          res.render('viewPage', {
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
      session.close();
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

router.post('/DataSearch', function (req, res) {
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

    var returnCyper5 = ") RETURN p, d2, ac, d1 LIMIT 10"
    var returnCyper4 = ") RETURN p1, d, ac, r, p2 LIMIT 10"
    var returnCyper3 = ") RETURN p, d, ac LIMIT 10"
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
                session.close();
            })
        .catch(function (err) {
            console.log(err);
        });
});

router.post('/nameSearch', function (req, res) {
    var name = req.body.name;

    var nameFlag = true;

    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    var user_pid = session_value.getSession().pid;

    //제공
    var s_nameArr = [];
    var s_pidArr = [];
    var s_pTypeArr = [];
    var activityTypeArr4 = [];
    var dateArr4 = [];
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

    console.log("name: " + name);


    var matchCyper4;

    var returnCyper4 = ") RETURN p1, d, ac, r, p2 LIMIT 10"

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
        res.render('search/searchNameResult.ejs', {
            esession: session_value.getSession(),

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

});

router.post('/periodSearch', function (req, res) {
    var end_date = req.body.start_date;
    var start_date = req.body.end_date;
    var activityType = req.body.activityType;

    //생성
    var nameArr = [];
    var pidArr = [];
    var p_typeArr = [];
    var activityTypeArr3 = [];
    var dateArr3 = [];
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

    var returnCyper5 = "RETURN p, d2, ac, d1 LIMIT 10"
    var returnCyper4 = "RETURN p1, d, ac, r, p2 LIMIT 10"
    var returnCyper3 = "RETURN p, d, ac LIMIT 10"

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
            newQuery3 = newQuery3 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') AND (ac.name = '생성') "
        }
        else if (activityType == '제공'){
            newQuery4 = newQuery4 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') AND (ac.name = " + "'" + activityType + "') "
        } 
        else {
            newQuery5 = newQuery5 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') AND (ac.name = " + "'" + activityType + "') "
        }
    }
    else {
        for (var i = 0; i < (2 - nullcount); i++) {
            if (end_dateFlag && start_date) {
                newQuery5 = newQuery5 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') and ac.name = '가공' " ;
                newQuery4 = newQuery4 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') and ac.name = '제공' ";
                newQuery3 = newQuery3 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') and ac.name = '생성' ";

                end_dateFlag = false;
                start_dateFlag = false;
                query3 = true;
                query4 = true;
                query5 = true;
            }
            else if (activityTypeFlag) {
                activityTypeFlag = false;
                if (activityType == '생성') {
                    newQuery3 = newQuery3 + " (ac.name = '생성') "
                    query3 = true;
                }
                if (activityType == '제공'){
                    newQuery4 = newQuery4 + " (ac.name = '" + activityType + "') "
                    query4 = true;
                }
                else {
                    newQuery5 = newQuery5 + " (ac.name = '" + activityType + "') "
                    query5 = true;
                }
            }
        }
    }
    newQuery5 = newQuery5 + returnCyper5;
    newQuery4 = newQuery4 + returnCyper4;
    newQuery3 = newQuery3 + returnCyper3;

    console.log(newQuery3)
    console.log(newQuery4)
    console.log(newQuery5)


    if (activityType == '생성') {

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

                    authenticated: true
                });

                session.close();
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else if (activityType == '제공') {

        session.run(newQuery4)
            .then(function (result) {
                query3 = false;
                query4 = true;
                query5 = false;
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
        else { //가공

            session.run(newQuery5)
                .then(function (result) {
                    query3 = false;
                    query4 = false;
                    query5 = true;
                    query5resultNum = result.records.length;
                    if (query5resultNum != 0) {
                        result.records.forEach(function (record) {
    
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
                    
                    session.close();
                })
                .catch(function (err) {
                    console.log(err);
                });
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
    var keyStr = req.body.keyword;
    console.log(keyStr);

    var wrote = 0;
    var process = spawn('python', [__dirname + '\\search\\search.py', keyStr]);


    /*
    Promise.all([getCheckNode(keyword[0]), getCheckNode(keyword[1])])
        .then(function(results){
            console.log("TT: ", results);
            resolve(results);
        })
        .then(
            session.run("MATCH (personA:Person { name: '양유정', affiliation: '한국인터넷진흥원'}), (personB:Person { name: '서민지', affiliation: '한국보건산업진흥원' }) WITH personA, personB MATCH p = shortestPath((personA)-[*]-(personB)) RETURN p, length(p)")
            .then(function (result) {
                console.log(result.records[0].get('p'))
                console.log(result.records[0].get('length(p)'))
            })
        )
            */

    var startTime = new Date().getTime();
    if(keyStr == '' || keyStr == null) {
        res.send('<script type="text/javascript">alert("검색어를 입력해주세요."); window.history.go(-1);</script>');
    }
    else{
        promiseFromChildProcess(process)
            .then(function (result) {
                //console.log('promise complete: ', result);
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
                    console.log(kk)

                    //res.render("search/searchKeyword.ejs", {esession: session_value.getSession(), data:keyResult.getKeywordResult()});
                    res.redirect('search/searchKeyword');
                });
            }, function (err) {
                console.log('promise rejected: ', err);
        });
    }

});

router.get('search/searchKeyword', function(req, res){
    res.render("search/searchKeyword", {esession: session_value.getSession(), data:keyResult.getKeywordResult()});
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
                session.close();
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

    var returnCyper5 = ") RETURN p, d2, ac, d1 LIMIT 10"
    var returnCyper4 = ") RETURN p1, d, ac, p2 LIMIT 10"
    var returnCyper3 = ") RETURN p, d, ac LIMIT 10"
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

router.post('/dataModify', function (req, res) {
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
                });
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
        } */
    }

});

router.post('/getModifyValues', function (req, res) {
    var checkValues5 = req.body.modifyCheck5;
    var checkValues4 = req.body.modifyCheck4;
    var checkValues3 = req.body.modifyCheck3;
    var check3Len;
    var check4Len;
    var check5Len;

    var multiCheckFlag = false;
    var modiFlag3 = false;
    var modiFlag4 = false;
    var modiFlag5 = false;

    var activityType = ['생성', '가공', '변환', '배포', '판매'];
    var deviceType = ['AI스피커', 'T머니', '레일플러스', '스마트워치', '페이션트모니터', '캐시비'];
    var dataType = ['건강데이터', '의료데이터', '위치데이터', '음성데이터'];

    if (checkValues3 == undefined) {
        check3Len = 0;
    } else {
        check3Len = checkValues3.length;
    }

    if (checkValues4 == undefined) {
        check4Len = 0;
    } else {
        check4Len = checkValues4.length;
    }

    if (checkValues5== undefined) {
        check5Len = 0;
    } else {
        check5Len = checkValues5.length;
    }

    if (check3Len == 1) {
        console.log("------------check3 ------------", checkValues3, checkValues3.length);
        modiFlag3 = true;
    }
    else if (check4Len == 1) {
        console.log("------------check4 ------------", checkValues4, checkValues4.length);
        modiFlag4 = true;
    }
    else if (check5Len == 1) {
        console.log("------------check5 ------------", checkValues5, checkValues5.length);
        modiFlag5 = true;
    }

    if (modiFlag4 && modiFlag3 && modiFlag5) {
        console.log("all false");
        modiFlag3 = false;
        modiFlag4 = false;
        modiFlag5 = false;
    }

    if ((check3Len + check4Len + check5Len) > 1) {
        modiFlag3 = false;
        modiFlag4 = false;
        modiFlag5 = false;
    }

    if (modiFlag3) {
        provInfo3.push(nameArr[checkValues3]);
        provInfo3.push(affiliationArr[checkValues3]);
        provInfo3.push(activityTypeArr3[checkValues3]);
        provInfo3.push(dateArr3[checkValues3]);
        provInfo3.push(dataNameArr3[checkValues3]);
        provInfo3.push(priceArr3[checkValues3]);
        provInfo3.push(deviceArr3[checkValues3]);
        provInfo3.push(dataTypeArr3[checkValues3]);

        console.log("modiFlag3 : ", modiFlag3);


        res.render('data/modifyDataPage.ejs', {
            esession: session_value.getSession(),

            modiFlag3: modiFlag3,
            modiFlag4: modiFlag4,
            modiFlag5: modiFlag5,
            provInfo3: provInfo3,

            activityType: activityType,
            dataType: dataType,
            deviceType: deviceType,

            authenticated: true
        });
    } else if (modiFlag4) {
        provInfo4.push(s_nameArr[checkValues4]);
        provInfo4.push(s_affiliationArr[checkValues4]);
        provInfo4.push(activityTypeArr4[checkValues4]);
        provInfo4.push(dateArr4[checkValues4]);
        provInfo4.push(dataNameArr4[checkValues4]);
        provInfo4.push(dataTypeArr4[checkValues4]);
        provInfo4.push(priceArr4[checkValues4]);
        provInfo4.push(deviceArr4[checkValues4]);
        provInfo4.push(r_nameArr[checkValues4]);
        provInfo4.push(r_affiliationArr[checkValues4]);

        console.log("modiFlag4 : ", modiFlag4);
        console.log(provInfo4[0]);

        res.render('data/modifyDataPage.ejs', {
            esession: session_value.getSession(),

            modiFlag3: modiFlag3,
            modiFlag4: modiFlag4,
            modiFlag5: modiFlag5,
            provInfo4: provInfo4,

            activityType: activityType,
            dataType: dataType,
            deviceType: deviceType,

            authenticated: true
        });
    } else if (modiFlag5) {
        provInfo5.push(nameArr5[checkValues5]);
        provInfo5.push(affiliationArr5[checkValues5]);
        provInfo5.push(dataNameArr5[checkValues5]);
        provInfo5.push(dataTypeArr5[checkValues5]);
        provInfo5.push(deviceArr5[checkValues5]);
        provInfo5.push(priceArr5[checkValues5]);
        provInfo5.push(activityTypeArr5[checkValues5]);
        provInfo5.push(dateArr5[checkValues5]);
        provInfo5.push(dataNameArr6[checkValues5]);
        provInfo5.push(dataTypeArr6[checkValues5]);
        provInfo5.push(deviceArr6[checkValues5]);
        provInfo5.push(priceArr6[checkValues5]);

        console.log("modiFlag5 : ", modiFlag5);

        res.render('data/modifyDataPage.ejs', {
            esession: session_value.getSession(),

            modiFlag3: modiFlag3,
            modiFlag4: modiFlag4,
            modiFlag5: modiFlag5,
            provInfo5: provInfo5,

            activityType: activityType,
            dataType: dataType,
            deviceType: deviceType,

            authenticated: true
        });
    } else {
        res.send('<script type="text/javascript">alert("하나의 이력만 선택해주세요."); window.history.go(-1);</script>');
    }
});

router.post('/modify', function (req, res) {
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

    var returnCyper5 = ") RETURN p, d2, ac, d1 LIMIT 10"
    var returnCyper4 = ") RETURN p1, d, ac, p2 LIMIT 10"
    var returnCyper3 = ") RETURN p, d, ac LIMIT 10"
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
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
});


module.exports = router;