/*\
title: $:/plugins/flibbles/xml/css.js
type: application/javascript
module-type: library

Makes available querySelector, either through a browser's native support, or
the node.JS library
\*/

var _css = undefined;

exports.querySelector = function(cssSelector, contextNode) {
	return getCSS().querySelector(cssSelector, contextNode);
};

exports.querySelectorAll = function(cssSelector, contextNode) {
	return getCSS().querySelectorAll(cssSelector, contextNode);
};

function getCSS() {
	if (_css === undefined) {
		_css = Object.create(null);
		if ($tw.browser) {
			_css.querySelector = function(cssSelector, contextNode) {
				return contextNode.querySelector(cssSelector);
			};
			_css.querySelectorAll = function(cssSelector, contextNode) {
				return contextNode.querySelectorAll(cssSelector);
			};
		} else {
			try {
				var querySelector = require("query-selector");
				_css.querySelectorAll = querySelector.default;
			} catch (e) {
				function unsupported() {
					throw "query-selector is required on Node.JS for this operation. Install xpath with 'npm install query-selector'";
				};
				_css.querySelector = unsupported;
				_css.querySelectorAll = unsupported;
			}
		}
	}
	return _css;
};
