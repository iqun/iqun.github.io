let level = 0;
let orbs = [];
let svg = d3.select("svg");
let audio = new Audio('bell.mp3');
let mid = [100, 100], left = [50, 100], right = [150, 100], up = [100, 50], down = [100, 150], 
    upleft = [50, 50], upright = [150, 50], downleft = [50, 150], downright = [150, 150];
let palettes = [
    ['lightgreen', 'black', 'darkgreen', 'green', 'palegreen', 'white', 'orange', 'mistyrose', 'coral', 'slategray'],
    ['khaki', 'saddlebrown', 'orange', 'darkred', 'gold', 'mediumseagreen', 'white', 'tomato', 'crimson', 'navajowhite'],
    ['azure', 'lightblue', 'cadetblue', 'darkorange', 'royalblue', 'chocolate', 'lightslategray', 'navy', 'sandybrown', 'thistle'],
    ['lightpink', 'palevioletred', 'mediumorchid', 'midnightblue', 'indigo', 'plum', 'rosybrown', 'lightsteelblue', 'tomato', 'sienna'],
];
let maps = [
    [
        'red',
        {r:20, color:'firebrick', orbit:[], states:[right]},
        {r:10, color:'white', orbit:[], states:[left, mid, right]},
    ],
    [
        'red',
        {r:20, color:'firebrick', orbit:[], states:[mid]},
        {r:16, color:'darkorange', orbit:[], states:[left, mid]},
        {r:14, color:'orange', orbit:[], states:[up, mid]},
        {r:12, color:'yellow', orbit:[], states:[right, mid]},
        {r:10, color:'white', orbit:[], states:[down, mid]},
    ],
    [
        'red',
        {r:20, color:'yellow', orbit:[], states:[downleft, upleft, mid]},
        {r:10, color:'white', orbit:[], states:[downright, upright, mid]},
    ],
    [
        'gray',
        {r:20, color:'darksalmon', orbit:[], states:[mid]},
        {r:15, color:'plum', orbit:[2], states:[downleft, upright, right, mid]},
        {r:18, color:'tomato', orbit:[1], states:[downright, upleft, left, mid]},
    ],
    [
        'gray',
        {r:40, color:'darksalmon', orbit:[1, 2], states:[mid, up]},
        {r:12, color:'plum', orbit:[2], states:[mid, downleft, downright]},
        {r:5, color:'tomato', orbit:[], states:[mid, downright, downleft]},
    ],
    [
        'lightblue',
        {r:20, color:'black', orbit:[], states:[mid, up]},
        {r:15, color:'blue', orbit:[2], states:[up, right, down, left]},
        {r:10, color:'white', orbit:[1], states:[downright, downleft, up]},
    ],
    [
        'lightblue',
        {r:15, color:'black', orbit:[1], states:[upleft, up, upright, up]},
        {r:10, color:'darkblue', orbit:[], states:[up, mid, down, mid]},
    ],
    [
        'lightblue',
        {r:25, color:'black', orbit:[2], states:[upleft, upright, downright, downleft]},
        {r:20, color:'darkblue', orbit:[3], states:[upright, downright, downleft, upleft]},
        {r:15, color:'blue', orbit:[1], states:[downright, downleft, upleft, upright]},
        {r:10, color:'white', orbit:[0], states:[downleft, upleft, upright, downright]},
    ],
];

function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function equals(state1, state2) {
    return (state1[0] == state2[0] && state1[1] == state2[1]);
}

function pivot(d) {
    for (let orb of d.orbit.concat(d)) {
        orb.states.push(orb.states.shift());
    }
}

function generate() {
    level++;
    let palette = pick(palettes).slice();
    let background = palette.shift();
    
    if (level <= maps.length) {
        orbs = maps[level - 1];
        background = orbs.shift();
    } else {
        let nodes = [upleft, up, upright, left, mid, right, downleft, down, downright];
        let count = Math.min(9, Math.floor(3 + level * 0.2 + 2 * Math.random()));
        let radius = count * 5;
        let prob = 0.5 + Math.min(0.4, (level - maps.length) * 0.01);
        let convergence = pick(nodes);
        for (let i = 0; i < count; i++) {
            let orb = {orbit:[], states:[convergence], r:radius, color:palette.shift()};
            for (let p = prob; Math.random() < p; p *= prob) {
                let sibling = Math.floor(count * Math.random());
                if (sibling != i && !orb.orbit.includes(sibling))
                    orb.orbit.push(sibling);
            }
            for (let p = 1; Math.random() < p; p *= 0.75) {
                let node = pick(nodes);
                if (!equals(node, orb.states[0]) && !equals(node, orb.states[orb.states.length - 1]))
                    orb.states.push(node);

            }
            radius *= (Math.random() + 2) / 3.3;
            orbs.push(orb);
        }
    }
    svg.transition().style('background-color', background).on('end', enter);
    for (let orb of orbs) {
        orb.orbit = orb.orbit.map(function(i) {return orbs[i]});
    }
    if (level > maps.length)
        for (let i of Array(100))
            pivot(pick(orbs));
}

function enter() {
    let c = svg.selectAll('circle').data(orbs);
    c.enter().append('circle')
        .on('click', click)
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
        .attr('cx', function(d) {return d.states[0][0]})
        .attr('cy', function(d) {return d.states[0][1]})
        .transition().duration(1500).delay(function(d, i) {return i * 200}).ease(d3.easeElasticOut)
        .attr('fill', function(d) {return d.color})
        .attr('r', function(d) {return d.r});
}

function callOnNth(callback, n) {
    return function() {
        n--;
        if (n == 0)
            setTimeout(callback, 100);
    }
}

function checkAlignment() {
    let state = orbs[0].states[0];
    for (let orb of orbs) {
        if (!equals(orb.states[0], state)) {
            return;
        }
    }

    let count = orbs.length;
    orbs = [];
    svg.selectAll('circle').data(orbs).exit().on('mouseover', null).on('mouseout', null)
        .transition().duration(750).ease(d3.easeLinear).attr('r', 100).style('opacity', '0').on('end', callOnNth(generate, count)).remove();
    audio.volume = 0.2;
    audio.play();
}

function click(d) {
    pivot(d);
    let c = svg.selectAll('circle').data(orbs);
    c.transition()
        .style('stroke', 'none')
        .attr('cx', function(d) {return d.states[0][0]})
        .attr('cy', function(d) {return d.states[0][1]})
        .on('end', callOnNth(checkAlignment, orbs.length));
}

function mouseover(d) {
    let data = d.states.length > 1 ? d.orbit.concat(d) : d.orbit;
    svg.selectAll('circle').data(data, function(o) {return o.color}).style('stroke', 'white').style('stroke-opacity', 0.5).style('stroke-width', 3);
}

function mouseout(d) {
    svg.selectAll('circle').data(d.orbit.concat(d), function(o) {return o.color}).style('stroke', 'none');
}

generate();
