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
	var DOMParser = xmlDom.DOMParser;
	this.foreach = this.getAttribute("for-each");
	this.valueof = this.getAttribute("value-of");
	this.variableName = this.getAttribute("variable", "xmlNode");
	//this.xmlTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.xmlTitle = this.getVariable("currentTiddler");

	for (var attribute in this.attributes) {
		if (attribute.substr(0, 6) === "xmlns:") {
			this.setVariable(attribute,this.attributes[attribute]);
		}
	}

	var tiddler = this.wiki.getTiddler(this.xmlTitle);
	var members = [];
	if (tiddler) {
		var contextVariable = this.variables[this.variableContext()];
		var contextNode, doc;
		if (contextVariable) {
			contextNode = contextVariable.node;
			doc = contextNode.ownerDocument;
		} else {
			var contextNode = contextVariable ? contextVariable.node : doc;
			var parser = new DOMParser();
			doc = parser.parseFromString(tiddler.fields.text, "text/xml");
			contextNode = doc;
		}
		var docResolver = doc.createNSResolver(doc);
		var self = this;
		var resolver = function(nsPrefix) {
			var variable = self.variables["xmlns:" + nsPrefix];
			return variable ? variable.value : docResolver.lookupNamespaceURI(nsPrefix);
		}
		resolver.lookupNamespaceURI = resolver;
		try {
			if (this.valueof) {
				var value = doc.evaluate(this.valueof, contextNode, resolver, xmlDom.XPathResult.STRING_TYPE);
				if (value) {
					members.push({type: "text", text: value.stringValue});
				}
			} else {
				var iterator = doc.evaluate(this.foreach, contextNode, resolver, xmlDom.XPathResult.ANY_TYPE, null );
				var node = iterator.iterateNext();
				while (node) {
					members.push(this.makeItemTemplate(node));
					node = iterator.iterateNext();
				}
			}
		} catch(e) {
			members.push({type: "element", tag: "span", attributes: {
				"class": {type: "string", value: "tc-error"}
			}, children: [
				{type: "text", text: $tw.language.getString("flibbles/xml/Error/InvalidXPath", {variables: {xpath: this.foreach}})}
			]});
		}
	}
	this.makeChildWidgets(members);
};

/*
Compose the template for a list item
*/
XPathWidget.prototype.makeItemTemplate = function(node) {
	var templateTree;
	// Compose the transclusion of the template
	if(false) {
		templateTree = [{type: "transclude", attributes: {tiddler: {type: "string", value: template}}}];
	} else {
		if(this.parseTreeNode.children && this.parseTreeNode.children.length > 0) {
			templateTree = this.parseTreeNode.children;
		} else {
			// Default template is to print out each result
			templateTree = [{type: "element", tag: this.parseTreeNode.isBlock ? "div" : "span", children: [{type: "text", text: node.textContent}]}];
		}
	}

	// Return the list item
	return {type: "xslnode", contextName: this.variableContext(), node: node, variableName: this.variableName, children: templateTree};
};

XPathWidget.prototype.variableContext = function() {
	return "xml-node-state-" + this.xmlTitle;
};

XPathWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.xslt || changedAttributes.tiddler || changedTiddlers[this.tiddler]) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
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
