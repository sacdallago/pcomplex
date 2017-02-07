/*jshint esversion: 6 */

let d3 = require('d3');

class PComplex {

    /**
     * Parse a TSV file representing the data
     * @param tsv
     * @returns {Array}
     */
    static parseTSV(tsv){

        /***
         * Example TSV:
         *
         * ID	Order	Protein A	Protein B
         * E1	1	NEK9	CDK1
         * E2	2	CDK1	INCENP
         *
         */

        // parsedTSV will contain the JSON representation of the TSV data
        let parsedTSV = [];
        // Proteins contains a unique list of the proteins in the data
        let proteins = new Set();

        // Here we perform the parsing: divide data by rows (first row being headers) and then aggregate data in JSON object
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

            // Add the new object (one line of the TSV) to the JSON array
            parsedTSV.push(obj);

            // Try to add to the proteins Set and perform an integrity check
            if(obj["proteina"] === undefined || obj["proteinb"] === undefined || obj["order"] === undefined ){
                // Make sure that the TSV line has protienb, proteina and time ("order" in the dataset)
                throw "Columns of the TSV don't match prototype (Protein A, Protein B, Order fields MUST be present)"
            } else {
                proteins.add(obj["proteina"]);
                proteins.add(obj["proteinb"]);
            }
        }

