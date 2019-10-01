고려해본 query
=======================
== 결과 출력 x==
-----------------------
1.<br>
	<pre>
	MATCH path=(a1:Agent{name:'Emily'})-[*]-(a2:Agent{name:'Maud'})
	RETURN path
	</pre>
2.<br>
	<pre>
	MATCH path = (n:Agent {name:'Emily'})-[*]-(n1:Agent{name:'Maud'})
	WITH relationships(path) as rels
	UNWIND rels AS rel
	WITH DISTINCT rel as rel
	RETURN startNode(rel).id AS source, endNode(rel).id AS destination, rel.cost AS cost
	</pre>
3.<br>
	<pre>
	MATCH path = (n:Agent {name:'Emily'})-[*]-()
	WITH relationships(path) as rels
	UNWIND rels AS rel
	WITH DISTINCT rel as rel
	RETURN startNode(rel).id AS source, endNode(rel).id AS destination, rel.cost AS cost
	</pre>
4.<br>
	<pre>
	MATCH path=(a1:Agent{name:'Maud'})-[*]-(a2:Agent{name:'Emily'})
	WHERE NOT (a2) --> ()
	RETURN EXTRACT (x IN NODES(path)[..-1]| x.id) AS result
	</pre>

== 결과 확인 o ==
-----------------------
1.<br>
	<pre>
	MATCH path = (a1:Agent{name:'Emily'})-[r*..3]-(a2:Agent{name:'Maud'})
	return path
	</pre>
2.<br>
	<pre>
	MATCH (a1:Agent{name:'Maud'}), (a2:Agent{name:'Emily'}), path=shortestPath((a1)-[*]-(a2))
	RETURN path
	ORDER BY LENGTH(path) DESC
	LIMIT 1
	</pre>
3.<br>
	<pre>
	MATCH (start:Agent{name:"Olie"}), (end:Agent{name:"Jane"}), p=shortestPath((start)-[*]-(end))
	WHERE length(p) > 1
	RETURN p
	// length(p) 부분을 = 3, 4 로 하면 특정 길이의 path 얻을 수 있음.
	</pre>
