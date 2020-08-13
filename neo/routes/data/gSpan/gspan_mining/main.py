"""The main program that runs gSpan."""
# -*- coding=utf-8 -*-
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from neo4j import GraphDatabase
import pandas as pd

from functools import reduce
import operator

import numpy as np

import codecs
import collections
import copy
import itertools
import time

import os, sys
from algorithms import g_span as gSpan
from algorithms import load_graphs


from graph import AUTO_EDGE_ID
from graph import Graph
from graph import VACANT_GRAPH_ID
from graph import VACANT_VERTEX_LABEL

# generate input data start
global allDict
global edgeDict
global instDict
global dataDict
global ver2Dict
global actDict

global driver




def search_personNode(tx):
    personNodes = tx.run("Match (p:Person) where p.p_type = '기관' return DISTINCT p.name")

    return personNodes
 
def search_perNode(tx):
    personNodes = tx.run("Match (p:Person) where p.p_type = '개인' return DISTINCT p.name")
    return personNodes

def search_dataNode(tx):
    dataNodes = tx.run("Match (d:Data) return  DISTINCT d.name")
    
    return dataNodes 

def get_allGraphs(tx, name, allDict, edgeDict):
    allGraphs = tx.run("MATCH p = ({name : '"+name+"'})-[*]-(connected) "
                       "WHERE size(nodes(p)) = size(apoc.coll.toSet(nodes(p))) "
                       "RETURN p", name = name).values()
    #print(allGraphs)
    '''
    ag = tx.run("""MATCH (p:Person {name: "강민석"}) 
                    CALL apoc.path.subgraphAll(p, {
                        maxLevel: 2
                    })
                    YIELD nodes, relationships
                    RETURN nodes, relationships;""")
    '''
    
    # separate path to [node, node]

    prov = []
    nodes = []
    for g in allGraphs:
        #print(g)
        if len(g[0]) == 2:
            prov.append([g[0].relationships[0].nodes[0], g[0].relationships[0].nodes[1], g[0].relationships[0].type])
            prov.append([g[0].relationships[1].nodes[0], g[0].relationships[1].nodes[1], g[0].relationships[1].type])
            nodes.append(g[0].relationships[0].nodes[0])
            nodes.append(g[0].relationships[0].nodes[1])
            nodes.append(g[0].relationships[1].nodes[0])
            nodes.append(g[0].relationships[1].nodes[1])

    nodes = list(set(nodes))
    
    allnode2Dic = []
    for n in nodes:
        if 'Person' in n.labels:
            if n.get('p_type') == '기관':
                allnode2Dic.append(allDict[n.get('name')])  
            else:
                allnode2Dic.append(allDict['개인'])
        elif 'Data'in n.labels:
            allnode2Dic.append(allDict[n.get('name')])
        elif 'Activity' in n.labels:
            allnode2Dic.append(allDict[n.get('name')])
            
    allnode2Dic = list(set(allnode2Dic))        
            
    # encoding graph node to dictionary
    graph2Dic = []
    for gl in prov:
        node2Dic = []        
        for g in gl:
            if type(g) != str:
                if 'Person' in g.labels:
                    if g.get('p_type') == '기관':
                        node2Dic.append(allDict[g.get('name')])  
                    else:
                        node2Dic.append(allDict['개인'])
                elif 'Data'in g.labels:

                    node2Dic.append(allDict[g.get('name')])
                elif 'Activity' in g.labels:
                    node2Dic.append(allDict[g.get('name')])
            else:
                node2Dic.append(edgeDict[g])
        
        graph2Dic.append(node2Dic)

    return allnode2Dic , graph2Dic

