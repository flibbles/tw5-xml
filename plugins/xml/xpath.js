/*\
title: $:/plugins/flibbles/xml/xpath.js
type: application/javascript
module-type: library

Makes available XPath, either through a browser's native support, or
the node.JS library
\*/

exports.evaluate = function(xpathExpression, contextNode, namespaceResolver) {
	var xpath = getXPath();
	return xpath.evaluate(xpathExpression, contextNode, namespaceResolver, xpath.XPathResult.ANY_TYPE, null);
};

/**This attempts to build a consistent error message from an xpath
 * "evaluate" exception. Different implementations act differently. This
 * Tries to reconcile them all into an error message in a tiddler language
 * string.
 */
exports.getError = function(exception, query) {
	var code, msg;
	switch (exception.name) {
		case "NamespaceError":
		case "SyntaxError":
			code = exception.name;
			break;
		case "Error":
			if (exception.message.indexOf("Cannot resolve QName") == 0) {
				code = "NamespaceError";
			} else if (exception.message.indexOf("Invalid expression") == 0) {
				code = "SyntaxError";
			}
			break;
	}
	if (code) {
		msg = $tw.language.getString("flibbles/xml/Error/XPath/" + code,
			{variables: {xpath: query}});
	} else {
		// This message will be wildly inconsistent across implementations,
		// but it's better that we show this than something generic.
		msg = exception.message;
		console.warn(exception.code);
		console.warn(exception.name);
		console.warn(exception.message);
		console.warn(exception);
	}
	return msg;
};

exports.createResolver = function(contextNode, widget) {
	var resolver, docResolver = getXPath().createNSResolver(contextNode);
	if (widget) {
		resolver = function(nsPrefix) {
			var variable = widget.variables["xmlns:" + nsPrefix];
			return variable ? variable.value : docResolver.lookupNamespaceURI(nsPrefix);
		};
		// Some implementations expect an object with this method, not a
		// function. We must abide.
		resolver.lookupNamespaceURI = resolver;
	} else {
		resolver = docResolver;
	}
	return resolver;
};

var _xpath = undefined;

function getXPath() {
	if (_xpath === undefined) {
		_xpath = Object.create(null);
		if ($tw.browser) {
			_xpath.XPathResult = XPathResult;
			_xpath.evaluate = function(xpathExpression, contextNode, namespaceResolver, resultType, result) {
				var doc = contextNode.ownerDocument || contextNode;
				return doc.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, result);
			}
			_xpath.createNSResolver = function(node) {
				var doc = node.ownerDocument || node;
				return doc.createNSResolver(node);
			}
		} else {
			try {
				var xpath = require('xpath');
				_xpath.XPathResult = xpath.XPathResult;
				_xpath.evaluate = xpath.evaluate;
				_xpath.createNSResolver = xpath.createNSResolver;
			} catch (e) {
				function unresolved() {
					throw "xpath is required on Node.JS for this operation. Install xpath with 'npm install xpath'";
				};
				_xpath.evaluate = unresolved;
				_xpath.createNSResolver = unresolved;
				_xpath.XPathResult = Object.create(null);
			}
		}
	}
	return _xpath;
}

