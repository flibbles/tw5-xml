/*\
module-type: startup
title: $:/plugins/flibbles/xml/filetype.js
type: application/javascript

This takes care of registering the xml filetype.

\*/

// This is technically incorrect. An XML file might not necessarily be
// utf-8, but Tiddlywiki doesn't have a mechanism that allows us to be
// dynamic about it.
$tw.utils.registerFileType("text/xml", "utf8", ".xml");
