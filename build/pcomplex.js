(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["PComplex"] = factory();
	else
		root["PComplex"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

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

/***/ }
/******/ ])
});
;