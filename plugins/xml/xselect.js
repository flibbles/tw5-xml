/*\
title: $:/plugins/flibbles/xml/xselect.js
type: application/javascript
module-type: library

Makes available querySelector, either through a browser's native support, or
the node.JS library
\*/

var _selector = undefined;

exports.querySelector = function(cssSelector, contextNode) {
	return getSelector().querySelector(cssSelector, contextNode);
};

exports.querySelectorAll = function(cssSelector, contextNode) {
	return getSelector().querySelectorAll(cssSelector, contextNode);
};

exports.getError = function(exception, cssSelector) {
	// All we do currently is say that the query is bad. No details.
	if (exception.name === "TypeError") {
		// This is an unexpected type of error. Not syntax. Just print it.
		return exception.message;
	}
	return $tw.language.getString("flibbles/xml/Error/XSelect/SyntaxError",
		{variables: {xselect: cssSelector}});
};

function getSelector() {
	if (_selector === undefined) {
		_selector = Object.create(null);
		if ($tw.browser) {
			_selector.querySelector = function(cssSelector, contextNode) {
				return contextNode.querySelector(cssSelector);
			};
			_selector.querySelectorAll = function(cssSelector, contextNode) {
				return contextNode.querySelectorAll(cssSelector);
			};
		} else {
			try {
				var querySelectorAll = require("query-selector").default;
				_selector.querySelectorAll = querySelectorAll;
				_selector.querySelector = function(cssSelector, contextNode) {
					var nodeList = querySelectorAll(cssSelector, contextNode);
					return nodeList[0];
				};
			} catch (e) {
				function unsupported() {
					throw "query-selector is required on Node.JS for this operation. Install xpath with 'npm install query-selector'";
				};
				_selector.querySelector = unsupported;
				_selector.querySelectorAll = unsupported;
			}
		}
	}
	return _selector;
};
