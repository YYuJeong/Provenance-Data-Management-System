# -*- coding: utf-8 -*-
import csv
import time
start_time = time.time()

with open("randomData.csv",'r') as f:
    matrix = list(csv.reader(f,delimiter=","))
    


from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223")) #11001

def add_node(tx,receiver_name,sender_name,entity_name, activity_time,activity_price, sender_attribute, receiver_attribute,  entity_use):
    tx.run("CREATE(agent: Agent {name: $receiver_name, attribute: $receiver_attribute}) <- [waw:wasAssociatedWith]-(act: Activity { name: 'Own'}) <- [wgb:wasGeneratedBy]-(entity: Entity { name: $entity_name, use: $entity_use}) - [wgb:wasGeneratedBy] -> (act: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [waw:wasAssociatedWith] -> (agent: Agent {name: $sender_name, attribute: $sender_attribute})"
         ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time, sender_attribute=sender_attribute, receiver_attribute=receiver_attribute, entity_use=entity_use)
    #tx.run("CREATE(: Agent {name: $receiver_name}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: $entity_name}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [:wasAssociatedWith] -> (: Agent {name: $sender_name})"
        # ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time)

'''
def add_node(tx,sender_name,receiver_name,entity_name, activity_time,activity_price, sender_attribute, receiver_attribute,  entity_use):
<<<<<<< HEAD
    tx.run("CREATE(b: Buyer {name: $receiver_name, division: $receiver_attribute}) <- [buy:Buy{relation: 'buy', date: $activity_time}]-(d: Data { name: $entity_name, price:$activity_price, use:  $entity_use }) <- [sell:Sell{relation: 'sell', date: $activity_time}] - (s: Seller {name: $sender_name, division: $sender_attribute})"
         ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time, sender_attribute=sender_attribute, receiver_attribute=receiver_attribute, entity_use=entity_use)
    #tx.run("CREATE(: Agent {name: $receiver_name}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: $entity_name}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [:wasAssociatedWith] -> (: Agent {name: $sender_name})"
        # ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time)

 '''       

    tx.run("CREATE(b: Buyer {name: $receiver_name, division: $receiver_attribute}) <- [buy:Buy{date: $activity_time}]-(d: Data { name: $entity_name, price:$activity_price, use:  $entity_use }) <- [sell:Sell{date: $activity_time}] - (s: Seller {name: $sender_name, division: $sender_attribute})"
         ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time, sender_attribute=sender_attribute, receiver_attribute=receiver_attribute, entity_use=entity_use)
    #tx.run("CREATE(: Agent {name: $receiver_name}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: $entity_name}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [:wasAssociatedWith] -> (: Agent {name: $sender_name})"
        # ,receiver_name=receiver_name,sender_name=sender_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time)
'''
        
>>>>>>> 691c745238fb5adb0a3806e3ad9a73bf7c788dbe

with driver.session() as session:
    for i in range(100):
        session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4],matrix[i][5],matrix[i][6],matrix[i][7])
        
        #session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4])

  
# Bi-directional relationship?
#u1.relationships.create("friends", u2)

def merge(tx):
   tx.run("MATCH (s:Seller) WITH s.name AS s, collect(s) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")

with driver.session() as session:
          session.read_transaction(merge)

def merge1(tx):
   tx.run("MATCH (d:Data) WITH d.name AS d, collect(d) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")

with driver.session() as session:
          session.read_transaction(merge1)
                                                    
def merge2(tx):
   tx.run("MATCH (b:Buyer) WITH b.name AS b, collect(b) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")

with driver.session() as session:
          session.read_transaction(merge2)



print("start_time", start_time)
print("---%s seconds ---" %(time.time() - start_time))