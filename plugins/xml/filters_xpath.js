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

exports.xpath = function(source,operator,options) {
	var query = operator.operand,
		results = [],
		xpath = require("../xpath"),
		xmlDom = require("../xmldom");

	source(function(tiddler,title) {
		var doc = xmlDom.getTiddlerDocument(options.wiki, title);
		if (doc) {
			if (doc.error) {
				results.push(doc.error);
			} else {
				var resolver, docResolver = xpath.createNSResolver(doc);
				if (options.widget) {
					resolver = function(nsPrefix) {
						var variable = options.widget.getVariable("xmlns:"+nsPrefix);
						return variable || docResolver.lookupNamespaceURI(nsPrefix);
					};
					resolver.lookupNamespaceURI = resolver;
				} else {
					resolver = docResolver;
				}
				try {
					var iterator = xpath.evaluate(query, doc, resolver, xpath.XPathResult.ANY_TYPE, null)
					var node = iterator.iterateNext();
					while (node) {
						var value = node.nodeValue || node.textContent;
						if (!value && node.documentElement) {
							value = node.documentElement.textContent;
						}
						results.push(value);
						node = iterator.iterateNext();
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
