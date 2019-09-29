# -*- coding: utf-8 -*-
"""
Created on Mon Sep 23 12:23:20 2019

@author: DKE
"""
import csv
from neo4j import GraphDatabase
with open("randomData.csv",'r') as f:
    matrix = list(csv.reader(f,delimiter=","))
    
    driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"))
          
    #create agent
    def create_agent(tx, name, affiliation):
        tx.run("CREATE (agent:Agent {name: $name, affiliation: $affiliation})", name=name, affiliation=affiliation)
    
    #create activity
    def create_activity(tx, activityType, date):
        tx.run("CREATE (activity:Activity {activityType: $activityType, date: $date})", activityType=activityType, date=date)
    
  
    #create entity
    def create_entity(tx, dataName, dataType, price, device):
        tx.run("CREATE (entity:Entity {dataName: $dataName, dataType: $dataType, price: $price, device: $device})", dataName=dataName, dataType=dataType, price=price, device=device)
    
  
    #create a relationship between entity and agent - wasAttributedTo
    def wasAttributedTo(tx, name, affiliation, dataName, dataType, price, device):
        tx.run("MATCH (agent:Agent {name:$name, affiliation:$affiliation}) "
               "MATCH (entity:Entity {dataName: $dataName, dataType: $dataType, price: $price, device: $device}) "
               "MERGE (agent)-[:wasAttributedTo]->(entity)",
               name=name, affiliation=affiliation, dataName=dataName, dataType=dataType, price=price, device=device)
    

    #create a relationship between activity and entity - wasGeneratedBy
    def wasGeneratedBy(tx, dataName, dataType, price, device, activityType, date):
        tx.run("MATCH (entity: Entity {dataName: $dataName, dataType: $dataType, price: $price, device: $device}) "
               "MATCH (activity: Activity {activityType: $activityType, date: $date})"
               "MERGE (entity)-[:wasGeneratedBy]->(activity)",     
               dataName=dataName, dataType=dataType, price=price, device=device, activityType=activityType, date=date)

    #create a relationship between activity and agent - wasAssociatedWith
    def wasAssociatedWith(tx, activityType, date, name, affiliation):
        tx.run("MATCH (activity: Activity {activityType: $activityType, date: $date}) "
               "MATCH (agent: Agent {name: $name, affiliation: $affiliation})"
               "MERGE (activity)-[:wasAssociatedWith]->(agent)",
               activityType=activityType, date=date, name=name, affiliation=affiliation)
        
  
    #create a relationship between entity and activity - used
    def used(tx, activityType, date, dataName, dataType, price, device):
        tx.run("MATCH (activity: Activity {activityType: $activityType, date: $date}) "
               "MATCH (entity:Entity {dataName: $dataName, dataType: $dataType, price:$price, device: $device}) "
               "MERGE (entity)<-[:used]-(activity)", 
                activityType=activityType, date=date, dataName=dataName, dataType=dataType, price=price, device=device)
     
 #   @classmethod 
    #create a relationship between entity and entity - wasDerivedFrom 
  #  def wasDerivedFrom(cls, tx, dataName, dataType, price, device):
   #     tx.run("MATCH (entity1: Entity {dataName: $dataName, dataType: $dataType, price: $price, device: $device})"
    #           "MATCH (entity2: Entity {dataName: $dataName, dataType: $dataType, price: $price, device: $device})"
     #          "MERGE (entity1)<-[:wasDerivedFrom]-(entity2),
      #         dataName=dataName, dataType=dataType, price=price, device=device)


    def merge(tx):
       tx.run("MATCH (a:Agent) WITH a.name AS a, collect(a) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")


    def merge1(tx):
       tx.run("MATCH (ac:Activity) WITH ac.activityType AS ac, collect(ac) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")
  
    def merge2(tx):
       tx.run("MATCH (e:Entity) WITH e.dataName AS e, collect(e) as node2Merge WITH node2Merge, extract(x IN node2Merge | x.match) AS matches CALL apoc.refactor.mergeNodes(node2Merge) yield node RETURN *")



    with driver.session() as session:
        for i in range(100):
            name = matrix[i][0]
            affiliation = matrix[i][1]
            activityType = matrix[i][2]
            date = matrix[i][3]
            dataName = matrix[i][4]
            dataType = matrix[i][5]
            price = matrix[i][6]
            device = matrix[i][7]
                
            session.write_transaction(create_agent, name, affiliation)
            session.write_transaction(create_activity, activityType, date)
            session.write_transaction(create_entity, dataName, dataType, price, device)
            session.write_transaction(wasAttributedTo, name, affiliation, dataName, dataType, price, device)
            session.write_transaction(wasGeneratedBy, dataName, dataType, price, device, activityType, date)
            session.write_transaction(wasAssociatedWith, activityType, date, name, affiliation)
            session.write_transaction(used, activityType, date, dataName, dataType, price, device)
                
            session.read_transaction(merge)
            session.read_transaction(merge1)
            session.read_transaction(merge2)
         
    
    print("finished")
            

    
    
