# -*- coding: utf-8 -*-
"""
Created on Mon Nov 25 14:50:29 2019

@author: SookmyungWomensUniv
"""
import sys, time
import numpy as np
from itertools import product

from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"))


def check_nodeLabel(tx, keyword):
    checkPerson = (tx.run("MERGE (referee:Person{name: $keyword} )"
                       "RETURN count(referee)>=1 "
                       "as check ", keyword = keyword)).value()[0]
    checkData = (tx.run("MERGE (referee:Data{name: $keyword} )"
                        "RETURN count(referee)>=1 "
                       "as check ", keyword = keyword)).value()[0]
    checkActivity = (tx.run("MERGE (referee:Activity{name: $keyword} )"
                       "RETURN count(referee)>=1 "
                       "as check ", keyword = keyword)).value()[0]
    if(checkPerson):
        nodeLabel = "Person"
    elif(checkData):
        nodeLabel = "Data"
    elif(checkActivity):
        nodeLabel = "Activity"
    return nodeLabel

# next (iter (k1nodes[0].labels)) : frozenset 값 얻는법
def get_nodes(tx, keyword, nodeLabel):
    nodes = (tx.run("MERGE (referee: " + nodeLabel + " {name:$keyword}) "
                    "RETURN referee"
                    , nodeLabel = nodeLabel, keyword = keyword)).values()
    return nodes


def shortestPath(tx, n1, n2):
    length = (tx.run("MATCH (k1:"+next(iter(n1[0].labels))+"{ name: $k1_name, affiliation: $k1_aff }),(k2: " + next(iter(n2[0].labels))+ " { name: $k2_name, affiliation : $k2_aff }), "
                    "p = shortestPath((k1)-[*]-(k2)) "
                    "RETURN p, length(p)" 
                    , k1_name = n1[0]["name"], k1_aff = n1[0]["affiliation"]
                    , k2_name = n2[0]["name"], k2_aff = n2[0]["affiliation"])).values()[0]
    return length
            
with driver.session() as session:
    keywords = ['양유정', '서민지'] 
    kLabels = []
    kNodes = []


    
    for i in range(len(keywords)):
        kLabels.append(session.read_transaction(check_nodeLabel,  keyword= keywords[i]))

    for i in range(len(keywords)):
        kNodes.append(session.read_transaction(get_nodes, keyword= keywords[i], nodeLabel = kLabels[i]))    

    candidN = list(product(*kNodes))
    #id 로 쉽게 계산하려고 id만 저장
    candidNid = []
    for i in range(len(candidN)):
        candidNid.append([])
        for j in range(len(candidN[i])):
            candidNid[i].append(candidN[i][j][0].id)
            
    pathLst = []
    nodeSum = 0
    for i in range(len(keywords)):
        nodeSum = nodeSum + len(kNodes[i])
        pathLst = pathLst + kNodes[i]

    #initialize subgraph g and N
    g = []
    N = []
    pathDic = {}
    #모든 path 다 구해서 딕셔너리에 저장
    for i in range(len(pathLst)):
        for j in range(i+1, len(pathLst)):
            print("i:", i, " j : " , j)
            print(pathLst[i][0]["name"], pathLst[i][0]["affiliation"])
            print(pathLst[j][0]["name"], pathLst[j][0]["affiliation"])
            shortP = session.read_transaction(shortestPath, n1 =  pathLst[i], n2 =  pathLst[j])
            pathDic[(pathLst[i][0].id, pathLst[j][0].id)] = [shortP[0], shortP[1]]
            
    for i in range(len(candidN)):
        N = list(candidN[i])
        g = N[0]
        del N[0]
        lenTmp = {}
        for j in range(len(N)):
            print(N)
            lenTmp[g[0].id, N[j][0].id] = pathDic[g[0].id, N[j][0].id]
            print(g[0].id)
            print(N[j][0].id)
            print("lenTmp", lenTmp)
            print(min(lenTmp, key = lambda k: lenTmp[k][1]))
        minKey = min(lenTmp, key = lambda k: lenTmp[k][1])
        print("mk: " , minKey)
        if minKey[0] in g:
            print("T")
        print("")
        
            
        
            
    

