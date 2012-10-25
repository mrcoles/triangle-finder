
var _ = (function(undefined) {
    var _ = {
        map: function(list, func) {
            var newList = [], i=0, len=list.length, x;
            for (; i<len; i++) {
                x = func(list[i]);
                if (x !== null && x !== undefined) { newList.push(x); }
            }
            return newList;
        },
        isArray: function(obj) {
            return typeof(obj) == 'object' &&
                Object.prototype.toString.call(obj) == '[object Array]';
        },
        each: function(obj, func) {
            if (_.isArray(obj)) {
                for (var i=0, len=obj.length; i<len; i++) {
                    func(obj[i], i);
                }
            } else {
                for (var k in obj) {
                    func(k, obj[k]);
                }
            }
        },
        copy: function(obj, deep) {
            if (typeof(obj) === 'object') {
                var newObj;
                if (_.isArray(obj)) {
                    newObj = [];
                    for (var i=0, len=obj.length; i<len; i++) {
                        newObj.push(deep ? _.copy(obj[i], deep) : obj[i]);
                    }
                } else {
                    newObj = {};
                    for (var k in obj) {
                        newObj[k] = deep ? _.copy(obj[k], deep) : obj[k];
                    }
                }
                return newObj;
            }
            return obj;
        },
        setdefault: function(obj, attr, value) {
            if (obj[attr] === undefined) {
                obj[attr] = value;
            }
            return obj[attr];
        },
        extend: function() {
            var o = arguments[0] || {}, others = [], i, len, key;
            for (i=1, len=arguments.length; i<len; i++) {
                others.push(arguments[i]);
            }
            for (i=0, len=others.length; i<len; i++) {
                for (key in others[i]) {
                    o[key] = others[i][key];
                }
            }
            return o;
        }
    };
    return _;
})();

