/* eslint-disable */
import sammy from 'sammy';
import logger from 'loglevel';
import storage from './storage';
import config from './config';

function init(picker) {
  const router = sammy(function () {
    const self = this;

    // Override setLocation to disable history modifications.
    this.disable_push_state = true;
    this.setLocation = function (path) {
      self.runRoute('get', path);
    };

    /*
     * Routes
     */

    // Switch to the accounts page.
    this.get('#/accounts', () => {
      logger.debug('Accounts page requested.');
      picker.switchViewTo('accounts');
    });

    // Reconnect an erroneously disconnected account.
    // WARNING: THIS HAS NOT YET BEEN IMPLEMENTED.
    this.get('#/account/reconnect/:id', function () {
      logger.debug(`Account reconnection invoked for id: ${this.params.id}.`);
    });

    // Disconnect an account.
    this.get('#/account/disconnect/:id', function () {
      logger.debug(`Account disconnection invoked for id: ${this.params.id}.`);

      picker.manager.deleteAccount(this.params.id, true, (account_data) => {
        // post message for account
        picker.view_model.postMessage('deleteAccount',
          account_data.account);
        // store accounts
        storage.storeAccounts(config.app_id, picker.manager.accounts());
      });
    });

    // Switch to the files page.
    this.get('#/files', () => {
      logger.debug('File view requested.');
      picker.switchViewTo('files');
    });
    // Switch to the files view of a particular account.
    // TODO: test.
    this.get('#/files/:account', function () {
      logger.debug(`Switching to files of account: ${this.params.account}.`);
      picker.switchViewTo('files');
      picker.manager.active(picker.manager.getByAccount(this.params.account));
    });

    this.get('#/search', () => {
      logger.debug('Switching to search files');
      picker.switchViewTo('search');
    });

    // Switch to the computer view
    this.get('#/computer', () => {
      logger.debug('Switching to computer view');
      picker.switchViewTo('computer');
    });
    // Switch to the dropzone view
    this.get('#/dropzone', () => {
      picker.switchViewTo('dropzone');
    });
    // Confirm add account button
    this.get('#/addConfirm', () => {
      picker.switchViewTo('addConfirm');
    });

    /*
     * Additional initialization steps.
     */

    this.get('#/', () => {
      router.setLocation('#/accounts');
    });
  });
  return router;
}

export default { init };
