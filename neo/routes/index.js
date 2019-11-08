var express = require('express');
var router = express.Router();
var app = express();
var mysql = require("mysql");
var esession = require('express-session');
var crypto = require('crypto');
var session_value = require('./session');
var Promise = require('promise');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wowhi223'));
var session = driver.session();
var cookieParser = require('cookie-parser');
var multer = require("multer");
var multiparty = require('multiparty');
var fs = require('fs');
const exec = require('child_process').exec;

app.use(esession({
    secret:"asdfasffdas",
    resave:false,
    saveUninitialized:true,
}));


let con = mysql.createConnection({
    host: 'localhost',
    user: "root",
    password: "1234",
    port: 3306,
    database: "iitp",
    insecureAuth: true
});
con.connect();

router.get('/contact', function(req, res, next) {
con.query("SELECT * FROM iitp.users;", function(err, result, fields){
  console.log("err : " + err);
    if(err){
      console.log(err);
      console.log("QUERY ERROR!");
    }
    else{
      console.log(result);
      res.render('contact', {
        results: result
      });
    }
  });
});

router.post('/contact', function(req, res, next) {
  var body = req.body;

  con.query("INSERT INTO iitp.users (name, email, password, gubun) VALUES (?, ?, ?, ?);", [
    body.name, body.email, body.password, body.gubun
  ], function(err, rows, fields){

    console.log("err : " + err);
    console.log("rows : " + rows);
    console.log("insertId : " + rows.insertId);

    res.redirect("/contact");
  });
});

router.get('/logout', function (req, res, next) {
    session_value.setSession('','','','',false);
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
        con.query(sql, [email], function(err, results){
            if(err)
                console.log(err);

            if(!results[0]){
                return res.render('users', {message:'아이디를 확인해주십시오'});
              }
            else {
                if(results[0].password === password){
                    //console.log('aaaaa');
                    //return res.send('로그인 되었습니다');

                    //session_info.email = body.email;
                    //session_info.password = body.password;
                    //session_info.user = results[0]["name"];
                    //session_info.gubun = results[0]["gubun"];
                    session_value.setSession(body.email, results[0]["name"], results[0]["gubun"], body.password, true);

                    res.render('index', {message:'로그인 되었습니다' , esession: session_value.getSession()});
                }
                else //return res.send('비밀번호를 확인해주십시오');
                    res.render('users', {message:'비밀번호를 확인해주십시오', esession: undefined});
            }
        });
    }
);

let upload = multer({
  dest: "upload/"
});

router.get('/data/uploadData', function(req, res, next) {
    res.render('data/uploadData', {esession: session_value.getSession()});
});

router.post('/data/uploadData', function (req, res, next) {
    var form = new multiparty.Form();
    var name;
    // get field name & value
    form.on('field',function(name,value){
        console.log('normal field / name = '+name+' , value = '+value);
    });

    // file upload handling
    form.on('part',function(part){
        var filename;
        var size;
        if (part.filename) {
            filename = part.filename;
            name = filename;
            size = part.byteCount;
        }else{
            part.resume();
        }

        console.log("Write Streaming file :"+filename);
        var writeStream = fs.createWriteStream('upload/'+filename);
        writeStream.filename = filename;
        part.pipe(writeStream);

        part.on('data',function(chunk){
            console.log(filename+' read '+chunk.length + 'bytes');
        });

        part.on('end',function(){
            console.log(filename+' Part read complete');
            writeStream.end();

        });
    });

    // all uploads are completed
    form.on('close',function(){
        var path = __dirname.split("\\");
        var len = path.length
        var tmp = path.splice(0, len -2)
        path = tmp.join("\\") + "\\"

        var path1 = __dirname.split("\\");
        path1 = path1.splice(0, len-1)
        path1 = path1.join("\\") + "\\"

        var cmd = "python "+ path + "readData.py " + path1 + "upload\\"+ name;
        console.log(cmd)
        exec(cmd);
        res.render('data/uploadData', {esession: session_value.getSession()});
    });

    // track progress
    form.on('progress',function(byteRead,byteExpected){
        console.log(' Reading total  '+byteRead+'/'+byteExpected);
    });

    form.parse(req);
})