function getGraph() {
    var nodes = {}, edges = {};

    function slope(node1, node2) {
        return (node1.y - node2.y) / (node1.x - node2.x);
    }

    // HACK - to clean up floating point numbers
    // only to be used for comparison, not calculations
    function rnd(x) { return Math.round(x*1000) / 1000; }

    function almost(x, y) { return rnd(x) == rnd(y); }
    function nodeKey(x, y) {
        x = rnd(x), y = rnd(y);
        return x + '_' + y;
    }
    function edgeKey(x1, y1, x2, y2) {
        var tx1, ty1, tx2, ty2;
        x1 = rnd(x1), y1 = rnd(y1), x2 = rnd(x2), y2 = rnd(y2);
        if (x1 < x2 || (x1 == x2 && y1 < y2)) {
            tx1 = x1, ty1 = y1, tx2 = x2, ty2 = y2;
        } else {
            tx1 = x2, ty1 = y2, tx2 = x1, ty2 = y1;
        }
        return tx1 + '_' + ty1 + '_' + tx2 + '_' + ty2;
    }

    function makeNode(x, y) {
        return {key: nodeKey(x, y), x: x, y: y, roundedX: rnd(x), roundedY: rnd(y)};
    }

    function makeEdge(x1, y1, x2, y2) {
        var key = edgeKey(x1, y1, x2, y2),
            // y = mx + b
            // m = (y1 - y2) / (x1 - x2)
            // b = (x1*y2 - x2*y1) / (x1 - x2)
            mNum = (y1 - y2),
            bNum = (x1*y2 - x2*y1),
            den = (x1 - x2);
        return {
            key: key,
            node1: makeNode(x1, y1),
            node2: makeNode(x2, y2),
            mNum: mNum,
            bNum: bNum,
            den: den,
            m: den == 0 ? null : mNum / den,
            b: den == 0 ? null : bNum / den,
            hasNode: function(x, y) {
                return (x1 == x && y1 == y) || (x2 == x && y2 == y);
            }
        };
    }

    function findIntersection(edge1, edge2) {
        // y = m1x + b1
        // y = m2x + b2
        // x = (b2 - b1) / (m1 - m2)
        var m1 = edge1.m, b1 = edge1.b,
            m2 = edge2.m, b2 = edge2.b,
            x = null, y = null, outOfBounds = false;

        // find intersection coordinates (deal with vertical lines!)
        if (edge1.den == 0 && edge2.den == 0) {
            return null;
        } else if (edge1.den == 0 && edge2.den != 0) {
            x = edge1.node1.x;
            y = m2*x + b2;
        } else if (edge2.den == 0 && edge1.den != 0) {
            x = edge2.node1.x;
            y = m1*x + b1;
        } else if (m1 != m2) {
            x = (b2 - b1) / (m1 - m2);
            y = m1*x + b1;
        }

        // if we found coordindates, verify they're within bounds
        if (x != null && y != null) {
            for (var i=0, es=[edge1, edge2], e; i<2; i++) {
                e = es[i];
                if (!(((e.node1.x <= x && x <= e.node2.x) ||
                       (e.node2.x <= x && x <= e.node1.x)) &&
                      ((e.node1.y <= y && y <= e.node2.y) ||
                       (e.node2.y <= y && y <= e.node1.y)))) {
                    outOfBounds = true;
                    break;
                }
            }
            if (!outOfBounds) {
                if (!edge1.hasNode(x, y) && !edge2.hasNode(x, y)) {
                    return makeNode(x, y);
                }
            }
        }

        return null;
    }

    var G = {
        edges: edges,
        addEdge: function(x1, y1, x2, y2) {
            var n1 = makeNode(x1, y1),
                n2 = makeNode(x2, y2),
                e = makeEdge(x1, y1, x2, y2);
            nodes[n1.key] = n1;
            nodes[n2.key] = n2;
            edges[e.key] = e;
            return G;
        },
        removeEdge: function(x1, y1, x2, y2) {
            delete edges[edgeKey(x1, y1, x2, y2)];
        },
        removeNode: function(x, y) {
            //TODO
        },
        countShapes: function(numSides) {
            if (numSides < 3) { throw new Error('shapes must have at least 3 sides'); }

            // connect all the edges and make a nodeMap and neighborMap
            var tEdges = [],       // list of edges
                nodeMap = {},      // node key to node
                neighborMap = {},  // node key to dict of neighbor node keys to nodes
                edgeInterMap = {}; // edge key to dict of node keys to nodes

            for (var attr in edges) {
                tEdges.push(edges[attr]);
            }
            function connectNodes(n1, n2) {
                nodeMap[n1.key] = n1;
                nodeMap[n2.key] = n2;
                _.setdefault(neighborMap, n1.key, {})[n2.key] = n2;
                _.setdefault(neighborMap, n2.key, {})[n1.key] = n1;
            }

            // for each edge, iterate over each other edge to
            // build nodeMap and neighborMap
            _.each(tEdges, function(e1, i) {
                connectNodes(e1.node1, e1.node2);
                var inters = [];
                _.each(tEdges, function(e2, j) {
                    if (i < j) {
                        var inter = findIntersection(e1, e2);
                        if (inter) {
                            // connect ends of edges to the intersection
                            connectNodes(inter, e1.node1);
                            connectNodes(inter, e1.node2);
                            connectNodes(inter, e2.node1);
                            connectNodes(inter, e2.node2);

                            var otherInters = _.extend(
                                {},
                                edgeInterMap[e1.key],
                                edgeInterMap[e2.key]
                            );
                            _.each(otherInters, function(key, otherInter) {
                                if (otherInter.key != inter.key) {
                                    connectNodes(otherInter, inter);
                                }
                            });

                            _.setdefault(edgeInterMap, e1.key, {})[inter.key] = inter;
                            _.setdefault(edgeInterMap, e2.key, {})[inter.key] = inter;
                        }
                    }
                });
            });

            var shapes = [];

            // iterate over the neighborMap and find the shapes
            _.each(nodeMap, function(key, node) {
                var paths = [[node]], depth = numSides,
                    j, jlen, path, newPaths, neighbors;

                // explore paths at each depth level
                while (depth-- > 0 && paths.length) {
                    newPaths = [];

                    // for each path check the continuations
                    for (j=0, jlen=paths.length; j<jlen; j++) {
                        path = paths[j];
                        neighbors = neighborMap[path[0].key];
                        if (neighbors) {
                            _.each(neighbors, function(key, neighbor) {

                                // don't allow same slope for consecutive sides
                                if (path.length < 2 ||
                                    !almost(
                                        slope(neighbor, path[0]),
                                        slope(path[0], path[1])
                                    )) {
                                    if (depth == 0) {
                                        var plen = path.length;
                                        // good if we end on start and not same slope
                                        if (key == node.key &&
                                            !almost(slope(path[plen-1], path[plen-2]),
                                                    slope(path[0], neighbor))
                                           ) {
                                            shapes.push(path);
                                        }
                                    } else {
                                        // continue if we're not repepating nodes
                                        var repeats = _.map(path, function(n) {
                                            // keys do some rounding to deal with
                                            // my float errors
                                            return n.key == neighbor.key ? 1 : null;
                                            //return n.x == neighbor.x && n.y == neighbor.y ? 1 : null;
                                        });
                                        if (!repeats.length) {
                                            var p = _.copy(path);
                                            p.unshift(neighbor);
                                            newPaths.push(p);
                                        }
                                    }
                                }
                            });
                        }
                    }
                    paths = newPaths;
                }
            });

            // de-dupe the shapes
            var shapesMap = {};
            function shapeKeySort(n1, n2) {
                var x1 = rnd(n1.x), x2 = rnd(n2.x),
                    y1 = rnd(n1.y), y2 = rnd(n2.y);
                return x1 != x2 ? x1 - x2 : y1 - y2;
            }
            _.each(shapes, function(shape) {
                var shapeCopy = _.copy(shape);
                shapeCopy.sort(shapeKeySort);
                var key = _.map(shapeCopy, function(x) { return x.key; }).join('_');
                shapesMap[key] = shape;
            });

            var count = 0, newShapes = [];
            _.each(shapesMap, function(key, shape) {
                count++;
                newShapes.push(shape);
            });
            newShapes.sort(function(a, b) {
                var sizeDiff = rnd(G.computeSize(a)) - rnd(G.computeSize(b));
                if (sizeDiff != 0) {
                    return sizeDiff;
                }
                var aBL = G.bottomLeft(a),
                    bBL = G.bottomLeft(b);
                return (aBL.left == bBL.left) ? aBL.bot - bBL.bot : aBL.left - bBL.left;
            });
            return {count: count, shapes: newShapes};
        },
        computeSize: function(shape, roundIt) {
            var sums = 0;
            for (var i=0, len=shape.length, n1, n2; i<len; i++) {
                n1 = shape[i];
                n2 = shape[i+1] || shape[0];
                sums += (n1.x*n2.y - n1.y*n2.x);
            }
            sums = Math.abs(sums) / 2;
            return roundIt ? rnd(sums) : sums;
        },
        bottomLeft: function(shape) {
            var bot = null, left = null;
            for (var i=0, len=shape.length, n; i<len; i++) {
                n = shape[i];
                if (left == null || n.x < left) { left = n.x; }
                if (bot == null || n.y < bot) { bot = n.y; }
            }
            return {bottom: rnd(bot), left: rnd(left)};
        },
        round: rnd
    };

    // optional constructor arguments
    if (arguments.length) {
        if (arguments.length % 2 != 0) { throw new Error('must give even # of args'); }
        var i=0, len=arguments.length, ns = [], x, y;
        for (; i<len; i+=2) {
            ns.push([arguments[i], arguments[i+1]]);
        }
        _.each(ns, function(n, i) {
            _.each(ns, function(n2, j) {
                if (i > j) {
                    G.addEdge(n[0], n[1], n2[0], n2[1]);
                }
            });
        });
    }

    return G;
}

