(function(root, factory){

	// Node env
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory(require('cloud/async.js'),root);
	} 
	// Browser env
	else {
		root.parseFindAll = factory(root.async, root);
	}


}(this,function(async,root){

	var findAll = function(query,callbackHash) {

		var promise = new Parse.Promise;

		var succCbDefined = typeof callbackHash !== "undefined" && typeof callbackHash.success !== "undefined";
		var errCbDefined = typeof callbackHash !== "undefined" && typeof callbackHash.error !== "undefined";

		query.count({
			success:function(count) {
				// Get the number of iterations (queries) we'll have to make.
				var nbIterations = Math.ceil(count / 1000);
				// Build the "limit array"
				var skipLimitArray = [];
				// Construct our skipLimitArray so we can chain it with async lib
				for (var i = 0; i < nbIterations; i++) {
					skipLimitArray.push(i*1000);
				}
				// allData will contain all the concatened results
				var allData = [];
				// Let's loop on it -- with async flow control indeed
				async.forEachSeries(skipLimitArray,function(currentSkip,callback){
					query.limit(1000).skip(currentSkip);
					query.find({
						success:function(results) {
							allData = allData.concat(results);
							callback();
						},
						error:function(err) {
							callback(err);
						}
					});

				},
				function(err) {
					// Any error during queries? Let's pass it back
					if (err) {
						if (errCbDefined) callbackHash.error(err);
						promise.reject(err);
					}

					if (succCbDefined) callbackHash.success(allData);
					promise.resolve(allData);
				});
			},
			error:function(err) {
				if (errCbDefined) callbackHash.error(err);
				promise.reject(err);
			}

		});

		// Make it promise compatible -- dope
		return promise;

	};	

	return findAll;

}));