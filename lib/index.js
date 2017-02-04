/*jshint esversion: 6 */

// Utilities:

/*  Convert TSV to JSON
 **  The TSV must have headers!
 */
function tsvJSON(tsv){

    var lines=tsv.split("\n");
    var result = [];
    var headers=lines[0].split("\t");

    for(var i=1;i<lines.length;i++){

        var obj = {};
        var currentLine=lines[i].split("\t");

        for(var j=0;j<headers.length;j++){
            if(headers[j] !== ''){
                obj[headers[j]] = currentLine[j];
            }
        }

        result.push(obj);
    }

    return result;
}

class PComplex {

}

module.exports = PComplex;