var Examples = {
    square: function() {
        var graph = getGraph();

        graph
            .addEdge(0, 0, 1, 0)
            .addEdge(0, 0, 0, 1)
            .addEdge(0, 0, 1, 1)
            .addEdge(0, 1, 1, 1)
            .addEdge(0, 1, 1, 0)
            .addEdge(1, 1, 1, 0);

        return graph;
    },
    hexagon: function() {
        var graph = getGraph();

        // (1, 0), (3, 0), (4, 1), (3, 2), (1, 2), (0, 1)

        graph
            .addEdge(1,0,3,0)
            .addEdge(1,0,4,1)
            .addEdge(1,0,3,2)
            .addEdge(1,0,1,2)
            .addEdge(1,0,0,1)

            .addEdge(3,0,4,1)
            .addEdge(3,0,3,2)
            .addEdge(3,0,1,2)
            .addEdge(3,0,0,1)

            .addEdge(4,1,3,2)
            .addEdge(4,1,1,2)
            .addEdge(4,1,0,1)

            .addEdge(3,2,1,2)
        //.addEdge(3,2,0,1)

            .addEdge(1,2,0,1);
        return graph;
    },
    hexagonFull: function() {
        // // (1, 0), (3, 0), (4, 1), (3, 2), (1, 2), (0, 1)
        var graph = getGraph(1,0, 3,0, 4,1, 3,2, 1,2, 0,1);
        return graph;
    },
    triangle: function() {
        // (0,0), (2,0), (4,0), (1,1), (3,1), (2,2)

        var graph = getGraph();
        graph
            .addEdge(0,0,2,0)
            .addEdge(0,0,4,0)
            .addEdge(0,0,1,1)
            .addEdge(0,0,2,2)

            .addEdge(1,1,2,2)
            .addEdge(1,1,3,1)
            .addEdge(1,1,2,0)

            .addEdge(2,0,3,1)
            .addEdge(2,0,4,0)

            .addEdge(3,1,2,2)
            .addEdge(3,1,4,0)

            .addEdge(0,0,2,2) //TODO(extend) - these shouldn't be necessary?
            .addEdge(2,2,4,0) //TODO(extend) - these shouldn't be necessary?
            .addEdge(0,0,4,0);//TODO(extend) - these shouldn't be necessary?

        graph.countShapes(3);
        return graph;
    },
    triangleFull: function() {
        // (0,0), (2,0), (4,0), (1,1), (3,1), (2,2)
        var graph = getGraph(0,0, 2,0, 4,0, 1,1, 3,1, 2,2);
        return graph;
    }
};
