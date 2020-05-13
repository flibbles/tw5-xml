/*\
title: $:/plugins/flibbles/xml/filters.js
type: application/javascript
module-type: filteroperator

Filter operator for applying xpath queries to incoming tiddler titles.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var xmldom = require("./xmldom");
var xpath = require("./xpath");
var xselect = require("./xselect");

function filterInput(source,operator,options,queryMethod,errorMethod) {
	var query = operator.operand,
		results = [],
		ifQuery = operator.suffix === "if",
		negate = operator.prefix === "!";

	source(function(tiddler,title) {
		var doc = options.wiki.getTiddlerDocument(title);
		if (doc) {
			if (doc.error) {
				if (ifQuery) {
					if (negate) {
						results.push(title);
					}
				} else {
					results.push(doc.error);
				}
			} else {
				try {
					var iterator = queryMethod(query, doc);
					var node = iterator.iterateNext();
					if (ifQuery) {
						if (!node == negate) {
							results.push(title);
						}
					} else {
						while (node) {
							results.push(xmldom.getStringValue(node));
							node = iterator.iterateNext();
						}
					}
				} catch (e) {
					var msg = errorMethod(e, query, title);
					if (results.indexOf(msg) < 0) {
						results.push(msg);
					}
				}
			}
		}
	});
	return results;
};

exports.xpath = function(source,operator,options) {
	return filterInput(source,operator,options, function(xpathQuery, contextNode) {
		var resolver = xpath.createResolver(contextNode, options.widget);
		var iterator = xpath.evaluate(xpathQuery, contextNode, resolver);
		return iterator;
	}, xpath.getError);
};

exports.xselect = function(source,operator,options) {
	return filterInput(source, operator, options, xselect.querySelectorAll, xselect.getError);
};

})();
