var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'wowhi223'));
var session = driver.session();


router.post('/dataAdd', function (req, res) {
    var receiver_name = req.body.receiver_name;
    var sender_name = req.body.sender_name;
    var entity_name = req.body.entity_name;
    var activity_price = req.body.activity_price;
    var activity_time = req.body.activity_time;
    
    session
        .run("CREATE(: Agent {name:'" + receiver_name + "'}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: '" + entity_name + "'}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price:'" + activity_price + "',time:'" + activity_time +"'})- [:wasAssociatedWith] -> (: Agent {name:'" + sender_name + "'})")
        .then(function (result) {

            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    
    res.redirect('/');
});

router.get('/',function(req, res, next) {
  // res.send('kkk');
   res.render('index');
 });


router.get('/viewPage', function (req, res) {  
  session
        .run('MATCH(n) RETURN n LIMIT 100')
        .then(function (result) {
            var activityArr = [];
            result.records.forEach(function (record) {
                activityArr.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name,
                    price: record._fields[0].properties.price,
                    time: record._fields[0].properties.time

                });
            });  
            session
                .run('MATCH(n: Agent) RETURN n LIMIT 100')
                .then(function (result2) {
                    var agentArr = [];
                    result2.records.forEach(function (record) {
                        agentArr.push({
                            id: record._fields[0].identity.low,
                            name: record._fields[0].properties.name
                        });
                    });
                    session
                        .run('MATCH(n: Entity) RETURN n LIMIT 100')
                        .then(function (result3) {
                            var entityArr = [];
                            result3.records.forEach(function (record) {
                                entityArr.push({
                                    id: record._fields[0].identity.low,
                                    name: record._fields[0].properties.name
                                });
                            });
                            res.render('viewPage', {
                                activities: activityArr,
                                agents: agentArr,
                                entities: entityArr
                            });
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                })
                .catch(function (err) {
                    console.log(err);
                });
        })
        .catch(function (err) {
            console.log(err);
        });
});

router.post('/agent', function (req, res) {
  var agent_name = req.body.agent_name;
  var data=[];
  var test = [];
  var activityArr= [];
  var agentArr = [];
  var entityArr = []; 
  var dateArr = [];
  var temp;
 // console.log(params_name);
   session
    .run("MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent{name:'"+agent_name+"'}) WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) RETURN entity.name, activity.name, agent.name, activity.time")
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
      temp = searchArr.toString()
      var splitTemp = temp.split(',')
      for(var i =0; i< splitTemp.length; i++){
        if((i%4) == 0){
          entityArr.push(splitTemp[i]);
        }
        else if((i%4) == 1){
          activityArr.push(splitTemp[i]);
        }
        else if((i%4) == 2){
          agentArr.push(splitTemp[i]);
        }
        else if((i%4) == 3){
          dateArr.push(splitTemp[i]);
        }
      }
      searchArr = []
      var j = 0;
      var k = 0;
      for(var i =0; i< dateArr.length; i++){
        if(activityArr[i] == 'Buy'){
          searchArr[(1+4*j)] = agentArr[i];
          searchArr[(2+4*j)] = entityArr[i];
          searchArr[(3+4*j)] = dateArr[i];
          j++;
        }
        else if(activityArr[i] == 'Own'){
          searchArr[(4*k)] = agentArr[i];
          k++;
        }
      }
      console.log(agent_name);
      res.render('search/searchAgentResult.ejs', {searches: searchArr, agent_name: agent_name}); 
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
  var test1 = [];

 // console.log(params_name);
   session
    .run("MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent{name:'"+agent_name+"', school:'"+agent_attr+"'}) WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) RETURN entity.name, activity.name, agent.name")
    .then(function (result) {
      
     
     var searchArr = [];
     var size = Object.keys(result.records).length;
     console.log("size : " + size);     
     for (var i = 0; i < size; i++) {
         var da = result.records[i]._fields;
         test[i] = da;            
         //data2 = JSON.stringify(data);         
         console.log("result : " + test[i]);
      }

    for(var i=0;i < size; i+=2){
      data=(test[[i]]+" ,"+test[[i+1]]);
      searchArr.push(data);
      console.log(data);

      } 
  // console.log("ssarr"+searchArr);
      res.render('search/searchAgentAttributeResult.ejs', {searches: searchArr});
  // console.log('ddd'); 
       session.close();  
    })
    .catch(function (err) {
       console.log(err);
    });
//res.render('search.ejs', {data: params_name});
});



router.post('/entity', function (req, res) {
  var entity_name = req.body.entity_name;
  var data2;
  var data=[];
  var test = [];
  
  //console.log(entity_name);
    session
        .run("MATCH (entity:Entity)-[rel:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent) WHERE entity.name='"+entity_name+"' RETURN entity.name, activity.name, agent.name")
        .then(function (result) {
            var searchArr = [];
            console.log(result);
            var size = Object.keys(result.records).length;
            console.log("size : " + size);     
            for (var i = 0; i < size; i++) {
              var da = result.records[i]._fields;
              test[i] = da;            
              //data2 = JSON.stringify(data);         
              //console.log("result : " + data2);
           }
     
         for(var i=0;i < size; i+=2){
           data=(test[[i]]+" ,"+test[[i+1]]);
           searchArr.push(data);
           console.log(data);
     
           } 
     
         // console.log("ssarr"+searchArr);
          res.render('search/searchEntityResult.ejs', {searches: searchArr});
         // console.log('ddd'); 
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
  var data2;
  var data=[];
  var test = [];
  
  //console.log(entity_name);
    session
        .run("MATCH (entity:Entity)-[rel:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent) WHERE entity.name='"+entity_name+"' RETURN entity.name, activity.name, agent.name")
        .then(function (result) {
            var searchArr = [];
            console.log(result);
            var size = Object.keys(result.records).length;
            console.log("size : " + size);     
            for (var i = 0; i < size; i++) {
              var da = result.records[i]._fields;
              test[i] = da;            
              //data2 = JSON.stringify(data);         
              //console.log("result : " + data2);
           }
     
         for(var i=0;i < size; i+=2){
           data=(test[[i]]+" ,"+test[[i+1]]);
           searchArr.push(data);
           console.log(data);
     
           } 
     
         // console.log("ssarr"+searchArr);
          res.render('search/searchEntityAttributeResult.ejs', {searches: searchArr});
         // console.log('ddd'); 
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
  
 // console.log(params_name);
    session
        .run("MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent{name:'"+agent_name+"'}) WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) WHERE activity.time>='"+start_date+"' AND activity.time<'"+end_date+"' WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent)  RETURN entity.name, activity.name, agent.name")
        .then(function (result) {
            var searchArr = [];
            console.log(result);
            var size = Object.keys(result.records).length;
            console.log("size : " + size);     
            for (var i = 0; i < size; i++) {
              var da = result.records[i]._fields;
              test[i] = da;            
              //data2 = JSON.stringify(data);         
              //console.log("result : " + data2);
           }
     
         for(var i=0;i < size; i+=2){
           data=(test[[i]]+" ,"+test[[i+1]]);
           searchArr.push(data);
           console.log(data);
     
           } 
         // console.log("ssarr"+searchArr);
          res.render('search/searchAgentPeriodResult.ejs', {searches: searchArr});
         // console.log('ddd'); 
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
  
 // console.log(params_name);
    session
        .run("MATCH (entity:Entity)-[rel:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent) WHERE entity.name='"+entity_name+"'AND activity.time>='"+start_date+"'AND activity.time<'"+end_date+"' WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) RETURN entity.name, activity.name, agent.name")
        .then(function (result) {
            var searchArr = [];
            console.log(result);
            var size = Object.keys(result.records).length;
            console.log("size : " + size);     
            for (var i = 0; i < size; i++) {
              var da = result.records[i]._fields;
              test[i] = da;            
              //data2 = JSON.stringify(data);         
              //console.log("result : " + data2);
           }
     
         for(var i=0;i < size; i+=2){
           data=(test[[i]]+" ,"+test[[i+1]]);
           searchArr.push(data);
           console.log(data);
     
           } 
     
         // console.log("ssarr"+searchArr);
          res.render('search/searchEntityPeriodResult.ejs', {searches: searchArr});
         // console.log('ddd'); 
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

 // console.log(params_name4);
   session
    .run("MATCH (entity:Entity)-[rel:wasGeneratedBy]->(activity:Activity)-[rel2:wasAssociatedWith]->(agent:Agent) WHERE entity.name='"+entity_name+"'AND agent.name='"+agent_name+"' AND activity.time>='"+start_date+"'AND activity.time<'"+end_date+"'WITH entity MATCH (entity:Entity)-[:wasGeneratedBy]->(activity:Activity)-[:wasAssociatedWith]->(agent:Agent) RETURN entity.name, activity.name, agent.name")
    .then(function (result) {
      
     
        var searchArr = [];
        var size = Object.keys(result.records).length;
        console.log("size : " + size);     
        for (var i = 0; i < size; i++) {
          var da = result.records[i]._fields;
          test[i] = da;            
          //data2 = JSON.stringify(data);         
         
        }

          for(var i=0;i < size; i+=2){
          data=(test[[i]]+" ,"+test[[i+1]]);
          searchArr.push(data);
          console.log(data);
          } 

  // console.log("ssarr"+searchArr);
      res.render('search/searchAgentEntityPeriodResult.ejs', {searches: searchArr});
  // console.log('ddd'); 
       session.close();  
    })
    .catch(function (err) {
       console.log(err);
    });
//res.render('search.ejs', {data: params_name});

});


module.exports = router;
