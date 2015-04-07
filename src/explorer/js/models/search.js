(function(){
	'use strict';

	define(['vendor/knockout', 'vendor/loglevel', 'jquery', 'config'],
			function(ko, logger, $, config){
		
		//Create a search object
		var Search = function(accounts, query, filesystem_callback){
			this.accounts = accounts;
			this.q = query;
			this.results = null;
		};

		Search.prototype.getSearch = function(){
			var self = this;

			var searchAccounts = "";
			var accountKeys = "";
			for(var i = 0; i < self.accounts.length; i++){
				if(i>0){
					searchAccounts+="%2C";
					accountKeys+=",";
				}
				searchAccounts+=self.accounts[i].account;
				accountKeys+=self.accounts[i].account_key;
			}

			self.request = $.ajax({
				url: config.base_url + '/v0/accounts/' + searchAccounts + "/search/?q=" + self.q,
				type: 'GET',
				headers: {
					Authorization: 'AccountKey ' + accountKeys
				},
				success: function(data){
					logger.debug('Search results:', data);
					self.results = data;
				},
				error: function(){
					alert("Error in search request!");
				},
				datatype: 'json'
			})
		};

		return Search;

	})
})();
// Input this to create a search object and search a specific query
// (function(query) {
//   require(['models/search'], function(Search) {
//     (function(accounts){
//       var s = new Search(accounts, query, null);
//       s.getSearch();
//     })(explorer.manager.accounts());
//   });
// })("cpu");
