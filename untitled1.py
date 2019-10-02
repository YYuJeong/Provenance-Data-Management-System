# -*- coding: utf-8 -*-
"""
Created on Tue Oct  1 16:10:55 2019

@author: YuJeong
"""


# import the GraphDatabase module - the neo4j driver for Python

from neo4j.v1 import GraphDatabase

 

# Provide Database Credentials

uriToServer     = "bolt://localhost:7687"

usr             = "neo4j"

pwd             = "wowhi223"

 

# Obtain a driver instance connecting to neo4j database server

graphDB_Driver  = GraphDatabase.driver(uriToServer, auth=(usr, pwd))

 

# Create a set of nodes representing friendship among a set of persons

cqlCreateNodesAndEdegs    = """CREATE (Onni:person { name: "Onni"}),

                                (Elias:person { name: "Elias"}),

                                (Eetu:person { name: "Eetu"}),

                                (Leo:person { name: "Leo"}),

                                (Leena:person { name: "Leena"}),

                                (Twain:person { name: "Twain"}),

                                (Ansa:person { name: "Ansa"}),

                                (Anneli:person { name: "Anneli"}),

                                (Onni)-[:friend {miles: 259}]->(Eetu),

                                (Onni)-[:friend {miles: 259}]->(Elias),

                                (Elias)-[:friend {miles: 259}]->(Leo),

                                (Leena)-[:friend {miles: 259}]->(Elias),

                                (Eetu)-[:friend {miles: 259}]->(Leena),

                                (Leena)-[:friend {miles: 259}]->(Twain),

                                (Ansa)-[:friend {miles: 259}]->(Leo),

                                (Twain)-[:friend {miles: 259}]->(Ansa),

                                (Ansa)-[:friend {miles: 259}]->(Anneli),

                                (Onni)<-[:friend {miles: 259}]-(Eetu),

                                (Onni)<-[:friend {miles: 259}]-(Elias),

                                (Elias)<-[:friend {miles: 259}]-(Leo),

                                (Leena)<-[:friend {miles: 259}]-(Elias),

                                (Eetu)<-[:friend {miles: 259}]-(Leena),

                                (Leena)<-[:friend {miles: 259}]-(Twain),

                                (Ansa)<-[:friend {miles: 259}]-(Leo),

                                (Twain)<-[:friend {miles: 259}]-(Ansa),

                                (Ansa)<-[:friend {miles: 259}]-(Anneli)"""

                   

cqlShorestPath      = """MATCH (p1:person { name: 'Ansa' }),(p2:person { name: 'Elias' }), path = shortestPath((p1)-[*..15]-(p2))

                      RETURN path"""

                      

cqlShorestPaths     = """MATCH (p1:person { name: 'Eetu' }),(p2:person { name: 'Elias' }), path = allShortestPaths((p1)-[*..15]->(p2))

                      RETURN path"""

 

# Execute the CQL queries

with graphDB_Driver.session() as graphDB_Session:

    # Create nodes and edges

    nodes = graphDB_Session.run(cqlCreateNodesAndEdegs)

 

    # Find the shortest path between two nodes..in this case two people

    shortestPath = graphDB_Session.run(cqlShorestPath)

 

    print("Shortest path between nodes - Ansa and Elias:")

    for record in shortestPath:

        nodes = record["path"].nodes

       

        for node in nodes:

            print(node)

 

    # Find the shortest paths between two nodes

    shortestPaths = graphDB_Session.run(cqlShorestPaths)

 

    print("======")

    print("Shortest paths between nodes - Eetu and Elias:")

    pathCount = 0

   

    for record in shortestPaths:

        pathCount   = pathCount + 1

        nodes       = record["path"].nodes

 

        print("Path %d:"%(pathCount))

        for node in nodes:

            print(node)

 