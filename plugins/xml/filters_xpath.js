/*\
title: $:/plugins/flibbles/xml/filters/xpath.js
type: application/javascript
module-type: filteroperator

Filter operator for applying xpath queries to incoming tiddler titles.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var xmlDom = require("../xmldom");
var xpath = require("../xpath");
var xselect = require("../xselect");

function filterInput(source,operator,options,queryMethod,errorMethod) {
	var query = operator.operand,
		results = [],
		ifQuery = operator.suffix === "if",
		negate = operator.prefix === "!";

	source(function(tiddler,title) {
		var doc = xmlDom.getTiddlerDocument(options.wiki, title);
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
							var value = node.nodeValue || node.textContent;
							if (!value && node.documentElement) {
								value = node.documentElement.textContent;
							}
							results.push(value);
							node = iterator.iterateNext();
						}
					}
				} catch (e) {
					if (e.message.indexOf("Cannot read property") >= 0) {
						console.log(e);
						console.log(doc);
						console.log(doc.documentElement);
						console.log(title);
					}
					results.push(errorMethod(e, query));
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
	function query(selector, contextNode) {
		var nodeList = xselect.querySelectorAll(selector, contextNode);
		return {
			nodeList: nodeList,
			index: 0,
			iterateNext: function() { return this.nodeList[this.index++]; }};
	};
	return filterInput(source, operator, options, query, xselect.getError);
};

})();
