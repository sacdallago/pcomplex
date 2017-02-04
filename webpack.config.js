module.exports = {
    entry: __dirname + '/lib/index.js',
    output: {
         path: __dirname + '/build',
         filename: 'pcomplex.js',
         libraryTarget: 'umd',
         library: 'PComplex'
    }
 };