/*\
title: $:/plugins/flibbles/xml/config.js
type: application/javascript
module-type: config

Adds global configurations used by tw5-xml to $tw.config, where they can
be hacked if necessary.
\*/

exports.xml = Object.create(null);

exports.xml.supportedDocumentTypes = {
	"text/html": "text/html",
	"text/xml": "text/xml",
	"application/xml": "application/xml",
	"application/xhtml+xml": "application/xhtml+xml",
	"image/svg+xml": "image/svg+xml"
};
