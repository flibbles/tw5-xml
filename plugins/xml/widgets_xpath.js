/*\
title: $:/plugins/flibbles/xml/widgets/xpath.js
type: application/javascript
module-type: widget

xslt widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var XPathWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

XPathWidget.prototype = new Widget();

exports.xpath = XPathWidget;

XPathWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

XPathWidget.prototype.execute = function() {
	var xmlDom = require("../xmldom");
	this.template = this.getAttribute("template");
	this.foreach = this.getAttribute("for-each");
	this.valueof = this.getAttribute("value-of");
	this.variableName = this.getAttribute("variable", "currentNode");
	this.xmlTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	for (var attribute in this.attributes) {
		if (attribute.substr(0, 6) === "xmlns:") {
			this.setVariable(attribute,this.attributes[attribute]);
		}
	}

	var members = [];
	var contextVariable = this.variables[this.variableContext()];
	var contextNode, doc;
	if (contextVariable) {
		contextNode = contextVariable.node;
		doc = contextNode.ownerDocument;
	} else {
		var xmlDom = require("../xmldom");
		doc = xmlDom.getTiddlerDocument(this.wiki, this.xmlTitle);
		contextNode = doc;
	}
	if (contextNode) {
		if (doc.error) {
			members.push(this.makeError({name: "DOMParserError"}, this.xmlTitle));
		} else {
			var docResolver = doc.createNSResolver(contextNode);
			var self = this;
			var resolver = function(nsPrefix) {
				var variable = self.variables["xmlns:" + nsPrefix];
				return variable ? variable.value : docResolver.lookupNamespaceURI(nsPrefix);
			}
			resolver.lookupNamespaceURI = resolver;
			if (this.foreach) {
				var node = undefined;
				try {
					var iterator = doc.evaluate(this.foreach, contextNode, resolver, xmlDom.XPathResult.ANY_TYPE, null);
					node = iterator.iterateNext();
				} catch(e) {
					members.push(this.makeError(e, this.foreach));
				}
				while (node) {
					var value;
					if (this.valueof) {
						try {
							var rtn = doc.evaluate(this.valueof, node, resolver, xmlDom.XPathResult.STRING_TYPE, null);
							value = rtn.stringValue;
						} catch(e) {
							members.push(this.makeError(e, this.valueof));
							break;
						}
					} else {
						value = node.nodeValue || node.innerHTML;
						if (!value && node.documentElement) {
							value = node.documentElement.outerHTML;
						}
					}
					members.push(this.makeItemTemplate(node, value, true));
					node = iterator.iterateNext();
				}
			} else {
				try {
					var value = doc.evaluate(this.valueof, contextNode, resolver, xmlDom.XPathResult.STRING_TYPE, null);
					if (value) {
						members.push(this.makeItemTemplate(null, value.stringValue, false));
					}
				} catch (e) {
					members.push(this.makeError(e, this.valueof));
				}
			}
		}
	}
	this.makeChildWidgets(members);
};

XPathWidget.prototype.makeError = function(e, xpath) {
	var code, msg;
	switch (e.name) {
		case "DOMParserError": // This is a custom one I made up
		case "NamespaceError":
		case "SyntaxError":
			code = e.name;
			break;
		case "Error":
			if (e.message.indexOf("Cannot resolve QName") == 0) {
				code = "NamespaceError";
			} else if (e.message.indexOf("Invalid expression") == 0) {
				code = "SyntaxError";
			}
			break;
	}
	if (code) {
		msg = $tw.language.getString("flibbles/xml/Error/XPath/" + code,
			{variables: {xpath: xpath}});
	} else {
		// This message will be wildly inconsistent across implementations,
		// but it's better that we show this than something generic.
		msg = e.message;
		console.warn(e.code);
		console.warn(e.name);
		console.warn(e.message);
		console.warn(e);
	}
	return {type: "element", tag: "span", attributes: {
			"class": {type: "string", value: "tc-error"}
		}, children: [
			{type: "text", text: msg}
		]};
};

/*
Compose the template for a list item
*/
XPathWidget.prototype.makeItemTemplate = function(node, value, repeats) {
	var templateTree;
	// Compose the transclusion of the template
	if(this.template) {
		templateTree = [{type: "transclude", attributes: {tiddler: {type: "string", value: this.template}}}];
	} else {
		if(this.parseTreeNode.children && this.parseTreeNode.children.length > 0) {
			templateTree = this.parseTreeNode.children;
		} else {
			// Default template is to print out each result
			templateTree = {type: "text", text: value};
			if (repeats) {
				templateTree = [{type: "element", tag: this.parseTreeNode.isBlock ? "div" : "span", children: [templateTree]}];
			} else {
				// Just returning the value. That's all.
				return templateTree;
			}
		}
	}

	// Return the list item
	return {type: "xslnode", contextName: this.variableContext(), node: node, variableName: this.variableName, variableValue: value, children: templateTree};
};

XPathWidget.prototype.variableContext = function() {
	return "xml-node-state-" + this.xmlTitle;
};

XPathWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["for-each"] || changedAttributes["value-of"] || changedAttributes.variable || changedAttributes.tiddler || changedAttributes.template || changedTiddlers[this.xmlTitle] || namespacesChanged(changedAttributes)) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

function namespacesChanged(changedAttributes) {
	for (var attribute in changedAttributes) {
		if (attribute.substr(0,6) == "xmlns:") {
			return true;
		}
	}
	return false;
};

/*
Widget exists for each loop of XPathWidget. Holds current state of
that iteration.
*/
var XslNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

XslNodeWidget.prototype = new Widget();

XslNodeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
XslNodeWidget.prototype.execute = function() {
	// Set the current list item title
	var node = this.parseTreeNode.node;
	this.setVariable(this.parseTreeNode.variableName,this.parseTreeNode.variableValue);
	if (this.parseTreeNode.node) {
		this.setVariable(this.parseTreeNode.contextName,this.parseTreeNode.node.localName);
		this.variables[this.parseTreeNode.contextName].node = this.parseTreeNode.node;
	}
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
XslNodeWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.xslnode = XslNodeWidget;

})();
