/*\
title: $:/plugins/flibbles/xml/xmldom.js
type: application/javascript
module-type: library

Makes available the XMLDom, either through a browser's native support, or
the tiddlywiki plugin.
\*/

if ($tw.browser) {
	exports.DOMParser = DOMParser;
} else {
	var parser = require("$:/plugins/tiddlywiki/xmldom/dom-parser");
	exports.DOMParser = parser.DOMParser;
	var tmp = (new parser.DOMParser()).parseFromString("<elem/>");
	var proto = Object.getPrototypeOf(tmp.documentElement);
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
}
