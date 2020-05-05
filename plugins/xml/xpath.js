/*\
title: $:/plugins/flibbles/xml/xpath.js
type: application/javascript
module-type: library

Makes available XPath, either through a browser's native support, or
the node.JS library
\*/

if ($tw.browser) {
	exports.XPathResult = XPathResult;
	exports.evaluate = function(xpathExpression, contextNode, namespaceResolver, resultType, result) {
		var doc = contextNode.ownerDocument || contextNode;
		return doc.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, result);
	}
	exports.createNSResolver = function(node) {
		var doc = node.ownerDocument || node;
		return doc.createNSResolver(node);
	}
} else {
	try {
		module.exports = require('xpath');
	} catch (e) {
		function unresolved() {
			throw "xpath is required on Node.JS for this operation. Install xpath with 'npm install xpath'";
		};
		module.exports = {
			evaluate: unresolved,
			createNSResolver: unresolved,
			XPathResult: Object.create(null)
		};
	}
}
