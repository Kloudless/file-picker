(function() {
  'use strict';

  define(['vendor/knockout', 'vendor/loglevel', 'jquery', 'config'],
    function(ko, logger, $, config) {

    //Create a search object
    var Search = function(account, account_key, query) {
      this.account = account;
      this.key = account_key;
      this.q = query;
      this.results = null;
      this.request = null;
    };

    Search.prototype.getSearch = function(callback) {
      var self = this;

      self.request = $.ajax({
        url: config.base_url + '/v0/accounts/' + self.account + "/search/?q=" + self.q,
        type: 'GET',
        headers: {
          Authorization: 'AccountKey ' + self.key
        },
        success: function(data) {
          self.results = data;
          logger.debug('Search results on', self.q, ':', self.results);
          callback();
        },
        error: function() {
          logger.error("Error with the search request.");
        },
        datatype: 'json'
      })
    };

    return Search;
  })
})();