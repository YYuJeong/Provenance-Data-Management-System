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

/*
router.get('/users', function(req, res, next) {
  
  let esession = req.esession;



console.log("bbb" + req.esession);
  res.render("users", {

    esession : esession
  });
});
*/

router.get('/logout', function (req, res, next) {
    session_value.setSession('','','','');
    console.log('logout', session_value.getSession())
    res.render('index', {esession: session_value.getSession() });
});
/*
router.route('/users').get(
    function (req, res) {
        console.log(esession.email)
        res.render('users', {essession:req.essession});
    }
)*/

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

            if(!results[0])
            //return res.send('아이디를 확인해주십시오');
                return res.render('users', {message:'아이디를 확인해주십시오'});
            else {
                if(results[0].password === password){
                    //console.log('aaaaa');
                    //return res.send('로그인 되었습니다');

                    //session_info.email = body.email;
                    //session_info.password = body.password;
                    //session_info.user = results[0]["name"];
                    //session_info.gubun = results[0]["gubun"];
                    session_value.setSession(body.email, results[0]["name"], results[0]["gubun"], body.password);

                    res.render('index', {message:'로그인 되었습니다' , esession: session_value.getSession()});
                }
                else //return res.send('비밀번호를 확인해주십시오');
                    res.render('users', {message:'비밀번호를 확인해주십시오', esession: undefined});
            }
        });
    }
)
/*
router.post('/users', function(req, res, next) {
  var body = req.body;
  var email = body.email;
  var password = body.password;
  var name = body.name;
  var gubun = body.gubun;

  var sql = 'SELECT * FROM users WHERE email=?';
  con.query(sql, [email], function(err, results){
    if(err)
      console.log(err);

    if(!results[0])
      //return res.send('아이디를 확인해주십시오');
      return res.render('users', {message:'아이디를 확인해주십시오'});
    else {
      if(results[0].password === password){
        //console.log('aaaaa');
        //return res.send('로그인 되었습니다');

        esession.email = body.email;
        esession.password = body.password;
        esession.user = results[0]["name"];
        esession.gubun = results[0]["gubun"];

        res.render('index', {message:'로그인 되었습니다' , esession: esession.user});
      }
      else //return res.send('비밀번호를 확인해주십시오');
        res.render('users', {message:'비밀번호를 확인해주십시오', esession: undefined});
    }
  });
}); 
*/





