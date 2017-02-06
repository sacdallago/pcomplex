/*jshint esversion: 6 */

let d3 = require('d3');

class PComplex {

    /**
     * Parse a TSV file representing the data
     * @param tsv
     * @returns {Array}
     */
    static parseTSV(tsv){

        /**
         * Example TSV:
         *
         * ID	Order	Protein A	Protein B
         * E1	1	NEK9	CDK1
         * E2	2	CDK1	INCENP
         */

            // parsedTSV contains simply the JSON representation of the TSV data
        let parsedTSV = [];
        // Proteins contains a unique list of the proteins in the data
        let proteins = new Set();

        //Do the parsing
        let lines=tsv.split("\n");
        let headers=lines[0].split("\t");
        for(let i=1;i<lines.length;i++){

            let obj = {};
            let currentLine=lines[i].split("\t");

            for(let j=0;j<headers.length;j++){
                if(headers[j] !== '' && headers[j] !== undefined){

                    // Remove spaces, new line hidden chars (/r) and set to lowercase
                    let formattedHeader = headers[j].trim().replace(" ","").toLowerCase();
                    obj[formattedHeader] = currentLine[j].trim();
                }
            }

            // Add to the general parsed variable
            parsedTSV.push(obj);

            // Try to add to the proteins set
            if(obj["proteina"] === undefined || obj["proteinb"] === undefined ){
                //throw "Columns of the TSV don't match prototype"
            } else {
                proteins.add(obj["proteina"]);
                proteins.add(obj["proteinb"]);
            }
        }


        return [parsedTSV, proteins];
    }

    /**
     * Find protein tracks, aka: proteins that interact with partners and when
     *
     * @param proteins - array (or iterable element) of identifiers
     * @param data - data returned in the form [{order: "123", proteina: "id1", proteinb: "id2"}]
     * @returns {Array} - Returns an array like [{protein: "abc", partners: [{partner: "cda", time: "23"}], length: 1}]
     */
    static getTracks(data){
        // Get
        let proteins = new Set();

        data.forEach(function(element){
            proteins.add(element.proteina);
            proteins.add(element.proteinb);
        });

        let tracks = [];

        proteins.forEach(function(proteinIdentifier) {
            let partners = data
                .filter(function(datum) {
                    return datum.proteina === proteinIdentifier || datum.proteinb === proteinIdentifier;
                })
                .map(function(datum) {
                    let partner;
                    if(datum.proteina == proteinIdentifier){
                        partner = datum.proteinb;
                    } else {
                        partner =  datum.proteina;
                    }
                    return {
                        partner: partner,
                        time: datum.order
                    }
                });

            tracks.push({
                protein: proteinIdentifier,
                partners: partners,
                length: partners.length
            });
        });

        return tracks;
    }

    static renderGraph(tracks, element){
        let proteins = tracks.map(function(element){
            return element.protein;
        });

        let minTemp = tracks[0].partners[0].time;
        let maxTemp = tracks[0].partners[0].time;

        tracks.forEach(function(track) {
            track.partners.forEach(function(partner) {
                if(minTemp > partner.time){
                    minTemp = partner.time;
                }
                if(maxTemp < partner.time){
                    maxTemp = partner.time;
                }
            })
        });

        let groupScale = d3
            .scalePoint()
            .domain(proteins)
            .range([0, proteins.length-1]);


        // Set the dimensions of the canvas / graph
        let	margin = {top: 20, right: 50, bottom: 50, left: 150},
            width = 800 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // Set the ranges
        let	xScale = d3
            .scaleLinear()
            .range([50, width])
            .domain([--minTemp, ++maxTemp]);

        let	yScale = d3
            .scaleLinear()
            .range([height, 50])
            .domain([-1,d3.max(proteins,function(d){return groupScale(d);})]);

        let xAxis = d3
            .axisBottom(xScale);

        let yAxis = d3
            .axisLeft(yScale)
            .tickFormat(function (d) {
                return proteins[d];
            })
            .ticks(proteins.length);

        //Create SVG element
        let svg = d3.select(element)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //CREATE X-AXIS
        svg.append("g")
            .attr("class", "x axis")
            .style("font-size", "1em")
            .style("stroke-width", ".1em")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        //Create Y axis
        svg.append("g")
            .attr("transform", "translate(70,0)")
            .style("stroke-width", "0")
            .style("font-size", "1em")
            .attr("class", "y axis")
            .call(yAxis);

        // Data generation functions
        function generateCirclesData(d){
            /*
             {protein: "NEK9", partners: [{partner: "CDK1
             ", time: "1"}], length: 1}
             */

            let arr = new Array(d.partners.length);
            for(let i=0;i<d.partners.length;i++){
                arr[i] = {
                    y: groupScale(d.protein),
                    x: d.partners[i].time,
                    partner: d.partners[i].partner,
                    origin: d.protein
                };
            }

            return arr;
        }

        let lineGenerator = d3.line()
            .x(function (dataItem) {
                return xScale(dataItem.x);
            })
            .y(function (dataItem) {
                return yScale(groupScale(dataItem.y));
            })
            .curve(d3.curveBasis);

        // Add the curves
        let curvesCollector = svg
            .append('g')
            .attr("class", "curvesCollector");

        tracks.forEach(function(protein) {
            let data = protein.partners.map(function(interaction) {
                return {
                    x: interaction.time,
                    y: protein.protein
                }
            });
            curvesCollector
                .append("path")
                .attr("class", protein.protein)
                .attr("stroke", "#d0d0d0")
                .attr("stroke-width", '.2em')
                .attr("d", lineGenerator(data));
        });

        // Add the circles
        let circlesCollector = svg
            .append('g')
            .attr("class", "circlesCollector");

        circlesCollector
            .selectAll("g")
            .data(tracks)
            .enter()
            .append('g')
            .attr("class", function(d){return d.protein})
            .selectAll("g.circle")
            .data(function(d){
                return generateCirclesData(d);
            })
            .enter()
            .append("circle")
            .style("fill", "#b4b4b4")
            .attr("r", ".4em")
            .attr("class", function(d){return d.partner})
            .attr("cx", function(d,i) {return xScale(d.x);})
            .attr("cy", function(d,i) {return yScale(d.y);});


        // Create tooltip element
        let tooltip = d3.select(element)
            .append('div')
            .attr('class', 'tooltip');

        tooltip.append('div')
            .attr('class', 'origin');
        tooltip.append('div')
            .attr('class', 'partner');
        tooltip.append('div')
            .attr('class', 'time');

        svg.selectAll("circle")
            .on('mouseover', function(d,i) {

                tooltip.select('.origin').html("<b>Origin: " + d.origin+ "</b>");
                tooltip.select('.partner').html("<b>Partner: " + d.partner+ "</b>");
                tooltip.select('.time').html("<b>Time: " + d.x+ "</b>");

                tooltip.classed("show", true);

                circlesCollector.selectAll('circle.' + d.origin).style("fill", "#1ab450");
                circlesCollector
                    .selectAll("." + d.origin)
                    .selectAll("circle").style("fill", "#1ab450");
                curvesCollector.selectAll('path.' + d.origin).attr("stroke", "#1ab450");
            })
            .on('mousemove', function(d) {
                tooltip.style('top', (d3.event.layerY + 10) + 'px')
                    .style('left', (d3.event.layerX - 25) + 'px');
            })
            .on('mouseout', function() {
                tooltip.classed("show", false);
                circlesCollector.selectAll('circle').style("fill", "#b4b4b4");
                curvesCollector.selectAll('path').attr("stroke", "#d0d0d0");
            });
    }
}

module.exports = PComplex;