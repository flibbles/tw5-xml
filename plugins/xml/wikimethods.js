/*\
title: $:/plugins/flibbles/xml/wikimethods.js
type: application/javascript
module-type: wikimethod

\*/

var xmldom = require("./xmldom");

/**If the given title is a valid DOM type and the text is valid, returns that.
 * If title doesn't exist, isn't a DOM type, or fails to parse, returns  undefined.
 *
 * Do not edit the returned documents.
 * They would be deep frozen if that wasn't so expensive.
 */

exports.getTiddlerDocument = function(title) {
	var self = this;
	return this.getCacheForTiddler(title, "XMLDOM", function() {
		var tiddler = self.getTiddler(title),
			doc = undefined;
		if (tiddler) {
			doc = xmldom.getDocumentForText(tiddler.fields.type, tiddler.fields.text);
			if (doc && doc.error) {
				// Let's elaborate
				var errorKey = "flibbles/xml/Error/DOMParserError";
				doc.error = $tw.language.getString(errorKey,
					{variables: {currentTiddler: title}});
			}
		}
		return doc;
	});
};
