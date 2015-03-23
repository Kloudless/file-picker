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
          callback(new Error("Account data empty"), null);
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
        self.account_key_expiry = data.account_key_expiry;
        logger.info('Account creation finished. Building filesystem...');

        self.filesystem = ko.observable(new Filesystem(self.account,
            self.account_key, filesystem_callback));

        account_callback(self);
      };

      // if initializing as a single key
      if (typeof(data) != typeof({})) {
        self.data_from_key(data, initialize_account);
      } else {
        initialize_account(data);
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
        url: config.base_url + '/v0/accounts/?active=True',
        type: 'GET',
        headers: {
          Authorization: 'AccountKey ' + key
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
          acct.account_key = key;
          callback(acct);
        }
      }).fail(function(xhr, status, err) {
        logger.debug('Retrieving account failed.');
        callback(null);
      }).always(function() {
        self.request = null;
      });
    }

    return Account;
  });
})();