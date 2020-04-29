# -*- coding: utf-8 -*-
"""
Created on Mon Nov 25 14:50:29 2019

@author: SookmyungWomensUniv
"""
import sys, time

from itertools import product
from itertools import groupby
from itertools import combinations
from math import floor
from neo4j import GraphDatabase


def check_nodeLabel(tx, keyword):
    personNodes = (tx.run("MATCH (n:Person)"
                          "WHERE (any(prop in ['name', 'affiliation'] WHERE n[prop] = $keyword))"
                          "RETURN n", keyword = keyword)).value()
    dataNodes = (tx.run("MATCH (n:Data)"
                      "WHERE (any(prop in ['name', 'd_type', 'device', 'price'] WHERE n[prop] = $keyword))"
                      "RETURN n", keyword = keyword)).value()
    activityNodes = (tx.run("MATCH (n:Activity)"
                  "WHERE (any(prop in ['name', 'date'] WHERE n[prop] = $keyword))"
                  "RETURN n", keyword = keyword)).value()

    if(personNodes):
        return personNodes
    elif(dataNodes):
        return dataNodes
    elif(activityNodes):
        return activityNodes

def delete_duplicateNode(kNodes):
    combi = list(range(len(kNodes)))
    candidN = list(product(*kNodes)) #generate all combinations for keyword nodes

    combi = list(combinations(combi, 2))
    
    delInd = []
    for i in range(len(candidN)):
        for j in range(len(combi)):
            if candidN[i][combi[j][0]].id == candidN[i][combi[j][1]].id:
                delInd.append(i)
                break
            
    ind = 0     
    for i in range(len(delInd)):
        del candidN[delInd[i]-ind]
        ind = ind + 1

    return candidN


def generate_shortestPathQuery(n, m):
    prop1 = [*n.keys()]
    prop2 = [*m.keys()]
    val1 = [*n.values()]
    val2 = [*m.values()]
    spMatch = "MATCH (n: "+next(iter(n.labels))+"), (m: "+next(iter(m.labels))+") "
    spWhere = "WHERE "
    whereN1 = ""
    whereN2 = ""
    
    for i in range(len(prop1)):
         whereN1 = whereN1 + "n."+prop1[i]+" = '" + val1[i] + "' AND "    
    for i in range(len(prop2)):
         whereN2 = whereN2 + "m."+prop2[i]+" = '" + val2[i] + "' "
         if i+1 != len(prop2):
             whereN2 = whereN2 + 'AND ' 
    spWhere = spWhere + whereN1 + whereN2
    spQuery = spMatch + spWhere + " MATCH p = shortestPath((n)-[*]-(m)) RETURN p, length(p)"
 
    return spQuery
    
    

def shortestPath(tx, spQuery):
 
    length = (tx.run(spQuery)).values()

    if length:
        return length
    
    

def sort_result(graphs):
    count = 0
    results = []
    for each in graphs:
        if each:
            count = count + 1
            results.append(each) 

    resultLen = []
    for each in results:
        sumLen = 0
        for i in range(len(keywords)-1):
            sumLen = sumLen + len(each[i])
        resultLen.append(sumLen)
    resultIndex = sorted(range(len(resultLen)), key=lambda k: resultLen[k])         
    ranking = []
    for i in resultIndex: 
      
        ranking.append(results[i])
    return ranking


def generate_outputQuery(ranking):
    '''
    MATCH (personA:Person { name: '변백현', affiliation:"대한법률구조공단"  }),
          (personB:Person {  name: '이시현', affiliation:"NHN"  }),
          (personC:Person {  name: '유상아', affiliation:"정보통신산업진흥원"  }),
          (personD:Person {  name: '이시현', affiliation:"NHN"  })
    WITH personA, personB, personC, personD
    MATCH p = shortestPath((personA)-[*]-(personB))
    MATCH p2 = shortestPath((personD)-[*]-(personC))
    RETURN p, p2
    '''
    j = 0
    outQuery = ""
    for r in range(len(ranking)):
        resultLabel = ""
        resultWhere = ""
        resultSp = ""
        resultRt = ""
        for i in range(len(keywords)-1):    
            psLabel = next(iter(ranking[r][i].start_node.labels))
            peLabel = next(iter(ranking[r][i].end_node.labels))
            labelTemp = "(s"+str(j) +":" + psLabel +"), (e"+str(j) +":"+peLabel +")"

            psProp = [*ranking[r][i].start_node.keys()]
            peProp = [*ranking[r][i].end_node.keys()]
            psVal = [*ranking[r][i].start_node.values()]
            peVal = [*ranking[r][i].end_node.values()]
            psWhere = ""
            peWhere = ""

            for p in range(len(psProp)):
                psWhere = psWhere + "s" + str(j) + "." + psProp[p]+" = '" + psVal[p] + "' AND "
            for p in range(len(peProp)):
                peWhere = peWhere + "e" + str(j) + "." + peProp[p]+" = '" + peVal[p] + "' "
                if p+1 != len(peProp):
                    peWhere = peWhere + 'AND ' 

            resultLabel = resultLabel + labelTemp 
            resultWhere = resultWhere + psWhere + peWhere
            spTemp = " MATCH p" + str(i) +" = shortestPath((s" + str(j) +")-[*]-(e" +str(j)+")) " 
            resultSp =  resultSp + spTemp       
            resultRt = resultRt + "p" + str(i) 
            if i+1 != len(keywords)-1:
                resultLabel = resultLabel + ", "
                resultWhere = resultWhere + "AND "
                resultRt = resultRt + ", "
            j += 1

        resultLabel = "MATCH " + resultLabel
        resultWhere = " WHERE " + resultWhere
        resultRt = " RETURN " + resultRt  
        resultOut = resultLabel + resultWhere + resultSp + resultRt
        outQuery = outQuery + "/" + resultOut
    return outQuery

