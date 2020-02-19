import sys, time, json
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


# proposed
with driver.session() as session:
    #keywords = ['가가가', '나나나', '다다다']
    keywords = ['양유정' , '서민지']
    kLabels = []
    kNodes = []

    start_time = time.time()

    for i in range(len(keywords)):
        kLabels.append(session.read_transaction(check_nodeLabel,  keyword= keywords[i]))

    for i in range(len(keywords)):
        kNodes.append(session.read_transaction(get_nodes, keyword= keywords[i], nodeLabel = kLabels[i]))

    candidN = list(product(*kNodes))

    #initialize subgraph g and N

    g = []
    N = []
    graphs = [] # pair 저장

    for k in range(len(candidN)):
        N = list(candidN[k])
        nodeSum = len(candidN[k])

        path = []
        pathLen = []

        for i in range(len(N)):

            pathTmp = []
            pathLenTmp = []
            for j in range(i+1, len(N)):
                shortP = session.read_transaction(shortestPath, n1 = N[i], n2 = N[j])
                pathTmp.append(shortP[0])
                pathLenTmp.append(shortP[1])
            path.append(pathTmp)
            pathLen.append(pathLenTmp)

        #algorithm
        g.append(N[0])
        del N[0]
        graphs.append([])
        for i in range(nodeSum-1):
            shortestLenIndex = pathLen[i].index(min(pathLen[i]))
            graphs[k].append(path[i][shortestLenIndex])
            g.append(N[shortestLenIndex])
            del N[shortestLenIndex]

        N = []
        g = []
    print(graphs)
    #print("proposed start_time", start_time)
    #print("---%s seconds ---" %(time.time() - start_time))
