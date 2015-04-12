(function(){
	'use strict';

	define(['vendor/knockout', 'vendor/loglevel', 'jquery', 'config'],
			function(ko, logger, $, config){
		
		//Create a search object
		var Search = function(accounts, query){
			this.accounts = accounts;
			this.q = query;
			this.results = null;
			this.request = null;
		};

		Search.prototype.getSearch = function(callback){
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
					self.results = data;
					logger.debug('Search results on', self.q, ':', self.results);
					callback();
				},
				error: function(){
					//Show an error
					alert("Error in search request!");
				},
				datatype: 'json'
			})
		};

		return Search;

	})
})();