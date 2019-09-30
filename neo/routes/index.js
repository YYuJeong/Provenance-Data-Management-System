var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wowhi223'));
var session = driver.session();


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
    
    res.redirect('/');
});

router.get('/',function(req, res, next) {
   res.render('index'); 
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
      res.render('viewPage', {dataTypes : dataTypeArr, dataNames : dataNameArr, devices : deviceArr, prices : priceArr
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
  var matchCyper = "MATCH (entity:Entity)-[rel:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent)";
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

  console.log("nullcount: " + nullcount);

  console.log("*******************************************************************************************************");
  if(nullcount == 3){
    if(deviceFlag){
      console.log("device : " + device);
      var newQuery = matchCyper + whereCyper + deviceCyper + "'" + device + "'" + returnCyper;
    }
    
    else if(dataNameFlag){
      console.log("dataName: " + dataName);
      var newQuery = matchCyper + whereCyper + dataNameCyper + "'" + dataName + "'" + returnCyper;
    }
    
    else if(nameFlag){

      console.log("name: " + name);
      var newQuery = matchCyper + whereCyper + nameCyper + "'" + name + "'" + returnCyper;
    }
  
    else if(dataTypeFlag){
      console.log("dataType: " + dataType);
      var newQuery = matchCyper + whereCyper+ dataTypeCyper + "'" + dataType + "'" + returnCyper;
    }
  }
  else{
    console.log("두개 이상이다. ");
    var newQuery = matchCyper + whereCyper;
    console.log("for 조건:  " +(4-nullcount));
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
  }
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
       console.log("daL: ", da);
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

    res.render('newSearch/searchDataResult.ejs', {dataTypes : dataTypeArr, dataNames : dataNameArr, devices : deviceArr, prices : priceArr
      , affiliations : affiliationArr, names : nameArr, dates : dateArr, activityTypes : activityTypeArr}); 
    session.close();  
  })
  .catch(function (err) {
     console.log(err);
  });
});


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
 // console.log(params_name);
   session
    .run("MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent{name:'"+agent_name+"'}) WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) RETURN entity.name, entity.use, activity.name, activity.price, activity.time, agent.name, agent.attribute")
    .then(function (result) {
      
     
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
      res.render('search/searchKeyword/searchKeywordResult.ejs', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr, agent_name: agent_name}); 
      session.close();  
    })
    .catch(function (err) {
       console.log(err);
    });
});


module.exports = router;