        return [parsedTSV, proteins];
    }

    /**
     * Find protein tracks, aka: proteins that interact with partners and when.
     *
     * @param proteins - array (or iterable element) of identifiers
     * @param data - data returned in the form [{order: "123", proteina: "id1", proteinb: "id2"}]
     * @returns {Array} - Returns an array like [{protein: "abc", partners: [{partner: "cda", time: "23"}], length: 1}]
     */
    static getTracksFromData(data){

        // For reusability purposes: we cannot assume users to pass a unique set of proteins, so we make up our own from the data passed
        let proteins = new Set();

        data.forEach(function(element){
            // Add both proteina + proteinb to the Set. Set logic will avoid duplicates
            proteins.add(element.proteina);
            proteins.add(element.proteinb);
        });

        // This will be our returned array
        let tracks = [];

        /** Aggregate tracks in the following way:
         *  1. For every protein A in the Set, create a track
         *  2. For every data item in the data array, check if protein A appears either in 'proteina' or 'proteinb' and interracts with protein B at time T
         *  3. Add the protein B that is interacting with protein A at time T to the "partners" array of the track of A
         *
         *  TODO - Can be implemented more efficiently by parallelizing the discovery of interactions, aka: track A and track B both can be updated with an interaction
         *  as soon as either of them is discovered either in "proteina" or "proteinb"
         */
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

    /**
     * Initialize the PComplex element and object
     *
     * @param tracks - An array of the form [{protein: "abc", partners: [{partner: "cda", time: "23"}], length: 1}]
     * @param options - An object containing rendering options. Options described in README
     */
    constructor(tracks, options){

        // Initialize variables
        // For reusability purposes: we cannot assume users to pass a unique set of proteins, so we make up our own from the data passed
        this.proteins = tracks.map(function(element){
            return element.protein;
        });
        this.tracks = tracks;
        this.options = options;
        this.element = this.options.element || "#pcomplex";

        // Use self instead of this to avoid variable shadowing inside of forEach, map, filter,... functions.
        let self = this;

        // Find out minimum and max time in the dataset
        let minTime = tracks[0].partners[0].time;
        let maxTime = tracks[0].partners[0].time;

        self.tracks.forEach(function(track) {
            track.partners.forEach(function(partner) {
                if(minTime > partner.time){
                    minTime = partner.time;
                }
                if(maxTime < partner.time){
                    maxTime = partner.time;
                }
            })
        });

        /** Create a d3 scale based on the ordinal protein names, but mapped to a numerical range from 0 to proteins.length-1
         *  Will be used later to map Y coordinates (the protein names) to the correct numerical (range) value
         */
        let groupScale = d3
            .scalePoint()
            .domain(self.proteins)
            .range([0, self.proteins.length-1]);

        // Get the boundingBox (to later calculate width and height) of the selected element (NEEDS TO BE AN ID and not a CLASS !!!!!)
        let e = document.getElementById(self.options.element.substr(1, self.element.length));
        let positionInfo = e.getBoundingClientRect();

        // Set the dimensions of the canvas / graph
        let	margin = {
            top: 20,
            right: 50,
            bottom: 50,
            left: 150
        };
        let width = positionInfo.width - margin.left - margin.right;
        let height = positionInfo.height - margin.top - margin.bottom;

        /** Set the ranges. Add one position before and after the min and max times to allow some visual overflow
         * (also: the Y axis will overlap slightly with the X axis because it looks better).
         */
        let	xScale = d3
            .scaleLinear()
            .range([50, width])
            .domain([--minTime, ++maxTime]);

        // d3.max is used to get the maximum of the groupScale
        let	yScale = d3
            .scaleLinear()
            .range([height, 50])
            .domain([-1,d3.max(self.proteins,function(d){return groupScale(d);})]);

        let xAxis = d3
            .axisBottom(xScale);

        let yAxis = d3
            .axisLeft(yScale)
            .tickFormat(function (d) {
                return self.proteins[d];
            })
            .ticks(self.proteins.length);

        //Create SVG element
        let svg = d3.select(self.element)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Create X axis and label (TIME)
        svg.append("g")
            .attr("class", "x axis")
            .style("font-size", "1em")
            .style("stroke-width", ".1em")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("text")
            .attr("transform", "translate(" + ((width / 2) + 30)+ "," + (height + 50) + ")")
            .style("text-anchor", "middle")
            .text("TIME");

        // Create Y axis
        svg.append("g")
            .attr("transform", "translate(80,0)")
            .style("stroke-width", "0")
            .style("font-size", "1em")
            .attr("class", "y axis")
            .call(yAxis);

        // Data generation functions
        let generateCirclesData = function(d){
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
        };

        let lineGenerator = d3.line()
            .x(function (dataItem) {
                return xScale(dataItem.x);
            })
            .y(function (dataItem) {
                return yScale(groupScale(dataItem.y));
            })
            .curve(d3.curveBasis);

        // Add the curves to the graph / svg
        let curvesCollector = svg
            .append('g')
            .attr("class", "curvesCollector");

        /**
         * 1. For each Track A
         * 2. Create an array of [x,y] positions, where x is the time T of the interaction and y is the protein name
         *      (the line needs to be horizontal and at the height (Y position) of the given protein)
         */
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

        // Add the circles / points
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
            .attr("cx", function(d) {return xScale(d.x);})
            .attr("cy", function(d) {return yScale(d.y);});

        // Create tooltip element:
        let tooltip = d3.select(self.element)
            .append('div')
            .attr('class', 'tooltip');

        tooltip
            .append('div')
            .attr('class', 'origin');
        tooltip
            .append('div')
            .attr('class', 'partner');
        tooltip
            .append('div')
            .attr('class', 'time');

        /** Add events:
         *  Hovering over one of the points will:
         *  1. Append a CSS class "show" + "origin" to the circles of that line
         *  2. Append a CSS class "show" + "partner" to the circles on other tracks that match the line
         *  4. Append a CSS class "show" to the path / line of that protein (the track)
         *  5. Append a CSS class "show" to the tooltip
         *  6. Update the tooltip element text with the currently selected protein
         *
         *  Hovering away will remove all extra classes from all items (but not erase the tooltip info)
         */
        svg.selectAll("circle")
            .on('mouseover', function(d,i) {
                // Update text on tooltip
                tooltip.select('.origin').html("<b>Track: " + d.origin+ "</b>");
                tooltip.select('.partner').html("<b>Partner: " + d.partner+ "</b>");
                tooltip.select('.time').html("<b>Time: " + d.x+ "</b>");

                // Add class to tooltip, circles and path
                tooltip.classed("show", true);
                circlesCollector.selectAll('circle.' + d.origin)
                    .classed("partner", true)
                    .classed("show", true);
                circlesCollector.selectAll("." + d.origin).selectAll("circle")
                    .classed("origin", true)
                    .classed("show", true);
                curvesCollector.selectAll('path.' + d.origin)
                    .classed("show", true);
            })
            // If the position of the tooltip element is set absolute, this event will allow the div to follow the mouse
            .on('mousemove', function(d) {
                tooltip
                    .style('top', (d3.event.layerY + 10) + 'px')
                    .style('left', (d3.event.layerX - 25) + 'px');
            })
            .on('mouseout', function() {
                tooltip.classed("show", false);
                circlesCollector.selectAll('circle')
                    .classed("show", false)
                    .classed("partner", false)
                    .classed("origin", false);
                curvesCollector.selectAll('path').classed("show", false);
            });
    }
}

module.exports = PComplex;