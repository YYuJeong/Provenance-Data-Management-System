# -*- coding: utf-8 -*-
"""
Created on Tue Feb 18 13:10:29 2020

@author: YuJeong
"""

import csv, sys, time
start_time = time.time()



with open("AnalysisData.csv", 'r', encoding='utf-8') as f:

    matrix = list(csv.reader(f, delimiter=","))

from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"), encrypted=False)


def add_node(tx, s_name, s_pid, s_type, dataName1, value1, file_path1, origin1, activityType, date, detail, r_name, r_pid, r_type, allowed_period_from, allowed_period_to, price, is_agreed):
    if activityType == "생성":
        tx.run("CREATE (p:Person), (d:Data), (ac:Activity)"
               "SET p = {name: $s_name, pid: $s_pid, p_type: $s_type}, "
               "    d = {name: $dataName1, value: $value1, file_path: $file_path1, origin: $origin1}, "
               "    ac = {name: $activityType, date: $date, detail: $detail} "
               "CREATE (ac) <- [g:Generate] - (d), (ac)-[a:Act]->(p)"
               , s_name = s_name, s_pid = s_pid, s_type = s_type,
               dataName1 = dataName1, value1 = value1, file_path1 = file_path1, origin1 = origin1, 
               activityType = activityType, date = date, detail = detail)
    
    elif activityType == "가공":
        tx.run("CREATE (p:Person), (d1:Data), (d2:Data), (ac:Activity)"
               "SET p = {name: $s_name, pid: $s_pid, p_type: $s_type}, "
               "    d1 = {name: $dataName1, value: $value1, file_path: $file_path1, origin: $origin1}, "
               "    ac = {name: $activityType, date: $date, detail: $detail}, "
               "    d2 = {name: $dataName1, value: $value1, file_path: $file_path1, origin: $origin1} "
               "CREATE (p) <- [a:Act] -(ac), (ac) <- [g1:Generate] -(d2), (d1) <- [g2:Generate] -(ac)"
               , s_name = s_name, s_pid = s_pid, s_type = s_type, 
               dataName1 = dataName1, value1 = value1, file_path1 = file_path1, origin1 = origin1, 
               activityType = activityType, date = date, detail = detail)
        
    elif activityType == "제공":
        tx.run("CREATE (p:Person), (d:Data), (p2:Person), (ac:Activity)"
               "SET p = {name: $s_name, pid: $s_pid, p_type: $s_type}, "
               "    d = {name: $dataName1, value: $value1, file_path: $file_path1, origin: $origin1}, "
               "    ac = {name: $activityType, date: $date, detail: $detail}, "
               "    p2 = {name: $r_name, pid: $r_pid, p_type: $r_type} "
               "CREATE (p) <- [s:Send] -(ac), (p2) <- [r:Receive{allowed_period_from: $allowed_period_from, allowed_period_to: $allowed_period_to, price: $price, is_agreed: $is_agreed}] -(ac), (ac) <- [g:Generate] -(d)"
               , s_name = s_name, s_pid = s_pid, s_type = s_type, 
               dataName1 = dataName1, value1 = value1, file_path1 = file_path1, origin1 = origin1, 
               activityType = activityType, date = date, detail = detail,
               allowed_period_from = allowed_period_from, allowed_period_to = allowed_period_to, price = price, is_agreed = is_agreed,
               r_name = r_name, r_pid = r_pid, r_type = r_type)

def merge_data(tx):
    tx.run("MATCH (d:Data) "
           "WITH d.name as name, d.value as value, d.file_path as file_path, d.origin as origin, COLLECT(d) AS ns "
           "WHERE size(ns) > 1 "
           "CALL apoc.refactor.mergeNodes(ns) YIELD node "
           "RETURN node")
    
def merge_person(tx):
   tx.run("MATCH (p:Person) "
          "WITH toLower(p.name) as name, p.pid as pid, p.p_type as p_type, COLLECT(p) AS ns "
          "WHERE size(ns) > 1 AND NOT (p.p_type = '기관')"
          "CALL apoc.refactor.mergeNodes(ns) YIELD node "
          "RETURN node" )


def merge_activity(tx):
   tx.run("MATCH (ac:Activity) "
          "WITH ac.name as name, COLLECT(ac) AS ns "
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
        session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4],matrix[i][5],matrix[i][6],matrix[i][7], matrix[i][8],matrix[i][9],matrix[i][10],matrix[i][11], matrix[i][12],matrix[i][13],  matrix[i][14],matrix[i][15],matrix[i][16])
   
    session.read_transaction(merge_data)
    session.read_transaction(merge_person)
    #session.read_transaction(merge_activity)
    session.read_transaction(delete_duplRelation)
    
print("start_time", start_time)
print("---%s seconds ---" %(time.time() - start_time))
