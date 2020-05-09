/*\
title: $:/plugins/flibbles/xml/xmldom.js
type: application/javascript
module-type: library

Makes available the XMLDom, either through a browser's native support, or
the tiddlywiki plugin.
\*/

exports.getTiddlerDocument = function(wiki, title) {
	return wiki.getCacheForTiddler(title, "XMLDOM", function() {
		var tiddler = wiki.getTiddler(title),
			doc = undefined;
		if (tiddler) {
			doc = exports.getTextDocument(tiddler.fields.text);
			if (doc.error) {
				// Let's elaborate
				doc.error = $tw.language.getString("flibbles/xml/Error/DOMParserError",
					{variables: {currentTiddler: title}});
			}
		}
		return doc;
	});
};

exports.getTextDocument = function(text) {
	var errorDetected = false;
	function flag() { errorDetected = true; };
	var parser = new (getDOMParser())({
		errorHandler: {
			error: flag,
			warning: flag,
			fatalError: flag
		}
	});
	var doc = parser.parseFromString(text, "text/xml");
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
	return doc;
};

/* Gets <?tiddlywiki attributes?> present at document's root.
 */
exports.getProcessingInstructions = function(doc) {
	var attributes = Object.create(null);
	var node = doc.firstChild;
	while (node) {
		if (node.target === "tiddlywiki") {
			var pos = 0;
			var attribute = $tw.utils.parseAttribute(node.data, pos);
			while (attribute) {
				attributes[attribute.name] = attribute;
				pos = attribute.end;
				attribute = $tw.utils.parseAttribute(node.data, pos);
			}
		}
		node = node.nextSibling;
	}
	return attributes;
};

var _DOMParser = undefined;

function getDOMParser() {
	if (_DOMParser === undefined) {
		if ($tw.browser) {
			_DOMParser = DOMParser;
		} else {
			var parser;
			try {
				var parser = require("$:/plugins/tiddlywiki/xmldom/dom-parser");
				_DOMParser = parser.DOMParser;
			} catch (e) {
				var DOM = require('xmldom');
				_DOMParser = DOM.DOMParser;
			}
			var doc = (new _DOMParser()).parseFromString("<elem/>");
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
		}
	}
	return _DOMParser;
};