def generateInput():
    global allDict
    global edgeDict
    global instDict
    global dataDict
    global actDict
    global driver

    driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"), encrypted=False)
    with driver.session() as session:
         # All personNodes to dict 
         personNodes = session.read_transaction(search_personNode)
         perNodes = session.read_transaction(search_perNode)
    
         records = []
         for personNode in perNodes:
             records.append(personNode["p.name"])
         personDict = {k: v for v, k in enumerate(records)}
    
         records = []
        
         for personNode in personNodes:
             records.append(personNode["p.name"])
         instDict = {k: (v+1)  for v, k in enumerate(records)}
       
    
         #dataDict = {'데이터': 0}
         #dataNodes to dict
         dataNodes = session.read_transaction(search_dataNode)
         records = []
         for dataNode in dataNodes:
             records.append(dataNode["d.name"])

         dataDict = {k: (v+len(instDict)+1) for v, k in enumerate(records)}
    
         
         #activityNodes to dict
         activityNodes = ['생성', '가공', '제공']
         actDict = {k: (v+len(dataDict)+len(instDict)+1) for v, k in enumerate(activityNodes)}
         
         #edge labels to dict
         edgeLabels = ['Act', 'Generate', 'Send', 'Receive']
         edgeDict = {k: v for v, k in enumerate(edgeLabels)}
    
         perDict = {'개인': len(dataDict) +len(instDict)+len(actDict)+1 }
         allDict = {**instDict,**dataDict, **actDict, **perDict}
         #print(allDict)
         
         #get all graphs 
         ''' 
         allGraph2Dic : Neo4j의 모든 이력 그래프들이 딕셔너리로 표현되어 저장
         len(allGraph2Dic) : Neo4j에 저장된 이력 수
         allGraph2Dic[i] : i-번째 이력그래프가 [[node1, node2],... , [nodeN-1, nodeN]] 형태로 저장됨
         [node1, node2]: node1과 node2가 node1 -> node2 방향으로 연결
         '''
        
         
         allGraph2Dic = []
         for key in personDict:
             allGraph2Dic.append(list(session.read_transaction(get_allGraphs, key, allDict, edgeDict)))
         
      
    driver.close()
    return allGraph2Dic

def numberingIndex(graph2Dic):
    global ver2Dict
    ver2Dict = {k: v for v, k in enumerate(graph2Dic[0])}
    
    del graph2Dic[0]
    
    for n in graph2Dic[0]:
        n[0] = ver2Dict[n[0]]
        n[1] = ver2Dict[n[1]]
    
    return ver2Dict, graph2Dic[0]

# generateinputdata End

filepath = os.path.dirname(os.path.abspath(__file__))

def main(min_sup):
    allGraph2Dic = generateInput()
    
    #filename = os.path.join(filepath, filename)
    gspanInput = []
    for graph2Dic in allGraph2Dic:
        gspanInput.append(list(numberingIndex(graph2Dic)))
        
    graphs = load_graphs(gspanInput)
    n = len(graphs)
    extensions = []
    extensions_sups = list()
    graphIndex = list()
    gSpan([], graphs, min_sup, extensions, extensions_sups)
    _report_df = pd.DataFrame()
    
    
    '''
    _report_df = _report_df.append(
            pd.DataFrame(
                {
                    'support': [_support],
                    'vertex': [nodeInfo],
                    'link' : [linkInfo],
                    'num_vert': [_num_vertices]
                },
                index=[i]
            )
        )
    '''
    
    
    for i, ext in enumerate(extensions):
        #print('Pattern %d' % (i+1))
        #print('Support : %d' %extensions_sups[i])
        nodelist = list()
        edgelist = list()
        graphIndex.append(i)
        for _c in ext:
            #print(_c)
            nodes = []
            nodes.append(_c[0])
            nodes.append(_c[2])
            nodelist.append(nodes)
            nodes = []
            nodes.append(_c[1])
            nodes.append(_c[3])
            nodelist.append(nodes)
            edges = []
            edges.append(_c[2])
            edges.append(_c[3])
            edges.append(_c[4])
            edgelist.append(edges)
        
        nodelist = list(set(map(tuple, nodelist)))
        
        nodecnt = len(nodelist)
        _report_df = _report_df.append(
            pd.DataFrame(
                {
                    'support': [extensions_sups[i]],
                    'vertex': [nodelist],
                    'link' : [edgelist],
                    'num_vert': [nodecnt]
                    }
                ,index=[i]
                )
            )
            
        #print('')
    #print("_report_df : print")
    #print(_report_df)
    return _report_df
# def main(FLAGS=None):
#     """Run gSpan."""
#     '''
#     if FLAGS is None:
#         FLAGS, _ = parser.parse_known_args(args=sys.argv[1:])

#     if not os.path.exists(FLAGS.database_file_name):
#         print('{} does not exist.'.format(FLAGS.database_file_name))
#         sys.exit()
#     '''    
#     gs = gSpan(
#         #database_file_name=FLAGS.database_file_name,
#         database_file_name='../gSpan-master/graphdata/neo4j.txt',
        
#         #min_support=FLAGS.min_support,
#         min_support=3,
        
# #        min_num_vertices=FLAGS.lower_bound_of_num_vertices,
# #        max_num_vertices=FLAGS.upper_bound_of_num_vertices,

