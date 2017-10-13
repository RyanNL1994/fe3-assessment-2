// Bron Mike Bostock 20 aug 2017 https://bl.ocks.org/mbostock/3885304 & Titus Wormer https://cmda-fe3.github.io/course-17-18/class-4/sort/


// hier wordt een variable svg gemaakt. In deze variabele roept d3 de svg in de html op en wordt de margin voor deze svg bepaald

var svg = d3.select("svg"),
    margin = {
        top: 20,
        right: 20,
        bottom: 120,
        left: 130
    },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;


// Hier wordt de witruimte bepaald tussen de bars van de grafieken

var x = d3.scaleBand().rangeRound([0, width]).padding(0.3),
    y = d3.scaleLinear().rangeRound([height, 0]);

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Hier wordt de data wat in mijn CSV bestand zit aangeroepen door d3 en als er iets mis is wordt er een error aangegeven via de if statement

d3.text('data.csv').mimeType('text/plain;charset=iso88591').get(onload)


function onload(err, doc) {
    if (err) {
        throw err;
    }


    // Aan de hand van de onderstaande code wordt de data schoon gemaakt. Deze heb ik verkregen met behulp van de slides van class 3
    // De header die niet nodig is voor data en dus overbodig is wordt hier weggehaald

    var header = doc.indexOf('"Geslacht";"Perioden";"% van de schoolverlaters"')
    var end = doc.indexOf('\n', header)
    doc = doc.slice(end).trim()

    // Hier worden alle ; vervangen met een , in de data van de CSV bestand
    doc = doc.replace(/;/g, ',')

    var cleanedData = d3.csvParseRows(doc, map)

    function map(d) {
        return {
            jaar: d[1],
            verlaters: Number(d[2])
        }
    }

    // Hier worden 2 variabelen gemaakt waarmee de footer gaan weghalen.
    // Eerst maken we een variabele footer met hierin de stuk tekst wat we willen weghalen.
    // Daarna roepen we deze variabele footer op in de variabele remove en wordt het gespliced.
    // Deze code heb ik kunnen verkrijgen met dank aan slack in de chat van @deshlieee.
    var footer = cleanedData.indexOf('� Statistics Netherlands, Den Haag/Heerlen 12-10-2017');
    var remove = cleanedData.splice(footer);


    // Hier wordt alle data gepakt, waarna er een passende schaal wordt gemaakt 'domain/range'
    x.domain(cleanedData.map(function (d) {
        return d.jaar;
    }));

    y.domain([0, d3.max(cleanedData, function (d) {
        return d.verlaters;
    })]);

    // Hier geef ik aan dat als er op de input (in de html) wordt gedrukt dat de function onchange geactiveerd en uitgevoerd moet worden.
    // Deze code heb ik grotendeels van de examples op github die zijn gemaakt door Titus Wormer in dit geval de sort function
    //https://cmda-fe3.github.io/course-17-18/class-4/sort/

    d3.select('input').on('change', onchange);

    // Hier wordt de functie gemaakt die de bars van hoog naar laag zal sorteren als er op de checkbox wordt geklikt.
    function onchange() {
        var sort = this.checked ? sortOnVerlaters : sortOnJaar;
        var x0 = x.domain(cleanedData.sort(sort).map(jaar)).copy();
        var transition = svg.transition();

        // alle bars worden hier geselecteerd in de svg en worden daarna gesorteerd

        svg.selectAll('.bar').sort(sortBar);

        // Deze stuk code laat de grafieken bewegen als er op de input geklikt wordt. hier zit een duration van 1,5 sec. in, wordt blauwgekleur en heeft een easeback transition.

        transition.selectAll('.bar')
            .transition().style('fill', 'blue')
            .duration(1500)
            .ease(d3.easeBack)
            .attr('x', barX0);

        // Deze stuk code laat de labels bewegen (dus de jaartallen) op de x as hier zit een duration van 1,5 sec op met een easeback transition.

        transition.select('.axis--x')
            .transition()
            .duration(1500)
            .ease(d3.easeBack)
            .call(d3.axisBottom(x));

        // Als het goed is wordt er hier berekend hoe de grafieken komen te staan als ze op hoog naar laag worden gesorteerd en weer andersom als de checkbox uitstaat.

        function sortBar(a, b) {
            return x0(jaar(a)) - x0(jaar(b));
        }

        function barX0(d) {
            return x0(jaar(d));
        }

        function delay(d, i) {
            return i * 50;
        }
    }

    // Hier krijgt de groep van de x as verschillende attributes en wordt bijv. de hoogte bepaald

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Hier geef ik de rotatie aan van de tekst op de x as en hoever zij van de x/y as moeten staan

    g.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-2em")
        .attr("dy", "-0.4em")
        .attr("transform", "rotate(-90)");


    // Hier krijgt de groep van de y as verschillende attributes en wordt bijv. de hoogte bepaald, fill, plaatsing van tekst.

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10))
        .append("text")
        .attr("y", 2)
        .attr("x", 6)
        .attr("dy", "2em")
        .attr("dx", "-2em")
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .text("% Schoolverlaters");

    // hier wordt een groep gemaakt om de grafiek te stijlen. Zo wordt de stijl uit de css aangeroepen en wordt er aangegeven dat deze gestijlt moet worden aan de hand van de kolom verlaters en jaar in de CSV.

    g.selectAll(".bar")
        .data(cleanedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return x(d.jaar);
        })
        .attr("y", function (d) {
            return y(d.verlaters);
        })
        .attr("width", x.bandwidth())
        .attr("height", function (d) {
            return height - y(d.verlaters);
        });
};


// hier wordt de data van de CSV bestand onder het kopje verlaters geordend
function sortOnVerlaters(a, b) {
    return verlaters(b) - verlaters(a);
}

// hier wordt de data van de CSV bestand onder het kopje jaar geordend
function sortOnJaar(a, b) {
    return d3.ascending(jaar(a), jaar(b));
}

// Hier wordt de data van de CSV bestand onder het kopje verlaters opgehaald en gereturnd
function verlaters(d) {
    return d.verlaters;
}

// Hier wordt de data van de CSV bestand onder het kopje jaar opgehaald en gereturnd
function jaar(d) {
    return d.jaar;
}
