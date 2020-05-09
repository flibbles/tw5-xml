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
var xmlDom = require("../xmldom");

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
	var xpath = require("../xpath");
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
		doc = contextNode.ownerDocument || contextNode;
	} else {
		doc = xmlDom.getTiddlerDocument(this.wiki, this.xmlTitle);
		contextNode = doc;
	}
	if (contextNode) {
		if (doc.error) {
			members.push(this.makeErrorTree(doc.error));
		} else {
			var resolver = xpath.createResolver(contextNode, this);
			if (this.foreach) {
				var node = undefined;
				try {
					var iterator = xpath.evaluate(this.foreach, contextNode, resolver, xpath.XPathResult.ANY_TYPE, null);
					node = iterator.iterateNext();
				} catch(e) {
					var error = xpath.getError(e, this.foreach);
					members.push(this.makeErrorTree(error));
				}
				while (node) {
					var value;
					if (this.valueof) {
						try {
							var rtn = xpath.evaluate(this.valueof, node, resolver, xpath.XPathResult.STRING_TYPE, null);
							value = rtn.stringValue;
						} catch(e) {
							var error = xpath.getError(e, this.valueof);
							members.push(this.makeErrorTree(error));
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
					var iterator = xpath.evaluate(this.valueof, contextNode, resolver, xpath.XPathResult.ANY_TYPE, null);
					node = iterator.iterateNext();
					if (node) {
						var value = node.nodeValue || node.textContent;
						if (!value && node.documentElement) {
							value = node.documentElement.textContent;
						}
						members.push(this.makeItemTemplate(null, value, false));
					}
				} catch (e) {
					var error = xpath.getError(e, this.valueof);
					members.push(this.makeErrorTree(error));
				}
			}
		}
	}
	this.makeChildWidgets(members);
};

XPathWidget.prototype.makeErrorTree = function(error) {
	return {type: "element", tag: "span", attributes: {
			"class": {type: "string", value: "tc-error"}
		}, children: [
			{type: "text", text: error}
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
