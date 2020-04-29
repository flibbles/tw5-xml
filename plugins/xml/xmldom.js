/*\
title: $:/plugins/flibbles/xml/xmldom.js
type: application/javascript
module-type: library

Makes available the XMLDom, either through a browser's native support, or
the tiddlywiki plugin.
\*/

if ($tw.browser) {
	exports.DOMParser = DOMParser;
	exports.XPathResult = XPathResult;
} else {
	var parser, xpath;
	try {
		throw "";
		var DOM = require('xmldom');
		exports.DOMParser = DOM.DOMParser;
	} catch (e) {
		var parser = require("$:/plugins/tiddlywiki/xmldom/dom-parser");
		exports.DOMParser = parser.DOMParser;
	}
	try {
		xpath = require('xpath');
		exports.XPathResult = xpath.XPathResult;
	} catch (e) {
		xpath = {
			evaluate: function() {throw "xpath is required on Node.JS for this operation. Install xpath with 'npm install xpath'"; }
		};
		exports.XPathResult = Object.create(null);
	}
	var doc = (new exports.DOMParser()).parseFromString("<elem/>");
		var proto = Object.getPrototypeOf(doc.documentElement);
		Object.defineProperty(proto, "innerHTML", {
			get: function() {
				var child = this.firstChild;
					buffer = [];
				while (child) {
					buffer.push(child.toString());
					child = child.nextSibling;
				}
				return buffer.join('');
			}
		});
	Object.getPrototypeOf(doc).evaluate = function(xpathExpression, contextNode, namespaceResolver, resultType, result) {
		return xpath.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, result);
	};
}
