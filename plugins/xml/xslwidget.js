/*\
title: $:/plugins/flibbles/xml/xslwidget.js
type: application/javascript
module-type: widget

xslt widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var XslWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

XslWidget.prototype = new Widget();

exports.xsl = XslWidget;

XslWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

XslWidget.prototype.execute = function() {
	var xmlDom = require("./xmldom");
	var DOMParser = xmlDom.DOMParser;
	this.foreach = this.getAttribute("for-each");
	this.variableName = this.getAttribute("variable", "xmlNode");
	//this.xmlTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.xmlTitle = this.getVariable("currentTiddler");
	var tiddler = this.wiki.getTiddler(this.xmlTitle);
	var members = [];
	if (tiddler) {
		var parser = new DOMParser();
		var doc = parser.parseFromString(tiddler.fields.text, "text/xml");
		var contextVariable = this.variables[this.variableContext()];
		var contextNode = contextVariable ? contextVariable.node : doc;
		var iterator = doc.evaluate(this.foreach, contextNode, null, xmlDom.XPathResult.ANY_TYPE, null );
		var node = iterator.iterateNext();
		while (node) {
			members.push(this.makeItemTemplate(node));
			node = iterator.iterateNext();
		}
	}
	this.makeChildWidgets(members);
};

/*
Compose the template for a list item
*/
XslWidget.prototype.makeItemTemplate = function(node) {
	var templateTree;
	// Compose the transclusion of the template
	if(false) {
		templateTree = [{type: "transclude", attributes: {tiddler: {type: "string", value: template}}}];
	} else {
		if(this.parseTreeNode.children && this.parseTreeNode.children.length > 0) {
			templateTree = this.parseTreeNode.children;
		} else {
			// Default template is a link to the title
			templateTree = [{type: "element", tag: this.parseTreeNode.isBlock ? "div" : "span", children: [{type: "link", attributes: {to: {type: "string", value: title}}, children: [
					{type: "text", text: title}
			]}]}];
		}
	}

	// Return the list item
	return {type: "xslnode", contextName: this.variableContext(), node: node, variableName: this.variableName, children: templateTree};
};

XslWidget.prototype.variableContext = function() {
	return "xml-node-state-" + this.xmlTitle;
};

XslWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.xslt || changedAttributes.tiddler || changedTiddlers[this.tiddler]) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

/*
Widget exists for each loop of XslWidget. Holds current state of that iteration.
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
	this.setVariable(this.parseTreeNode.variableName,this.parseTreeNode.node.textContent);
	this.setVariable(this.parseTreeNode.contextName,this.parseTreeNode.node.localName);
	this.variables[this.parseTreeNode.contextName].node = this.parseTreeNode.node;
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
