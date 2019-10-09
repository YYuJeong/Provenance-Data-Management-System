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
  '"+user_name +"'
    if(user_gubun == '사용자'){
      session
      .run("START n=node(*) MATCH (n:Agent)<-[:wasAttributedTo]-(m:Entity)-[:wasGeneratedBy]-(q:Activity)-[]-(w:Agent) WHERE Not(q.name = '수정') AND (n.name = '"+user_name +"' OR w.name =   '"+user_name +"') RETURN n, m , q, w LIMIT 4")
      .then(function(result){
        result.records.forEach(function (record) {
          console.log("***************view*******************")
          console.log(record._fields[0]);
          console.log(record._fields[1]);
          console.log(record._fields[2]);
          console.log(record._fields[3]);
          console.log(record._fields[3].properties.affiliation);
          
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


          session.run("START n=node(*) MATCH (n:Agent)<-[:wasAttributedTo]-(m:Entity)-[:wasGeneratedBy]-(q:Activity) WHERE q.name = '수정' AND n.name = '"+user_name +"' RETURN n, m, q LIMIT 3")
          .then(function(result){
            result.records.forEach(function (record) {
              console.log("***************view*******************")

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
    else if(user_gubun =='관리자'){

        session
        .run("START n=node(*) MATCH (n:Agent)<-[:wasAttributedTo]-(m:Entity)-[:wasGeneratedBy]-(q:Activity)-[]-(w:Agent) WHERE Not(q.name = '수정') RETURN n, m , q, w LIMIT 4")
        .then(function(result){
          result.records.forEach(function (record) {
            console.log("***************view*******************")
            console.log(record._fields[0]);
            console.log(record._fields[1]);
            console.log(record._fields[2]);
            console.log(record._fields[3]);
            console.log(record._fields[3].properties.affiliation);
            
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


            session.run("START n=node(*) MATCH (n:Agent)<-[:wasAttributedTo]-(m:Entity)-[:wasGeneratedBy]-(q:Activity) WHERE q.name = '수정' RETURN n, m, q LIMIT 3")
            .then(function(result){
              result.records.forEach(function (record) {
                console.log("***************view*******************")
          //      console.log(record._fields[0]);
            //    console.log(record._fields[1]);
           //     console.log(record._fields[2]);

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
  var activityTypeArr = [];
  var dateArr = [];
  var dataNameArr = [];
  var dataTypeArr = [];
  var priceArr = [];
  var deviceArr = [];


  console.log("dataName: " + dataName);
  console.log("device: " + device);
  console.log("dataType: " + dataType);
  console.log("price: " + price);

  console.log("*******************************************************************************************************");
  var nullcount = 0;
  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;
  var matchCyper;

  if(user_gubun == '관리자')
      matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent)";
  else
      matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent{name:'" + user_name + "'})";

  var returnCyper = " RETURN agent.name, agent.aff, activity.name, activity.date, entity.name, entity.d_type, entity.price, entity.device"
  var whereCyper = " WHERE"
  
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

  var newQuery = matchCyper + whereCyper;

  for(var i = 0 ; i < (4-nullcount); i++){
    if(deviceFlag){
      newQuery = newQuery + deviceCyper + "'" + device + "'";
      deviceFlag = false;
    }
    else if(dataNameFlag){
      newQuery = newQuery + dataNameCyper + "'" + dataName + "'";
      dataNameFlag = false;
    }
  
    else if(dataTypeFlag){
      newQuery = newQuery + dataTypeCyper + "'" + dataType + "'" ;
      dataTypeFlag = false;
    }
    else if(priceFlag){
      newQuery = newQuery + priceCyper + "'" + price + "'" ;
      priceFlag = false;
    }
    if((i+1) != (4-nullcount)){
      newQuery = newQuery + " AND";
    }
  }
  newQuery = newQuery + returnCyper;
  console.log(newQuery)
  session
  .run(newQuery)
  .then(function (result) {

   var searchArr = [];
   var size = Object.keys(result.records).length;  
   var test = [];
   for (var i = 0; i < size; i++) {
       var da = result.records[i]._fields;
       test[i] = da;                  
    }
    for(var i=0;i < size; i+=2){
      data=(test[[i]]+" ,"+test[[i+1]]);
      searchArr.push(data);
    }      

    temp = searchArr.toString();
    var splitTemp = temp.split(',');


    for(var j = 0, i=0; j < 8*size ; j++){
      if((j+1)%8 != 0){
        nameArr.push(splitTemp[j]);
        affiliationArr[i] = splitTemp[++j];
        activityTypeArr[i] = splitTemp[++j];
        dateArr[i] = splitTemp[++j];
        dataNameArr[i] = splitTemp[++j];
        dataTypeArr[i] = splitTemp[++j];
        priceArr[i] = splitTemp[++j];
        deviceArr[i] = splitTemp[++j];
      }
      i++; 
    }

    res.render('search/searchDataResult.ejs', {
      esession:session_value.getSession(),
      dataTypes : dataTypeArr, 
      dataNames : dataNameArr, 
      devices : deviceArr, 
      prices : priceArr, 
      affiliations : affiliationArr, 
      names : nameArr, 
      dates : dateArr, 
      activityTypes : activityTypeArr
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
  var activityTypeArr = [];
  var dateArr = [];
  var dataNameArr = [];
  var dataTypeArr = [];
  var priceArr = [];
  var deviceArr = [];

  console.log("affiliation: " + affiliation);
  console.log("name: " + name);

  var nullcount = 0;
  var matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent)";
  var returnCyper = " RETURN agent.name, agent.aff, activity.name, activity.date, entity.name, entity.d_type, entity.price, entity.device"
  var whereCyper = " WHERE"
  
  var affiliationCyper = " agent.aff = ";
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

  var newQuery = matchCyper + whereCyper;
  for(var i = 0 ; i < (2-nullcount); i++){
    if(affiliationFlag){
      newQuery = newQuery + affiliationCyper + "'" + affiliation + "'";
      affiliationFlag = false;
    }
    else if(nameFlag){
      newQuery = newQuery + nameCyper + "'" + name + "'" ;
      nameFlag = false;
    }
    if((i+1) != (2-nullcount)){
      newQuery = newQuery + " AND";
    }
  }
  newQuery = newQuery + returnCyper;
  session
  .run(newQuery)
  .then(function (result) {

   var searchArr = [];
   var size = Object.keys(result.records).length;  
   console.log("size: " + size);
   var test = [];
   for (var i = 0; i < size; i++) {
       var da = result.records[i]._fields;
       test[i] = da;                  
    }
    for(var i=0;i < size; i+=2){
      data=(test[[i]]+" ,"+test[[i+1]]);
      searchArr.push(data);
    }      

    temp = searchArr.toString();
    var splitTemp = temp.split(',');
    console.log("SSS: " , splitTemp);


    for(var j = 0, i=0; j < 8*size ; j++){
      if((j+1)%8 != 0){
        nameArr.push(splitTemp[j]);
        affiliationArr[i] = splitTemp[++j];
        activityTypeArr[i] = splitTemp[++j];
        dateArr[i] = splitTemp[++j];
        dataNameArr[i] = splitTemp[++j];
        dataTypeArr[i] = splitTemp[++j];
        priceArr[i] = splitTemp[++j];
        deviceArr[i] = splitTemp[++j];
      }
      i++; 
    }
    res.render('search/searchNameResult.ejs', {esession:session_value.getSession(), dataTypes : dataTypeArr, dataNames : dataNameArr, devices : deviceArr, prices : priceArr
      , affiliations : affiliationArr, names : nameArr, dates : dateArr, activityTypes : activityTypeArr}); 
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
  var activityTypeArr = [];
  var dateArr = [];
  var dataNameArr = [];
  var dataTypeArr = [];
  var priceArr = [];
  var deviceArr = [];

  var end_dateFlag = true;
  var start_dateFlag = true;
  var activityTypeFlag = true;

  console.log("starDate:  " + start_date);
  console.log("end: " + end_date);
  
  var nullcount = 0;

  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;
  var matchCyper;

  if(user_gubun == '관리자')
      matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent)";
  else
      matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent{name:'" + user_name + "'})";

  var returnCyper = " RETURN agent.name, agent.aff, activity.name, activity.date, entity.name, entity.d_type, entity.price, entity.device"
  var whereCyper = " WHERE"
  
  var startDateCyper = " activity.date >= ";
  var endDateCyper = " activity.date < ";
  var activityTypeCyper = " activity.name = "

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
  var newQuery = matchCyper + whereCyper;
  for(var i = 0 ; i < (2-nullcount); i++){
    if(end_dateFlag && start_date){
      newQuery = newQuery +  startDateCyper + "'" + start_date +"'" + " AND" + endDateCyper + "'" + end_date + "'" ;
      end_dateFlag = false;
      start_dateFlag = false;
    }
    else if(activityTypeFlag){
      newQuery = newQuery + activityTypeCyper + "'" + activityType + "'" ;
      activityTypeFlag = false;
    }
    if((i+1) != (2-nullcount)){
      newQuery = newQuery + " AND";
    }
  }

  newQuery = newQuery + returnCyper;
  console.log(newQuery);
  session
  .run(newQuery )
  .then(function (result) {

   var searchArr = [];
   var size = Object.keys(result.records).length;  
   console.log("size: " + size);
   var test = [];
   for (var i = 0; i < size; i++) {
       var da = result.records[i]._fields;
       test[i] = da;                  
    }
    for(var i=0;i < size; i+=2){
      data=(test[[i]]+" ,"+test[[i+1]]);
      searchArr.push(data);
    }      

    temp = searchArr.toString();
    var splitTemp = temp.split(',');
    console.log("SSS: " , splitTemp);


    for(var j = 0, i=0; j < 8*size ; j++){
      if((j+1)%8 != 0){
        nameArr.push(splitTemp[j]);
        affiliationArr[i] = splitTemp[++j];
        activityTypeArr[i] = splitTemp[++j];
        dateArr[i] = splitTemp[++j];
        dataNameArr[i] = splitTemp[++j];
        dataTypeArr[i] = splitTemp[++j];
        priceArr[i] = splitTemp[++j];
        deviceArr[i] = splitTemp[++j];
      }
      i++; 
    }
    res.render('search/searchPeriodResult.ejs', {esession:session_value.getSession(), dataTypes : dataTypeArr, dataNames : dataNameArr, devices : deviceArr, prices : priceArr
      , affiliations : affiliationArr, names : nameArr, dates : dateArr, activityTypes : activityTypeArr}); 
    session.close();  
  })
  .catch(function (err) {
     console.log(err);
  });
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

        /*
        for (var i = 0; i <result3Arr.length ; i++){
          console.log("result3Arr[" , i , "] : ", result3Arr[i])
        }
        */
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
  
 //console.log(params_name);

});

router.post('/getValues', function (req, res) {
    var checkValues = req.body.deleteCheck;
    console.log("*****************************", checkValues);
    res.render('data/deleteData', {esession:session_value.getSession()});
});


router.post('/delete', function(req, res){
  var dataName = req.body.dataName;
  var name = req.body.name;
  var dataNameFlag = true;
  var nameFlag = true;

  var nameArr = [];
  var affiliationArr = [];
  var activityTypeArr = [];
  var dateArr = [];
  var dataNameArr = [];
  var dataTypeArr = [];
  var priceArr = [];
  var deviceArr = [];

  console.log("dataName: " + dataName);
  console.log("name: " + name);

  var nullcount = 0;


  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;
  var matchCyper;

  if(user_gubun == '관리자')
    matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent)";
  else
    matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent{name:'" + user_name + "'})";

//  var matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent)";
  var returnCyper = " RETURN agent.name, agent.aff, activity.name, activity.date, entity.name, entity.d_type, entity.price, entity.device"
  var whereCyper = " WHERE"
  
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

  var newQuery = matchCyper + whereCyper;
  for(var i = 0 ; i < (2-nullcount); i++){
    if(dataNameFlag){
      newQuery = newQuery + dataNameCyper + "'" + dataName + "'";
      dataNameFlag = false;
    }
    else if(nameFlag){
      newQuery = newQuery + nameCyper + "'" + name + "'" ;
      nameFlag = false;
    }
    if((i+1) != (2-nullcount)){
      newQuery = newQuery + " AND";
    }
  }
  newQuery = newQuery + returnCyper;
  session
  .run(newQuery)
  .then(function (result) {

   var searchArr = [];
   var size = Object.keys(result.records).length;  
   console.log("size: " + size);
   var test = [];
   for (var i = 0; i < size; i++) {
       var da = result.records[i]._fields;
       test[i] = da;                  
    }
    for(var i=0;i < size; i+=2){
      data=(test[[i]]+" ,"+test[[i+1]]);
      searchArr.push(data);
    }      

    temp = searchArr.toString();
    var splitTemp = temp.split(',');
    console.log("SSS: " , splitTemp);


    for(var j = 0, i=0; j < 8*size ; j++){
      if((j+1)%8 != 0){
        nameArr.push(splitTemp[j]);
        affiliationArr[i] = splitTemp[++j];
        activityTypeArr[i] = splitTemp[++j];
        dateArr[i] = splitTemp[++j];
        dataNameArr[i] = splitTemp[++j];
        dataTypeArr[i] = splitTemp[++j];
        priceArr[i] = splitTemp[++j];
        deviceArr[i] = splitTemp[++j];
      }
      i++; 
    }
    res.render('data/deleteDataResult.ejs', {esession:session_value.getSession(), dataTypes : dataTypeArr, dataNames : dataNameArr, devices : deviceArr, prices : priceArr
      , affiliations : affiliationArr, names : nameArr, dates : dateArr, activityTypes : activityTypeArr}); 
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
  var activityTypeArr = [];
  var dateArr = [];
  var dataNameArr = [];
  var dataTypeArr = [];
  var priceArr = [];
  var deviceArr = [];

  console.log("dataName: " + dataName);
  console.log("name: " + name);

  var nullcount = 0;

  var user_gubun = session_value.getSession().gubun;
  var user_name = session_value.getSession().user;
  var matchCyper;

  if(user_gubun == '관리자')
    matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent)";
  else
    matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent{name:'" + user_name + "'})";

  //var matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent)";
  var returnCyper = " RETURN agent.name, agent.aff, activity.name, activity.date, entity.name, entity.d_type, entity.price, entity.device"
  var whereCyper = " WHERE"
  
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

  var newQuery = matchCyper + whereCyper;
  for(var i = 0 ; i < (2-nullcount); i++){
    if(dataNameFlag){
      newQuery = newQuery + dataNameCyper + "'" + dataName + "'";
      dataNameFlag = false;
    }
    else if(nameFlag){
      newQuery = newQuery + nameCyper + "'" + name + "'" ;
      nameFlag = false;
    }
    if((i+1) != (2-nullcount)){
      newQuery = newQuery + " AND";
    }
  }
  newQuery = newQuery + returnCyper;
  session
  .run(newQuery)
  .then(function (result) {

   var searchArr = [];
   var size = Object.keys(result.records).length;  
   console.log("size: " + size);
   var test = [];
   for (var i = 0; i < size; i++) {
       var da = result.records[i]._fields;
       test[i] = da;                  
    }
    for(var i=0;i < size; i+=2){
      data=(test[[i]]+" ,"+test[[i+1]]);
      searchArr.push(data);
    }      

    temp = searchArr.toString();
    var splitTemp = temp.split(',');
    console.log("SSS: " , splitTemp);


    for(var j = 0, i=0; j < 8*size ; j++){
      if((j+1)%8 != 0){
        nameArr.push(splitTemp[j]);
        affiliationArr[i] = splitTemp[++j];
        activityTypeArr[i] = splitTemp[++j];
        dateArr[i] = splitTemp[++j];
        dataNameArr[i] = splitTemp[++j];
        dataTypeArr[i] = splitTemp[++j];
        priceArr[i] = splitTemp[++j];
        deviceArr[i] = splitTemp[++j];
      }
      i++; 
    }
    res.render('data/modifyDataResult.ejs', {esession:session_value.getSession(), dataTypes : dataTypeArr, dataNames : dataNameArr, devices : deviceArr, prices : priceArr
      , affiliations : affiliationArr, names : nameArr, dates : dateArr, activityTypes : activityTypeArr}); 
    session.close();  
  })
  .catch(function (err) {
     console.log(err);
  });
});



module.exports = router;