router.post('/create', upload.single("file"), function(req, res, next) {
  
  let file = req.file
  let result = {
      originalName : file.originalname,
      size : file.size,
  }

  res.render('data/uploadData', {esession:session_value.getSession()});
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
    var device  = req.body.device;

    var r_name = req.body.r_name;
    var r_affiliation = req.body.r_affiliation;
    

    if(activityType == '수정'){
      session
      .run("CREATE(a: Agent {name: '" + name + "' , affiliation: '" + affiliation + "' }) <- [:wasAttributedTo] - (e: Entity {name: '" + dataName + "' , price: '" + price + "' , d_type: '" + dataType + "', device: '" + device + "'})  - [:wasGeneratedBy] -> (ac:Activity {name: '" + activityType + "', date: '" + date + "'})")
      .then(function (result) {
          session.close();
      })
      .catch(function (err) {
          console.log(err);
      });
    }
    else{
      session
      .run("CREATE(a: Agent {name: '" + name + "' , affiliation: '" + affiliation + "'}) <- [:wasAttributedTo] - (e: Entity {name: '" + dataName + "' , price: '" + price + "' , d_type: '" + dataType + "', device: '" + device + "'})  - [:wasGeneratedBy] -> (ac:Activity {name: '" + activityType + "', date: '" + date + "' }) - [:wasAssociatedWith] -> (a1: Agent {name: '" + r_name + "' , affiliation: '" + r_affiliation + "' })")
      .then(function (result) {
          session.close();
      })
      .catch(function (err) {
          console.log(err);
      });
    }
    res.render('addPage', {esession:session_value.getSession()});
});

router.get('/addPage', function (req, res, next) {
    res.render('addPage', {esession:session_value.getSession()});
})

router.get('/',function(req, res, next) {
   res.render('index', {esession: session_value.getSession()});
 });


router.get('/viewPage', function (req, res) {
  var nameArr = [];
  var affiliationArr = [];

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
  
  var i = 0;
  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;

    if(user_gubun == '사용자'){
      session.run("START n=node(*) MATCH (n:Agent)<-[:wasAttributedTo]-(m:Entity)-[:wasGeneratedBy]-(q:Activity) WHERE q.name = '수정' AND n.name = '"+user_name +"' RETURN n, m, q LIMIT 30")
      .then(function(result){
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
            
            authenticated: true
        });

 
      session.close();
    })
    .catch(function (err) {
        console.log(err);
      });
    }
    else if(user_gubun =='관리자'){

        session
        .run("START n=node(*) MATCH (n:Agent)<-[:wasAttributedTo]-(m:Entity)-[:wasGeneratedBy]-(q:Activity)-[]-(w:Agent) WHERE Not(q.name = '수정') RETURN n, m , q, w LIMIT 30")
        .then(function(result){
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


            session.run("START n=node(*) MATCH (n:Agent)<-[:wasAttributedTo]-(m:Entity)-[:wasGeneratedBy]-(q:Activity) WHERE q.name = '수정' RETURN n, m, q LIMIT 30")
            .then(function(result){
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
            affiliations:undefined,
            dataTypes3:undefined,
            dataNames3:undefined,
            devices3: undefined,
            prices3: undefined,
            activityTypes3:undefined,
            dates3: undefined,

            s_names: undefined,
            s_affiliations: undefined,
            dataTypes4:undefined,
            dataNames4: undefined,
            devices4: undefined,
            prices4: undefined,
            activityTypes4: undefined,
            dates4: undefined,            
            r_names:undefined,
            r_affiliations: undefined,
            authenticated: false
        });
    }
});

