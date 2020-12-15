import logger from 'loglevel';
import config from './config';

const storage = {
  container: null,
};

try {
  // set the storage container
  if (config.persist === 'local' && window.localStorage) {
    storage.container = window.localStorage;
  } else if (config.persist === 'session' && window.sessionStorage) {
    storage.container = window.sessionStorage;
  } else {
    // "none" or window.localStorage/window.sessionStorage is falsy.
    storage.container = {};
  }
} catch (err) {
  // Chrome and Edge will throw DOMException when accessing sessionStorage or
  // localStorage if 3rd party cookie disabled.
  // https://blog.zok.pw/web/2015/10/21/3rd-party-cookies-in-practice/
  logger.warn(
    'Cannot access localStorage/sessionStorage. '
    + 'This might be due to third-party cookies being disabled.',
  );
  storage.container = {};
}

// Pass in accounts from an account manager
storage.storeAccounts = function storeAccounts(appId, accounts) {
  if (!storage.container) {
    return;
  }

  const serviceNames = config.all_services().map(service => service.id);

  const key = `k-${appId}`;
  let appData = storage.container[key];
  try {
    appData = JSON.parse(appData);
  } catch (err) {
    appData = {};
  }

  // add accounts from the manager for currently visible services.
  const array = accounts.map(acc => JSON.stringify(acc));

  // add accounts already saved for currently invisible services.
  if (appData.accounts) {
    appData.accounts.forEach((acc) => {
      const account = JSON.parse(acc);
      if (!serviceNames.includes(account.service)) {
        array.push(acc);
      }
    });
  }

  // store the final array
  appData.accounts = array;
  storage.container[key] = JSON.stringify(appData);
};

// Return an array of accounts, initialize if necessary
// the appData is stringified
storage.loadAccounts = function loadAccounts(appId) {
  if (!storage.container) {
    return [];
  }

  const serviceNames = config.all_services().map(service => service.id);
  const key = `k-${appId}`;
  let appData = storage.container[key];
  if (!appData || appData.length === 0) {
    appData = {};
    appData.accounts = [];
    storage.container[key] = JSON.stringify(appData);
    return appData.accounts;
  }

  appData = JSON.parse(appData);
  // accounts also needs to be parsed
  const array = [];
  const { accounts } = appData;
  for (let i = 0; i < accounts.length; i += 1) {
    const acc = JSON.parse(accounts[i]);
    if (serviceNames.length === 0 || // Not loaded yet
      serviceNames.indexOf(acc.service) !== -1) {
      array.push(acc);
    }
  }
  return array;
};

storage.removeAllAccounts = function removeAllAccounts(appId) {
  if (!storage.container) {
    return;
  }

  const key = `k-${appId}`;
  let appData = storage.container[key];
  if (!appData || appData.length === 0) {
    appData = {};
    appData.accounts = [];
    storage.container[key] = JSON.stringify(appData);
  } else {
    appData = JSON.parse(appData);
    appData.accounts = [];
    storage.container[key] = JSON.stringify(appData);
  }
};

storage.storeId = function storeId(pickerId) {
  if (!storage.container) {
    return;
  }
  const key = 'k-explorerId';
  storage.container[key] = pickerId;
};

storage.loadId = function loadId() {
  if (!storage.container) {
    return null;
  }
  const key = 'k-explorerId';
  return storage.container[key];
};

export default storage;
