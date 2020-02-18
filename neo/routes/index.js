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

router.get('/search/searchkey', function (req, res, next) {
    var process = spawn('python', [__dirname + '/search/search.py']);
    var wrote = 0;
    promiseFromChildProcess(process)
        .then(function (result) {
            console.log('promise complete: ', result);
            process.stdout.on('data', function (data) {
                if (wrote == 0) {
                    keyword_result = iconv.decode(data, 'EUC-KR').toString();
                    keyResult.setKeywordResult(keyword_result);
                }
                wrote += 1;
            });
            process.on('close', function (data) {
                res.redirect('/search/searchKeyword');
            });
        }, function (err) {
            console.log('promise rejected: ', err);
        });
});

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

    con.query("INSERT INTO iitp.users (name, email, password, gubun) VALUES (?, ?, ?, ?);", [
        body.name, body.email, body.password, body.gubun
    ], function (err, rows, fields) {

        console.log("err : " + err);
        console.log("rows : " + rows);
        console.log("insertId : " + rows.insertId);

        res.redirect("/contact");
    });
});

router.get('/logout', function (req, res, next) {
    session_value.setSession('', '', '', '', false);
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
        var gubun = body.gubun;

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
                    session_value.setSession(body.email, results[0]["name"], results[0]["gubun"], body.password, true);
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

var PythonShell = require('python-shell');
var options = {
    mode: 'text',
    pythonPath: '',
    pythonOptions: ['-u'],
    scriptPath: '',
    args: ['value1', 'value2', 'value3']
};


router.post('/data/uploadData', function (req, res, next) {
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


        // var cmd = "python "+ path + "keywordData.py " + path1 + "upload\\"+ name;
        //var c = "python " + path + "s.py "


        var cmd = "python " + path + "KeywordSearch\\keywordData.py " + path1 + "upload\\" + name;

        //console.log(cmd)
        exec(cmd);

        var spawn = require("child_process").spawn;

        // Parameters passed in spawn -
        // 1. type_of_script
        // 2. list containing Path of the script
        //    and arguments for the script

        // E.g : http://localhost:3000/name?firstname=Mike&lastname=Will
        // so, first name = Mike and last name = Will
        var process = spawn('python', [c,
            "DD",
            "SSS"]);

        // Takes stdout data from script which executed
        // with arguments and send this data to res object
        process.stdout.on('data', function (data) {
            res.send(data.toString());
        })

        res.render('data/uploadData', {esession: session_value.getSession()});
    });

    // track progress
    form.on('progress', function (byteRead, byteExpected) {
        console.log(' Reading total  ' + byteRead + '/' + byteExpected);
    });

    form.parse(req);
})

router.post('/create', upload.single("file"), function (req, res, next) {

    let file = req.file
    let result = {
        originalName: file.originalname,
        size: file.size,
    }

    res.render('data/uploadData', {esession: session_value.getSession()});
    //res.json(result);
});


router.post('/dataAdd', function (req, res) {
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


    if (activityType == '수정') {
        session
            .run("CREATE(a: Agent {name: '" + name + "' , affiliation: '" + affiliation + "' }) <- [:wasAttributedTo] - (e: Entity {name: '" + dataName + "' , price: '" + price + "' , d_type: '" + dataType + "', device: '" + device + "'})  - [:wasGeneratedBy] -> (ac:Activity {name: '" + activityType + "', date: '" + date + "'})")
            .then(function (result) {
                session.close();
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else {
        session
            .run("CREATE(a: Agent {name: '" + name + "' , affiliation: '" + affiliation + "'}) <- [:wasAttributedTo] - (e: Entity {name: '" + dataName + "' , price: '" + price + "' , d_type: '" + dataType + "', device: '" + device + "'})  - [:wasGeneratedBy] -> (ac:Activity {name: '" + activityType + "', date: '" + date + "' }) - [:wasAssociatedWith] -> (a1: Agent {name: '" + r_name + "' , affiliation: '" + r_affiliation + "' })")
            .then(function (result) {
                session.close();
            })
            .catch(function (err) {
                console.log(err);
            });
    }
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
    var nameArr2 = [];
    var affiliationArr2 = [];

    var s_nameArr = [];
    var s_affiliationArr = [];
    var r_nameArr = [];
    var r_affiliationArr = [];

    var activityTypeArr4 = [];
    var dateArr4 = [];
    var dataNameArr4 = [];
    var dataTypeArr4 = [];
    var priceArr4 = [];
    var deviceArr4 = [];

    var activityTypeArr3 = [];
    var dateArr3 = [];
    var dataNameArr3 = [];
    var dataTypeArr3 = [];
    var priceArr3 = [];
    var deviceArr3 = [];

    var nameArr10 = [];
    var affiliationArr10 = [];

    var activityTypeArr10 = [];
    var dateArr10 = [];
    var dataNameArr10 = [];
    var dataTypeArr10 = [];
    var priceArr10 = [];
    var deviceArr10 = [];

    var nameArr11 = [];
    var affiliationArr11 = [];

    var dataNameArr11 = [];
    var dataTypeArr11 = [];
    var priceArr11 = [];
    var deviceArr11 = [];


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

                session.run("MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), (ac:Activity)-[r:Receive]-(p2:Person) WHERE ac.name IN ['배포', '판매'] AND ( p1.name = '" + user_name + "' OR p2.name = '" + user_name + "' ) RETURN p1, d, ac, p2 LIMIT 10")
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

                        session.run("MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) WHERE ac.name IN ['가공', '변환'] AND p.name = '" + user_name + "' RETURN p, d1, ac, d2 LIMIT 10")
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

                                    names2: nameArr2,
                                    affiliations2: affiliationArr2,
                                    names10: nameArr10,
                                    affiliations10: affiliationArr10,
                                    activityTypes10: activityTypeArr10,
                                    dates10: dateArr10,
                                    dateNames10: dataNameArr10,
                                    dateTypes10: dataTypeArr10,
                                    prices10: priceArr10,
                                    devices10: deviceArr10,
                                    dateNames11: dataNameArr11,
                                    dateTypes11: dataTypeArr11,
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

                        session.run("MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), (ac:Activity)-[:Act]-(p:Person) WHERE ac.name IN ['가공', '변환'] RETURN p, d1, ac, d2 LIMIT 10")
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

                                    names2: nameArr2,
                                    affiliations2: affiliationArr2,
                                    names10: nameArr10,
                                    affiliations10: affiliationArr10,
                                    activityTypes10: activityTypeArr10,
                                    dates10: dateArr10,
                                    dateNames10: dataNameArr10,
                                    dateTypes10: dataTypeArr10,
                                    prices10: priceArr10,
                                    devices10: deviceArr10,
                                    dateNames11: dataNameArr11,
                                    dateTypes11: dataTypeArr11,
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

            names2: undefined,
            affiliations2: undefined,

            names10: undefined,
            affiliations10: undefined,

            activityTypes10: undefined,
            dates10: undefined,
            dateNames10: undefined,
            dateTypes10: undefined,
            prices10: undefined,
            devices10: undefined,

            names11: undefined,
            affiliations11: undefined,

            dateNames11: undefined,
            dateTypes11: undefined,
            prices11: undefined,
            devices11: undefined,

            authenticated: false
        });
    }
});

