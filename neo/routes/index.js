var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wowhi223'));
var session = driver.session();


router.post('/dataAdd', function (req, res) {
    var receiver_name = req.body.receiver_name;
    var receiver_attr = req.body.receiver_attr;
    var sender_name = req.body.sender_name;
    var sender_attr = req.body.sender_attr;
    var entity_name = req.body.entity_name;
    var entity_use = req.body.entity_use;
    var activity_price = req.body.activity_price;
    var activity_time = req.body.activity_time;
    
    session
        .run("CREATE(: Agent {name:'" + sender_name + "', attribute:'" + sender_attr + "'}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: '" + entity_name + "', use: '" + entity_use + "'}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price:'" + activity_price + "',time:'" + activity_time +"'})- [:wasAssociatedWith] -> (: Agent {name:'" + receiver_name + "', attribute:'" + receiver_attr + "'})")
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
  var receiverArr= [];
  var recvDivisionArr = [];
  var senderArr = [];
  var sendDivisionArr = [];
  var dataUsageArr = [];
  var dataArr = []; 
  var priceArr = [];
  var dateArr = [];
  session
      .run("START n=node(*) MATCH (n)-[r]->(m) RETURN n, m LIMIT 60")
      .then(function (result) {
        var j =0;
        result.records.forEach(function (record) {
          if(j%4 == 0){
            senderArr.push(record._fields[1].properties.name);
            sendDivisionArr.push(record._fields[1].properties.attribute);
          }
          else if(j%4 == 1){
            dataArr.push(record._fields[0].properties.name);
            dataUsageArr.push(record._fields[0].properties.use);
          }
          else if(j%4 == 3){
            priceArr.push(record._fields[0].properties.price);
            dateArr.push(record._fields[0].properties.time);
            receiverArr.push(record._fields[1].properties.name);
            recvDivisionArr.push(record._fields[1].properties.attribute);
          }
          /*
          for (var i =0; i<2; i++){
            console.log("record " + i + " -th " + "field: " + record._fields[i]);
            console.log("record " + i + " -th " + "field labels: " + record._fields[i].labels[0]);
            console.log("record " + i + " -th " + "field properties name: " + record._fields[i].properties.name);
            console.log("======================================");       
          } 
          */
          j++;
        });
      res.render('viewPage', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr}); 
      session.close();  
    })
    .catch(function (err) {
        console.log(err);
  });
});

router.post('/agent', function (req, res) {
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
      res.render('search/searchPerson/searchAgentResult.ejs', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr, agent_name: agent_name}); 
      session.close();  
    })
    .catch(function (err) {
       console.log(err);
    });
});

router.post('/agentAttribute', function (req, res) {
  var agent_name = req.body.agent_name;
  var agent_attr = req.body.agent_attr;
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
   session
    .run("MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent{name:'"+agent_name+"', attribute:'"+agent_attr+"'}) WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) RETURN entity.name, entity.use, activity.name, activity.price, activity.time, agent.name, agent.attribute")
    .then(function (result) {
     var searchArr = [];
     var size = Object.keys(result.records).length;
    console.log("size : " + size);     
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
      res.render('search/searchPerson/searchAgentAttributeResult.ejs', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr });
       session.close();  
    })
    .catch(function (err) {
       console.log(err);
    });
//res.render('search.ejs', {data: params_name});
});



router.post('/entity', function (req, res) {
  var entity_name = req.body.entity_name;
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
    session
        .run("MATCH (entity:Entity)-[rel:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent) WHERE entity.name='"+entity_name+"' RETURN entity.name, entity.use, activity.name, activity.price, activity.time, agent.name, agent.attribute")
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
          res.render('search/searchData/searchEntityResult.ejs', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr});
          session.close();  
        })
        .catch(function (err) {
            console.log(err);
      });
      //res.render('search.ejs', {data: params_name});   
});

router.post('/entityAttribute', function (req, res) {
  var entity_name = req.body.entity_name;
  var entity_attr = req.body.entity_attr;
  var receiverArr= [];
  var recvDivisionArr = [];
  var senderArr = [];
  var sendDivisionArr = [];
  var dataUsageArr = [];
  var dataArr = []; 
  var priceArr = [];
  var dateArr = [];
  var temp;
  var data=[];
  var test = [];
  
  //console.log(entity_name);
    session
        .run("MATCH (entity:Entity)-[rel:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent) WHERE entity.name='"+entity_name+"' AND entity.use='"+entity_attr+"' RETURN entity.name, entity.use, activity.name, activity.price, activity.time, agent.name, agent.attribute")
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
          res.render('search/searchData/searchEntityAttributeResult.ejs', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr});
          session.close();  
        })
        .catch(function (err) {
            console.log(err);
      });
      //res.render('search.ejs', {data: params_name});   
});

router.post('/agentPeriod', function (req, res) {
  var agent_name = req.body.agent_name;
  var start_date = req.body.start_date;
  var end_date = req.body.end_date;
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
  
    session
        .run("MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent{name:'"+agent_name+"'}) WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) WHERE activity.time>='"+start_date+"' AND activity.time<'"+end_date+"' WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent)  RETURN entity.name, entity.use, activity.name, activity.price, activity.time, agent.name, agent.attribute")
        .then(function (result) {
            var searchArr = [];
            console.log(result);
            var size = Object.keys(result.records).length;
            console.log("size : " + size);     
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
          res.render('search/searchPerson/searchAgentPeriodResult.ejs', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr});
          session.close();  
        })
        .catch(function (err) {
            console.log(err);
      });
      //res.render('search.ejs', {data: params_name});
      
});

router.post('/entityPeriod', function (req, res) {
  var entity_name = req.body.entity_name;
  var start_date = req.body.start_date;
  var end_date = req.body.end_date;
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

    session
        .run("MATCH (entity:Entity)-[rel:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent) WHERE entity.name='"+entity_name+"'AND activity.time>='"+start_date+"'AND activity.time<'"+end_date+"' WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) RETURN entity.name, entity.use, activity.name, activity.price, activity.time, agent.name, agent.attribute")
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
          res.render('search/searchData/searchEntityPeriodResult.ejs', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr});
          session.close();  
        })
        .catch(function (err) {
            console.log(err);
      });
      //res.render('search.ejs', {data: params_name});
      
});

router.post('/agentEntityPeriod', function (req, res) {
  var entity_name = req.body.entity_name;
  var agent_name = req.body.agent_name;
  var start_date = req.body.start_date;
  var end_date = req.body.end_date;
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

   session
    .run("MATCH (entity:Entity)-[rel:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent) WHERE entity.name='"+entity_name+"'AND agent.name='"+agent_name+"' AND activity.time>='"+start_date+"'AND activity.time<'"+end_date+"'WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) RETURN entity.name, entity.use, activity.name, activity.price, activity.time, agent.name, agent.attribute")
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
      res.render('search/searchDataPerson/searchAgentEntityPeriodResult.ejs', {receivers : receiverArr, recvDivisions: recvDivisionArr, senders: senderArr, sendDivisions: sendDivisionArr, dataUsages: dataUsageArr, datas: dataArr, prices: priceArr, dates: dateArr});
       session.close();  
    })
    .catch(function (err) {
       console.log(err);
    });
//res.render('search.ejs', {data: params_name});

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
