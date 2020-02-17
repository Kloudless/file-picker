/* eslint-disable */
import config from './config';

'use strict';


var storage = {
  container: null
};

// set the storage container
if (config.persist == "local" && window.localStorage) {
  storage.container = window.localStorage;
} else if (config.persist == "session" && window.sessionStorage) {
  storage.container = window.sessionStorage;
} else if (config.persist == "none") {
  storage.container = null;
} else {
  // Temporary container.
  storage.container = {};
}

// Pass in accounts from an account manager
storage.storeAccounts = function (appId, accounts) {
  if (!storage.container) return;

  var serviceNames = config.all_services().map(function (service) {
    return service.id;
  });

  var key = 'k-' + appId, appData = storage.container[key];
  if (!appData || appData.length == 0) {
    appData = {}
  } else {
    appData = JSON.parse(appData);
  }

  // add accounts from the manager for currently visible services.
  var i, account, array = [];
  for (i = 0; i < accounts.length; i++) {
    account = accounts[i];
    array.push(JSON.stringify(account));
  }
  // add accounts already saved for currently invisible services.
  for (i = 0; i < appData.accounts.length; i++) {
    account = JSON.parse(appData.accounts[i]);
    if (serviceNames.indexOf(account.service) == -1) {
      array.push(appData.accounts[i]);
    }
  }
  // store the final array
  appData.accounts = array;
  storage.container[key] = JSON.stringify(appData);
};

// Return an array of accounts, initialize if necessary
// the appData is stringified
storage.loadAccounts = function (appId) {
  if (!storage.container) return [];

  var serviceNames = config.all_services().map(function (service) {
    return service.id;
  });
  var key = 'k-' + appId, appData = storage.container[key];
  if (!appData || appData.length === 0) {
    appData = {};
    appData.accounts = [];
    storage.container[key] = JSON.stringify(appData);
    return appData.accounts;
  }

  appData = JSON.parse(appData);
  // accounts also needs to be parsed
  var i, array = [], accounts = appData.accounts;
  for (i = 0; i < accounts.length; i++) {
    var acc = JSON.parse(accounts[i]);
    if (serviceNames.length === 0 || // Not loaded yet
      serviceNames.indexOf(acc.service) != -1) {
      array.push(acc);
    }
  }
  return array;
};

storage.removeAllAccounts = function (appId) {
  if (!storage.container) return;

  var key = 'k-' + appId, appData = storage.container[key];
  if (!appData || appData.length == 0) {
    appData = {};
    appData.accounts = [];
    storage.container[key] = JSON.stringify(appData);
  } else {
    appData = JSON.parse(appData);
    appData.accounts = [];
    storage.container[key] = JSON.stringify(appData);
  }
};

storage.storeId = function (pickerId) {
  if (!storage.container) {
    return
  };
  const key = 'k-explorerId';
  storage.container[key] = pickerId;
}

storage.loadId = function () {
  if (!storage.container) {
    return
  };
  const key = 'k-explorerId';
  return storage.container[key];
}

export default storage;