router.post('/dataAdd', function (req, res) {
    var name = req.body.name;
    var affiliation = req.body.affiliation;
    var activityType = req.body.activityType;
    var date = req.body.date;
    var dataName = req.body.dataName;
    var dataType = req.body.dataType;
    var price = req.body.price;
    var device  = req.body.device;
    
    session
        .run("CREATE(: Entity {name: '" + dataName + "', price: '" + price + "', d_type: '" + dataType + "', device: '" + device + "'}) - [:wasAttributedTo] -> (: Agent {name: '" + name + "' , aff: '" + affiliation + "'}) <- [:wasAssociatedWith] - (:Activity {name: '" + activityType + "', date: '" + date + "'})<-[:wasGeneratedBy]-(: Entity {name: '" + dataName + "', price: '" + price + "', d_type: '" + dataType + "', device: '" + device + "'})")
       //.run("CREATE(: Agent {name:'" + sender_name + "', attribute:'" + sender_attr + "'}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: '" + entity_name + "', use: '" + entity_use + "'}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price:'" + activity_price + "',time:'" + activity_time +"'})- [:wasAssociatedWith] -> (: Agent {name:'" + receiver_name + "', attribute:'" + receiver_attr + "'})")


        .then(function (result) {

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    
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
  var activityTypeArr = [];
  var dateArr = [];
  var dataNameArr = [];
  var dataTypeArr = [];
  var priceArr = [];
  var deviceArr = [];
  var i = 0;
  session
      .run("START n=node(*) MATCH (n)-[:wasAttributedTo]->(m)<-[:wasAssociatedWith]-(k) RETURN n, m, k LIMIT 50")
      .then(function (result) {
        result.records.forEach(function (record) {
          i = i + 1;
          dataTypeArr.push(record._fields[0].properties.d_type);
          dataNameArr.push(record._fields[0].properties.name);
          deviceArr.push(record._fields[0].properties.device);
          priceArr.push(record._fields[0].properties.price)

          affiliationArr.push(record._fields[1].properties.aff);
          nameArr.push(record._fields[1].properties.name);

          dateArr.push(record._fields[2].properties.date);
          activityTypeArr.push(record._fields[2].properties.name);

          for (var j =0; j<3; j++){
            console.log("record " + j + " -th " + "field: " + record._fields[j]);
            console.log("record " + j + " -th " + "field labels: " + record._fields[j].labels[0]);
            console.log("record " + j+ " -th " + "field properties name: " + record._fields[j].properties.name);
            console.log("======================================");       
          } 

          console.log("i: " + i);
        });
      res.render('viewPage', {esession:session_value.getSession(), dataTypes : dataTypeArr, dataNames : dataNameArr, devices : deviceArr, prices : priceArr
        , affiliations : affiliationArr, names : nameArr, dates : dateArr, activityTypes : activityTypeArr}); 
      session.close();  
    })
    .catch(function (err) {
        console.log(err);
  });
});

router.post('/DataSearch', function(req, res){
  var dataName = req.body.dataName;
  var name = req.body.name;
  var dataType = req.body.dataType;
  var device = req.body.device;

  var dataNameFlag = true;
  var nameFlag = true;
  var dataTypeFlag = true;
  var deviceFlag = true;

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
  console.log("device: " + device);
  console.log("dataType: " + dataType);

  console.log("*******************************************************************************************************");
  var nullcount = 0;
  var matchCyper = "MATCH (entity:Entity)-[rel1:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent)";
  var returnCyper = " RETURN agent.name, agent.aff, activity.name, activity.date, entity.name, entity.d_type, entity.price, entity.device"
  var whereCyper = " WHERE"
  
  var deviceCyper = " entity.device = ";
  var dataNameCyper = " entity.name = ";
  var dataTypeCyper = " entity.d_type = ";
  var nameCyper = " agent.name = ";

  if(device == ''){
    console.log("device null");
    deviceFlag = false;
    nullcount++;
  }
  if(dataName == '' || dataName == undefined){
    console.log("dataName null");
    dataNameFlag = false;
    nullcount++;
  }

  if(name == ''){
    console.log("name null");
    nameFlag = false;
    nullcount++;
  }
  if(dataType == ''){
    console.log("dataType null");
    dataTypeFlag = false;
    nullcount++;
  }


  var newQuery = matchCyper + whereCyper;

  for(var i = 0 ; i < (4-nullcount); i++){
    console.log("i: " + i);
    if(deviceFlag){
      console.log("2device : " + device);
      newQuery = newQuery + deviceCyper + "'" + device + "'";
      deviceFlag = false;
    }
    else if(dataNameFlag){
      console.log("2dataName: " + dataName);
      newQuery = newQuery + dataNameCyper + "'" + dataName + "'";
      dataNameFlag = false;
    }
    
    else if(nameFlag){

      console.log("2name: " + name);
      newQuery = newQuery + nameCyper + "'" + name + "'" ;
      nameFlag = false;
    }
  
    else if(dataTypeFlag){
      console.log("2dataType: " + dataType);
      newQuery = newQuery + dataTypeCyper + "'" + dataType + "'" ;
      dataTypeFlag = false;
    }
    if((i+1) != (4-nullcount)){
      newQuery = newQuery + " AND";
    }
  }
  newQuery = newQuery + returnCyper;

  console.log("*******************************************************************************************************");
  console.log(newQuery);

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
    console.log("=======================================================");

    /*
    for(var i = 0; i < 4; i++){
      console.log("i: " + i);
      console.log("nameArr[i]: " + nameArr[i] );
      console.log("affiliation: " + affiliationArr[i]);
      console.log("activityType: " + activityTypeArr[i]);
      console.log("date: " + dateArr[i]);
      console.log("dataName: " + dataNameArr[i]);
      console.log("dataType: " + dataTypeArr[i]);
      console.log("price: " + priceArr[i]);
      console.log("device: " + deviceArr[i]);
    }

    */

    res.render('search/searchDataResult.ejs', {esession:session_value.getSession(), dataTypes : dataTypeArr, dataNames : dataNameArr, devices : deviceArr, prices : priceArr
      , affiliations : affiliationArr, names : nameArr, dates : dateArr, activityTypes : activityTypeArr}); 
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

  var nameArr = [];
  var affiliationArr = [];
  var activityTypeArr = [];
  var dateArr = [];
  var dataNameArr = [];
  var dataTypeArr = [];
  var priceArr = [];
  var deviceArr = [];

  console.log("starDate:  " + start_date);
  console.log("end: " + end_date);

  session
  .run( "MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) WHERE activity.date>='"+start_date+"' AND activity.date<'"+end_date+"' RETURN agent.name, agent.aff, activity.name, activity.date, entity.name, entity.d_type, entity.price, entity.device")
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
  var agent_name = req.body.agent_name;
  var data=[];
  var test = [];
  var receiverArr= [];
  var recvDivisionArr = [];
  var senderArr = [];
  var sendDivisionArr = [];
  var dataUsageArr = [];
  var dataArr = []; 
  var priceArr = [];
  var dateArr = [];
  var temp;
  var search_keyword;
  
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
    console.log(group, keyword);
    session
    .run("MATCH (a1:"+ group[0] +" {name:'"+ keyword[0] +"'}), (a2:"+group[1]+" {name:'"+ keyword[1] +"'}), path=((a1)-[*3..4]-(a2)) RETURN path ORDER BY LENGTH(path)")
    .then(result => {
      console.log(result.records.length)
      return result.records.map(record => {
        console.log("-----------------START------------------------")
        console.log(record.get("path"));
        path = record.get("path");
        start = path["start"]["properties"]["name"]
        end = path["end"]["properties"]["name"]
        var startArr = [];
        for(var p in path["segments"]){
          console.log("=============================PATH SEGMENT====================")
          console.log(typeof(path["segments"][p]));
          console.log(path["segments"][p]);
          var ss = path["segments"][p];
          console.log(typeof(ss));
          startArr.push(ss.start);
          console.log(ss.start);
          //var size = Object.keys(result.records).length;  
        }
        console.log(start, end)
        console.log("**********************END*****************************")

        for(var i =0; i < startArr.length ; i++){
          console.log("startArr[" + i + "] : " + startArr[i]);
        }
        res.render('search/searchKeywordResult.ejs',{esession: session_value.getSession() } );
      });
    })
    /*(function (result) {
      console.log(result);
      for(var i =0; i<result.length; i++){
        console.log(result.records[i]._fields)
      }
     /*
     var searchArr = [];
     var size = Object.keys(result.records).length;   
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
      for(var i=0, j =0; i< splitTemp.length; i++){
        if(i%14 == 0){
          if(i > 0){
            j++;
            dataArr[j] = splitTemp[i]; 
            dataUsageArr[j] = splitTemp[++i];
          }
          else{
            dataArr[j] = splitTemp[i]; 
            dataUsageArr[j] = splitTemp[++i];
          }
        }
        else if(i%14 == 2){
          if(splitTemp[i] == 'Buy'){
            priceArr[j] = splitTemp[++i];
            dateArr[j] = splitTemp[++i];
            receiverArr[j] = splitTemp[++i];
            recvDivisionArr[j] = splitTemp[++i];
          }
          else if(splitTemp[i] == 'Own'){
            i += 2;
            senderArr[j] = splitTemp[++i];
            sendDivisionArr[j] = splitTemp[++i];
          }
          i += 2;
        }
        else if(i%14 == 9){
          if(splitTemp[i] == 'Buy'){
            priceArr[j] = splitTemp[++i];
            dateArr[j] = splitTemp[++i];
            receiverArr[j] = splitTemp[++i];
            recvDivisionArr[j] = splitTemp[++i];
          }
          else if(splitTemp[i] == 'Own'){
            i += 2;
            senderArr[j] = splitTemp[++i];
            sendDivisionArr[j] = splitTemp[++i];
          }
        }
      }
<<<<<<< HEAD
      res.render('search/searchKeywordResult.ejs', {esession:session_value.getSession(), receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr, agent_name: agent_name});

      
      res.render('search/searchKeywordResult.ejs', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr, agent_name: agent_name}); 
>>>>>>> master
      session.close();  
    })*/
    .catch(function (err) {
       console.log(err);
    });
  });
  
 //console.log(params_name);

});

module.exports = router;
