/* global $ */
/* eslint-disable camelcase */
import ko from 'knockout';
import logger from 'loglevel';
import config from '../config';
import Filesystem from './filesystem';

/**
 *
 * @param {object} data
 * {
 *   key: {scheme: "Bearer", key: BEARER_TOKEN }
 *   ...account_metadata
 * }
 *
 * "key" is always provided from localStorage or from OOB OAuth flow,
 * but the rest of account metadata is only provided when initialized from
 * localStorage.
 */
function Account(data, account_callback, filesystem_callback) {
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

  const self = this;
  this.request = null;

  // eslint-disable-next-line no-shadow
  function initialize_account(data, invalidToken) {
    if (!data) {
      const error = new Error('Account data empty');
      // hack to pass invalidToken flag
      error.invalidToken = invalidToken;
      filesystem_callback(error, null);
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
      self.key.scheme = 'Bearer';
    } else {
      self.key.key = self.account_key;
      self.key.scheme = 'AccountKey';
    }
    self.filesystem = ko.observable(
      new Filesystem(
        self.account,
        self.key,
        filesystem_callback,
        config.root_folder_id()[self.account],
      ),
    );

    const callback = () => {
      account_callback(self);
    };
    if (config.account_key && !self.account_key) {
      self.includeAccountKey(callback);
    } else if (config.retrieve_token() && !self.bearer_token) {
      self.includeBearerToken(callback);
    } else {
      callback();
    }
  }

  /**
   * When initialized from localStorage, even though the account metadata
   * is already available, we still get metadata from API again
   * in order to verify if account token is still valid
   *
   * Verifying token when getting root folder metadata in filesystem is
   * difficult because we don't know if a 403 error is caused by invalid token
   * or insufficient permission to access the defined root folder.
   */
  self.data_from_key(data, initialize_account);
}

// Reconnect this account.
// WARNING: THIS METHOD IS A MOCK.
Account.prototype.reconnect = function () { // eslint-disable-line func-names
  this.connected(true);
  return this.connected;
};
// Disconnect this account.
// WARNING: THIS METHOD IS A MOCK.
Account.prototype.disconnect = function () { // eslint-disable-line func-names
  this.connected(false);
  return this.connected;
};

// Get this account's metadata
// eslint-disable-next-line func-names
Account.prototype.data_from_key = function ({ key }, callback = () => {}) {
  const self = this;
  if (self.request !== null) {
    self.request.abort();
  }

  self.request = $.ajax({
    url: `${config.getAccountUrl()}?active=True`,
    type: 'GET',
    headers: {
      Authorization: `${key.scheme} ${key.key}`,
    },
  }).done((data) => {
    logger.debug('Retrieving account succeeded.');

    const accts = data.objects;
    if (accts.length === 0) {
      callback(null);
    } else {
      const acct = accts[0];
      acct.account_name = acct.account;
      acct.account = acct.id;

      if (key.scheme === 'AccountKey') {
        acct.account_key = key.key;
      } else {
        acct.bearer_token = key.key;
      }

      callback(acct);
    }
  }).fail((err) => {
    callback(null, (err && err.status === 403));
  }).always(() => {
    self.request = null;
  });
};

// eslint-disable-next-line func-names
Account.prototype.includeAccountKey = function (callback) {
  /*
   Only called when OAuth tokens are in use.
   */
  const self = this;
  $.ajax({
    url: `${config.base_url}/v0/accounts/${self.account}/keys`,
    type: 'GET',
    headers: {
      Authorization: `${self.key.scheme} ${self.key.key}`,
    },
  }).done((data) => {
    if (data.objects.length > 0) {
      self.account_key = data.objects[0].key;
    }
  }).fail(() => {
    logger.debug('Retrieving the account key via OAuth token failed.');
  }).always(() => {
    callback();
  });
};

// eslint-disable-next-line func-names
Account.prototype.includeBearerToken = function (callback) {
  /**
   * Only called when Account Keys are in use and bearer tokens need to be
   * returned. Does not delete the existing account key.
   */
  const self = this;
  $.ajax({
    url: `${config.base_url}/v0/accounts/${self.account}/token_from_key`,
    type: 'POST',
    headers: {
      Authorization: `${self.key.scheme} ${self.key.key}`,
    },
  }).done((data) => {
    self.bearer_token = data.access_token;
  }).fail(() => {
    logger.debug('Retrieving the OAuth token via the account key failed.');
  }).always(() => {
    callback();
  });
};

export default Account;