# #        max_ngraphs=FLAGS.num_graphs,
#         is_undirected=False,
# #        verbose=FLAGS.verbose,
# #        visualize=FLAGS.plot,
# #        where=FLAGS.where
#     )

#     gs.run()
#     gs.time_stats()
#     return gs

def uploadFSMresults(tx, create):
    tx.run(create)
    
def merge_data(tx):
    tx.run("MATCH (d:Data) "
           "where exists(d.graph) "
           "WITH d.name as name, d.graph as graph, COLLECT(d) AS ns "
           "WHERE size(ns) > 1 "
           "CALL apoc.refactor.mergeNodes(ns) YIELD node "
           "RETURN node")
    
def merge_person(tx):
   tx.run("MATCH (p:Person) "
          "where exists(p.graph) "
          "WITH toLower(p.name) as name, p.graph as graph, COLLECT(p) AS ns "
          "WHERE size(ns) > 1 "
          "CALL apoc.refactor.mergeNodes(ns) YIELD node "
          "RETURN node" )
def merge_activity(tx):
   tx.run("MATCH (ac:Activity) "
          "where exists(ac.graph) "
          "WITH ac.name as name, ac.graph as graph, COLLECT(ac) AS ns "
          "WHERE size(ns) > 1 "
          "CALL apoc.refactor.mergeNodes(ns) YIELD node "
          "RETURN node" )
    
def delete_duplRelation(tx):
    tx.run("Match (s)-[r]->(e) "
           "with s,e,type(r) as typ, tail(collect(r)) as coll "
           "foreach(x in coll | delete x) ")

