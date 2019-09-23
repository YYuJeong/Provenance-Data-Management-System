# -*- coding: utf-8 -*-
import csv
import time
start_time = time.time()

with open("C:/Users/YuJeong/Desktop/randomData.csv",'r') as f:
    matrix = list(csv.reader(f,delimiter=","))
    
from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223")) #11001
'''
#기존 cypher
def add_node(tx,receiver_name,sender_name,entity_name, activity_time,activity_price, sender_attribute, receiver_attribute,  entity_use):
    #tx.run("CREATE(: Agent {: $receiver_name, attribute: $receiver_attribute}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(entity: Entity { : $entity_name, use: $entity_use}) - [:wasGeneratedBy] -> (: Activity { n: 'Buy', : $activity_price,time: $activity_time})- [waw:wasAssociatedWith] -> (agent: Agent {name: $sender_name, attribute: $sender_attribute})"
     #    ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time, sender_attribute=sender_attribute, receiver_attribute=receiver_attribute, entity_use=entity_use)
    tx.run("CREATE(: Agent {name: $receiver_name, division: $receiver_attribute}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: $entity_name, use:$entity_use}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [:wasAssociatedWith] -> (: Agent {name: $sender_name, division: $sender_attribute})"
         ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,sender_attribute=sender_attribute, receiver_attribute=receiver_attribute, activity_time=activity_time, entity_use=entity_use)
'''

#새로 만든 데이터모델 적용한 cypher

def add_node(tx, name, affiliation, activityType, date, dataName, dataType, price, device):
 #   tx.run("CREATE(: Entity {d_name: $dataName, price: $price, d_type: $dataType, device: $device}) - [:wasAttributedTo] -> (: Agent {name: $name, aff: $affiliation})<- [:wasAssociatedWith]-(: Activity {a_type:$activityType, date:$date}) <- [:wasGeneratedBy]-(: Entity {d_name: $dataName, price:$price, d_type:$dataType, device:$device}) <- [:used] - (: Activity { a_type: $activityType, date:$date})"
 #                  ,name=name, affiliation=affiliation, activityType=activityType, date=date, dataName=dataName, dataType=dataType, price=price, device=device)  

     tx.run("CREATE(: Entity {name: $dataName, price: $price, d_type: $dataType, device: $device}) - [:wasAttributedTo] -> (: Agent {name: $name, aff: $affiliation}) <- [:wasAssociatedWith] - (:Activity {name: $activityType, date: $date})<-[:wasGeneratedBy]-(: Entity {name: $dataName, price: $price, d_type: $dataType, device: $device})"
           ,name=name, affiliation=affiliation, activityType=activityType, date=date, dataName=dataName, dataType=dataType, price=price, device=device)
  
    
with driver.session() as session:
    for i in range(10):
        session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4],matrix[i][5],matrix[i][6],matrix[i][7])
        
       
        #session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4])

  
# Bi-directional relationship?
#u1.relationships.create("friends", u2)
'''
def merge(tx):
   tx.run("MATCH (a:Agent) WITH a.name AS a, collect(a) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")

with driver.session() as session:
          session.read_transaction(merge)

def merge1(tx):
   tx.run("MATCH (ac:Activity) WITH ac.name AS ac, collect(ac) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")

with driver.session() as session:
          session.read_transaction(merge1)
                                                    
def merge2(tx):
   tx.run("MATCH (e:Entity) WITH e.name AS e, collect(e) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")

with driver.session() as session:
          session.read_transaction(merge2)

'''

print("start_time", start_time)
print("---%s seconds ---" %(time.time() - start_time))