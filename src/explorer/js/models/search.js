(function() {
  'use strict';

  define(['vendor/knockout', 'vendor/loglevel', 'jquery', 'config'],
    function(ko, logger, $, config) {

    //Create a search object
    var Search = function(account, key, query) {
      this.account = account;
      this.key = key;
      this.q = query;
      this.results = null;
      this.request = null;
    };

    Search.prototype.search = function(callback, errback) {
      var self = this;

      self.request = $.ajax({
        url: config.getAccountUrl(self.account, 'storage', '/search/?q=' + self.q),
        type: 'GET',
        headers: {
          Authorization: self.key.scheme + ' ' + self.key.key
        },
        success: function(data) {
          self.results = data;
          logger.debug('[Account ' + self.account + '] Search results on ',
                       self.q, ': ', self.results);
          if (callback) callback();
        },
        error: function() {
          logger.error('[Account ' + self.account + '] Search request failed.');
          if (errback) errback();
        },
        datatype: 'json'
      })
    };

    return Search;
  })
})();
