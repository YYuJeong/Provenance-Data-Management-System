# -*- coding: utf-8 -*-
import csv, sys, time
start_time = time.time()

filename = sys.argv[1]
with open(filename,'r', encoding='UTF8', errors='ignore') as f:
    matrix = list(csv.reader(f,delimiter=","))
print(len(matrix))


from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"))
'''
def add_node(tx,receiver_name,sender_name,entity_name, activity_time,activity_price, sender_attribute, receiver_attribute,  entity_use):
    tx.run("CREATE(: Agent {name: $receiver_name, attribute: $receiver_attribute}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: $entity_name, use: $entity_use}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [:wasAssociatedWith] -> (: Agent {name: $sender_name, attribute: $sender_attribute})"
         ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time, sender_attribute=sender_attribute, receiver_attribute=receiver_attribute, entity_use=entity_use)
    #tx.run("CREATE(: Agent {name: $receiver_name}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: $entity_name}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [:wasAssociatedWith] -> (: Agent {name: $sender_name})"
        # ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time)
'''

def add_node(tx,name,	affiliation,	activityType,	date,	dataName,	dataType,	price,	device):
    #tx.run("CREATE(e: Entity {name: $dataName , price: $price , d_type: $dataType, device: $device}) - [:wasAttributedTo {cost:1}] -> (a: Agent {name: $name , aff: $affiliation }) <- [:wasAssociatedWith {cost:1}] - (ac:Activity {name: $activityType, date: $date })<-[:wasGeneratedBy {cost:1}]-(e1: Entity {name: $dataName , price: $price , d_type: $dataType , device: $device})"
    tx.run("CREATE(e: Entity {name: $dataName , price: $price , d_type: $dataType, device: $device}) - [:wasAttributedTo] -> (a: Agent {name: $name , aff: $affiliation }) <- [:wasAssociatedWith] - (ac:Activity {name: $activityType, date: $date })<-[:wasGeneratedBy]-(e1: Entity {name: $dataName , price: $price , d_type: $dataType , device: $device})"     ,dataName = dataName, price = price, dataType = dataType, device = device, name = name, affiliation = affiliation, activityType = activityType, date = date)
    #tx.run("CREATE(: Agent {name: $receiver_name}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: $entity_name}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [:wasAssociatedWith] -> (: Agent {name: $sender_name})"
        # ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time)


'''
def add_node(tx,sender_name,receiver_name,entity_name, activity_time,activity_price, sender_attribute, receiver_attribute,  entity_use):
    tx.run("CREATE(b: Buyer {name: $receiver_name, division: $receiver_attribute}) <- [buy:Buy{relation: 'buy', date: $activity_time}]-(d: Data { name: $entity_name, price:$activity_price, use:  $entity_use }) <- [sell:Sell{relation: 'sell', date: $activity_time}] - (s: Seller {name: $sender_name, division: $sender_attribute})"
         ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time, sender_attribute=sender_attribute, receiver_attribute=receiver_attribute, entity_use=entity_use)
    #tx.run("CREATE(: Agent {name: $receiver_name}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: $entity_name}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [:wasAssociatedWith] -> (: Agent {name: $sender_name})"
        # ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time)
 '''       

with driver.session() as session:
    for i in range(len(matrix)):
        session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4],matrix[i][5],matrix[i][6],matrix[i][7])
        
        #session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4])

  
# Bi-directional relationship?
#u1.relationships.create("friends", u2)
'''
def merge(tx):
   tx.run("MATCH (e:Entity) WITH e.name AS e, collect(e) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")
with driver.session() as session:
          session.read_transaction(merge)
def merge1(tx):
   tx.run("MATCH (a:Agent) WITH a.name AS a, collect(a) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")
with driver.session() as session:
          session.read_transaction(merge1)
                                                    
def merge2(tx):
   tx.run("MATCH (ac:Activity) WITH ac.name AS ac, collect(ac) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")
with driver.session() as session:
          session.read_transaction(merge2)

def merge3(tx):
   tx.run("MATCH (e1:Entity) WITH e1.name AS e1, collect(e1) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")
with driver.session() as session:
          session.read_transaction(merge3)
'''
print("start_time", start_time)
print("---%s seconds ---" %(time.time() - start_time))
