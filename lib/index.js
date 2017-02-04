/*jshint esversion: 6 */

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
                    obj[formattedHeader] = currentLine[j];
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

    static getTracks(proteins, data){
        // Now let's find protein tracks, aka: proteins that interact with partners and when.
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
}

module.exports = PComplex;