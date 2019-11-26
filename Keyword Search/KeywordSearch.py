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


    
with driver.session() as session:
    k1Label = session.read_transaction(check_nodeLabel,  keyword= '양유정')
    k2Label = session.read_transaction(check_nodeLabel,  keyword= '서민지')    
    k1nodes = session.read_transaction(get_nodes, keyword= '양유정', nodeLabel = k1Label)
    k2nodes = session.read_transaction(get_nodes, keyword= '서민지', nodeLabel = k2Label)

    #initialize subgraph g and N
    g = []
    N = k1nodes
    for node in k2nodes:
        N.append(node)
    print("g : ", g)
    print("N : ", N)
    
