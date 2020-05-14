/*\
title: $:/plugins/flibbles/xml/xmldom.js
type: application/javascript
module-type: library

Makes available the XMLDom, either through a browser's native support, or
the tiddlywiki plugin.
\*/

exports.getDocumentForText = function(type, text) {
	var supportedType = $tw.config.xml.supportedDocumentTypes[type];
	if (!supportedType) {
		return undefined;
	}
	return getParseFromString()(text, supportedType);
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
var _parseFromString = undefined;

function getParseFromString() {
	if (_parseFromString === undefined) {
		if ($tw.browser) {
			_DOMParser = DOMParser;
			_parseFromString = parseFromStringInBrowser;
		} else {
			var DOM;
			try {
				DOM = require('xmldom');
			} catch (e) {
				DOM = require("$:/plugins/tiddlywiki/xmldom/dom-parser");
			}
			_DOMParser = DOM.DOMParser;
			_parseFromString = parseFromStringInNodeJS;
			var doc = _parseFromString("<elem/>");
			var docProto = Object.getPrototypeOf(doc);
			var nodeProto = Object.getPrototypeOf(doc.documentElement);
			Object.defineProperty(nodeProto, "innerHTML", { get: innerHTML });
			Object.defineProperty(nodeProto, "outerHTML", { get: outerHTML });
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
	return _parseFromString;
};

function parseFromStringInBrowser(text, type) {
	var parser = new _DOMParser();
	var doc = parser.parseFromString(text, type);
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
	return doc;
};

function parseFromStringInNodeJS(text, type) {
	var errorDetected = false;
	function flag() { errorDetected = true; };
	var parser = new _DOMParser({
		errorHandler: {
			error: flag,
			warning: flag,
			fatalError: flag
		}
	});
	var doc = parser.parseFromString(text, type);
	if (errorDetected) {
		doc.error = true;
	}
	if (!doc.documentElement && text.indexOf("<html>") < 0) {
		// This is one of those weird halfbaked documents that Node.js
		// sometimes returns if it's text only. Just wrap it ourselves.
		doc = parseFromStringInNodeJS(type, "<html><body>"+text+"</html></body>");
	}
	return doc;
};

/////// Substitute methods ///////

function innerHTML() {
	var child = this.firstChild;
		buffer = [];
	while (child) {
		buffer.push(child.toString());
		child = child.nextSibling;
	}
	return buffer.join('');
};

function outerHTML() {
	return this.toString();
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
