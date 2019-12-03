# -*- coding: utf-8 -*-
"""
Created on Mon Nov 25 14:50:29 2019

@author: SookmyungWomensUniv
"""


from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"))

'''
MERGE (referee:Person{name:'양유정'} )
RETURN count(referee)>=1
as check
'''

def check_nodeLabel(tx, keyword):
    print("keyword: ", keyword)
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
    print("node label: ", nodeLabel)
    return nodeLabel

# next (iter (k1nodes[0].labels)) : frozenset 값 얻는법
def get_nodes(tx, keyword, nodeLabel):
    nodes = (tx.run("MERGE (referee: " + nodeLabel + " {name:$keyword}) "
                    "RETURN referee"
                    , nodeLabel = nodeLabel, keyword = keyword)).values()
    return nodes

def subgraphG(nodes):
    g = nodes
    return g

def shortestPath(tx, n1, n2):
    length = (tx.run("MATCH (k1:"+next(iter(n1[0].labels))+"{ name: $k1_name, affiliation: $k1_aff }),(k2: " + next(iter(n2[0].labels))+ " { name: $k2_name, affiliation : $k2_aff }), "
                    "p = shortestPath((k1)-[*]-(k2)) "
                    "RETURN p, length(p)" 
                    , k1_name = n1[0]["name"], k1_aff = n1[0]["affiliation"]
                    , k2_name = n2[0]["name"], k2_aff = n2[0]["affiliation"])).values()[0]
    return length

with driver.session() as session:
    k1Label = session.read_transaction(check_nodeLabel,  keyword= '양유정')
    k2Label = session.read_transaction(check_nodeLabel,  keyword= '서민지')    
    k1nodes = session.read_transaction(get_nodes, keyword= '양유정', nodeLabel = k1Label)
    k2nodes = session.read_transaction(get_nodes, keyword= '서민지', nodeLabel = k2Label)
    print("")
    #initialize subgraph g and N
    g = []
    N = k1nodes + k2nodes
    
    path = []
    pathLen = []
    for i in range(len(N)):
        pathTmp = []
        pathLenTmp = []
        for j in range(i+1, len(N)):
            pathTmp.append(session.read_transaction(shortestPath, n1 = N[i], n2 = N[j])[0])
            pathLenTmp.append(session.read_transaction(shortestPath, n1 = N[i], n2 = N[j])[1])
        path.append(pathTmp)
        pathLen.append(pathLenTmp)


    graphs = [] # pair 저장
    
    #algorithm
    g.append(N[0])
    del N[0]
    j = 0 
    for i in range(len(k1nodes + k2nodes)-1):
        shortestLenIndex = pathLen[i].index(min(pathLen[i]))
        print("shrtestLEnindex : " , shortestLenIndex)
        graphs.append(path[i][shortestLenIndex])
        g.append(N[shortestLenIndex])
        del N[shortestLenIndex]
        
    print("")
    for node in g:
        print("g :", node)
    print("")
    for node in N:
        print("N :", node)
    print("=="*50)
    


'''    
#naive
with driver.session() as session:
    k1Label = session.read_transaction(check_nodeLabel,  keyword= '양유정')
    k2Label = session.read_transaction(check_nodeLabel,  keyword= '서민지')    
    k1nodes = session.read_transaction(get_nodes, keyword= '양유정', nodeLabel = k1Label)
    k2nodes = session.read_transaction(get_nodes, keyword= '서민지', nodeLabel = k2Label)
    print("")
    #initialize subgraph g and N
    g = []
    N = k1nodes + k2nodes
    graphs = [] # pair 저장
    
    #algorithm
    g.append(N[0])
    del N[0]
    
    for node in g:
        print("g :", node)
    print("")
    for node in N:
        print("N :", node)
    print("=="*50)
    print("")
    for k in range(len(k1nodes)+len(k2nodes)-1):
        print("========================================", k, " 번째 단계 ===========================================")
        path = []
        pathLen = []
        for j in range(len(g)):
            print("g len: ",len(g))
            if len(N) != 0:
                for i in range(len(N)):
                    print("g[", j, "]: ",g[j])
                    print("N[", i, "]: ",N[i])
                    print("")
                    path.append(session.read_transaction(shortestPath, n1 = g[j], n2 = N[i])[0])
                    pathLen.append(session.read_transaction(shortestPath, n1 = g[j], n2 = N[i])[1])
                
        print("pathLen: " , pathLen)
        print("N : " , N)
        shortestLenIndex = pathLen.index(min(pathLen))
        print("shortestLenIndex: ", shortestLenIndex )
        print("d: " , int(shortestLenIndex/len(N)))
  
        graphs.append(path[shortestLenIndex])
        g.append(N[int(shortestLenIndex%len(N))])
        del N[int(shortestLenIndex%len(N))]

        print("")
        for node in g:
            print("g :", node)
        print("")
        for node in N:
            print("N :", node)
            
        print("====================================== shortest Path ===============================")
        for graph in graphs:
            print(graph)
    

    graphs[0].start_node["name"]
    graphs[0].start_node["affiliation"]    
    
    #graph merge
    MATCH (k1:Person { name: '서민지', affiliation:"숙대" }),(k2:Person { name: '서민지', affiliation : "고대" }), p1 = shortestPath((k1)-[*]-(k2))
    MATCH (k11:Person { name: '서민지', affiliation:"숙대" }),(k22:Person { name: '양유정', affiliation : "고대" }), p2 = shortestPath((k11)-[*]-(k22))
    MATCH (k111:Person { name: '양유정', affiliation:"숙대" }),(k222:Person { name: '서민지', affiliation : "숙대" }), p3 = shortestPath((k111)-[*]-(k222))
    RETURN p1, p2, p3
'''
    
    
    
    
    
    
    
    
