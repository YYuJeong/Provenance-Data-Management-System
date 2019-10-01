고려해본 query
=======================
== 결과 출력 x==
-----------------------
1.
	MATCH path=(a1:Agent{name:'Emily'})-[*]-(a2:Agent{name:'Maud'})
	RETURN path
2.
	MATCH path = (n:Agent {name:'Emily'})-[*]-(n1:Agent{name:'Maud'})
	WITH relationships(path) as rels
	UNWIND rels AS rel
	WITH DISTINCT rel as rel
	RETURN startNode(rel).id AS source, endNode(rel).id AS destination, rel.cost AS cost
3.
	MATCH path = (n:Agent {name:'Emily'})-[*]-()
	WITH relationships(path) as rels
	UNWIND rels AS rel
	WITH DISTINCT rel as rel
	RETURN startNode(rel).id AS source, endNode(rel).id AS destination, rel.cost AS cost
4.
	MATCH path=(a1:Agent{name:'Maud'})-[*]-(a2:Agent{name:'Emily'})
	WHERE NOT (a2) --> ()
	RETURN EXTRACT (x IN NODES(path)[..-1]| x.id) AS result

== 결과 확인 o ==
-----------------------
1.
	MATCH path = (a1:Agent{name:'Emily'})-[r*..3]-(a2:Agent{name:'Maud'})
	return path
2.
	MATCH (a1:Agent{name:'Maud'}), (a2:Agent{name:'Emily'}), path=shortestPath((a1)-[*]-(a2))
	RETURN path
	ORDER BY LENGTH(path) DESC
	LIMIT 1
3.
	MATCH (start:Agent{name:"Olie"}), (end:Agent{name:"Jane"}), p=shortestPath((start)-[*]-(end))
	WHERE length(p) > 1
	RETURN p
	// length(p) 부분을 = 3, 4 로 하면 특정 길이의 path 얻을 수 있음.