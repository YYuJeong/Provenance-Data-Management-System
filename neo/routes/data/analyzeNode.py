# -*- coding: utf-8 -*-
"""
Created on Thu Jul 30 03:43:36 2020

@author: Jooyeon
"""

import sys
from gensim.models import Word2Vec
# Define Neo4j connections
from neo4j import GraphDatabase

host = 'bolt://localhost:7687'
user = 'neo4j'
password = 'wowhi223'
driver = GraphDatabase.driver(host,auth=(user, password))

nodeName = ''
nodeSimilarity = ''

if __name__ == "__main__":
    
    model = Word2Vec.load('model')
    nodeKeyword = sys.argv[1]
    #nodeKeyword = '강민석,901421-1154275'
    nodeResult = model.wv.most_similar(nodeKeyword)
    
    for key in range(len(nodeResult)-1):
        nodeName = nodeName + str(nodeResult[key][0]) + '/'
        
    for key in range(len(nodeResult)-1):
        nodeSimilarity = nodeSimilarity + str(model.wv.similarity(nodeKeyword,nodeResult[key][0])) + '/'
            
    nodeName = nodeName + str(nodeResult[9][0])
    nodeSimilarity = nodeSimilarity + str(model.wv.similarity(nodeKeyword,nodeResult[9][0]))

    print(nodeName + "+" + nodeSimilarity)
    