router.post('/DataSearch', function(req, res){
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

  var query4resultNum;
  var query3resultNum;

  console.log("dataName: " + dataName);
  console.log("device: " + device);
  console.log("dataType: " + dataType);
  console.log("price: " + price);

  var nullcount = 0;
  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;
  
  var deviceCyper = " entity.device = ";
  var dataNameCyper = " entity.name = ";
  var dataTypeCyper = " entity.d_type = ";
  var priceCyper = " entity.price = ";

  if(device == ''){
    deviceFlag = false;
    nullcount++;
  }
  if(dataName == '' || dataName == undefined){
    dataNameFlag = false;
    nullcount++;
  }
  if(dataType == ''){
    dataTypeFlag = false;
    nullcount++;
  }
  if(price == ''){
    priceFlag = false;
    nullcount++;
  }

  var matchCyper4;
  var matchCyper3;

  var returnCyper4 = ") RETURN s_agent, entity, activity, r_agent LIMIT 50"
  var returnCyper3 = ") RETURN agent, entity, activity LIMIT 50"
  var whereCyper4 = " WHERE Not(activity.name = '수정') AND ("
  var whereCyper3 = " WHERE (activity.name = '수정') AND ("
  var newQuery4; 
  var newQuery3;
  if(user_gubun == '관리자'){
    matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
    matchCyper3 = "MATCH (agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
    newQuery4 = matchCyper4 + whereCyper4;
    newQuery3 = matchCyper3 + whereCyper3;
  }
else{
    matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
    matchCyper3 = "MATCH (agent:Agent{name: '"+user_name +"' })<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
    newQuery4 = matchCyper4 + whereCyper4 + "s_agent.name = '"+user_name +"' OR r_agent.name = '"+user_name +"') AND (";
    newQuery3 = matchCyper3 + whereCyper3;
  }

  for(var i = 0 ; i < (4-nullcount); i++){
    if(deviceFlag){
      newQuery4 = newQuery4 + deviceCyper + "'" + device + "'";
      newQuery3 = newQuery3 + deviceCyper + "'" + device + "'";
      deviceFlag = false;
    }
    else if(dataNameFlag){
      newQuery4 = newQuery4 + dataNameCyper + "'" + dataName + "'";
      newQuery3 = newQuery3 + dataNameCyper + "'" + dataName + "'";
      dataNameFlag = false;
    }
  
    else if(dataTypeFlag){
      newQuery4 = newQuery4 + dataTypeCyper + "'" + dataType + "'" ;
      newQuery3 = newQuery3 + dataTypeCyper + "'" + dataType + "'" ;
      dataTypeFlag = false;
    }
    else if(priceFlag){
      newQuery4 = newQuery4 + priceCyper + "'" + price + "'" ;
      newQuery3 = newQuery3 + priceCyper + "'" + price + "'" ;
      priceFlag = false;
    }
    if((i+1) != (4-nullcount)){
      newQuery4 = newQuery4 + " AND";
      newQuery3 = newQuery3 + " AND";
    }
  }
  newQuery4 = newQuery4 + returnCyper4;
  newQuery3 = newQuery3 + returnCyper3;
  console.log(newQuery3)
  console.log(newQuery4)

  session.run(newQuery4)
  .then(function(result){
    query4resultNum = result.records.length;
    if(query4resultNum != 0){
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
    else{
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
    .then(function(result){
      query3resultNum = result.records.length;
      if(query3resultNum != 0){
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
      else{
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
          
          authenticated: true
      });
    });
    session.close();
  })
  .catch(function (err) {
      console.log(err);
  });
});

router.post('/nameSearch', function(req, res){
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

  var query4resultNum;
  var query3resultNum;

  console.log("affiliation: " + affiliation);
  console.log("name: " + name);

  var nullcount = 0;
  var matchCyper4;
  var matchCyper3;

  var returnCyper4 = " RETURN s_agent, entity, activity, r_agent LIMIT 30"
  var returnCyper3 = ") RETURN agent, entity, activity LIMIT 30"
  var whereCyper4 = " WHERE Not(activity.name = '수정') AND "
  var whereCyper3 = " WHERE (activity.name = '수정') AND ("
  var newQuery4; 
  var newQuery3;

  matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
  matchCyper3 = "MATCH (agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
  newQuery4 = matchCyper4 + whereCyper4;
  newQuery3 = matchCyper3 + whereCyper3;

  var affiliationCyper = " agent.affiliation = ";
  var nameCyper = " agent.name = ";

  if(affiliation == '' || affiliation == undefined ){
    console.log("affiliation null");
    affiliationFlag = false;
    nullcount++;
  }
  if(name == '' || name == undefined ){
    console.log("name null");
    nameFlag = false;
    nullcount++;
  }

  for(var i = 0 ; i < (2-nullcount); i++){
    if(nullcount == 0){
      newQuery4 = newQuery4 + "(s_agent.affiliation = '"+ affiliation +"'  AND s_agent.name = '"+ name +"') OR (r_agent.affiliation = '"+ affiliation +"' AND r_agent.name = '"+ name +"')";
      newQuery3 = newQuery3 + affiliationCyper + "'" + affiliation + "' AND ";
      newQuery3 = newQuery3 + nameCyper + "'" + name + "'" ;
      affiliationFlag = false;
      nameFlag = false;
      break;
    }
    else{
      if(affiliationFlag){
        newQuery4 = newQuery4 + "(s_agent.affiliation = '"+ affiliation +"' OR r_agent.affiliation = '"+ affiliation +"') ";
        newQuery3 = newQuery3 + affiliationCyper + "'" + affiliation + "'";
        affiliationFlag = false;
      }
      else if(nameFlag){
        newQuery4 = newQuery4 + "(s_agent.name = '"+ name +"' OR r_agent.name = '"+ name +"') "
        newQuery3 = newQuery3 + nameCyper + "'" + name + "'" ;
        nameFlag = false;
      }
    }
    if((i+1) != (2-nullcount)){
      newQuery4 = newQuery4 + " AND ";
      newQuery3 = newQuery3 + " AND";
    }
  }
  newQuery3 = newQuery3 + returnCyper3;
  newQuery4 = newQuery4 + returnCyper4;

  console.log(newQuery3)
  console.log("********************************************")
  console.log(newQuery4)


  session
  .run(newQuery4)
  .then(function(result){
    query4resultNum = result.records.length
    if(query4resultNum != 0){
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
    else{
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
      .then(function(result){
        query3resultNum = result.records.length
        if(query3resultNum){
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
        else{
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
            
            authenticated: true
        });
      });
  session.close();
})
  .catch(function (err) {
    console.log(err);
    });
});

router.post('/periodSearch', function(req, res){
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

  var end_dateFlag = true;
  var start_dateFlag = true;
  var activityTypeFlag = true;

  var query4resultNum;
  var query3resultNum;

  console.log("starDate:  " + start_date);
  console.log("end: " + end_date);
  
  var nullcount = 0;

  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;

  var matchCyper4;
  var matchCyper3;

  var returnCyper4 = " RETURN s_agent, entity, activity, r_agent LIMIT 30"
  var returnCyper3 = " RETURN agent, entity, activity LIMIT 30"
  
  var newQuery4; 
  var newQuery3;

 
  matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
  if(user_gubun == '관리자'){
    matchCyper3 = "MATCH (agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
    newQuery4 = matchCyper4 + " WHERE "
    newQuery3 = matchCyper3 + " WHERE "
  }
else{
    matchCyper3 = "MATCH (agent:Agent{name: '"+user_name +"' })<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
    newQuery4 = matchCyper4 + " WHERE (s_agent.name = '"+user_name +"' OR r_agent.name = '"+user_name +"') AND";
    newQuery3 = matchCyper3 + " WHERE (agent.name = '"+user_name +"') AND";
  }
  var startDateCyper = " (activity.date >= ";
  var endDateCyper = " activity.date < ";

  if(end_date == '' || end_date == undefined){
    end_dateFlag = false;

  }
  if(start_date == '' || start_date == undefined){
    start_dateFlag = false;

  }
  if( start_dateFlag == false || end_dateFlag == false){
    nullcount++;
  }
  if(activityType == '' || activityType == undefined ){
    activityTypeFlag = false;
    nullcount++;
  }
  if(nullcount == 0){
    if(activityType == '수정'){
      newQuery3 = newQuery3 + startDateCyper + "'" + start_date +"'" + " AND" + endDateCyper + "'" + end_date + "') AND (activity.name = '수정') "
    }
    else{
      newQuery4 = newQuery4 + startDateCyper + "'" + start_date +"'" + " AND" + endDateCyper + "'" + end_date + "') AND (activity.name = " + "'" +  activityType + "') " 
    }
  }
  else{
    for(var i = 0 ; i < (2-nullcount); i++){
      if(end_dateFlag && start_date){
        newQuery4 = newQuery4 +  startDateCyper + "'" + start_date +"'" + " AND" + endDateCyper + "'" + end_date + "') " ;
        newQuery3 = newQuery3 +  startDateCyper + "'" + start_date +"'" + " AND" + endDateCyper + "'" + end_date + "') " ;

        end_dateFlag = false;
        start_dateFlag = false;
      }
      else if(activityTypeFlag){
        activityTypeFlag = false;
        if(activityType == '수정'){
          newQuery3 = newQuery3 + " (activity.name = '수정') "
        }
        else{
          newQuery4 = newQuery4 + " (activity.name = " + "'" +  activityType + "') " 
        }
      }
    } 
  }
  newQuery4 = newQuery4 + returnCyper4;
  newQuery3 = newQuery3 + returnCyper3;

  console.log(newQuery3)
  console.log(newQuery4)
  var query3 = false;
  var query4 = false;
  if(activityType == '수정'){
      query3 = true;
      query4 = false;
      session.run(newQuery3)
      .then(function(result){
        query3 = true;
        query4 = false;
        query3resultNum = result.records.length;
        if(query3resultNum != 0){
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
        else{
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
            query3 : query3,
            query4 : query4, 
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
    else{
      query4 = true;
      query3 = false;
      session.run(newQuery4)
      .then(function(result){
        query3 = false;
        query4 = true;
        query4resultNum = result.records.length;
        if(query4resultNum != 0){
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
        else{
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

            query3 : query3, 
            query4 : query4,
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
});

function getKeyword(keywords){
  return new Promise(function(resolve, reject){
    keyword = keywords.split(',');
    if (keyword.length == 1){
        keyword = keyword[0].split(' ');
    }
    else{
      for(var k in keyword){
        keyword[k] = keyword[k].trim()
      }
        console.log(keyword)
    }
    resolve(keyword);
  });
}

function getCheckNode(keyword){
  return new Promise(function(resolve, reject){
    if (!isNaN(parseInt(keyword))){
      ;
    }
    else{
      session.run('MATCH (a:Agent{name:"' + keyword + '"}) RETURN count(a)=1 as check')
      .then(function(result){
        //console.log(result)
        if (result.records[0].get('check'))
          resolve('Agent');
        else{
          session.run('MATCH (a:Activity{name:"' + keyword + '"}) RETURN count(a)=1 as check')
          .then(function(result){
            if (result.records[0].get('check'))
              resolve('Activity')
            else {
              session.run('MATCH (a:Entity{name:"' + keyword + '"}) RETURN count(a)=1 as check')
              .then(function(result){
                if (result.records[0].get('check'))
                  resolve('Entity');
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
  getKeyword(req.body.keyword)
  .then(
    function(keywords){
      return new Promise(function(resolve, reject){
        Promise.all([getCheckNode(keywords[0]), getCheckNode(keywords[1])]).then(function(results){
          results.push(keywords);
          resolve(results);
        });
      });      
    }
  )
  .then(function(keys){
    var group = [keys[0], keys[1]];
    var keyword = keys[2]
    var resultArr = []
    console.log(group, keyword);
    var user_gubun = session_value.getSession().gubun;
    var user_name = session_value.getSession().user;
    var query = "MATCH (a1:"+ group[0] +" {name:'"+ keyword[0] +"'}), (a2:"+group[1]+" {name:'"+ keyword[1] +"'}), path=((a1)-[*3..4]-(a2)) RETURN path ORDER BY LENGTH(path)";

    session
    .run(query)
    .then(result => {
      leng = result.records.length
      console.log(result.records.length)
      return result.records.map(record => {
        path = record.get("path");
        start = path["start"]["properties"]["name"]
        end = path["end"]["properties"]["name"]
        //console.log(record)
        for(var p in path["segments"]){
          console.log(path["segments"][p]);
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
      
        if( arrLength == leng){
          res.render('search/searchKeywordResult.ejs',{esession: session_value.getSession(), result4s:result4Arr, result3s : result3Arr} );
          session.close();
        }
        else if( arrLength == 300){
          res.render('search/searchKeywordResult.ejs',{esession: session_value.getSession(), result4s:result4Arr, result3s : result3Arr} );
          session.close();
        }
      });
    })
    .catch(function (err) {
       console.log(err);
    });
  });
});

router.post('/getValues', function (req, res) {
    var checkValues4 = req.body.deleteCheck4;
    var checkValues3 = req.body.deleteCheck3;
    console.log("************* checkValues3 ****************", checkValues3);
    console.log("************* checkValues4 ****************", checkValues4);

    var str = document.getElementsByTagName('td')[5].childNodes[0].nodeValue;


    res.render('data/deleteData', {esession:session_value.getSession()});
});


router.post('/delete', function(req, res){
  var dataName = req.body.dataName;
  var name = req.body.name;
  var dataNameFlag = true;
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

  if(user_gubun == '관리자'){
    matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
    matchCyper3 = "MATCH (agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
    newQuery4 = matchCyper4 + whereCyper4;
    newQuery3 = matchCyper3 + whereCyper3;
  }
else{
    matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
    matchCyper3 = "MATCH (agent:Agent{name: '"+user_name +"' })<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
    newQuery4 = matchCyper4 + whereCyper4 + "s_agent.name = '"+user_name +"' OR r_agent.name = '"+user_name +"') AND (";
    newQuery3 = matchCyper3 + whereCyper3;
  }

  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;


  var dataNameCyper = " entity.name = ";
  var nameCyper = " agent.name = ";

  if(dataName == '' || dataName == undefined ){
    console.log("dataName null");
    dataNameFlag = false;
    nullcount++;
  }
  if(name == '' || name == undefined ){
    console.log("name null");
    nameFlag = false;
    nullcount++;
  }

  for(var i = 0 ; i < (2-nullcount); i++){
    if(dataNameFlag){
      newQuery4 = newQuery4 + dataNameCyper + "'" + dataName + "'";
      newQuery3 = newQuery3 + dataNameCyper + "'" + dataName + "'";
      dataNameFlag = false;
    }
    else if(nameFlag){
      newQuery4 = newQuery4 +" s_agent.name = '"+name +"' OR r_agent.name = '"+name +"'";
      newQuery3 = newQuery3 + nameCyper + "'" + name + "'" ;
      nameFlag = false;
    }
    if((i+1) != (2-nullcount)){
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
    .then(function(result){
      query4resultNum = result.records.length
      if(query4resultNum != 0){
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
      else{
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
      .then(function(result){
        query3resultNum = result.records.length;
        if(query3resultNum != 0){
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
        else{
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

router.post('/modify', function(req, res){
  var dataName = req.body.dataName;
  var name = req.body.name;
  var dataNameFlag = true;
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

  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;
  console.log("dataName: " + dataName);
  console.log("name: " + name);

  var nullcount = 0;


  var matchCyper4;
  var matchCyper3;

  var returnCyper4 = ") RETURN s_agent, entity, activity, r_agent "
  var returnCyper3 = ") RETURN agent, entity, activity "
  var whereCyper4 = " WHERE Not(activity.name = '수정') AND ("
  var whereCyper3 = " WHERE (activity.name = '수정') AND ("
  var newQuery4; 
  var newQuery3;

  if(user_gubun == '관리자'){
    matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
    matchCyper3 = "MATCH (agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
    newQuery4 = matchCyper4 + whereCyper4;
    newQuery3 = matchCyper3 + whereCyper3;
  }
else{
    matchCyper4 = "MATCH (s_agent:Agent)<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)-[]-(r_agent: Agent)";
    matchCyper3 = "MATCH (agent:Agent{name: '"+user_name +"' })<-[:wasAttributedTo]-(entity:Entity)-[:wasGeneratedBy]-(activity:Activity)"
    newQuery4 = matchCyper4 + whereCyper4 + "s_agent.name = '"+user_name +"' OR r_agent.name = '"+user_name +"') AND (";
    newQuery3 = matchCyper3 + whereCyper3;
  }

  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;


  var dataNameCyper = " entity.name = ";
  var nameCyper = " agent.name = ";

  if(dataName == '' || dataName == undefined ){
    console.log("dataName null");
    dataNameFlag = false;
    nullcount++;
  }
  if(name == '' || name == undefined ){
    console.log("name null");
    nameFlag = false;
    nullcount++;
  }

  for(var i = 0 ; i < (2-nullcount); i++){
    if(dataNameFlag){
      newQuery4 = newQuery4 + dataNameCyper + "'" + dataName + "' ";
      newQuery3 = newQuery3 + dataNameCyper + "'" + dataName + "' ";
      dataNameFlag = false;
    }
    else if(nameFlag){
      newQuery4 = newQuery4 +" s_agent.name = '"+name +"' OR r_agent.name = '"+name +"' ";
      newQuery3 = newQuery3 + nameCyper + "'" + name + "'" ;
      nameFlag = false;
    }
    if((i+1) != (2-nullcount)){
      newQuery4 = newQuery4 + ") AND (";
      newQuery3 = newQuery3 + ") AND (";
    }
  }
  newQuery4 = newQuery4 + returnCyper4;
  newQuery3 = newQuery3 + returnCyper3;
  console.log(newQuery3)
  console.log("******************************************")
  console.log(newQuery4)
 
  if(user_gubun == '사용자'){
    session.run(newQuery4)
    .then(function(result){
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


        session.run(newQuery3)
        .then(function(result){
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
  else if(user_gubun == '관리자'){

    session
    .run(newQuery4)
    .then(function(result){
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


        session.run(newQuery3)
        .then(function(result){
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

});



module.exports = router;
