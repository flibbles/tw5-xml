/*\
title: $:/plugins/flibbles/xml/widgets.js
type: application/javascript
module-type: widget

xslt widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var xmldom = require("./xmldom");
var xpath = require("./xpath");
var xselect = require("./xselect");

var DOMWidget = function() {};

DOMWidget.prototype = new Widget();

DOMWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

DOMWidget.prototype.execute = function() {
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
		doc = this.wiki.getTiddlerDocument(this.xmlTitle);
		contextNode = doc;
	}
	if (contextNode) {
		if (doc.error) {
			members.push(this.makeErrorTree(doc.error));
		} else {
			if (this.foreach) {
				var node = undefined;
				try {
					var iterator = this.queryAll(this.foreach, contextNode);
					node = iterator.iterateNext();
				} catch(e) {
					var error = this.handleQueryError(e, this.foreach);
					members.push(this.makeErrorTree(error));
				}
				while (node) {
					var value;
					if (this.valueof) {
						try {
							var subnode = this.query(this.valueof, node);
							if (subnode) {
								value = xmldom.getStringValue(subnode);
							} else {
								value = "";
							}
						} catch(e) {
							var error = this.handleQueryError(e, this.valueof);
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
					node = this.query(this.valueof, contextNode);
					if (node) {
						var value = xmldom.getStringValue(node);
						members.push(this.makeItemTemplate(null, value, false));
					}
				} catch (e) {
					var error = this.handleQueryError(e, this.valueof);
					members.push(this.makeErrorTree(error));
				}
			}
		}
	}
	this.makeChildWidgets(members);
};

DOMWidget.prototype.makeErrorTree = function(error) {
	return {type: "element", tag: "span", attributes: {
			"class": {type: "string", value: "tc-error"}
		}, children: [
			{type: "text", text: error}
		]};
};

/*
Compose the template for a list item
*/
DOMWidget.prototype.makeItemTemplate = function(node, value, repeats) {
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
	return {type: "domnode", contextName: this.variableContext(), node: node, variableName: this.variableName, variableValue: value, children: templateTree};
};

DOMWidget.prototype.variableContext = function() {
	return "xml-node-state-" + this.xmlTitle;
};

DOMWidget.prototype.refresh = function(changedTiddlers) {
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
var DOMNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

DOMNodeWidget.prototype = new Widget();

DOMNodeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
DOMNodeWidget.prototype.execute = function() {
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
DOMNodeWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.domnode = DOMNodeWidget;

///////// XPath Widget /////////

function XPathWidget(parseTreeNode, options) {
	this.initialise(parseTreeNode,options);
};

XPathWidget.prototype = new DOMWidget();

exports.xpath = XPathWidget;

XPathWidget.prototype.queryAll = function(xpathQuery, contextNode) {
	var resolver = xpath.createResolver(contextNode, this);
	var iterator = xpath.evaluate(xpathQuery, contextNode, resolver);
	return iterator;
};

XPathWidget.prototype.query = function(xpathQuery, contextNode) {
	var resolver = xpath.createResolver(contextNode, this);
	var iterator = xpath.evaluate(xpathQuery, contextNode, resolver);
	return iterator.iterateNext();
};

XPathWidget.prototype.handleQueryError = function(error, offendingQuery) {
	return xpath.getError(error, offendingQuery, this.xmlTitle);
};

///////// XSelect Widget /////////

function XSelectWidget(parseTreeNode, options) {
	this.initialise(parseTreeNode,options);
};

XSelectWidget.prototype = new DOMWidget();

exports.xselect = XSelectWidget;

XSelectWidget.prototype.queryAll = function(selector, contextNode) {
	return xselect.querySelectorAll(selector, contextNode);
};

XSelectWidget.prototype.query = function(selector, contextNode) {
	return xselect.querySelector(selector, contextNode);
};

XSelectWidget.prototype.handleQueryError = function(error, offendingQuery) {
	return xselect.getError(error, offendingQuery);
};

})();
