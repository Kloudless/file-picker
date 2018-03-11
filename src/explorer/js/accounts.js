(function() {
  'use strict';

  define(['vendor/knockout', 'vendor/loglevel', 'models/account',
          'auth'],
         function(ko, logger, Account, Authenticator) {
    // Construct an AccountManager, which abstracts the process of
    // connecting and disconnecting accounts.
    var AccountManager = function() {
      this.accounts = ko.observableArray([]);
      this.active = ko.observable({});
    };

    // Connect an account of a particular service, then fire callbacks on init.
    AccountManager.prototype.addAccount = function(service, callbacks) {
      logger.debug('Starting authentication.');
      var response = Authenticator.authenticate(service, function(data) {
        logger.debug('Authenticated for: ', data.service || data.scope);
        var created = new Account(
          {scheme: 'Bearer', key: data.access_token},
          callbacks.on_account_ready, callbacks.on_fs_ready);
      });

      if (response.authUsingIEXDFrame) {
        callbacks.on_confirm_with_iexd();
      }
    };

   /**
    * Add authed account
    * @param {object} authedAccount - account object
    */
    AccountManager.prototype.addAuthedAccount = function(authedAccount) {
      logger.debug("Add authed account");

      // Don't allow duplicate accounts
      this.accounts.remove(function(account) {
        return account.account === authedAccount.account;
      });

      this.accounts.push(authedAccount);
    };

    // Remove an account by Account ID.
    AccountManager.prototype.removeAccount = function(account_id) {
      this.accounts.remove(function(account) {
        return account.account == account_id;
      });
      // Remove the account from this.active
      if(this.active().account === account_id) {
        if (this.accounts()[0] !== undefined) {
          logger.debug("Change the active account to ", this.accounts()[0]);
          this.active(this.accounts()[0]);
        } else {
          logger.debug("Change the active account to an empty object");
          this.active({});
        }
      }
    };

    // Retrieve an account by Account ID. Returns null if account not found.
    AccountManager.prototype.getByAccount = function(account_id) {
      return ko.utils.arrayFirst(this.accounts(), function(a) {
        return a.account == account_id;
      });
    };

    return AccountManager;
  });
})();
