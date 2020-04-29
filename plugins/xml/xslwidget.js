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
	this.xmlTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	var tiddler = this.wiki.getTiddler(this.xmlTitle);
	var members = [];
	if (tiddler) {
		var parser = new DOMParser();
		var doc = parser.parseFromString(tiddler.fields.text, "text/xml");
		var iterator = doc.evaluate(this.foreach, doc.documentElement, null, xmlDom.XPathResult.ANY_TYPE, null );
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
	return {type: "listitem", itemTitle: node.textContent, variableName: this.variableName, children: templateTree};
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

})();
