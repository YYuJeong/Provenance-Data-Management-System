# -*- coding: utf-8 -*-
"""
Created on Tue Feb 18 13:10:29 2020

@author: YuJeong
"""

import csv, sys, time
start_time = time.time()

#with open("exampleData.csv",'r', encoding='UTF-8') as f:
#with open("randomDataDemo.csv",'r') as f:
with open("../KeywordSearch/attributeSearchData.csv",'r') as f:
    matrix = list(csv.reader(f,delimiter=","))

from neo4j import GraphDatabase

#52.79.241.1
driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"))


def add_node(tx, s_name, s_affiliation, dataName1, price1, dataType1, device1, activityType, date, r_name, r_affiliation, dataName2, price2, dataType2, device2):
    if activityType == "생성":
        tx.run("CREATE (p:Person), (d:Data), (ac:Activity)"
               "SET p = {name: $s_name, affiliation: $s_affiliation}, "
               "    d = {name: $dataName1, price: $price1, d_type: $dataType1, device: $device1}, "
               "    ac = {name: $activityType, date: $date} "
               "CREATE (ac) <- [g:Generate] - (d), (ac)-[a:Act]->(p)"
               , s_name = s_name, s_affiliation = s_affiliation, 
               dataName1 = dataName1, price1 = price1, dataType1 = dataType1, device1 = device1, 
               activityType = activityType, date = date)
    
    elif activityType == "가공" or activityType ==  "변환":
        tx.run("CREATE (p:Person), (d1:Data), (d2:Data), (ac:Activity)"
               "SET p = {name: $s_name, affiliation: $s_affiliation}, "
               "    d1 = {name: $dataName1, price: $price1, d_type: $dataType1, device: $device1}, "
               "    ac = {name: $activityType, date: $date}, "
               "    d2 = {name: $dataName2, price: $price2, d_type: $dataType2, device: $device2} "
               "CREATE (p) <- [a:Act] -(ac), (ac) <- [g1:Generate] -(d2), (d1) <- [g2:Generate] -(ac)"
               , s_name = s_name, s_affiliation = s_affiliation, 
               dataName1 = dataName1, price1 = price1, dataType1 = dataType1, device1 = device1, 
               activityType = activityType, date = date, 
               dataName2 = dataName2, price2 = price2, dataType2 = dataType2, device2 = device2)
        
    elif activityType == "배포" or activityType == "판매":
        tx.run("CREATE (p:Person), (d:Data), (p2:Person), (ac:Activity)"
               "SET p = {name: $s_name, affiliation: $s_affiliation}, "
               "    d = {name: $dataName1, price: $price1, d_type: $dataType1, device: $device1}, "
               "    ac = {name: $activityType, date: $date}, "
               "    p2 = {name: $r_name, affiliation: $r_affiliation} "
               "CREATE (p) <- [s:Send] -(ac), (p2) <- [r:Receive] -(ac), (ac) <- [g:Generate] -(d)"
               , s_name = s_name, s_affiliation = s_affiliation, 
               dataName1 = dataName1, price1 = price1, dataType1 = dataType1, device1 = device1, 
               activityType = activityType, date = date, 
               r_name = r_name, r_affiliation = r_affiliation)

def merge_data(tx):
    tx.run("MATCH (d:Data) "
           "WITH d.name as name, d.price as price, d.d_type as d_type, d.device as device, COLLECT(d) AS ns "
           "WHERE size(ns) > 1 "
           "CALL apoc.refactor.mergeNodes(ns) YIELD node "
           "RETURN node")
    
def merge_person(tx):
   tx.run("MATCH (p:Person) "
          "WITH toLower(p.name) as name,toLower(p.affiliation) as affiliation, COLLECT(p) AS ns "
          "WHERE size(ns) > 1 "
          "CALL apoc.refactor.mergeNodes(ns) YIELD node "
          "RETURN node" )
    
def delete_duplRelation(tx):
    tx.run("start r=relationship(*) "
           "match (s)-[r]->(e) "
           "with s,e,type(r) as typ, tail(collect(r)) as coll "
           "foreach(x in coll | delete x) ")

with driver.session() as session:
    for i in range(len(matrix)):
        session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4],matrix[i][5],matrix[i][6],matrix[i][7], matrix[i][8],matrix[i][9],matrix[i][10],matrix[i][11], matrix[i][12],matrix[i][13])

    session.read_transaction(merge_data)
    session.read_transaction(merge_person)
    session.read_transaction(delete_duplRelation)
    
print("start_time", start_time)
print("---%s seconds ---" %(time.time() - start_time))
