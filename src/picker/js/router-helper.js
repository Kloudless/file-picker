/* eslint-disable camelcase */
import sammy from 'sammy';
import logger from 'loglevel';
import storage from './storage';
import config from './config';
import { VIEW } from './constants';

function init(picker) {
  const router = sammy(function () { // eslint-disable-line func-names
    // Do not use arrow function in order to use `this`

    // Override setLocation to disable history modifications.
    this.disable_push_state = true;
    this.setLocation = (path) => {
      this.runRoute('get', path);
    };

    /*
     * Routes
     */

    // Switch to the accounts page.
    this.get('#/accounts', () => {
      logger.debug('Accounts page requested.');
      picker.switchViewTo(VIEW.accounts);
    });

    // Reconnect an erroneously disconnected account.
    // WARNING: THIS HAS NOT YET BEEN IMPLEMENTED.
    // eslint-disable-next-line func-names
    this.get('#/account/reconnect/:id', function () {
      // Do not use arrow function in order to use `this`
      logger.debug(`Account reconnection invoked for id: ${this.params.id}.`);
    });

    // Disconnect an account.
    // eslint-disable-next-line func-names
    this.get('#/account/disconnect/:id', function () {
      // Do not use arrow function in order to use `this`
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
      picker.switchViewTo(VIEW.files);
    });
    // Switch to the files view of a particular account.
    // eslint-disable-next-line func-names
    this.get('#/files/:account', function () {
      // Do not use arrow function in order to use `this`
      logger.debug(`Switching to files of account: ${this.params.account}.`);
      picker.switchViewTo(VIEW.files);
      picker.manager.active(picker.manager.getByAccount(this.params.account));
    });

    this.get('#/search', () => {
      logger.debug('Switching to search files');
      picker.switchViewTo(VIEW.search);
    });

    // Switch to the computer view
    this.get('#/computer', () => {
      logger.debug('Switching to computer view');
      picker.switchViewTo(VIEW.computer);
    });
    // Switch to the dropzone view
    this.get('#/dropzone', () => {
      picker.switchViewTo(VIEW.dropzone);
    });
    // Confirm add account button
    this.get('#/addConfirm', () => {
      picker.switchViewTo(VIEW.addConfirm);
    });

    /*
     * Additional initialization steps.
     */

    this.get('#/', () => {
      this.setLocation('#/accounts');
    });

    this.get(/.*/, () => {
      // Pass.
      // Add this to avoid 404 error from sammy router.
    });
  });
  return router;
}

export default { init };
