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
exports.getTiddlerDocument = function(titleOrTiddler) {
	var tiddler = titleOrTiddler;
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = this.getTiddler(tiddler);
	}
	if (tiddler) {
		return this.getCacheForTiddler(tiddler.fields.title, "XMLDOM", function() {
			var doc = xmldom.getDocumentForText(tiddler.fields.type, tiddler.fields.text);
			if (doc && doc.error) {
				// Let's elaborate
				var errorKey = "flibbles/xml/Error/DOMParserError";
				doc.error = $tw.language.getString(errorKey,
					{variables: {currentTiddler: tiddler.fields.title}});
			}
			return doc;
		});
	} else {
		return undefined;
	}
};
