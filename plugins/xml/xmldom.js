/*\
title: $:/plugins/flibbles/xml/xmldom.js
type: application/javascript
module-type: library

Makes available the XMLDom, either through a browser's native support, or
the tiddlywiki plugin.
\*/

exports.getDocumentForText = function(type, text) {
	var errorDetected = false;
	function flag() { errorDetected = true; };
	var parser = new (getDOMParser())({
		errorHandler: {
			error: flag,
			warning: flag,
			fatalError: flag
		}
	});
	if (!$tw.config.xml.supportedDocumentTypes[type]) {
		return {error: true, unsupported: true};
	}
	var doc = parser.parseFromString(text, $tw.config.xml.supportedDocumentTypes[type] || "text/html");
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
		if (!doc.documentElement && text.indexOf("<html>") < 0) {
			// This is one of those weird halfbaked documents that Node.js
			// sometimes returns if it's text only. Just wrap it ourselves.
			doc = this.getDocumentForText(type, "<html><body>"+text+"</html></body>");
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

exports.getStringValue = function(node) {
	var value = node.nodeValue || node.textContent;
	if (!value && node.documentElement) {
		value = node.documentElement.textContent;
	}
	return value;
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
			var docProto = Object.getPrototypeOf(doc);
			var nodeProto = Object.getPrototypeOf(doc.documentElement);
			Object.defineProperty(nodeProto, "innerHTML", {
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
			Object.defineProperty(nodeProto, "outerHTML", {
				get: function() {
					return this.toString();
				}
			});
			if (!doc.documentElement.compareDocumentPosition) {
				nodeProto.compareDocumentPosition = compareDocumentPosition;
			}
			if (!doc.compareDocumentPosition) {
				docProto.compareDocumentPosition = function(node) {
					return (node.ownerDocument == this) ? 20 : 33;
				};
			}
		}
	}
	return _DOMParser;
};

// This is a cheap standin compare method used for Node.JS implementations
// Needed for css, and not xpath. Hopefully I never need this for attributes.
function compareDocumentPosition(target) {
	var tree = [];
	var ptr = this;
	// Build tree of this's ancestors.
	while (ptr) {
		tree.push(ptr);
		ptr = ptr.parentNode || ptr.ownerElement;
	}
	// Find common ancestory
	ptr = target;
	var index = -1, prev = null;
	while (ptr) {
		if ((index = tree.indexOf(ptr)) >= 0) {
			break;
		}
		prev = ptr;
		ptr = ptr.parentNode || ptr.ownerElement;
	}
	if (index < 0) {
		// Disconnected
		return 33;
	}
	if (index == 0) {
		// target is descendant of this
		return 20;
	}
	if (prev == null) {
		// target is ancestor of this
		return 10
	}
	while (tree.indexOf(prev) < 0) {
		prev = prev.nextSibling;
		if (!prev) {
			// End of the line. B's ancestor in ptr must come after this's
			return 4;
		}
	}
	// Match. B's ancestor under ptr comes before this
	return 2;
};
