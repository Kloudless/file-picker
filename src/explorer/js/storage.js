(function () {
    'use strict';

    define(function () {

        var storage = {
        };

        // Pass in accounts from an account manager
        storage.storeAccounts = function (appId, accounts, services) {
            var key = 'k-' + appId, appData = localStorage[key];
            if (!appData || appData.length == 0) {
                appData = {}
            } else {
                appData = JSON.parse(appData);
            }

            // add accounts from the manager
            var i, account, array = [];
            for (i = 0; i < accounts.length; i++) {
                account = accounts[i];
                array.push(JSON.stringify(account));
            }
            // add accounts not in services
            for (i = 0; i < appData.accounts.length; i++) {
                account = JSON.parse(appData.accounts[i]);
                if (services.indexOf(account.service) == -1) {
                    array.push(appData.accounts[i]);
                }
            }
            // store the final array
            appData.accounts = array;
            localStorage[key] = JSON.stringify(appData);
        };

        // Return an array of accounts, initialize if necessary
        // the appData is stringified
        storage.loadAccounts = function (appId, services) {
            var key = 'k-' + appId, appData = localStorage[key];
            if (!appData || appData.length === 0) {
                appData = {};
                appData.accounts = [];
                localStorage[key] = JSON.stringify(appData);
                return appData.accounts;
            }

            appData = JSON.parse(appData);
            // accounts also needs to be parsed
            var i, array = [], accounts = appData.accounts;
            for (i = 0; i < accounts.length; i++) {
                var acc = JSON.parse(accounts[i]);
                if (services.indexOf(acc.service) != -1) {
                    array.push(acc);
                }
            }
            return array;
        };

        storage.removeAllAccounts = function (appId) {
            var key = 'k-' + appId, appData = localStorage[key];
            if (!appData || appData.length == 0) {
                appData = {};
                appData.accounts = [];
                localStorage[key] = JSON.stringify(appData);
            } else {
                appData = JSON.parse(appData);
                appData.accounts = [];
                localStorage[key] = JSON.stringify(appData);
            }
        };

        storage.storeId = function(explorerId) {
          var key = 'k-explorerId';
          localStorage[key] = explorerId;
        }

        storage.loadId = function() {
          var key = 'k-explorerId';
          return localStorage[key];
        }

        return storage;
    });
})();