router.post('/DataSearch', function (req, res) {
    var dataName = req.body.dataName;
    var dataType = req.body.dataType;
    var device = req.body.device;
    var price = req.body.price;

    var dataNameFlag = true;
    var dataTypeFlag = true;
    var deviceFlag = true;
    var priceFlag = true;

    var nameArr = [];
    var affiliationArr = [];
    var activityTypeArr3 = [];
    var dateArr3 = [];
    var dataNameArr3 = [];
    var dataTypeArr3 = [];
    var priceArr3 = [];
    var deviceArr3 = [];

    var s_nameArr = [];
    var s_affiliationArr = [];
    var activityTypeArr4 = [];
    var dateArr4 = [];
    var dataNameArr4 = [];
    var dataTypeArr4 = [];
    var priceArr4 = [];
    var deviceArr4 = [];
    var r_nameArr = [];
    var r_affiliationArr = [];

    var nameArr5 = [];
    var affiliationArr5 = [];
    var activityTypeArr5 = [];
    var dateArr5 = [];
    var dataNameArr5 = [];
    var dataTypeArr5 = [];
    var priceArr5 = [];
    var deviceArr5 = [];
    var nameArr6 = [];
    var affiliationArr6 = [];
    var dataNameArr6 = [];
    var dataTypeArr6 = [];
    var priceArr6 = [];
    var deviceArr6 = [];

    var query4resultNum;
    var query3resultNum;
    var query5resultNum;

    console.log("dataName: " + dataName);
    console.log("device: " + device);
    console.log("dataType: " + dataType);
    console.log("price: " + price);

    var nullcount = 0;
    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;

    var deviceCyper3 = " d.device = ";
    var dataNameCyper3 = " d.name = ";
    var dataTypeCyper3 = " d.d_type = ";
    var priceCyper3 = " d.price = ";
    var deviceCyper4 = " d1.device = ";
    var dataNameCyper4 = " d1.name = ";
    var dataTypeCyper4 = " d1.d_type = ";
    var priceCyper4 = " d1.price = ";
    var deviceCyper5 = " d1.device = ";
    var dataNameCyper5 = " d2.name = ";
    var dataTypeCyper5 = " d2.d_type = ";
    var priceCyper5 = " d2.price = ";

    if (device == '') {
        deviceFlag = false;
        nullcount++;
    }
    if (dataName == '' || dataName == undefined) {
        dataNameFlag = false;
        nullcount++;
    }
    if (dataType == '') {
        dataTypeFlag = false;
        nullcount++;
    }
    if (price == '') {
        priceFlag = false;
        nullcount++;
    }

    var matchCyper5;
    var matchCyper4;
    var matchCyper3;

    var returnCyper5 = ") RETURN p1, d1, ac, p2, d2 LIMIT 10"
    var returnCyper4 = ") RETURN p1, d1, ac, p2 LIMIT 10"
    var returnCyper3 = ") RETURN p, d, ac LIMIT 10"
    var whereCyper5 = " WHERE ac.name IN ['수정', '가공', '변환'] AND ("
    var whereCyper4 = " WHERE ac.name IN ['배포', '판매', '전달'] AND ("
    var whereCyper3 = " WHERE ac.name = '생성' AND ("
    var newQuery5;
    var newQuery4;
    var newQuery3;

    if (user_gubun == '관리자') {
        matchCyper5 = "MATCH (p1:Person)<-[:Own]-(d1:Data), (d1:Data)<-[:Generate]-(ac:Activity), (ac:Activity)-[:Act]-(p2:Person), (d2:Data)-[:Generate]-(ac:Activity)"
        matchCyper4 = "MATCH (p1:Person)<-[:Own]-(d1:Data)-[:Generate]-(ac:Activity)-[:Generate]-(d2:Data)-[:Own]-(p2:Person)"
        matchCyper3 = "MATCH (p:Person)<-[:Own]-(d:Data)<-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + whereCyper5;
        newQuery4 = matchCyper4 + whereCyper4;
        newQuery3 = matchCyper3 + whereCyper3;
    }
    else {
        matchCyper5 = "MATCH (p1:Person)<-[:Own]-(d1:Data), (d1:Data)<-[:Generate]-(ac:Activity), (ac:Activity)-[:Act]-(p2:Person), (d2:Data)-[:Generate]-(ac:Activity)"
        matchCyper4 = "MATCH (p1:Person)<-[:Own]-(d1:Data)-[:Generate]-(ac:Activity)-[:Generate]-(d2:Data)-[:Own]-(p2:Person)"
        matchCyper3 = "MATCH (p:Person{name: '" + user_name + "' })<-[:Own]-(d:Data)<-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + whereCyper5 + "p1.name = '" + user_name + "' OR p2.name = '" + user_name + "') AND (";
        newQuery4 = matchCyper4 + whereCyper4 + "p1.name = '" + user_name + "' OR p2.name = '" + user_name + "') AND (";
        newQuery3 = matchCyper3 + whereCyper3;
    }

    for (var i = 0; i < (4 - nullcount); i++) {
        if (deviceFlag) {
            newQuery5 = newQuery5 + deviceCyper5 + "'" + device + "' OR " + deviceCyper4 + "'" + device + "'";
            newQuery4 = newQuery4 + deviceCyper4 + "'" + device + "'";
            newQuery3 = newQuery3 + deviceCyper3 + "'" + device + "'";
            deviceFlag = false;
        }
        else if (dataNameFlag) {
            newQuery5 = newQuery5 + dataNameCyper5 + "'" + dataName + "' OR " + dataNameCyper4 + "'" + dataName + "'";
            newQuery4 = newQuery4 + dataNameCyper4 + "'" + dataName + "'";
            newQuery3 = newQuery3 + dataNameCyper3 + "'" + dataName + "'";
            dataNameFlag = false;
        }

        else if (dataTypeFlag) {
            newQuery5 = newQuery5 + dataTypeCyper5 + "'" + dataType + "' OR " + dataTypeCyper4 + "'" + dataType + "'";
            newQuery4 = newQuery4 + dataTypeCyper4 + "'" + dataType + "'";
            newQuery3 = newQuery3 + dataTypeCyper3 + "'" + dataType + "'";
            dataTypeFlag = false;
        }
        else if (priceFlag) {
            newQuery5 = newQuery5 + priceCyper5 + "'" + price + "' OR " + priceCyper4 + "'" + price + "'";
            newQuery4 = newQuery4 + priceCyper4 + "'" + price + "'";
            newQuery3 = newQuery3 + priceCyper3 + "'" + price + "'";
            priceFlag = false;
        }
        if ((i + 1) != (4 - nullcount)) {
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

                    nameArr5.push(record._fields[0].properties.name)
                    affiliationArr5.push(record._fields[0].properties.affiliation)

                    dataNameArr5.push(record._fields[1].properties.name)
                    dataTypeArr5.push(record._fields[1].properties.d_type)
                    deviceArr5.push(record._fields[1].properties.device)
                    priceArr5.push(record._fields[1].properties.price)

                    activityTypeArr5.push(record._fields[2].properties.name)
                    dateArr5.push(record._fields[2].properties.date)

                    nameArr6.push(record._fields[3].properties.name)
                    affiliationArr6.push(record._fields[3].properties.affiliation)

                    dataNameArr6.push(record._fields[4].properties.name)
                    dataTypeArr6.push(record._fields[4].properties.d_type)
                    deviceArr6.push(record._fields[4].properties.device)
                    priceArr6.push(record._fields[4].properties.price)
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

                nameArr6.push(' ')
                affiliationArr6.push(' ')

                dataNameArr6.push(' ')
                dataTypeArr6.push(' ')
                deviceArr6.push(' ')
                priceArr6.push(' ')
            }

            session.run(newQuery4)
                .then(function (result) {
                    query4resultNum = result.records.length;
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


                            res.render('search/searchDataResult.ejs', {
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

                                names5: nameArr5,
                                affiliations5: affiliationArr5,
                                dataTypes5: dataTypeArr5,
                                dataNames5: dataNameArr5,
                                devices5: deviceArr5,
                                prices5: priceArr5,
                                activityTypes5: activityTypeArr5,
                                dates5: dateArr5,

                                names6: nameArr6,
                                affiliations6: affiliationArr6,
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

router.post('/nameSearch', function (req, res) {
    var affiliation = req.body.affiliation;
    var name = req.body.name;

    var affiliationFlag = true;
    var nameFlag = true;

    var nameArr = [];
    var affiliationArr = [];
    var activityTypeArr3 = [];
    var dateArr3 = [];
    var dataNameArr3 = [];
    var dataTypeArr3 = [];
    var priceArr3 = [];
    var deviceArr3 = [];

    var s_nameArr = [];
    var s_affiliationArr = [];
    var activityTypeArr4 = [];
    var dateArr4 = [];
    var dataNameArr4 = [];
    var dataTypeArr4 = [];
    var priceArr4 = [];
    var deviceArr4 = [];
    var r_nameArr = [];
    var r_affiliationArr = [];

    var nameArr5 = [];
    var affiliationArr5 = [];
    var activityTypeArr5 = [];
    var dateArr5 = [];
    var dataNameArr5 = [];
    var dataTypeArr5 = [];
    var priceArr5 = [];
    var deviceArr5 = [];
    var nameArr6 = [];
    var affiliationArr6 = [];
    var dataNameArr6 = [];
    var dataTypeArr6 = [];
    var priceArr6 = [];
    var deviceArr6 = [];

    var query4resultNum;
    var query3resultNum;
    var query5resultNum;

    console.log("affiliation: " + affiliation);
    console.log("name: " + name);

    var nullcount = 0;
    var matchCyper5;
    var matchCyper4;
    var matchCyper3;

    var returnCyper5 = ") RETURN p1, d1, ac, p2, d2 LIMIT 10"
    var returnCyper4 = ") RETURN p1, d1, ac, p2 LIMIT 10"
    var returnCyper3 = ") RETURN p, d, ac LIMIT 10"
    var whereCyper5 = " WHERE ac.name IN ['수정', '가공', '변환'] AND ("
    var whereCyper4 = " WHERE ac.name IN ['배포', '판매', '전달'] AND ("
    var whereCyper3 = " WHERE ac.name = '생성' AND ("
    var newQuery4;
    var newQuery3;
    var newQuery5;

    matchCyper5 = "MATCH (p1:Person)<-[:Own]-(d1:Data), (d1:Data)<-[:Generate]-(ac:Activity), (ac:Activity)-[:Act]-(p2:Person), (d2:Data)-[:Generate]-(ac:Activity)"
    matchCyper4 = "MATCH (p1:Person)<-[:Own]-(d1:Data)-[:Generate]-(ac:Activity)-[:Generate]-(d2:Data)-[:Own]-(p2:Person)"
    matchCyper3 = "MATCH (p:Person)<-[:Own]-(d:Data)<-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
    newQuery5 = matchCyper5 + whereCyper5;
    newQuery4 = matchCyper4 + whereCyper4;
    newQuery3 = matchCyper3 + whereCyper3;

    var affiliationCyper = " p.affiliation = ";
    var nameCyper = " p.name = ";

    if (affiliation == '' || affiliation == undefined) {
        console.log("affiliation null");
        affiliationFlag = false;
        nullcount++;
    }
    if (name == '' || name == undefined) {
        console.log("name null");
        nameFlag = false;
        nullcount++;
    }

    for (var i = 0; i < (2 - nullcount); i++) {
        if (nullcount == 0) {
            newQuery5 = newQuery5 + "(p1.affiliation = '" + affiliation + "'  AND p1.name = '" + name + "') OR (p2.affiliation = '" + affiliation + "' AND p2.name = '" + name + "')";
            newQuery4 = newQuery4 + "(p1.affiliation = '" + affiliation + "'  AND p1.name = '" + name + "') OR (p2.affiliation = '" + affiliation + "' AND p2.name = '" + name + "')";
            newQuery3 = newQuery3 + affiliationCyper + "'" + affiliation + "' AND ";
            newQuery3 = newQuery3 + nameCyper + "'" + name + "'";
            affiliationFlag = false;
            nameFlag = false;
            break;
        }
        else {
            if (affiliationFlag) {
                newQuery5 = newQuery4 + "(p1.affiliation = '" + affiliation + "' OR p2.affiliation = '" + affiliation + "') ";
                newQuery4 = newQuery4 + "(p1.affiliation = '" + affiliation + "' OR p2.affiliation = '" + affiliation + "') ";
                newQuery3 = newQuery3 + affiliationCyper + "'" + affiliation + "'";
                affiliationFlag = false;
            }
            else if (nameFlag) {
                newQuery5 = newQuery4 + "(p1.name = '" + name + "' OR p2.name = '" + name + "') "
                newQuery4 = newQuery4 + "(p1.name = '" + name + "' OR p2.name = '" + name + "') "
                newQuery3 = newQuery3 + nameCyper + "'" + name + "'";
                nameFlag = false;
            }
        }
        if ((i + 1) != (2 - nullcount)) {
            newQuery5 = newQuery5 + " AND ";
            newQuery4 = newQuery4 + " AND ";
            newQuery3 = newQuery3 + " AND";
        }
    }
    newQuery3 = newQuery3 + returnCyper3;
    newQuery4 = newQuery4 + returnCyper4;
    newQuery5 = newQuery5 + returnCyper5;

    console.log(newQuery3)
    console.log("********************************************")
    console.log(newQuery4)
    console.log("********************************************")
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

                    nameArr6.push(record._fields[3].properties.name)
                    affiliationArr6.push(record._fields[3].properties.affiliation)

                    dataNameArr6.push(record._fields[4].properties.name)
                    dataTypeArr6.push(record._fields[4].properties.d_type)
                    deviceArr6.push(record._fields[4].properties.device)
                    priceArr6.push(record._fields[4].properties.price)
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

                nameArr6.push(' ')
                affiliationArr6.push(' ')

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
                            query3resultNum = result.records.length
                            if (query3resultNum) {
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
                            res.render('search/searchNameResult.ejs', {
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

                                names5: nameArr5,
                                affiliations5: affiliationArr5,
                                dataTypes5: dataTypeArr5,
                                dataNames5: dataNameArr5,
                                devices5: deviceArr5,
                                prices5: priceArr5,
                                activityTypes5: activityTypeArr5,
                                dates5: dateArr5,

                                names6: nameArr6,
                                affiliations6: affiliationArr6,
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

router.post('/periodSearch', function (req, res) {
    var end_date = req.body.start_date;
    var start_date = req.body.end_date;
    var activityType = req.body.activityType;


    var nameArr = [];
    var affiliationArr = [];
    var activityTypeArr3 = [];
    var dateArr3 = [];
    var dataNameArr3 = [];
    var dataTypeArr3 = [];
    var priceArr3 = [];
    var deviceArr3 = [];

    var s_nameArr = [];
    var s_affiliationArr = [];
    var activityTypeArr4 = [];
    var dateArr4 = [];
    var dataNameArr4 = [];
    var dataTypeArr4 = [];
    var priceArr4 = [];
    var deviceArr4 = [];
    var r_nameArr = [];
    var r_affiliationArr = [];

    var nameArr5 = [];
    var affiliationArr5 = [];
    var activityTypeArr5 = [];
    var dateArr5 = [];
    var dataNameArr5 = [];
    var dataTypeArr5 = [];
    var priceArr5 = [];
    var deviceArr5 = [];
    var nameArr6 = [];
    var affiliationArr6 = [];
    var dataNameArr6 = [];
    var dataTypeArr6 = [];
    var priceArr6 = [];
    var deviceArr6 = [];

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

    var matchCyper5;
    var matchCyper4;
    var matchCyper3;

    var returnCyper5 = " RETURN p1, d1, ac, p2, d2 LIMIT 10"
    var returnCyper4 = " RETURN p1, d1, ac, p2 LIMIT 10"
    var returnCyper3 = " RETURN p, d, ac LIMIT 10"

    var newQuery5;
    var newQuery4;
    var newQuery3;

    matchCyper5 = "MATCH (p1:Person)<-[:Own]-(d1:Data), (d1:Data)<-[:Generate]-(ac:Activity), (ac:Activity)-[:Act]-(p2:Person), (d2:Data)-[:Generate]-(ac:Activity)"
    matchCyper4 = "MATCH (p1:Person)<-[:Own]-(d1:Data)-[:Generate]-(ac:Activity)-[:Generate]-(d2:Data)-[:Own]-(p2:Person)"
    if (user_gubun == '관리자') {
        matchCyper3 = "MATCH (p:Person)<-[:Own]-(d:Data)<-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + " WHERE "
        newQuery4 = matchCyper4 + " WHERE "
        newQuery3 = matchCyper3 + " WHERE "
    }
    else {
        matchCyper3 = "MATCH (p:Person{name: '" + user_name + "' })<-[:Own]-(d:Data)<-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + " WHERE (p1.name = '" + user_name + "' OR p2.name = '" + user_name + "') AND";
        newQuery4 = matchCyper4 + " WHERE (p1.name = '" + user_name + "' OR p2.name = '" + user_name + "') AND";
        newQuery3 = matchCyper3 + " WHERE (p.name = '" + user_name + "') AND";
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

    if (nullcount == 0) {
        if (activityType == '생성') {
            newQuery3 = newQuery3 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') AND (ac.name = '생성') "
        }
        else if (activityType == '배포' || activityType == '판매' || activityType == '전달') {
            newQuery4 = newQuery4 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') AND (ac.name = " + "'" + activityType + "') "
        }
        else {
            newQuery5 = newQuery5 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') AND (ac.name = " + "'" + activityType + "') "
        }
    }
    else {
        for (var i = 0; i < (2 - nullcount); i++) {
            if (end_dateFlag && start_date) {
                newQuery5 = newQuery5 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') ";
                newQuery4 = newQuery4 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') ";
                newQuery3 = newQuery3 + startDateCyper + "'" + start_date + "'" + " AND" + endDateCyper + "'" + end_date + "') ";

                end_dateFlag = false;
                start_dateFlag = false;
            }
            else if (activityTypeFlag) {
                activityTypeFlag = false;
                if (activityType == '생성') {
                    newQuery3 = newQuery3 + " (ac.name = '생성') "
                }
                if (activityType == '배포' || activityType == '판매' || activityType == '전달') {
                    newQuery4 = newQuery4 + " (ac.name = " + "'" + activityType + "') "
                }
                else {
                    newQuery5 = newQuery5 + " (ac.name = " + "'" + activityType + "') "
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
    var query3 = false;
    var query4 = false;
    var query5 = false;
    if (activityType == '생성') {
        query3 = true;
        query4 = false;
        query5 = false;
        session.run(newQuery3)
            .then(function (result) {
                query3 = true;
                query4 = false;
                query5 = false;
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
                res.render('search/searchPeriodResult.ejs', {
                    esession: session_value.getSession(),
                    query3: query3,
                    query4: query4,
                    query5: query5,
                    names: nameArr,
                    affiliations: affiliationArr,
                    dataTypes3: dataTypeArr3,
                    dataNames3: dataNameArr3,
                    devices3: deviceArr3,
                    prices3: priceArr3,
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
    else if (activityType == '배포' || activityType == '판매' || activityType == '전달') {
        query5 = false;
        query4 = true;
        query3 = false;
        session.run(newQuery4)
            .then(function (result) {
                query3 = false;
                query4 = true;
                query5 = false;
                query4resultNum = result.records.length;
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
                res.render('search/searchPeriodResult.ejs', {
                    esession: session_value.getSession(),

                    query3: query3,
                    query4: query4,
                    query5: query5,
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

                    authenticated: true
                });

                session.close();
            })
            .catch(function (err) {
                console.log(err);
            });
    }
    else {
        query5 = true;
        query4 = false;
        query3 = false;
        session.run(newQuery5)
            .then(function (result) {
                query3 = false;
                query4 = false;
                query5 = true;
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

                        nameArr6.push(record._fields[3].properties.name)
                        affiliationArr6.push(record._fields[3].properties.affiliation)

                        dataNameArr6.push(record._fields[4].properties.name)
                        dataTypeArr6.push(record._fields[4].properties.d_type)
                        deviceArr6.push(record._fields[4].properties.device)
                        priceArr6.push(record._fields[4].properties.price)
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

                    nameArr6.push(' ')
                    affiliationArr6.push(' ')

                    dataNameArr6.push(' ')
                    dataTypeArr6.push(' ')
                    deviceArr6.push(' ')
                    priceArr6.push(' ')
                }
                res.render('search/searchPeriodResult.ejs', {
                    esession: session_value.getSession(),
                    query3: query3,
                    query4: query4,
                    query5: query5,

                    names5: nameArr5,
                    affiliations5: affiliationArr5,
                    dataTypes5: dataTypeArr5,
                    dataNames5: dataNameArr5,
                    devices5: deviceArr5,
                    prices5: priceArr5,
                    activityTypes5: activityTypeArr5,
                    dates5: dateArr5,

                    names6: nameArr6,
                    affiliations6: affiliationArr6,
                    dataTypes6: dataTypeArr6,
                    dataNames6: dataNameArr6,
                    devices6: deviceArr6,
                    prices6: priceArr6,

                    authenticated: true
                });

                session.close();
            })
            .catch(function (err) {
                console.log(err);
            });
    }
});

function getRuntime() {
    var sum = 0;

    var startTime = new Date().getTime();
    for (var i = 1; i <= 1000000; i++) {
        sum += i;
    }
    var endTime = new Date().getTime();

    //console.log("실행 시간 : ", (endTime - startTime));
}

getRuntime();

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

function getCheckNode(keyword) {
    var nodeType;
    return new Promise(function (resolve, reject) {
        if (!isNaN(parseInt(keyword))) {
            ;
        }
        else {
            session.run('MATCH (a:Agent{name:"' + keyword + '"}) RETURN count(a)>=1 as check')
                .then(function (result) {
                    if (result.records[0].get('check')) {
                        nodeType = "Agent";
                        resolve('Agent');
                    }
                    else {
                        session.run('MATCH (a:Activity{name:"' + keyword + '"}) RETURN count(a)>=1 as check')
                            .then(function (result) {
                                if (result.records[0].get('check')) {
                                    nodeType = "Activity";
                                    resolve('Activity')
                                }
                                else {
                                    session.run('MATCH (a:Entity{name:"' + keyword + '"}) RETURN count(a)>=1 as check')
                                        .then(function (result) {
                                            if (result.records[0].get('check')) {
                                                nodeType = "Entity";
                                                resolve('Entity');
                                            }
                                            else
                                                resolve('NOT EXIST');
                                        });
                                }
                            });
                    }
                    //resolve(result);
                });
        }
    });
}

router.post('/keyword', function (req, res) {

    var result4Arr = []
    var result3Arr = []
    var arrLength;
    var startTime = new Date().getTime();
    var keye = req.body.keyword;
    getKeyword(req.body.keyword)
        .then(
            function (keywords) {
                return new Promise(function (resolve, reject) {
                    Promise.all([getCheckNode(keywords[0]), getCheckNode(keywords[1])]).then(function (results) {
                        results.push(keywords);
                        resolve(results);
                    });
                });
            }
        )
        .then(function (keys) {

            var group = [keys[0], keys[1]];
            var keyword = keys[2]
            var resultArr = []
            console.log(group, keyword);

            var user_gubun = session_value.getSession().gubun;
            var user_name = session_value.getSession().user;
            var query = "MATCH (a1:" + group[0] + " {name:'" + keyword[0] + "'}), (a2:" + group[1] + " {name:'" + keyword[1] + "'}), path=((a1)-[*3..4]-(a2)) RETURN path ORDER BY LENGTH(path)";

            var naiveQuery = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent) WHERE a1.name:'" + keyword[1] + "' RETURN path";

// "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)
//WHERE a1.name:'"+ keyword[1] +"' RETURN path"
            //var naiveQuery = "MATCH (a1:"+ group[0] +" {name:'"+ keyword[0] +"'}), path=((a1)-[*3..4]-(a2)) RETURN path ORDER BY LENGTH(path)"
            var naiveQuery = "MATCH path = ((a1:" + group[0] + ") - [*3..4]-(a2)) WHERE a1.name = '" + keyword[0] + "' RETURN path ORDER BY LENGTH(path)"
            var endArr = []
            /*
                session
                .run(naiveQuery)
                .then(result => {
                  var endTime = new Date().getTime();
                  console.log("키워드 서치 실행 시간 : ", (endTime - startTime));
                  leng = result.records.length
                  console.log(result.records.length)
                  return result.records.map(record => {
                    path = record.get("path");
                    start = path["start"]["properties"]["name"]
                    end = path["end"]["properties"]["name"]
                    //console.log(record)
                    for(var p in path["segments"]){
                      if(path["segments"][p].end.properties.name == keyword[1]){
                        console.log(path["segments"][p].end.properties.name)
                      }
                    }
                    if(path.length == 3){
                     // length3count++;
                      for(var p in path["segments"]){
                        result3Arr.push(path["segments"][p].start.properties.name)
                      }
                      result3Arr.push(end)
                    }
                    else if(path.length == 4){
                    //  length4count++;
                      for(var p in path["segments"]){
                        result4Arr.push(path["segments"][p].start.properties.name)
                      }
                      result4Arr.push(end)
                    }
                    arrLength = result4Arr.length;
                    for (var i = 0; i <result3Arr.length ; i++){
                      console.log("result3Arr[" , i , "] : ", result3Arr[i])
                    }
                      res.render('search/searchKeywordResult.ejs',{
                        esession: session_value.getSession(),
                        //result4s:result4Arr,
                        //result3s : result3Arr
                      } );
                      session.close();
                  });
                })
                .catch(function (err) {
                   console.log(err);
                });*/
            res.render('search/searchKeyword.ejs', {
                esession: session_value.getSession(),
                //result4s:result4Arr,
                //result3s : result3Arr
            });
        });
});

/* 키우드 서치 부분
session
.run(query)
.then(result => {
  var endTime = new Date().getTime();
  console.log("키워드 서치 실행 시간 : ", (endTime - startTime));
  leng = result.records.length
  console.log(result.records.length)
  return result.records.map(record => {
    path = record.get("path");
    start = path["start"]["properties"]["name"]
    end = path["end"]["properties"]["name"]
    res.render('search/searchKeywordResult.ejs',{
      esession: session_value.getSession(),
      result4s:result4Arr,
      result3s : result3Arr} );
    session.close();
    //console.log(record)
    /*
    for(var p in path["segments"]){
      //console.log(path["segments"][p]);
    }
    if(path.length == 3){
     // length3count++;
      for(var p in path["segments"]){
        result3Arr.push(path["segments"][p].start.properties.name)
      }
      result3Arr.push(end)
    }
    else if(path.length == 4){
    //  length4count++;
      for(var p in path["segments"]){
        result4Arr.push(path["segments"][p].start.properties.name)
      }
      result4Arr.push(end)
    }
    arrLength = result4Arr.length;
    */
/*
for (var i = 0; i <result3Arr.length ; i++){
  console.log("result3Arr[" , i , "] : ", result3Arr[i])
}
if( arrLength == leng){
  res.render('search/searchKeywordResult.ejs',{
    esession: session_value.getSession(),
    result4s:result4Arr,
    result3s : result3Arr} );
  session.close();
}
else if( arrLength == 300){
  res.render('search/searchKeywordResult.ejs',{
    esession: session_value.getSession(),
    result4s:result4Arr,
    result3s : result3Arr} );
  session.close();
}
});
})
.catch(function (err) {
console.log(err);
});
});
});
*/
router.post('/getDeleteValues', function (req, res) {
    var checkValues4 = req.body.deleteCheck4;
    var checkValues3 = req.body.deleteCheck3;

    var namelst
    var dataNamelst3

    var s_namelst
    var r_namelst
    var activitylst4
    var dataNamelst4

    // WHERE (a1.name IN ["김태연","임윤아"]) and (ac.name in ["판매", "판매"]) and (e.name in ["data_683", "data_964"])
    var delMatch3 = "MATCH prov = ((a:Agent)<-[:wasAttributedTo]-(e:Entity)-[:wasGeneratedBy]-(ac:Activity)) "
    var delMatch4 = "MATCH prov = ((a1:Agent)<-[:wasAttributedTo]-(e:Entity)-[:wasGeneratedBy]-(ac:Activity)-[:wasAssociatedWith]-(a2:Agent)) "
    var delDetach = "DETACH DELETE prov"

    var query3;
    var query4;
    var delFlag3 = false
    var delFlag4 = false;


    if (checkValues3 != undefined) {
        delFlag3 = true;
        namelst = "\"" + nameArr[checkValues3[0]] + "\""
        dataNamelst3 = "\"" + dataNameArr3[checkValues3[0]] + "\""
        for (var i = 1; i < checkValues3.length; i++) {

            console.log("name : ", nameArr[checkValues3[i]]);
            console.log("data : ", dataNameArr3[checkValues3[i]]);

            namelst = namelst + ", \"" + nameArr[checkValues3[i]] + "\""
            dataNamelst3 = dataNamelst3 + ", \"" + dataNameArr3[checkValues3[i]] + "\""

        }
        console.log("namelst", namelst)
        console.log("dataNamelst3", dataNamelst3)
        query3 = delMatch3 + "WHERE a.name in [" + namelst + "] AND ac.name = '수정' AND e.name in [" + dataNamelst3 + "] "
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
        query4 = delMatch4 + "WHERE a1.name in [" + s_namelst + "] AND ac.name in [" + activitylst4 + "] AND e.name in [" + dataNamelst4 + "] AND a2.name in [" + r_namelst + "] "
        query4 = query4 + delDetach
    }

    console.log(query3)
    console.log("----------------------------------------------------------")
    console.log(query4)
    if (delFlag3 && delFlag4) {
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

    var query3resultNum;
    var query4resultNum;

    var matchCyper4;
    var matchCyper3;

    var returnCyper4 = ") RETURN s_agent, entity, activity, r_agent LIMIT 30"
    var returnCyper3 = ") RETURN agent, entity, activity LIMIT 30"
    var whereCyper4 = " WHERE Not(activity.name = '수정') AND ("
    var whereCyper3 = " WHERE (activity.name = '수정') AND ("
    var newQuery4;
    var newQuery3;

    if (user_gubun == '관리자') {
        matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
        matchCyper3 = "MATCH (agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
        newQuery4 = matchCyper4 + whereCyper4;
        newQuery3 = matchCyper3 + whereCyper3;
    }
    else {
        matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
        matchCyper3 = "MATCH (agent:Agent{name: '" + user_name + "' })<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
        newQuery4 = matchCyper4 + whereCyper4 + "s_agent.name = '" + user_name + "' OR r_agent.name = '" + user_name + "') AND (";
        newQuery3 = matchCyper3 + whereCyper3;
    }

    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;


    var dataNameCyper = " entity.name = ";
    var nameCyper = " agent.name = ";

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

    for (var i = 0; i < (2 - nullcount); i++) {
        if (dataNameFlag) {
            newQuery4 = newQuery4 + dataNameCyper + "'" + dataName + "'";
            newQuery3 = newQuery3 + dataNameCyper + "'" + dataName + "'";
            dataNameFlag = false;
        }
        else if (nameFlag) {
            newQuery4 = newQuery4 + " s_agent.name = '" + name + "' OR r_agent.name = '" + name + "'";
            newQuery3 = newQuery3 + nameCyper + "'" + name + "'";
            nameFlag = false;
        }
        if ((i + 1) != (2 - nullcount)) {
            newQuery4 = newQuery4 + " AND";
            newQuery3 = newQuery3 + " AND";
        }
    }
    newQuery4 = newQuery4 + returnCyper4;
    newQuery3 = newQuery3 + returnCyper3;
    console.log(newQuery3)
    console.log("******************************************")
    console.log(newQuery4)
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

                        authenticated: true
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
    var modiQuery3;
    var modiQuery4;
    var modiMatch3 = "(a1:Agent)<-[:wasAttributedTo]-(e:Entity)-[:wasGeneratedBy]-(ac:Activity) "
    var modiMatch4 = "(a1:Agent)<-[:wasAttributedTo]-(e:Entity)-[:wasGeneratedBy]-(ac:Activity)-[:wasAssociatedWith]-(a2:Agent) "
    for (var i = 0; i < 8; i++) {
        console.log("provInfo3[", i, "]: ", provInfo3[i]);
    }
    for (var i = 0; i < 10; i++) {
        console.log("pushInfo4[", i, "]: ", provInfo4[i]);
    }
    var modiWhere3 = "WHERE a1.name = '" + provInfo3[0] + "' AND e.name = '" + provInfo3[4] + "' AND ac.name = '" + provInfo3[2] + "' "
    var modiWhere4 = "WHERE a1.name = '" + provInfo4[0] + "' AND e.name = '" + provInfo4[4] + "' AND ac.name = '" + provInfo4[2] + "' "
    var modiSet = "SET a1 = {name: '" + name + "' , affiliation: '" + affiliation + "'}, e = {name: '" + dataName + "', d_type: '" + dataType + "', price: '" + price + "', device: '" + device + "' }, ac = {name: '" + activityType + "', date: '" + date + "'}"
    if (provInfo3.length != 0) {
        console.log(provInfo3.length)
        console.log(provInfo4.length)
        console.log("수정인 이력들")
        if (provInfo3[2] == activityType) {
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
        }
        else {
            modiQuery3 = "MATCH prov = (" + modiMatch3 + ") " + modiWhere3 + "DELETE prov CREATE(a12: Agent {name: '" + name + "' , affiliation: '" + affiliation + "'}) <- [:wasAttributedTo] - (e12: Entity {name: '" + dataName + "' , price: '" + price + "' , d_type: '" + dataType + "', device: '" + device + "'})  - [:wasGeneratedBy] -> (ac12:Activity {name: '" + activityType + "', date: '" + date + "' }) - [:wasAssociatedWith] -> (a122: Agent {name: '" + r_name + "' , affiliation: '" + r_affiliation + "' })"
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
        }
    } else if (provInfo4.length != 0) {
        console.log(provInfo4.length)
        console.log("수정 아닌 이력들")
        if (activityType != "수정") {
            console.log("수정으로 안바꿈");
            modiQuery4 = "MATCH " + modiMatch4 + modiWhere4 + "AND a2.name = '" + provInfo4[8] + "' " + modiSet + " ,a2 = {name: '" + r_name + "' , affiliation: '" + r_affiliation + "'}"
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
        }
        else {
            console.log("수정으로 바꿈")
            modiQuery4 = "MATCH prov = (" + modiMatch4 + ") " + modiWhere4 + "AND a2.name = '" + provInfo4[8] + "' " + "DELETE prov CREATE(a12: Agent {name: '" + name + "' , affiliation: '" + affiliation + "'}) <- [:wasAttributedTo] - (e12: Entity {name: '" + dataName + "' , price: '" + price + "' , d_type: '" + dataType + "', device: '" + device + "'})  - [:wasGeneratedBy] -> (ac12:Activity {name: '" + activityType + "', date: '" + date + "' }) "
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
        }
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

    var activityType = ['생성', '수정', '가공', '변환', '배포', '전달', '판매'];
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


    if (check3Len == 1) {
        console.log("------------check3 ------------", checkValues3, checkValues3.length);
        modiFlag3 = true;
    }
    else if (check4Len == 1) {
        console.log("------------check4 ------------", checkValues4, checkValues4.length);
        modiFlag4 = true;
    }

    if (modiFlag4 && modiFlag3) {
        console.log("all false");
        modiFlag3 = false;
        modiFlag4 = false;
    }

    if ((check3Len + check4Len) > 1) {
        modiFlag3 = false;
        modiFlag4 = false;
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
            provInfo3: provInfo3,

            activityType: activityType,
            dataType: dataType,
            deviceType: deviceType,

            authenticated: true
        });
    } else if (modiFlag4) {
        console.log("수정 아님")

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

        res.render('data/modifyDataPage.ejs', {
            esession: session_value.getSession(),

            modiFlag3: modiFlag3,
            modiFlag4: modiFlag4,
            provInfo4: provInfo4,

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

    var returnCyper5 = ") RETURN p1, d1, ac, p2, d2 LIMIT 10"
    var returnCyper4 = ") RETURN p1, d1, ac, p2 LIMIT 10"
    var returnCyper3 = ") RETURN p, d, ac LIMIT 10"
    var whereCyper5 = " WHERE ac.name IN ['수정', '가공', '변환'] AND ("
    var whereCyper4 = " WHERE ac.name IN ['배포', '판매', '전달'] AND ("
    var whereCyper3 = " WHERE ac.name = '생성' AND ("
    var newQuery5;
    var newQuery4;
    var newQuery3;

    if (user_gubun == '관리자') {
        matchCyper5 = "MATCH (p1:Person)<-[:Own]-(d1:Data), (d1:Data)<-[:Generate]-(ac:Activity), (ac:Activity)-[:Act]-(p2:Person), (d2:Data)-[:Generate]-(ac:Activity)"
        matchCyper4 = "MATCH (p1:Person)<-[:Own]-(d1:Data)-[:Generate]-(ac:Activity)-[:Generate]-(d2:Data)-[:Own]-(p2:Person)"
        matchCyper3 = "MATCH (p:Person)<-[:Own]-(d:Data)<-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + whereCyper5;
        newQuery4 = matchCyper4 + whereCyper4;
        newQuery3 = matchCyper3 + whereCyper3;
    }
    else {
        matchCyper5 = "MATCH (p1:Person)<-[:Own]-(d1:Data), (d1:Data)<-[:Generate]-(ac:Activity), (ac:Activity)-[:Act]-(p2:Person), (d2:Data)-[:Generate]-(ac:Activity)"
        matchCyper4 = "MATCH (p1:Person)<-[:Own]-(d1:Data)-[:Generate]-(ac:Activity)-[:Generate]-(d2:Data)-[:Own]-(p2:Person)"
        matchCyper3 = "MATCH (p:Person{name: '" + user_name + "' })<-[:Own]-(d:Data)<-[:Generate]-(ac:Activity)-[:Act]-(p:Person)"
        newQuery5 = matchCyper5 + whereCyper5 + "p1.name = '" + user_name + "' OR p2.name = '" + user_name + "') AND (";
        newQuery4 = matchCyper4 + whereCyper4 + "p1.name = '" + user_name + "' OR p2.name = '" + user_name + "') AND (";
        newQuery3 = matchCyper3 + whereCyper3;
    }

    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;


    var dataNameCyper3 = " d.name = ";
    var nameCyper3 = " p.name = ";
    var dataNameCyper4 = " d1.name = ";

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

    for (var i = 0; i < (2 - nullcount); i++) {
        if (dataNameFlag) {
            newQuery5 = newQuery5 + dataNameCyper4 + "'" + dataName + "' OR d2.name = '" + dataName + "' ";
            newQuery4 = newQuery4 + dataNameCyper4 + "'" + dataName + "' ";
            newQuery3 = newQuery3 + dataNameCyper3 + "'" + dataName + "' ";
            dataNameFlag = false;
        }
        else if (nameFlag) {
            newQuery5 = newQuery5 + " p1.name = '" + name + "' OR p2.name = '" + name + "' ";
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

                    nameArr6.push(record._fields[3].properties.name)
                    affiliationArr6.push(record._fields[3].properties.affiliation)

                    dataNameArr6.push(record._fields[4].properties.name)
                    dataTypeArr6.push(record._fields[4].properties.d_type)
                    deviceArr6.push(record._fields[4].properties.device)
                    priceArr6.push(record._fields[4].properties.price)
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

                nameArr6.push(' ')
                affiliationArr6.push(' ')

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

                                names5: nameArr5,
                                affiliations5: affiliationArr5,
                                dataTypes5: dataTypeArr5,
                                dataNames5: dataNameArr5,
                                devices5: deviceArr5,
                                prices5: priceArr5,
                                activityTypes5: activityTypeArr5,
                                dates5: dateArr5,

                                names6: nameArr6,
                                affiliations6: affiliationArr6,
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