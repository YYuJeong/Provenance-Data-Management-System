//      new Cy2NeoD3(config, "graph", "datatable", cypher, "execute", connection, true);
function Cy2NeoD3(config, graphId, tableId, sourceId, execId, urlSource, renderGraph, cbResult) {
    var neod3 = new Neod3Renderer();
    var neo = new Neo(urlSource);
    var editor = sourceId;
    try {
        //evt.preventDefault();

        var queries = editor;
        var ss = [] 
        var gs = []
        console.log("Executing Query",queries);
        /*
        queries.forEach(function (query, index){
            console.log(index, query);
            neo.executeQuery(query , {}, function (err, res) {
                console.log("esss: " + query)
                console.log("**************************************************")
                res = res || {}
                //console.log("res" + JSON.stringify(res))
                ss.push(res);
                gs.push(res.graph)
            });
        });
        console.log("@@@@@")
        */
        /*
        ss.forEach(function (s, index){
            console.log("ss", index)
            console.log(s.graph['nodes'].length)

        });
        */
        /*
        var s1 = gs[0]['nodes']
        console.log(JSON.stringify(s1))
        var s2 = gs[1]['nodes']
        console.log(JSON.stringify(s2))
        console.log(s1.length, s2.length)
        for(var i = 0; i<s2.length ; i++){
            s1[s1.length++] = s2[i]
        }
        console.log(s1.length)
        console.log(Object.keys(s1))
        console.log(Object.values(s1))
        
        
        console.log("@@@@@+++++++++++++++++++++++++++++++++++++")
        var s1l = gs[0]['links']
        console.log(JSON.stringify(s1l))
        console.log(Object.keys(s1l))
        var s2l = gs[1]['links']
        console.log(JSON.stringify(s2l))
        console.log(s1l.length, s2l.length)
        for(var i = 0; i<s2l.length ; i++){
            s1l[s1l.length++] = s2l[i]
        }

        console.log(s1l.length)
        console.log(Object.keys(s1l))
        console.log(Object.values(s1l))

        var newgraph = {
            'nodes' : s1,
            'links' : s1l
        };

        console.log(Object.keys(newgraph))
        console.log(Object.values(newgraph))
        console.log('========================================================')
        if (renderGraph) {
            if (newgraph) {
                var c = $("#" + graphId);
                var t = $("#" + tableId);
                t.empty();
                c.empty();
                neod3.render(graphId, c, newgraph);
                // renderResult(tableId, res.table);
                console.log(newgraph)
                console.log(Object.keys(newgraph))
                console.log(Object.values(newgraph))
            } else {
                if (err) {
                    console.log(err);
                    if (err.length > 0) {
                        sweetAlert("Cypher error", err[0].code + "\n" + err[0].message, "error");
                    } else {
                        sweetAlert("Ajax " + err.statusText, "Status " + err.status + ": " + err.state(), "error");
                    }
                }
            }
        }
        */
        //console.log(JSON.stringify(ss[0].graph))

       
        neo.executeQuery(queries , {}, function (err, res) {
            //  console.log("res" + JSON.stringify(res))
            res = res || {}
            //  console.log("**************************************************")
            //  console.log("res" + JSON.stringify(res))
            var graph = res.graph;
            if (renderGraph) {
                if (graph) {
                    var c = $("#" + graphId);
                    var t = $("#" + tableId);
                    t.empty();
                    c.empty();
                    neod3.render(graphId, c, graph);
                    renderResult(tableId, res.table);
                    console.log(graph)
                    console.log(Object.keys(graph))
                    console.log(Object.values(graph))
                } else {
                    if (err) {
                        console.log(err);
                        if (err.length > 0) {
                            sweetAlert("Cypher error", err[0].code + "\n" + err[0].message, "error");
                        } else {
                            sweetAlert("Ajax " + err.statusText, "Status " + err.status + ": " + err.state(), "error");
                        }
                    }
                }
            }
            if (cbResult) {
                cbResult(res);
            }
        });

        
    } catch (e) {
        console.log(e);
        sweetAlert("Catched error", e, "error");
    }
    return false;



}

exports.Cy2NeoD3 = Cy2NeoD3;
