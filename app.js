
var $canvas = $('#c'),
    canvas = $canvas.get(0),
    width = $canvas.attr('width'),
    height = $canvas.attr('height'),
    ctx = canvas.getContext('2d'),

    graph = getGraph();


function translateCtx() {
    var scale = 100;
    ctx.restore();
    ctx.save();
    ctx.translate(20, height - 20);
    ctx.scale(scale, -scale);
}

function drawGraph(graph) {
    var scale = 100;
    ctx.restore();
    ctx.clearRect(0, 0, width, height);
    translateCtx();

    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1/100;
    var x, y, dmin = -1, dmax = 4.25;
    for (x=-1; x<dmax; x++) {
        ctx.beginPath();
        ctx.moveTo(x, dmin);
        ctx.lineTo(x, dmax);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(dmin, x);
        ctx.lineTo(dmax, x);
        ctx.closePath();
        ctx.stroke();
    }

    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5/100;
    $.each(graph.edges, function(i, edge) {
        $.each([edge.node1, edge.node2], function(i, node) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 1/10, 0, 2*Math.PI);
            ctx.fill();
        });
        ctx.beginPath();
        ctx.moveTo(edge.node1.x, edge.node1.y);
        ctx.lineTo(edge.node2.x, edge.node2.y);
        ctx.stroke();
    });
}

var $graphs = $('#graphs');
$.each(Examples, function(name, func) {
    var simpleName = name.replace(/[^0-9A-z]/g, '');
    $('<a>', {
        text: name,
        href: '#'+simpleName,
        click: function(e) {
            e.preventDefault();
            var graph = func();
            drawGraph(graph);
            var sc = graph.countShapes(3);
            var shapes = sc.shapes;

            var $p = $('#p').html('<strong>' + name + '</strong> has ' + sc.count + ' triangles.');
            var $list = $('<ol>');
            var lastSize = 0, odd = false, size;
            _.each(shapes, function(shape, i) {
                size = graph.computeSize(shape, true);
                if (lastSize != size) {
                    odd = !odd;
                    lastSize = size;
                }
                $list.append('<li class="' + (odd?'odd':'even') + '">coordinates: '
                             + _.map(shape, function(n) {
                                 return '('+n.roundedX+', '+n.roundedY+')';
                             }).join(', ')
                             + ' size: ' + size + '</li>');
            });
            $p.append('<br><br>').append($list);

            var $buttons = $('#buttons').empty();

            var shapeIndex = -1, colors = [
                '#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'
            ];
            function round(x) {
                return Math.round(x*100) / 100;
            }
            function drawShape(index) {
                shapeIndex = index;
                var shape = shapes[shapeIndex];
                if (shape || shapeIndex == -1) {
                    $('#cur-shape').text(shapeIndex+1);
                    drawGraph(graph);
                    if (shapeIndex == -1) return;
                    translateCtx();
                    ctx.fillStyle = colors[shapeIndex%colors.length];
                    ctx.lineWidth = 5/100;
                    ctx.strokeStyle = '#000';
                    ctx.beginPath();
                    _.each(shape, function(node, i) {
                        ctx[i == 0 ? 'moveTo' : 'lineTo'](node.x, node.y);
                    });
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            }

            $('<a>', {href: '#', html: '&laquo;', click: function(e) {
                e.preventDefault();
                drawShape(-1);
            }}).appendTo($buttons);
            $('<a>', {href: '#', html: '←', click: function(e) {
                e.preventDefault();
                if (shapeIndex >= 0) drawShape(shapeIndex - 1);
            }}).appendTo($buttons);
            $buttons.append(' <span id="cur-shape">0</span> of ' + shapes.length + ' ');
            $('<a>', {href: '#', html: '→', click: function(e) {
                e.preventDefault();
                if (shapeIndex < shapes.length) drawShape(shapeIndex + 1);
            }}).appendTo($buttons);
            $('<a>', {href: '#', html: '&raquo;', click: function(e) {
                e.preventDefault();
                drawShape(shapes.length - 1);
            }}).appendTo($buttons);

            var animateIndex = 0;
            (function animateShapes() {
                var shape = shapes[animateIndex];
                if (shape) {
                    drawShape(animateIndex);
                }
                if (++animateIndex < shapes.length) {
                    window.setTimeout(animateShapes, 1000);
                }
            });
        }
    }).appendTo($('<li>').appendTo($graphs));
});

$graphs.find('a[href=#hexagon]').click();
