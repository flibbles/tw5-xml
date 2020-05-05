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
		var parser = require("$:/plugins/tiddlywiki/xmldom/dom-parser");
		exports.DOMParser = parser.DOMParser;
	} catch (e) {
		var DOM = require('xmldom');
		exports.DOMParser = DOM.DOMParser;
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
		Object.defineProperty(proto, "outerHTML", {
			get: function() {
				return this.toString();
			}
		});
	var docPrototype = Object.getPrototypeOf(doc);
	docPrototype.evaluate = function(xpathExpression, contextNode, namespaceResolver, resultType, result) {
		return xpath.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, result);
	};
	docPrototype.createNSResolver = function(node) {
		return xpath.createNSResolver(node);
	};
}

exports.getTiddlerDocument = function(wiki, title) {
	var tiddler = wiki.getTiddler(title),
		doc = undefined;
	if (tiddler) {
		var text = tiddler.fields.text,
			errorDetected = false;
		function flag() { errorDetected = true; };
		var parser = new exports.DOMParser({
			errorHandler: {
				error: flag,
				warning: flag,
				fatalError: flag
			}
		});
		doc = parser.parseFromString(tiddler.fields.text, "text/xml");
		if (errorDetected) {
			doc.error = true;
		} else {
			var errors = doc.getElementsByTagName("parsererror");
			if (errors.length > 0) {
				// If the xml doc already contained parsererror
				// elements, then we have no reliable way to
				// detect parse errors on the browser, so just
				// greenlight and hope for the best.
				if (text.indexOf("<parsererror") < 0) {
					doc.error = true;
				}
			}
		}
	}
	return doc;
};

