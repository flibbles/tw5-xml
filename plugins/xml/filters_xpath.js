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

exports.xpath = function(source,operator,options) {
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
				var resolver = xpath.createResolver(doc, options.widget);
				try {
					var iterator = xpath.evaluate(query, doc, resolver);
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
					results.push(xpath.getError(e, query));
				}
			}
		}
	});
	return results;
};

})();
