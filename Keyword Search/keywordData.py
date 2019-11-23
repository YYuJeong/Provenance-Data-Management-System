# -*- coding: utf-8 -*-
"""
Created on Sat Nov 23 13:39:37 2019

@author: SookmyungWomensUniv
"""

# -*- coding: utf-8 -*-
import csv, sys, time
start_time = time.time()


with open("keywordData.csv",'r') as f:
    matrix = list(csv.reader(f,delimiter=","))


from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"))

'''
create (p:Person), (d:Data), (ac:Activity)
set p={name:"A", aff:"고대"} , 
    d={name:"data1", price: "200000", owner:"A", owner_aff: "고대"}, 
    ac={name:"생성", date:"20180809"}
create (p) <- [o:own] -(d), (ac) - [g:generate] ->(d), (ac)-[a:act]->(p)

소유자	소유자소속	데이터	가격	데이터종류	수집장치	행동	날짜	행위자	행위자소속	데이터	가격	데이터종류	수집장치
'''

def add_node(tx, o_name, o_affiliation, dataName1, price1, dataType1, device1, activityType, date, a_name, a_affiliation, dataName2, price2, dataType2, device2):
    print("activityType: ", activityType)
    if activityType == "생성":
        tx.run("CREATE (p:Person), (d:Data), (ac:Activity)"
               "SET p = {name: $o_name, affiliation: $o_affiliation}, "
               "    d = {name: $dataName1, price: $price1, d_type: $dataType1, device: $device1, owner: $o_name, owner_aff:$o_affiliation}, "
               "    ac = {name: $activityType, date: $date} "
               "CREATE (p) <- [o:Own] -(d), (ac) - [g:Generate] ->(d), (ac)-[a:Act]->(p)"
               , o_name = o_name, o_affiliation = o_affiliation, 
               dataName1 = dataName1, price1 = price1, dataType1 = dataType1, device1 = device1, 
               activityType = activityType, date = date, 
               a_name = a_name, a_affiliation = a_affiliation, dataName2 = dataName2, price2 = price2, dataType2 = dataType2, device2 = device2)
    
    elif activityType == "수정" or activityType == "가공" or activityType ==  "변환":
        tx.run("CREATE (p1:Person), (d1:Data), (p2:Person), (d2:Data), (ac:Activity)"
               "SET p1 = {name: $o_name, affiliation: $o_affiliation}, "
               "    d1 = {name: $dataName1, price: $price1, d_type: $dataType1, device: $device1, owner: $o_name, owner_aff:$o_affiliation}, "
               "    ac = {name: $activityType, date: $date}, "
               "    p2 = {name: $a_name, affiliation: $a_affiliation}, "
               "    d2 = {name: $dataName2, price: $price2, d_type: $dataType2, device: $device2, owner: $o_name, owner_aff:$o_affiliation} "
               "CREATE (p1) <- [o:Own] -(d1), (p1) <- [o2:Own] -(d2), (d1) - [g:Generate] ->(ac), (ac) - [g2:Generate] ->(d2), (ac)-[a:Act]->(p2)"
               , o_name = o_name, o_affiliation = o_affiliation, 
               dataName1 = dataName1, price1 = price1, dataType1 = dataType1, device1 = device1, 
               activityType = activityType, date = date, 
               a_name = a_name, a_affiliation = a_affiliation, dataName2 = dataName2, price2 = price2, dataType2 = dataType2, device2 = device2)
        
    elif activityType == "배포" or activityType == "판매" or activityType == "전달":
        tx.run("CREATE (p1:Person), (d1:Data), (p2:Person), (d2:Data), (ac:Activity)"
               "SET p1 = {name: $o_name, affiliation: $o_affiliation}, "
               "    d1 = {name: $dataName1, price: $price1, d_type: $dataType1, device: $device1, owner: $o_name, owner_aff:$o_affiliation}, "
               "    ac = {name: $activityType, date: $date}, "
               "    p2 = {name: $a_name, affiliation: $a_affiliation}, "
               "    d2 = {name: $dataName1, price: $price1, d_type: $dataType1, device: $device1, owner: $a_name, owner_aff:$a_affiliation} "
               "CREATE (p1) <- [o:Own] -(d1), (p2) <- [o2:Own] -(d2), (d1) - [g:Generate] ->(ac), (ac) - [g2:Generate] ->(d2)"
               , o_name = o_name, o_affiliation = o_affiliation, 
               dataName1 = dataName1, price1 = price1, dataType1 = dataType1, device1 = device1, 
               activityType = activityType, date = date, 
               a_name = a_name, a_affiliation = a_affiliation, dataName2 = dataName2, price2 = price2, dataType2 = dataType2, device2 = device2)


with driver.session() as session:
    for i in range(2):
        session.write_transaction(add_node,matrix[i][0],matrix[i][1],matrix[i][2],matrix[i][3],matrix[i][4],matrix[i][5],matrix[i][6],matrix[i][7], matrix[i][8],matrix[i][9],matrix[i][10],matrix[i][11], matrix[i][12],matrix[i][13])

print("start_time", start_time)
print("---%s seconds ---" %(time.time() - start_time))
