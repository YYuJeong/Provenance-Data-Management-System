//      new Cy2NeoD3(config, "graph", "datatable", cypher, "execute", connection, true);
function Cy2NeoD3(config, graphId, tableId, sourceId, execId, urlSource, renderGraph, cbResult) {
    var neod3 = new Neod3Renderer();
    var neo = new Neo(urlSource);
    var editor = sourceId;
    try {
        //evt.preventDefault();

        var queries = editor;
        var resArr = [] 
        var graphs = []
        var tables = []
        /*
        console.log("qq: " , typeof(queries))
        console.log(Object.keys(queries))
        //console.log(Object.values(queries))
        console.log(Object.keys(queries).length)
     
        if(Object.keys(queries).length > 1){
            console.log("여러쿼리")
            queries.forEach(function (query, index){
                console.log(index, query);
                neo.executeQuery(query , {}, function (err, res) {
                    res = res || {}
                    console.log(res)
                    resArr.push(res)
                    graphs.push(res.graph)
                    tables.push(res.table)
                });
            });
            var graphNode = graphs[0]['nodes']
            for(var j = 1; j< graphs.length; j++){
                for(var i = 0; i<graphs[j]['nodes'].length ; i++){
                    graphNode[graphNode.length++] = graphs[j]['nodes'][i]
                }
            }
            var graphLink = graphs[0]['links']
            for(var j = 1; j< graphs.length; j++){
                for(var i = 0; i<graphs[j]['links'].length ; i++){
                    graphLink[graphLink.length++] = graphs[j]['links'][i]
                }
            }
            var graphResult = {
                'nodes' : graphNode,
                'links' : graphLink
            };

            //console.log(Object.keys(graphLink))
            //console.log(Object.values(graphLink))

            var tableResult = tables[0]
            for (var i = 1; i<tables.length; i++){
                for(var j = 0; j<tables[i].length; j++){
                    tableResult[tableResult.length++] = tables[i][j]
                }
            }

            //console.log(Object.keys(tableResult))
            //console.log(Object.values(tableResult))

            if (renderGraph) {
                if (graphResult) {
                    var c = $("#" + graphId);
                    var t = $("#" + tableId);
                    t.empty();
                    c.empty();
                    neod3.render(graphId, c, graphResult);
                    renderResult(tableId, tableResult);
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
        }
        else{
            */
            //var q1 = "MATCH (personA:Person { name: '양유정', affiliation: '한국인터넷진흥원'}), (personB:Person { name: '서민지', affiliation: '한국보건산업진흥원' }) WITH personA, personB MATCH p = shortestPath((personA)-[*]-(personB)) RETURN p"

            //console.log(queries)
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
                        //console.log(Object.valuesOf(graph))
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
        //}    
        
        //console.log(JSON.stringify(ss[0].graph))

        /* 쿼리 하나 실행하는 기존 코드
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
        */
        
    } catch (e) {
        console.log(e);
        sweetAlert("Catched error", e, "error");
    }
}

exports.Cy2NeoD3 = Cy2NeoD3;
