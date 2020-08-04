# -*- coding: utf-8 -*-
"""
Created on Thu Jul 30 03:43:14 2020

@author: Jooyeon
"""

from gensim.models import Word2Vec

# Define Neo4j connections
from neo4j import GraphDatabase

host = 'bolt://localhost:7687'
user = 'neo4j'
password = 'wowhi223'
driver = GraphDatabase.driver(host,auth=(user, password))


with driver.session() as session:
    catalogCheck = session.run(""" CALL gds.graph.exists('Nodes') YIELD exists; """)
    for i in catalogCheck:
         checkResult = i
    checkResult = str(checkResult)
    if checkResult == '<Record exists=True>':
        session.run(""" CALL gds.graph.drop('Nodes') YIELD graphName """)
    session.run("""CALL gds.graph.create('Nodes', 
                    '*', 
                    {ALL_UNDIRECTED: {type:'*', orientation:'UNDIRECTED'}})""")
    
# Define random walk query
random_walks_query = """

MATCH (node)
CALL gds.alpha.randomWalk.stream('Nodes', {
  start: id(node),
  steps: 5,
  walks: 5,
  mode:'node2vec',
  inOut:0.6,
  return:1.0
})
YIELD nodeIds
RETURN [id in nodeIds | coalesce(gds.util.asNode(id).name + ','  + gds.util.asNode(id).value)] as walks

"""
# Fetch data from Neo4j
with driver.session() as session:
    walks = session.run(random_walks_query)
# Train the word2vec model
cleaWalks = [row['walks'] for row in walks]
model = Word2Vec(cleaWalks, sg=1, window=5, size=100)
model.save('model')
model.wv.save_word2vec_format('model.txt', binary=False)
model.wv.save_word2vec_format('model.bin', binary=True)
#embedding.wv.save_word2vec_format('model', binary=False)