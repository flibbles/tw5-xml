/*\
title: $:/plugins/flibbles/xml/xmlparser.js
type: application/javascript
module-type: parser

The XML parser displays itself as xml.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var XmlParser = function(type,text,options) {
	this.tree = [{
		type: "codeblock",
		attributes: {
			code: {type: "string", value: text},
			language: {type: "string", value: "xml"}
		}
	}];
};

exports["text/xml"] = XmlParser;

})();