if __name__ == '__main__':
    gs = main(int(sys.argv[1]))
    # gs = main()
    tableLen = int(sys.argv[2])
    global allDict
    global edgeDict
    global instDict
    global dataDict
    global actDict

    global driver
    # Create an empty list 

    row_list =[] 
    links = []
    indexs = []

    for i in range(len(gs)):
        s = gs.loc[i]['support']
        v = gs.loc[i]['vertex']
        v = list(map(list, v))
        v = [list( map(int,i) ) for i in v]
        l = gs.loc[i]['link']
        l = [list( map(int,i) ) for i in l]
        m = gs.loc[i]['num_vert']
        my_list = [s, v, l, m]
        row_list.append(my_list)
        
        links.append(l)
        indexs.append(i)
    '''
    # Iterate over each row 
    for index, rows in gs.iterrows(): 
        # Create list for the current row 
        my_list =[rows.support, rows.vertex, rows.link, rows.num_vert] 
        # append the list to the final list 
        row_list.append(my_list) 

        links.append(rows.link)
        indexs.append(index)
    '''
    # Extract maximum graph
    linksFlatten = []
    for link in links:
        for l in link:
            linksFlatten.append(l)
   
    linkSet = [list(t) for t in set(tuple(element) for element in linksFlatten)]
    link2Dict = {tuple(k): v for v, k in enumerate(linkSet)}

   
    # Convert edge to dictionary
    edge2Dict = []
    for link in links:
        l2d = []
        for l in link:
            l2d.append(link2Dict[tuple(l)])
        edge2Dict.append(l2d)
    
    # Check small graph
    delInd = []
    for j, ed in enumerate(edge2Dict):
        g = ed
        for i, e in enumerate(edge2Dict[j+1:], start=j+1):
            if set(g).issubset(e):
                delInd.append(j)
                break
    
    # delete small graph
    for index in sorted(delInd, reverse=True):
        del links[index]
        del indexs[index]
        del row_list[index]

    #Generate ouputTable
    supports = []
    final = []
    dic2graphs = []
    for i in range(len(row_list)):
        #print("result graph #" , i)
        edgeInfo = row_list[i]
    #Extract row's information
        supports.append(edgeInfo[0])
        nodes = edgeInfo[1]
        edges = edgeInfo[2]
        numVer = edgeInfo[3]

        #decode dict to node
        dic2graph = []
        for edge in edges:
            #print(edge)
            dic2node = []
            dic2node.append(list(allDict.keys())[list(allDict.values()).index(edge[0])])
            dic2node.append(list(allDict.keys())[list(allDict.values()).index(edge[1])])
            dic2node.append(list(edgeDict.keys())[list(edgeDict.values()).index(edge[2])])          
            #(dic2node)
            dic2graph.append(dic2node)
        dic2graphs.append(dic2graph)
    
    fsmResults = []
    for dic2graph in dic2graphs:
        #look up original node
        fsmResult = []
        for nodes in dic2graph:
            dic2node = []
            for node in nodes:
                if instDict.get(node) != None:
                    label = '기관'
                elif dataDict.get(node) != None:
                    label = 'Data'
                elif actDict.get(node) != None:
                    label = 'Activity'
                elif edgeDict.get(node) != None:
                    label = 'Edge'
                else:
                    label = '개인'
                dic2node.append((node, label))
            #print(dic2node)
            fsmResult.append(dic2node)
        fsmResults.append(fsmResult)
     
    searchesFinal = []
    returnsFinal = []
    createsFinal = []
    nodeInfoFinal = []
    
    stmtsFinal = []
    for i in range(len(fsmResults)):  
        #create cypher by activity type
        returns = []
        searches = []
        creates = [] #결과 그래프 하나 당 사이퍼들
        nodes = []
        stmts = []
        #print(fsmResults[i])
        for index, result in enumerate(fsmResults[i]):
            #print(index)
            #print("result: ", result)
            if result[0][1] == 'Activity':
                node2 = result[0]
                node1 = result[1]
            else:
                node1 = result[0]
                node2 = result[1]
            edge = result[2]
            create = ''
            search = ''
            #print(node1, node2)
            stmt = [node1, node2]
            node = [node1[0], node2[0]]
            if node2[0] == '생성': #두번째 노드가 
                if edge[0] == 'Generate':
                    create = ("CREATE (d:Data), (ac:Activity) "
                             "SET d = {name: " + "'" + node1[0] +"', graph : " + str(i) + "},"
                             "   ac = {name: " + "'" + node2[0] +"', graph : " + str(i) + "} "
                             "CREATE (ac) <- [g:Generate] - (d)")
                    search = ("MATCH (d"+str(index)+":Data), (ac"+str(index)+":Activity) "
                              "WHERE d"+str(index)+".name =  " + "'" + node1[0] +"' and d"+str(index)+".graph = " + str(i) + " "
                              "and ac"+str(index)+".name = "+ "'" + node2[0] + "' and ac"+str(index)+".graph = " + str(i) + " "
                              "MATCH path"+str(index)+" = (d"+str(index)+")-[]-(ac"+str(index)+")")
                elif edge[0] == 'Act':
                    create = ("CREATE (p:Person), (ac:Activity) "
                             "SET p = {name: " + "'" + node1[0] + "', graph : " + str(i) + "},"
                             "   ac = {name: " + "'" + node2[0] + "', graph : " + str(i) + "} "
                             "CREATE (ac) - [a:Act] -> (p)")
                    search = ("MATCH (p"+str(index)+":Person), (ac"+str(index)+":Activity) "
                              "WHERE p"+str(index)+".name =  " + "'" + node1[0] +"' and p"+str(index)+".graph = " + str(i) + " "
                              "and ac"+str(index)+".name = "+ "'" + node2[0] + "' and ac"+str(index)+".graph = " + str(i) + " "
                              "MATCH path"+str(index)+" = (p"+str(index)+")-[]-(ac"+str(index)+")")
            elif node2[0] == '가공':
                if edge[0] == 'Generate':
                    create = ("CREATE (d:Data), (ac:Activity) "
                             "SET d = {name: " + "'" + node1[0] + "', graph : " + str(i) + "},"
                             "   ac = {name: " + "'" + node2[0] + "', graph : " + str(i) + "} "
                             "CREATE (ac) <- [g:Generate] - (d)")
                    search = ("MATCH (d"+str(index)+":Data), (ac"+str(index)+":Activity) "
                              "WHERE d"+str(index)+".name =  " + "'" + node1[0] +"' and d"+str(index)+".graph = " + str(i) + " "
                              "and ac"+str(index)+".name = "+ "'" + node2[0] + "' and ac"+str(index)+".graph = " + str(i) + " "                  
                              "MATCH path"+str(index)+" = (d"+str(index)+")-[]-(ac"+str(index)+")")
                elif edge[0] == 'Act':
                    create = ("CREATE (p:Person), (ac:Activity) "
                             "SET p = {name: " + "'" + node1[0] + "', graph : " + str(i) + "},"
                             "   ac = {name: " + "'" + node2[0] + "', graph : " + str(i) + "} " 
                             "CREATE (ac) - [a:Act] -> (p)")
                    search = ("MATCH (p"+str(index)+":Person), (ac"+str(index)+":Activity) "
                              "WHERE p"+str(index)+".name =  " + "'" + node1[0] +"' and p"+str(index)+".graph = " + str(i) + " "
                              "and ac"+str(index)+".name = "+ "'" + node2[0] + "' and ac"+str(index)+".graph = " + str(i) + " "   
                              "MATCH path"+str(index)+" = (p"+str(index)+")-[]-(ac"+str(index)+")")
            elif node2[0] == '제공':
                if edge[0] == 'Generate':
                    create = ("CREATE (d:Data), (ac:Activity) "
                             "SET d = {name: " + "'" + node1[0] + "', graph : " + str(i) + "},"
                             "   ac = {name: " + "'" + node2[0] + "', graph : " + str(i) + "} "
                             "CREATE (ac) <- [g:Generate] - (d)")
                    search = ("MATCH (d"+str(index)+":Data), (ac"+str(index)+":Activity) "
                              "WHERE d"+str(index)+".name =  " + "'" + node1[0] +"' and d"+str(index)+".graph = " + str(i) + " "
                              " and ac"+str(index)+".name = "+ "'" + node2[0] + "' and ac"+str(index)+".graph = " + str(i) + " "
                              "MATCH path"+str(index)+" = (d"+str(index)+")-[]-(ac"+str(index)+")")
                elif edge[0] == 'Send':
                    create = ("CREATE (p:Person), (ac:Activity) "
                             "SET p = {name: " + "'" + node1[0] + "', graph : " + str(i) + "},"
                             "   ac = {name: " + "'" + node2[0] + "', graph : " + str(i) + "} "
                             "CREATE (ac) - [s:Send] -> (p)")
                    search = ("MATCH (p"+str(index)+":Person), (ac"+str(index)+":Activity) "
                              "WHERE p"+str(index)+".name =  " + "'" + node1[0] +"' and p"+str(index)+".graph = " + str(i) + " "
                              " and ac"+str(index)+".name = "+ "'" + node2[0] + "' and ac"+str(index)+".graph = " + str(i) + " "
                              "MATCH path"+str(index)+" = (p"+str(index)+")-[]-(ac"+str(index)+")")
                elif edge[0] == 'Receive':
                    create = ("CREATE (p:Person), (ac:Activity) "
                             "SET p = {name: " + "'" + node1[0] + "', graph : " + str(i) + "},"
                             "   ac = {name: " + "'" + node2[0] + "', graph : " + str(i) + "} "
                             "CREATE (ac) - [r:Receive] -> (p)")
                    search = ("MATCH (p"+str(index)+":Person), (ac"+str(index)+":Activity) "
                              "WHERE p"+str(index)+".name =  " + "'" + node1[0] +"' and p"+str(index)+".graph = " + str(i) + " "
                              " and ac"+str(index)+".name = "+ "'" + node2[0] + "' and ac"+str(index)+".graph = " + str(i) + " "      
                              "MATCH path"+str(index)+" = (p"+str(index)+")-[]-(ac"+str(index)+")")
            returns.append("path"+str(index))
            searches.append(search)
            creates.append(create)
            nodes.append(node) 
            stmts.append(stmt)
            #returns.append(ret)
        #print(searches)
        searchesFinal.append(searches)
        createsFinal.append(creates)
        nodeInfoFinal.append(nodes)
        stmtsFinal.append(stmts)
        
        stmtInfo = []
        nodesInfo = []
        for i in range(len(nodeInfoFinal)):
            nodesInfo.append(list(set(np.array(nodeInfoFinal[i]).flatten().tolist()))) 
            stmtInfo.append(list(set([e for sl in stmtsFinal[i] for e in sl])))
            
            
            
        returnCypher = 'RETURN '
        for ret in returns:
            returnCypher = returnCypher + ret + ', '
        returnCypher = returnCypher[:len(returnCypher)-2]      
        returnsFinal.append(returnCypher)

    createResult = [item for sublist in createsFinal for item in sublist]


    #print(nodesInfo)
    ndict = {tuple(k): v for v, k in enumerate(nodesInfo)}
    n2dict = []
    for i in nodesInfo:
        n2dict.append(ndict[tuple(i)]) 
    
    delInd = []    
    seen = set()
    for idx, item in enumerate(n2dict):
        if item not in seen:
            seen.add(item)          # First time seeing the element
        else:
            delInd.append(idx)      # Already seen, add the index to the result
    #print(delInd)


   
    cypherFinal = []
    for i in range(len(searchesFinal)):
        cyphers = ''
        for j in range(len(searchesFinal[i])):
            cyphers = cyphers + searchesFinal[i][j] + ' '
        cypherFinal.append(cyphers + returnsFinal[i])
    
    ranking = [] 
    for i in range(len(supports)):
        ranking.append([supports[i], cypherFinal[i], nodesInfo[i]])

    #remove duplicate list
    for index in sorted(delInd, reverse=True): 
        del ranking[index]
        del stmtInfo[index]
    #ranking = sorted(ranking, key = operator.itemgetter(0), reverse=True)
    
    #create explainable statement
    # 1. if frequentNodes's length is 2, it is deleted
    frequentNodes = []
    delInd = []
    for i in range(len(ranking)):
        if len(ranking[i][2]) == 2:
            delInd.append(i)

    for index in sorted(delInd, reverse=True):
        del ranking[index]
        del stmtInfo[index]
    
    # 2. search predefined prov structure
    # provFlag = [personFlag, instFlag, dataFlag, createFlag, provideFlag, processFlag]
    provFlags = []
    provStruc = []
    for i in range(len(stmtInfo)):
        per = ''
        inst = ''
        data = ''
        create = ''
        prov = ''
        proc = ''
        provFlag = [False, False, False, False, False, False]
        for node in stmtInfo[i]:
            if node[1] == '개인':
                provFlag[0] = True
                per = node[0]
            elif node[1] == '기관':
                provFlag[1] = True
                inst = node[0]
            elif node[1] == 'Data':
                provFlag[2] = True
                data = node[0]
            else:
                if node[0] == '생성':
                    provFlag[3] = True
                    create = '생성'
                elif node[0] == '제공':
                    provFlag[4] = True
                    prov = '제공'
                else:
                    provFlag[5] = True
                    proc = '가공'
        provFlags.append(provFlag)
        provStruc.append([per, inst, data, create, prov, proc])

    delInd = []
    stmtsFinal = []
    for i in range(len(provFlags)):
        remainFlag = False
        stmts = []
        if provFlags[i][0] and provFlags[i][2] and provFlags[i][3]: #생성
            createStmt = '개인이 "' + provStruc[i][2] + '(개인정보)"을(를) "생성"함'
            remainFlag = True
            stmts.append(createStmt)
        if provFlags[i][0] and provFlags[i][1] and provFlags[i][2] and provFlags[i][4]: #제공 
            provStmt = '개인이 "' + provStruc[i][2] + '(개인정보)"을(를) "' + provStruc[i][1] +'"에게 "제공"함'
            remainFlag = True
            stmts.append(provStmt)
        if provFlags[i][0] and provFlags[i][2] and provFlags[i][5]: #가공
            procStmt = '개인이 "' + provStruc[i][2] + '(개인정보)"을(를) "가공"함'
            remainFlag = True
            stmts.append(procStmt)
        if not(remainFlag):
            delInd.append(i)
        stmtsFinal.append(stmts)

    
    for index in sorted(delInd, reverse=True):
        #print(ranking[index])
        #print(stmtsFinal[index])
        del ranking[index]
        del stmtsFinal[index]       
   
    for i in range(len(ranking)):
        ranking[i].append(stmtsFinal[i])
    ranking = sorted(ranking, key = operator.itemgetter(0), reverse=True)
    
    #create Output [support, Match Cyphers, Frequent Nodes]    
    outTable = '/'        
    sup = '^'
    node = '^-'
    stmt = '^-'
    if tableLen < len(ranking):
        for i in range(tableLen):
            outTable = outTable + ranking[i][1] +'/'
            sup = sup + str(ranking[i][0]) + '^'
            for n in ranking[i][2]:
                node = node + n + '-'
            node = node + '^'
            for s in ranking[i][3]:
                stmt = stmt + s + '-'
            stmt = stmt + '^'
        outTable = outTable + '|' + sup + '|' + node + '|' + stmt    
    else:
        for i in range(len(ranking)):
            outTable = outTable + ranking[i][1] +'/'
            sup = sup + str(ranking[i][0]) + '^'
            for n in ranking[i][2]:
                node = node + n + '-'
            node = node + '^'
            for s in ranking[i][3]:
                stmt = stmt + s + '-'
            stmt = stmt + '^'
        outTable = outTable + '|' + sup + '|' + node + '|' + stmt   

    print(outTable)

    #upload FSM result graphs to NEO4j
    driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"), encrypted=False)    

    with driver.session() as session:
        for create in createResult:
            #print(create)
            session.write_transaction(uploadFSMresults, create)
            
        session.read_transaction(merge_data)
        session.read_transaction(merge_person)
        session.read_transaction(merge_activity)
        session.read_transaction(delete_duplRelation)
    driver.close()
