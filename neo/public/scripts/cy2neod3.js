function Cy2NeoD3(config, graphId, tableId, sourceId, execId, urlSource, renderGraph, cbResult) {
    var neod3 = new Neod3Renderer();
    var neo = new Neo(urlSource);
    var editor = sourceId;
    $("#" + execId).click(function (evt) {
        try {
            evt.preventDefault();
            var query = editor;
            //console.log("Executing Query",query);
            neo.executeQuery(query, {}, function (err, res) {
                res = res || {}
                var graph = res.graph;
                if (renderGraph) {
                    if (graph) {
                        var c = $("#" + graphId);
                        var t = $("#" + tableId);
                        t.empty();
                        c.empty();
                        neod3.render(graphId, c, graph);
                        renderResult(tableId, res.table);
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
    });
}
