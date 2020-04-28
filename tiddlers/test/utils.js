/*\
module-type: library

Utils for testing.

\*/

/** This allows some method to be swapped out with a mock method for the
 *  purpose of testing a block. Afterward, it replaces the old method.
 */
exports.monkeyPatch = function(container, method, alternative, block) {
	var old = container[method];
	container[method] = alternative;
	try {
		block();
	} finally {
		container[method] = old;
	}
};
