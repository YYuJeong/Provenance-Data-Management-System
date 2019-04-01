# -*- coding: utf-8 -*-
"""
Created on Mon Apr  1 15:26:34 2019

@author: YuJeong
"""

import csv
import time
start_time = time.time()




from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"))

def add_node(tx,sender_name,receiver_name,entity_name, activity_time,activity_price,sender_attribute,receiver_attribute, entity_use):
    tx.run("CREATE(: Agent {name: $sender_name, attribute: $sender_attribute}) <- [:wasAssociatedWith]-(: Activity { name: 'Own'}) <- [:wasGeneratedBy]-(: Entity { name: $entity_name, use: $entity_use}) - [:wasGeneratedBy] -> (: Activity { name: 'Buy', price: $activity_price,time: $activity_time})- [:wasAssociatedWith] -> (: Agent {name: $receiver_name, attribute: $receiver_attribute})"
         ,sender_name=sender_name,receiver_name=receiver_name,entity_name=entity_name,activity_price=activity_price,activity_time=activity_time,sender_attribute=sender_attribute, receiver_attribute=receiver_attribute, entity_use=entity_use)

with open("newdata.csv",'r') as f:
    matrix = list(csv.reader(f,delimiter=","))
    
with driver.session() as session:
    for i in range(len(matrix)):
        session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4],matrix[i][5],matrix[i][6], matrix[i][7])

  
# Bi-directional relationship?
#u1.relationships.create("friends", u2)
'''
def merge(tx):
   tx.run("MATCH (agent:Agent) WITH agent.name AS agent, collect(agent) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")

with driver.session() as session:
          session.read_transaction(merge)

def merge1(tx):
   tx.run("MATCH (entity:Entity) WITH entity.name AS entity, collect(entity) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")

with driver.session() as session:
          session.read_transaction(merge1)
'''                                                       
                                                                                                                                                                                                                                  


print("start_time", start_time)
print("---%s seconds ---" %(time.time() - start_time))