'''
with driver.session() as session:
    keywords = ['양유정' , '서민지'] 
    kLabels = []
    kNodes = []
    start_time = time.time()
    for i in range(len(keywords)):
        kLabels.append(session.read_transaction(check_nodeLabel,  keyword= keywords[i]))
        
    for i in range(len(keywords)):
        kNodes.append(session.read_transaction(get_nodes, keyword= keywords[i], nodeLabel = kLabels[i]))    

    #initialize subgraph g and N
    g = []
    nodeSum = 0
    N = []
    for i in range(len(keywords)):
        nodeSum = nodeSum + len(kNodes[i])
        N = N + kNodes[i]
    
    path = []
    pathLen = []

    for i in range(len(N)):
        pathTmp = []
        pathLenTmp = []
        for j in range(i+1, len(N)):
            print("i:", i, " j : " , j)
            print(N[i][0]["name"], N[i][0]["affiliation"])
            print(N[j][0]["name"], N[j][0]["affiliation"])
        
            pathTmp.append(session.read_transaction(shortestPath, n1 = N[i], n2 = N[j])[0])
   
            pathLenTmp.append(session.read_transaction(shortestPath, n1 = N[i], n2 = N[j])[1])
        path.append(pathTmp)
        pathLen.append(pathLenTmp)


    graphs = [] # pair 저장
    
    #algorithm
    g.append(N[0])
    del N[0]
    j = 0 
    for i in range(nodeSum-1):
        shortestLenIndex = pathLen[i].index(min(pathLen[i]))
        graphs.append(path[i][shortestLenIndex])
        g.append(N[shortestLenIndex])
        del N[shortestLenIndex]
        
    print("proposed start_time", start_time)
    print("---%s seconds ---" %(time.time() - start_time))

'''
'''   
#naive
with driver.session() as session:
    keywords = ['양유정' , '서민지', '이주연'] 
    kLabels = []
    kNodes = []
    start_time = time.time()
    for i in range(len(keywords)):
        kLabels.append(session.read_transaction(check_nodeLabel,  keyword= keywords[i]))
        
    for i in range(len(keywords)):
        kNodes.append(session.read_transaction(get_nodes, keyword= keywords[i], nodeLabel = kLabels[i]))    

    #initialize subgraph g and N
    g2 = []
    nodeSum = 0
    N = []
    for i in range(len(keywords)):
        nodeSum = nodeSum + len(kNodes[i])
        N = N + kNodes[i]
    graphs2 = [] # pair 저장
    
    #algorithm
    g2.append(N[0])
    del N[0]
    
    for k in range(nodeSum-1):
        path = []
        pathLen = []
        for j in range(len(g2)):
            if len(N) != 0:
                for i in range(len(N)):
                    path.append(session.read_transaction(shortestPath, n1 = g2[j], n2 = N[i])[0])
                    pathLen.append(session.read_transaction(shortestPath, n1 = g2[j], n2 = N[i])[1])
        shortestLenIndex = pathLen.index(min(pathLen))
        graphs2.append(path[shortestLenIndex])
        g2.append(N[int(shortestLenIndex%len(N))])
        del N[int(shortestLenIndex%len(N))]
        
    print("naive start_time", start_time)
    print("---%s seconds ---" %(time.time() - start_time))
            
            
'''        
'''
    graphs[0].start_node["name"]
    graphs[0].start_node["affiliation"]    
   
    #graph merge
    MATCH (k1:Person { name: '서민지', affiliation:"숙대" }),(k2:Person { name: '서민지', affiliation : "고대" }), p1 = shortestPath((k1)-[*]-(k2))
    MATCH (k11:Person { name: '서민지', affiliation:"숙대" }),(k22:Person { name: '양유정', affiliation : "고대" }), p2 = shortestPath((k11)-[*]-(k22))
    MATCH (k111:Person { name: '양유정', affiliation:"숙대" }),(k222:Person { name: '서민지', affiliation : "숙대" }), p3 = shortestPath((k111)-[*]-(k222))
'''
    
    
    
    
    
    
