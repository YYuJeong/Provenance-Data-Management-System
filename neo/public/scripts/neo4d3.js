function Neo(urlSource) {
	function txUrl() {
		var connection = urlSource();
		var url = (connection.url || "http://localhost:7474").replace(/\/db\/data.*/,"");
		return url + "/db/data/transaction/commit";
	}
	var me = {
		executeQuery: function(query, params, cb) {
			var connection = urlSource();
			var auth = ((connection.user || "") == "") ? "" : "Basic " + btoa(connection.user + ":" + connection.pass);
			//jQuery.ajaxSettings.traditional = true;


			$.ajax(txUrl(), {
				type: "POST",
				data: JSON.stringify({
					statements: [{
						statement: query,
						parameters: params || {},
						resultDataContents: ["row", "graph"]
					}]
				}),
				contentType: "application/json",
				async:false,
				error: function(err) {
					cb(err);
				},
				beforeSend: function (xhr) {
				    if (auth && auth.length) xhr.setRequestHeader ("Authorization", auth);
				},
				success: function(res) {

					//console.log("ajax query: ", queries[0])
					if (res.errors.length > 0) {
						cb(res.errors);
					} else {
						var cols = res.results[0].columns;
						//console.log("dd " +JSON.stringify(res.results[0].data))
						var rows = res.results[0].data.map(function(row) {
							var r = {};
							cols.forEach(function(col, index) {
								r[col] = row.row[index];
							});
							//console.log("r: " + JSON.stringify(r))

							return r;
						});
						var nodes = [];
						var rels = [];
						var labels = [];
					    function findNode(nodes, id) {
						   for (var i=0;i<nodes.length;i++) {
						      if (nodes[i].id == id) return i;
						   }
						   return -1;
					    }
						res.results[0].data.forEach(function(row) {

							row.graph.nodes.forEach(function(n) {
							   var found = nodes.filter(function (m) { return m.id == n.id; }).length > 0;
							   if (!found) {
								  //n.props=n.properties;
								  for(var p in n.properties||{}) { n[p]=n.properties[p];delete n.properties[p];} 
								  delete n.properties;
								  nodes.push(n);
								  labels=labels.concat(n.labels.filter(function(l) { labels.indexOf(l) == -1 }))
							   }
							});
							rels = rels.concat(row.graph.relationships.map(
								function(r) { 
								   return { id: r.id, start:r.startNode, end:r.endNode, type:r.type } }
								));
						});
						cb(null,{table:rows,graph:{nodes:nodes, links:rels},labels:labels});
					}
				}

			});

		}
	};
	return me;
}
