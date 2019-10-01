from neo4j import GraphDatabase

uriToServer = 'bolt://localhost:7687'
usr = 'neo4j'
pwd = 'wowhi223'

graphDB_Driver = GraphDatabase.driver(uriToServer, auth=(usr, pwd))

cqlShortestPaths = """MATCH (a1:Agent{name:'Emily'}), (a2:Agent{name:'Maud'}), path=((a1)-[*3..5]-(a2)) RETURN path ORDER BY LENGTH(path)"""

with graphDB_Driver.session() as graphDB_Session:
	shortestPaths = graphDB_Session.run(cqlShortestPaths)
	print("====")
	pathCount = 0

	for record in shortestPaths:
		pathCount += 1
		nodes = record["path"].nodes
		'''if pathCount > 5:
			break
		'''
		print("Path %d:"%(pathCount))
		for node in nodes:
			print(node)