def generate_outputTable(ranking):
    outTable = ""
    for r in range(len(ranking)):
        pTmp = []
        for i in range(len(keywords)-1):
            psTmp = []
            peTmp = []
          
            psLabel = next(iter(ranking[r][i].start_node.labels))
            peLabel = next(iter(ranking[r][i].end_node.labels))

            psTmp.append(psLabel)
            peTmp.append(peLabel)            
            
            '''
            psLabel1 Name.Affiliation 이름.소속;
                        
            2qeury1/outputQuery2|path1;path2,path1
            
            path1 = psLabel peLabel psprop peprop psVal peVal
            '''
            psProp = [*ranking[r][i].start_node.keys()]
            peProp = [*ranking[r][i].end_node.keys()]
            psVal = [*ranking[r][i].start_node.values()]
            peVal = [*ranking[r][i].end_node.values()]

            psTmp = psTmp + psProp + psVal
            peTmp = peTmp + peProp + peVal
            pTmp.append(psTmp)
            pTmp.append(peTmp)
            
            pTmp.sort()
            pTmp = list(pTmp for pTmp,_ in groupby(pTmp))
        
        out = ""
        for p in pTmp:
            outTmp = ""
            for j in range(len(p)):
                if j == 0:
                    outTmp = outTmp + p[j] + " "
                else:
                    if j == floor(len(p)/2):            
                        outTmp = outTmp + p[j] + " "
                    else:
                        if j == len(p)-1:
                            outTmp = outTmp + p[j] + "/"
                        else:
                            outTmp = outTmp + p[j] + "."
            
            out = out + outTmp

        outTable = outTable + out +";"    

    return outTable

# proposed
if __name__ == "__main__":
    driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"))
    with driver.session() as session:

        
        keywords = sys.argv[1].split(' ')
		
        start_time = time.time()
		
        #search for all nodes with keywords
        kNodes = []
        for i in range(len(keywords)):
            kNodes.append(session.read_transaction(check_nodeLabel,  keyword= keywords[i]))

        candidN = delete_duplicateNode(kNodes)   

        g = []
        N = []
        graphs = [] # pair 저장
            
		#search all shortestpaths for all combinations   
        for k in range(len(candidN)):
				
            N = list(candidN[k])
            nodeSum = len(candidN[k])
            path = []
            pathLen = []

            flag = True

            for i in range(len(N)):

                pathTmp = []
                pathLenTmp = []
                if not flag:
                    break
                for j in range(i+1, len(N)):
                    spQuery = generate_shortestPathQuery(N[i], N[j])
                    shortP = session.read_transaction(shortestPath, spQuery)
            
                    if shortP is not None:
                        pathTmp.append(shortP[0][0])
                        pathLenTmp.append(shortP[0][1])
                    else: #No shortestPath
                        flag = False  
                        break
                path.append(pathTmp)
                pathLen.append(pathLenTmp)  

			#algorithm
            if pathLen and flag:
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
            else:
                graphs.append([]) 
		

        ranking = sort_result(graphs)
        if len(ranking) <= 10:
            outQuery = generate_outputQuery(ranking)
            outTable = generate_outputTable(ranking)
        else:
            outQuery = generate_outputQuery(ranking[:10])
            outTable = generate_outputTable(ranking[:10])
        print(outQuery + "|" + outTable)

        driver.close()

		
		
		
		
		
