(function() {
  'use strict';

  define(['vendor/knockout', 'vendor/loglevel', 'models/filesystem', 'config'],
      function(ko, logger, Filesystem, config) {
    // Construct an Account, which keeps track of account metadata, and fire a callback on init.
    var Account = function(data, account_callback, filesystem_callback) {
      /*
       *  Data should normally be of the format
       *    {
       *      account
       *      account_name
       *      service
       *      active
       *      created
       *      modified
       *    }
       *
       *    However, you can also create an account from a key, which will be
       *    a string representing the account_key.  The data will be retrieved
       *    using data_from_key()
       */

      var self = this;
      this.request = null;

      var initialize_account = function(data) {
        if (!data) {
          filesystem_callback(new Error("Account data empty"), null);
          return;
        }

        // Important account attributes.
        self.account = data.account;
        self.account_name = data.account_name;
        self.service = data.service;

        // Extra metadata -- don't rely on this being here.
        self.active = data.active;
        self.created = data.created;
        self.modified = data.modified;

        // Application stuff.
        self.connected = ko.observable(true);
        self.account_key = data.account_key;
        self.bearer_token = data.bearer_token;
        logger.info('Account creation finished. Building filesystem...');

        self.key = {};
        if (self.bearer_token) {
          self.key.key = self.bearer_token;
          self.key.scheme = "Bearer";
        } else {
          self.key.key = self.account_key;
          self.key.scheme = "AccountKey";
        }
        self.filesystem = ko.observable(
          new Filesystem(self.account, self.key, filesystem_callback));

        var callback = function () { account_callback(self) }
        if (config.account_key && !self.account_key) {
          self.includeAccountKey(callback);
        } else if (config.retrieve_token() && !self.bearer_token) {
          self.includeBearerToken(callback);
        } else {
          callback();
        }
      };

      // If data is an object with 'account', then we already have account data
      // to initialize with. Otherwise, fetch the data from the Key.
      if (data.account) {
        initialize_account(data);
      } else {
        self.data_from_key(data, initialize_account);
      }
    };

    // Reconnect this account.
    // WARNING: THIS METHOD IS A MOCK.
    Account.prototype.reconnect = function() {
      this.connected(true);
      return this.connected;
    };
    // Disconnect this account.
    // WARNING: THIS METHOD IS A MOCK.
    Account.prototype.disconnect = function() {
      this.connected(false);
      return this.connected;
    };

    Account.prototype.data_from_key = function(key, callback) {
      var self = this;

      if (callback === undefined) {
        callback = function(){};
      }

      if (self.request !== null) {
        self.request.abort();
      }

      self.request = $.ajax({
        url: config.getAccountUrl() + '?active=True',
        type: 'GET',
        headers: {
          Authorization: key.scheme + ' ' + key.key
        },
      }).done(function(data) {
        logger.debug('Retrieving account succeeded.');

        var accts = data.objects;
        if (accts.length == 0) {
          callback(null);
        } else {
          var acct = accts[0];
          acct.account_name = acct.account;
          acct.account = acct.id;

          if (key.scheme === 'AccountKey') {
            acct.account_key = key.key
          } else {
            acct.bearer_token = key.key
          }

          callback(acct)
        }
      }).fail(function(xhr, status, err) {
        logger.debug('Retrieving account failed.');
        callback(null);
      }).always(function() {
        self.request = null;
      });
    }

    Account.prototype.includeAccountKey = function(callback) {
      /*
       Only called when OAuth tokens are in use.
       */
      var self = this;
      $.ajax({
        url: config.base_url + '/v0/accounts/' + self.account + '/keys',
        type: 'GET',
        headers: {
          Authorization: self.key.scheme + ' ' + self.key.key
        },
      }).done(function(data) {
        if (data.objects.length > 0) {
          self.account_key = data.objects[0].key
        }
      }).fail(function(xhr, status, err) {
        logger.debug('Retrieving the account key via OAuth token failed.');
      }).always(function() {
        callback()
      });
    }

    Account.prototype.includeBearerToken = function(callback) {
      /*
       Only called when Account Keys are in use and bearer tokens need to be
       returned.
       Does not delete the existing account key.
       */
      var self = this;
      $.ajax({
        url: config.base_url + '/v0/accounts/' + self.account + '/token_from_key',
        type: 'POST',
        headers: {
          Authorization: self.key.scheme + ' ' + self.key.key
        },
      }).done(function(data) {
        self.bearer_token = data.access_token
      }).fail(function(xhr, status, err) {
        logger.debug('Retrieving the OAuth token via the account key failed.');
      }).always(function() {
        callback()
      });
    }

    return Account;
  });
})();
