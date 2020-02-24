/* global $ */
/* eslint-disable camelcase, func-names */
import ko from 'knockout';
import logger from 'loglevel';
import Account from './models/account';
import Authenticator from './auth';
import config from './config';

function AccountManager() {
  this.accounts = ko.observableArray([]);
  this.active = ko.observable({});
}

// Connect an account of a particular service, then fire callbacks on init.
AccountManager.prototype.addAccount = function (
  service, oauthParams, callbacks,
) {
  logger.debug('Starting authentication.');
  const response = Authenticator.authenticate(
    service, oauthParams, (data) => {
      logger.debug('Authenticated for: ', data.service || data.scope);
      const created = new Account( // eslint-disable-line no-unused-vars
        { key: { scheme: 'Bearer', key: data.access_token } },
        callbacks.on_account_ready, callbacks.on_fs_ready,
      );
    },
  );

  if (response.authUsingIEXDFrame) {
    callbacks.on_confirm_with_iexd();
  }
};

/**
 * Add authed account
 * @param {object} authedAccount - account object
 */
AccountManager.prototype.addAuthedAccount = function (authedAccount) {
  logger.debug('Add authed account');

  // Don't allow duplicate accounts
  this.accounts.remove(account => account.account === authedAccount.account);

  this.accounts.push(authedAccount);
};

// Remove an account by Account ID.
AccountManager.prototype.removeAccount = function (account_id) {
  // eslint-disable-next-line eqeqeq
  this.accounts.remove(account => account.account == account_id);
  // Remove the account from this.active
  if (this.active().account === account_id) {
    if (this.accounts()[0] !== undefined) {
      logger.debug('Change the active account to ', this.accounts()[0]);
      this.active(this.accounts()[0]);
    } else {
      logger.debug('Change the active account to an empty object');
      this.active({});
    }
  }
};

// Send a DELETE request to server to delete the account, then call
// removeAccount().
AccountManager.prototype.deleteAccount = function deleteAccount(
  account_id, delete_on_server, on_success_callback,
) {
  let account_data = {};
  const accounts = this.accounts();
  for (let i = 0; i < accounts.length; i += 1) {
    if (accounts[i].account == account_id) { // eslint-disable-line eqeqeq
      account_data = accounts[i];
      break;
    }
  }
  if (Object.keys(account_data).length === 0) {
    logger.warn('Account failed to remove');
    alert('Error occurred. Please try again!'); // eslint-disable-line no-alert
    return;
  }
  if (delete_on_server) {
    let request = $.ajax({ // eslint-disable-line no-unused-vars
      url: config.getAccountUrl(account_data.account),
      type: 'DELETE',
      headers: {
        Authorization: `${account_data.key.scheme} ${account_data.key.key}`,
      },
    }).done(() => {
      this.removeAccount(account_data.account);
      on_success_callback(account_data);
    }).fail(() => {
      logger.warn('Account failed to remove');
      // eslint-disable-next-line no-alert
      alert('Error occurred. Please try again!');
    }).always(() => {
      request = null;
    });
  } else {
    this.removeAccount(account_data.account);
    on_success_callback(account_data);
  }
};

// Retrieve an account by Account ID. Returns null if account not found.
AccountManager.prototype.getByAccount = function (account_id) {
  // eslint-disable-next-line eqeqeq
  return ko.utils.arrayFirst(this.accounts(), a => a.account == account_id);
};

export default AccountManager;
