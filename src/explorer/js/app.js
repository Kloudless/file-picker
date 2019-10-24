/* global plupload, mOxie */
/* eslint-disable func-names, no-underscore-dangle, camelcase, no-alert */
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import $ from 'jquery';
import 'jquery-ui/ui/jquery-ui';
import 'jquery-dropdown/jquery.dropdown';
import 'jquery-scrollstop/jquery.scrollstop';
import 'jquery.finderSelect';
import 'plupload/moxie';
import 'plupload/plupload.dev';
import 'plupload/jquery.ui.plupload/jquery.ui.plupload';
import 'cldrjs';
import ko from 'knockout';
import sammy from 'sammy';
import logger from 'loglevel';
import config from './config';
import storage from './storage';
import AccountManager from './accounts';
import FileManager from './files';
import auth from './auth';
import Search from './models/search';
import util from './util';
import localization from './localization';
import Account from './models/account';
import './iexd-transport';
import 'foundation/css/normalize.css';
import 'foundation/css/foundation.css';
import 'jquery-dropdown/jquery.dropdown.css';
import '../css/file-explorer.styl';

'use strict';

const EVENT_CALLBACKS = {};

// Initialise and configure.
logger.setLevel(config.logLevel);

// Enable cors
$.support.cors = true;
let dropzoneLoaded = false;
let filesQueue = [];
let processingConfirm = false;
let loadedDropConfig = false;

// Set Kloudless source header
$.ajaxSetup({
  headers: {
    'X-Kloudless-Source': 'file-explorer',
  },
});

// This can be generalized in the future with a config option
const startView = (config.flavor() === 'dropzone') ? 'dropzone' : 'accounts';

const services = ko.pureComputed(() => {
  const result = {};
  ko.utils.arrayForEach(config.all_services(), (service) => {
    result[service.id] = service;
  });
  return result;
});

/**
 * Add mobile view class to body if mobile
 */
if (util.isMobile) {
  $('body').addClass('mobile-view');
}
// Explorer declaration.
const FileExplorer = function () {
  this.manager = new AccountManager();
  this.fileManager = new FileManager();

  this.id = (function () {
    let _id = storage.loadId();
    if (!_id) {
      _id = Math.floor(Math.random() * (10 ** 12));
      storage.storeId(_id);
    }
    return _id;
  }());

  this.exp_id = config.exp_id;

  // Track the last cancellation so Chooser responses received after
  // a cancellation are ignored. Saves are allowed to proceed due to
  // the new file already having been saved to the location.
  this.lastCancelTime = new Date();

  // View model setup.
  this.view_model = {
    // config
    flavor: config.flavor,
    enable_logout: config.enable_logout,
    delete_accounts_on_logout: config.delete_accounts_on_logout,

    // The current view: alternates between
    // 'files', 'accounts', 'computer', 'addConfirm', and 'dropzone'
    current: ko.observable(startView),
    isDesktop: !util.isMobile,

    // Save all files in FileManager to the selected directory
    save: () => {
      const { view_model, fileManager, manager } = this;
      // Set loading to true
      view_model.loading(true);

      // Grab the current location
      const current = manager.active().filesystem().current();
      const saves = [];

      // If you can save here
      if (current.can_upload_files) {
        const accountId = manager.active().filesystem().id;
        const authKey = manager.active().filesystem().key;
        let requestCountSuccess = 0;
        let requestCountError = 0;

        // Save Complete Callback
        const saveComplete = function (success) {
          if (success) {
            requestCountSuccess += 1;
          } else {
            requestCountError += 1;
            logger.warn('Error with ajax requests for save');
          }

          // All requests are done
          if (requestCountSuccess + requestCountError
            === fileManager.files().length) {
            view_model.postMessage('success', saves);
            logger.debug('Successfully uploaded files: ', saves);
          }
        };

        let choseOverwrite = false;
        let overwrite = false;
        for (let i = 0; i < fileManager.files().length; i += 1) {
          for (let k = 0; k < (current.children().length); k += 1) {
            if (current.children()[k].name === fileManager.files()[i].name) {
              overwrite = window.confirm(
                'Files already exist with the same names as the ones being '
                + 'uploaded. Click OK to overwrite existing files with the same'
                + ' name or Cancel to proceed without overwriting.',
              );
              choseOverwrite = true;
              break;
            }
          }
          if (choseOverwrite) {
            break;
          }
        }

        for (let i = 0; i < fileManager.files().length; i += 1) {
          const f = fileManager.files()[i];
          const file_data = {
            url: f.url,
            parent_id: current.id,
            name: $('.kloudless-saver-name').val() || f.name,
          };
          logger.debug('file_data.name: ', file_data.name);

          (function (event_data) {
            view_model.postMessage('startFileUpload', event_data);
            $.ajax({
              url: config.getAccountUrl(
                accountId, 'storage', `/files/?overwrite=${overwrite}`,
              ),
              type: 'POST',
              contentType: 'application/json',
              headers: { Authorization: `${authKey.scheme} ${authKey.key}` },
              data: JSON.stringify(file_data),
            }).done((data) => {
              saves.push(data);
              event_data.metadata = data;
              view_model.postMessage('finishFileUpload', event_data);
              saveComplete(true);
            }).fail((xhr, status, err) => {
              logger.warn('Error uploading file: ', status, err, xhr);
              saveComplete(false);
            });
          }({ name: file_data.name, url: file_data.url }));
        }
      } else {
        this.view_model.error(
          'Files cannot be saved to this folder. Please choose again.',
        );
        this.view_model.loading(false);
      }
    },

    // Select files or a folder.
    confirm: () => {
      if (processingConfirm) {
        return;
      }

      // Set loading to true
      this.view_model.loading(true);

      const current = this.manager.active().filesystem().current();
      const selections = [];
      let selectedType = 'file';

      const { table } = this.view_model.files;
      if (table) {
        const selectedElements = table.finderSelect('selected');
        for (let i = 0; i < selectedElements.length; i += 1) {
          // removing the parent reference.
          const { parent_obs, ...rest } = ko.dataFor(selectedElements[i]);
          selections.push(rest);
        }
      }

      if (selections.length === 0 && (
        config.types.includes('all') || config.types.includes('folders'))) {
        selectedType = 'folder';
        // removing the parent reference.
        const { parent_obs, ...rest } = current;
        selections.push(rest);
      }

      const accountId = this.manager.active().filesystem().id;
      const authKey = this.manager.active().filesystem().key;
      const { lastCancelTime } = this;

      let requestCountSuccess = 0;
      let requestCountError = 0;
      let requestCountStarted = 0;
      const maxRequestsInProgress = 4;
      const requestsToLaunch = [];

      const requestLauncherInterval = window.setInterval(() => {
        const requestsComplete = requestCountSuccess + requestCountError;
        let requestsInProgress = requestCountStarted - requestsComplete;
        while (requestsToLaunch.length > 0 &&
          requestsInProgress < maxRequestsInProgress) {
          const { fn, args } = requestsToLaunch.shift();
          fn.apply(this, args);
          requestsInProgress = requestCountStarted - requestsComplete;
        }
      }, 200);

      // Selection Complete Callback
      const selectionComplete = (success) => {
        if (success) {
          requestCountSuccess += 1;
        } else {
          requestCountError += 1;
          logger.warn('Error with ajax requests for selection');
        }

        if (this.lastCancelTime > lastCancelTime) {
          logger.info('A cancellation occurred prior to the operation ' +
            'being completed. Ignoring response.');
          processingConfirm = false;
          window.clearInterval(requestLauncherInterval);
          return;
        }

        // All requests are done
        if (requestCountSuccess + requestCountError === selections.length) {
          window.clearInterval(requestLauncherInterval);
          this.view_model.postMessage(
            requestCountError ? 'error' : 'success', selections,
          );
          processingConfirm = false;
        }
      };

      // Add the link at the last possible moment for error/async handling
      const createLink = (selection_index) => {
        const linkData = $.extend({}, config.link_options());
        linkData.file_id = selections[selection_index].id;

        $.ajax({
          url: config.getAccountUrl(accountId, 'storage', '/links/'),
          type: 'POST',
          headers: {
            Authorization: `${authKey.scheme} ${authKey.key}`,
          },
          contentType: 'application/json',
          data: JSON.stringify(linkData),
        }).done((data) => {
          selections[selection_index].link = data.url;
          selectionComplete(true);
        }).fail((xhr, status, err) => {
          logger.warn('Error creating link: ', status, err, xhr);
          selections[selection_index].error = xhr.responseJSON;
          selectionComplete(false);
        });
        requestCountStarted += 1;
      };

      const pollTask = (task_id, callbacks) => {
        const POLLING_INTERVAL = 3000; // in millisecond
        // eslint-disable-next-line no-param-reassign
        callbacks = callbacks || {};
        setTimeout(() => {
          $.ajax({
            url: config.getAccountUrl(accountId, 'tasks', `/${task_id}`),
            type: 'GET',
            headers: { Authorization: `${authKey.scheme} ${authKey.key}` },
          }).done((data) => {
            if (data.state && data.state.toUpperCase() === 'PENDING') {
              pollTask(task_id, callbacks);
            } else {
              // eslint-disable-next-line no-unused-expressions
              callbacks.onComplete && callbacks.onComplete(data);
            }
          }).fail((xhr, status, err) => {
            // eslint-disable-next-line no-unused-expressions
            callbacks.onError && callbacks.onError(xhr, status, err);
          });
        }, POLLING_INTERVAL);
      };

      const moveToDrop = function (type, selection_index) {
        const copyMode = config.copy_to_upload_location();
        const isTask = copyMode === 'sync' || copyMode === 'async';

        const queryParams = {};
        if (isTask) {
          queryParams.return_type = 'task';
        }
        if (type === 'file') {
          queryParams.link = config.link();
          queryParams.link_options = encodeURIComponent(
            JSON.stringify(config.link_options()),
          );
        }

        const queryStrings = Object.keys(queryParams)
          .map(key => `${key}=${queryParams[key]}`).join('&');
        const url = config.getAccountUrl(
          accountId, 'storage',
          `/${type === 'file' ? 'files' : 'folders'}` +
          `/${selections[selection_index].id}/copy?${queryStrings}`,
        );

        const data = {
          account: 'upload_location',
        };
        if (config.upload_location_account()) {
          data.drop_account = config.upload_location_account();
          data.parent_id = config.upload_location_folder();
        } else if (config.upload_location_uri()) {
          // used by Dev Portal
          data.drop_uri = config.upload_location_uri();
        }

        const headers = {
          Authorization: `${authKey.scheme} ${authKey.key}`,
        };
        if (type === 'folder') {
          headers['X-Kloudless-Async'] = true;
        }

        $.ajax({
          url,
          type: 'POST',
          contentType: 'application/json',
          headers,
          data: JSON.stringify(data),
        }).done((res) => {
          if (copyMode === 'sync') {
            // polling for the result (file metadata)
            pollTask(res.id, {
              onComplete(metadata) {
                selections[selection_index] = metadata;
                selectionComplete(true);
              },
              onError(xhr, status, err) {
                logger.error(
                  `Task[${res.id}] failed: ${JSON.stringify(err)}`,
                );
                selections[selection_index].error = xhr.responseJSON;
                selectionComplete(false);
              },
            });
          } else {
            selections[selection_index] = res;
            selectionComplete(true);
          }
        }).fail((xhr) => {
          selections[selection_index].error = xhr.responseJSON;
          selectionComplete(false);
        });
        requestCountStarted += 1;
      };

      // postMessage to indicate success.
      const copyToUploadLocation = config.copy_to_upload_location();
      if (selectedType === 'file' && selections.length > 0) {
        logger.debug('Files selected! ', selections);
        this.view_model.postMessage('selected', selections);

        if (copyToUploadLocation) {
          // Move to upload location.
          for (let i = 0; i < selections.length; i += 1) {
            requestsToLaunch.push({
              fn: moveToDrop, args: [selectedType, i],
            });
          }
        } else if (config.link()) {
          for (let i = 0; i < selections.length; i += 1) {
            processingConfirm = true;
            requestsToLaunch.push({ fn: createLink, args: [i] });
          }
        } else {
          this.view_model.postMessage('success', selections);
        }
        return;
      }
      if (selectedType === 'folder') {
        if (['sync', 'async'].includes(copyToUploadLocation)) {
          if (selections[0].id !== 'root') {
            const msg = 'Are you sure to copy the folder ' +
              ` '${selections[0].name}'?`;
            if (window.confirm(msg)) {
              // Move to upload location.
              requestsToLaunch.push({
                fn: moveToDrop, args: [selectedType, 0],
              });
              return;
            }
          } else {
            window.alert('Copying all data at once is not allowed.');
          }
        } else {
          this.view_model.postMessage('success', selections);
        }
        this.view_model.loading(false);
        return;
      }
      this.view_model.error('No files selected. Please select a file.');
      this.view_model.loading(false);
    },

    // Quit the file explorer.
    cancel: () => {
      logger.debug('Quitting!');
      this.lastCancelTime = new Date();
      // postMessage to indicate failure.
      this.view_model.postMessage('cancel');
    },
    /**
     * Compose action, data and some additional info to an object then send to
     * loader via window.parent.postMessage().
     * You can provide a callback function to get the response from loader.
     * Check 'GET_OAUTH_PARAMS' for example.
     */
    postMessage: (action, data, callback) => {
      const message = {
        exp_id: this.exp_id,
        type: 'explorer',
        action,
      };

      if (callback) {
        let callbackId = util.randomID();
        while (callbackId in EVENT_CALLBACKS) {
          callbackId = util.randomID();
        }
        message.callbackId = callbackId;
        EVENT_CALLBACKS[callbackId] = callback;
      }

      if (data !== undefined) {
        if (['selected', 'success', 'addAccount'].includes(action)
          && (config.account_key || config.retrieve_token())
          && config.user_data().trusted) {
          // Add in OAuth Token on success for files.

          const accountMap = {};
          ko.utils.arrayForEach(this.manager.accounts(), (account) => {
            accountMap[account.account] = account;
          });

          // Separate variable for cases where it isn't an array,
          // to reuse code.
          let addKeyToData = data;
          let accountIdField = 'account';
          if (action === 'addAccount') {
            addKeyToData = [data];
            accountIdField = 'id';
          }

          // Add OAuth Token
          ko.utils.arrayForEach(addKeyToData, (d) => {
            const account = accountMap[d[accountIdField]];
            if (account !== undefined) {
              if (config.retrieve_token()) {
                d.bearer_token = { key: account.bearer_token };
              }
              if (config.account_key) {
                d.account_key = { key: account.account_key };
              }
            }
          });
        }
        message.data = data;
      }
      window.parent.postMessage(JSON.stringify(message), config.origin);
    },

    sync: (accounts, loadStorage) => {
      // if loadStorage, remove local accounts and load from storage
      // if not loadStorage, store local accounts into storage

      logger.debug('syncing...');

      // remove all old accounts
      if (loadStorage) {
        this.manager.accounts.removeAll();
      }

      // add new accounts because data may have changed
      let active;
      accounts.forEach((account) => {
        // eslint-disable-next-line no-unused-vars
        const created = new Account(
          account,
          (acc) => {
            if (acc.connected()) {
              this.manager.addAuthedAccount(acc);

              if (!active) {
                active = true;
                this.manager.active(this.manager.getByAccount(acc.account));
              }

              if (!loadStorage) {
                storage.storeAccounts(config.app_id, this.manager.accounts());
              }
            }

            // if no valid accounts from local storage are loaded
            if (this.manager.accounts().length === 0) {
              // eslint-disable-next-line no-use-before-define
              router.setLocation('#/accounts');
            } else if (config.flavor() !== 'dropzone') {
              // eslint-disable-next-line no-use-before-define
              router.setLocation('#/files');
            }
          },
          (err) => {
            this.view_model.loading(false);

            // if it errors on root folder metadata, we shouldn't add it
            if (err && err.message === 'failed to retrieve root folder') {
              logger.warn('failed to load account from localStorage');
              this.manager.removeAccount(account.account);
              // store accounts
              storage.storeAccounts(config.app_id, this.manager.accounts());
              // else if it errors on folder contents, we should show an error
            } else if (err) {
              logger.warn('failed to refresh filesystem', err);
              this.view_model.error('Error occurred. Please try again.');
            } else {
              this.view_model.error('');
            }

            // need to make sure on files view since we're loading
            // asynchronously from local storage
            // eslint-disable-next-line no-use-before-define
            if (first_account && this.view_model.current() === 'files') {
              // eslint-disable-next-line no-use-before-define
              router.setLocation('#/files');
              first_account = false; // eslint-disable-line no-use-before-define
            }

            // need to make sure on accounts view since... ^^^
            if (this.manager.accounts().length === 0) {
              // eslint-disable-next-line no-use-before-define
              router.setLocation('#/accounts');
            }
          },
        );
      });
    },

    setLocation(path) {
      /*
       We override setLocation in the router, so this let's us bypass the
       hash actually changing.
       */
      // eslint-disable-next-line no-use-before-define
      router.setLocation(path);
    },

    // Request states.
    error: ko.observable(''),
    loading: ko.observable(true),

    localizedConfirmPopup(token, variables) {
      try {
        // eslint-disable-next-line no-unused-expressions
        window.top.document;
      } catch (e) {
        // DOMException: the widget is embedded by a page from different domain
        // we cannot inspect if allow-modals is set in the parent page, so
        // assume it is disabled
        return true;
      }
      return window.confirm(
        localization.formatAndWrapMessage(token, variables),
      );
    },

    logo_url: ko.pureComputed(() => (config.user_data() || {}).logo_url || ''),

    static(path) {
      return `${config.static_path.replace(/\/$/, '')}/${
        path.replace(/^\//, '')}`;
    },

    // Accounts view model.
    accounts: {
      // List of all account objects.
      all: this.manager.accounts,

      // Current active service
      active: ko.pureComputed(function () {
        if (this.view_model.current() === 'computer') {
          return 'computer';
        }
        return this.manager.active().service;
      }, this),

      active_logo: ko.pureComputed(function () {
        return `${config.static_path}/webapp/sources/${
          this.view_model.accounts.active()}.png`;
      }, this),

      logout: (deleteAccount) => {
        const accounts = this.manager.accounts().map(acc => acc.account);
        accounts.forEach((account) => {
          this.manager.deleteAccount(
            account, deleteAccount,
            (acc) => {
              // post message for account
              this.view_model.postMessage('deleteAccount', acc.account);
            },
          );
        });

        storage.removeAllAccounts(config.app_id);
        // eslint-disable-next-line no-use-before-define
        router.setLocation('#/accounts');
        this.view_model.postMessage('logout');
      },

      // Current active service name
      name: ko.pureComputed(function () {
        if (this.view_model.current() === 'computer') {
          return 'My Computer';
        }
        return this.manager.active().account_name;
      }, this),

      // Returns hash mapping service name to an array of account objects.
      by_service: ko.computed(function () {
        const accounts = this(); // gimmick to register observer with KO
        const output = {};

        for (let i = 0; i < accounts.length; i += 1) {
          if (!(accounts[i].service in output)) {
            output[accounts[i].service] = [];
          }
          output[accounts[i].service].push(accounts[i]);
        }

        return output;
      }, this.manager.accounts),

      // Connect new account.
      connect: (service) => {
        // if clicking on computer, switch to computer view
        if (service === 'computer') {
          // eslint-disable-next-line no-use-before-define
          router.setLocation('#/computer');
          return;
        }

        logger.debug(`Account connection invoked for service: ${service}.`);
        const serviceData = services()[service];

        // post message to get OAuth parameters
        const getOAuthParams = new Promise((resolve) => {
          this.view_model.postMessage(
            'GET_OAUTH_PARAMS', { service }, resolve,
          );
        });

        getOAuthParams.then(({ oauthParams }) => {
          this.manager.addAccount(service, oauthParams, {
            on_confirm_with_iexd: () => {
              this.view_model.addConfirm.serviceName = serviceData.name;
              this.view_model.addConfirm.serviceLogo = serviceData.logo;

              // eslint-disable-next-line no-use-before-define
              router.setLocation('#/addConfirm');

              // position the iframe on the modal;
              //
              // note that we can't move the iframe in the DOM (e.g. to be a
              // child of some element in our template) because that will
              // force a reload, and we'll lose all existing state
              // --> http://stackoverflow.com/q/7434230/612279

              setTimeout(() => {
                const button = $('#confirm-add-button');
                const pos = button.offset();

                $(auth.iframe).css({
                  top: `${pos.top}px`,
                  left: `${pos.left}px`,
                  width: button.outerWidth(),
                  height: button.outerHeight(),
                }).show();
              }, 0);
            },
            on_account_ready: (account) => {
              // eslint-disable-next-line no-use-before-define
              logger.debug('Redirecting to files view? ', first_account);

              // Don't allow duplicate accounts
              for (let i = 0; i < this.manager.accounts().length; i += 1) {
                const acc = this.manager.accounts()[i];
                // eslint-disable-next-line eqeqeq
                if (acc.account == account.account) {
                  // Delete existing account to be overridden by new account
                  this.manager.removeAccount(acc.account);
                }
              }

              this.manager.accounts.push(account);

              if (Object.keys(ko.toJS(this.manager.active)).length === 0) {
                this.manager.active(
                  this.manager.getByAccount(account.account),
                );
              }

              // post message for account
              this.view_model.postMessage('addAccount', {
                id: account.account,
                name: account.account_name,
                service: account.service,
              });

              // eslint-disable-next-line no-use-before-define
              if (first_account) {
                this.view_model.loading(true);
                // eslint-disable-next-line no-use-before-define
                router.setLocation('#/files');
              } else {
                // eslint-disable-next-line no-use-before-define
                router.setLocation('#/accounts');
              }
            },
            on_fs_ready: (err) => {
              // eslint-disable-next-line no-use-before-define
              if (err && error_message) {
                // eslint-disable-next-line no-use-before-define
                this.view_model.error(error_message);
              } else if (err) {
                this.view_model.error(err.message);
              } else {
                this.view_model.error('');
              }

              // eslint-disable-next-line no-use-before-define
              if (first_account) {
                this.view_model.loading(false);
                // eslint-disable-next-line no-use-before-define
                first_account = false;
              }

              // store accounts
              storage.storeAccounts(config.app_id, this.manager.accounts());
            },
          });
        });
      },
      computer: config.visible_computer,
      account_management: config.account_management,
    },

    // addConfirm view model
    addConfirm: {},

    // Files view model.
    files: {
      all: this.fileManager.files,
      // Compute breadcrumbs.
      breadcrumbs: ko.computed(() => {
        const activeAccount = this.manager.active();
        // check to make sure an active account is set
        if (Object.keys(activeAccount).length === 0) {
          return util.isMobile ? ['/'] : null;
        }
        const paths = activeAccount.filesystem().path();
        return util.isMobile ? ['/'].concat(paths) : paths;
      }),
      // Return active service
      service: ko.computed(() => this.manager.active().service),
      service_friendly: ko.computed(() => {
        const activeAccount = this.manager.active();
        const allServices = services();
        if (!activeAccount.service) {
          return '';
        }
        if (!allServices[activeAccount.service]) {
          return '';
        }
        return allServices[activeAccount.service].name;
      }),
      // Compute current working directory.
      cwd: ko.computed(() => {
        const activeAccount = this.manager.active();
        if (Object.keys(activeAccount).length === 0) {
          return null;
        }
        logger.debug('Recomputing cwd...');
        return activeAccount.filesystem().cwd();
      }),
      // Relative navigation.
      navigate: (file) => {
        logger.debug('Navigating to file: ', file);
        let target = file;
        const parent = this.manager.active().filesystem().PARENT_FLAG;
        if (typeof file === 'string' && file === parent) {
          target = parent;
        }
        // remove properties that are only for internal use
        const target2 = Object.assign({}, target);
        delete target2.friendlySize;

        this.view_model.loading(true);
        this.manager.active().filesystem().navigate(target2, (err, result) => {
          logger.debug('Navigation result: ', err, result);
          this.view_model.loading(false);
          // eslint-disable-next-line no-use-before-define
          if (err && error_message) {
            // eslint-disable-next-line no-use-before-define
            return this.view_model.error(error_message);
          } if (err) {
            return this.view_model.error(err.message);
          }
          return this.view_model.error('');
        });
      },
      // Breadcrumb navigation.
      navUp(obj) {
        // prevent up() from being called recursively (by `change` binding)
        if (obj.navTimer) return;
        obj.navTimer = setTimeout(() => {
          delete obj.navTimer;
        }, 1000);
        const index = this.breadcrumbs().indexOf($('.navigator').val());
        const level = Math.max(0, this.breadcrumbs().length - index - 1);
        this.up(level);
      },
      up: (count) => {
        logger.debug(`Going up ${count} directories.`);

        this.view_model.loading(true);
        this.manager.active().filesystem().up(count, (err) => {
          this.view_model.loading(false);
          // eslint-disable-next-line no-use-before-define
          if (err && error_message) {
            // eslint-disable-next-line no-use-before-define
            return this.view_model.error(error_message);
          }
          if (err) {
            return this.view_model.error(err.message);
          }
          return this.view_model.error('');
        });
      },
      mkdir: () => {
        this.view_model.loading(true);
        const name = $('.new-folder-name').val();
        logger.debug('New folder name', name);
        this.manager.active().filesystem().mkdir(name, (err, result) => {
          // update first entry
          // eslint-disable-next-line no-use-before-define
          if (err && error_message) {
            // eslint-disable-next-line no-use-before-define
            this.view_model.error(error_message);
          } else if (err) {
            this.view_model.error(err.message);
          } else {
            this.view_model.error('');
            const dir = this.manager.active().filesystem().updatedir(result);
            if (dir) {
              this.view_model.files.navigate(dir);
            }
          }
          this.view_model.loading(false);
        });
      },
      newdir: () => {
        if (this.manager.active().filesystem().current().can_create_folders) {
          this.manager.active().filesystem().newdir();
        } else {
          this.view_model.error(
            'Sorry! Folders cannot be created in this directory',
          );
        }
      },
      rmdir: () => {
        this.manager.active().filesystem().rmdir();
      },
      refresh: () => {
        logger.debug('Refreshing current directory');
        this.view_model.loading(true);
        this.manager.active().filesystem().refresh(true, (err) => {
          this.view_model.loading(false);
          // eslint-disable-next-line no-use-before-define
          if (err && error_message) {
            // eslint-disable-next-line no-use-before-define
            return this.view_model.error(error_message);
          }
          if (err) {
            return this.view_model.error(err.message);
          }
          return this.view_model.error('');
        });
      },
      sort: (option) => {
        this.manager.active().filesystem().sort(option);
      },
      searchQuery: ko.observable(''),
      search: () => {
        const { manager, view_model } = this;
        (function (query) {
          if (query === '') {
            view_model.files.refresh();
            return;
          }
          view_model.loading(true);
          const currentFs = manager.active().filesystem();
          const s = new Search(currentFs.id, currentFs.key, query);
          s.search(() => {
            const fs = manager.active().filesystem();
            fs.display(fs.filterChildren(s.results.objects));
            view_model.loading(false);
          }, () => {
            view_model.error('The search request was not successful.');
            view_model.loading(false);
          });
        }(view_model.files.searchQuery()));
      },

      allow_newdir: config.create_folder,

      // Placeholder for finderSelect'd jQuery object.
      table: null,
    },

    // Computer view model.
    computer: {},

    // List of supported services. Used to render things on the accounts page.
    services,
  };


  this.view_model.files.searchQuery.extend({
    rateLimit: {
      timeout: 250,
      method: 'notifyWhenChangesStop',
    },
  });
  this.view_model.files.searchQuery.subscribe(
    this.view_model.files.search, this,
  );

  ko.applyBindings(this.view_model, $('#kloudless-file-explorer')[0]);
};

// Switch views between 'accounts', 'files', and 'computer'.
FileExplorer.prototype.switchViewTo = function (to) {
  const explorer = this;
  explorer.view_model.current(to);

  // When view is changed, the old view template is unloaded.
  if (to !== 'dropzone') {
    dropzoneLoaded = false;
  }

  if (to === 'dropzone') {
    const dz = $('#dropzone');
    dz.on('click', () => {
      explorer.view_model.postMessage('dropzoneClicked');
    });

    // Make sure to only load the dropzone once
    if (!dropzoneLoaded) {
      const dropzone = new mOxie.FileDrop({
        drop_zone: dz.get(0),
      });

      // Because templates are re-rendered on view change, don't add
      // dropped files to the computer view uploader immediately.
      // Instead, add it to a queue that will be processed after
      // the router switches to the computer view.
      dropzone.ondrop = function () {
        explorer.view_model.postMessage('drop');
        filesQueue.push(dropzone.files);
        // eslint-disable-next-line no-use-before-define
        router.setLocation('#/computer');
      };

      dropzone.init();
      dropzoneLoaded = true;
    }
  }

  if (to !== 'addConfirm') {
    $(auth.iframe).hide();
  }

  if ($('#search-query').is(':visible')) {
    $('#search-back-button').trigger('click');
  }

  if ($('.accountsbutton')) {
    $('.accountsbutton').dropdown('hide');
  }

  // Initialise jQuery dropdown plugin.
  if (to === 'files' || to === 'computer') {
    $('.accountsbutton').dropdown('attach', ['#account-dropdown']);

    // Since we're not using foundation, add click handler to 'x'
    $('.close').off('click');
    $('.close').on('click', (e) => {
      // clear the error
      explorer.view_model.error('');
      e.preventDefault();
      e.stopPropagation();
    });
  }

  // Initialise infinite scroll
  if (to === 'files') {
    const $fsViewBody = $('#fs-view-body');
    $fsViewBody.off('scrollstop');
    $fsViewBody.on('scrollstop', () => {
      const scrolled = $fsViewBody.scrollTop();
      const tableHeight = $fsViewBody.outerHeight();
      const contentHeight = $fsViewBody[0].scrollHeight;

      // load more
      const fileSystem = explorer.manager.active().filesystem();
      // we can consider tableHeight as a page of a book
      // people would want to fetch some more pages (if available) to read
      // before they reach and finish the last page they currently possess
      if (fileSystem.page && (scrolled + tableHeight * 2) >= contentHeight) {
        explorer.view_model.loading(true);
        fileSystem.getPage(() => {
          explorer.view_model.loading(false);
        });
      }
    });

    // Search jquery actions
    $('.search').off('click');
    $('#search-enable-button, #search-back-button').on('click', () => {
      $('.refresh-button, #search-back-button').toggle();
      // the following 2 vars are purely for styles.
      const searchActiveClass = 'search-active';
      const searchActiveData = `data-${searchActiveClass}`;
      const $fileTable = $('.clickable');
      if ($fileTable.attr(searchActiveData)) {
        $fileTable.removeAttr(searchActiveData);
      } else {
        $fileTable.attr(searchActiveData, true);
      }
      const duration = 150;
      if ($('#search-query').is(':visible')) {
        $('#search-enable-button').removeClass(searchActiveClass);
        explorer.view_model.files.refresh();
        // Slide along with search query
        $('#search-enable-button').animate({
          left: '+=360',
        }, duration);
        $('#search-enable-button').animate({
          left: '-=360',
        }, 0);
        $('#search-query').toggle('slide', {
          direction: 'right',
        }, duration, () => {
          $('.breadcrumbs, .new-folder-button').toggle();
        });
        $('#search-query').val('');
      } else {
        $('#search-enable-button').addClass(searchActiveClass);
        $('.new-folder-button, .breadcrumbs').toggle();
        $('#search-enable-button').animate({
          left: '+=360',
        }, 0);
        $('#search-enable-button').animate({
          left: '-=360',
        }, duration);
        $('#search-query').toggle('slide', {
          direction: 'right',
        }, duration);
        $('#search-query').focus()
          .off('keyup')
          .on('keyup', (e) => {
            // eslint-disable-next-line eqeqeq
            if (e.keyCode == 27) { // Escape key
              $('#search-back-button').click();
              e.stopPropagation();
            }
          });
      }
    });
  }

  if (to === 'computer') {
    // eslint-disable-next-line no-use-before-define
    initializePlUpload();
  }
};

function initializePlUpload() {
  $(() => {
    let selections = [];
    const filtered_types = [];
    // if not default 'all' or 'files', add the mimetypes
    if ((!config.types.includes('all') && !config.types.includes('files'))
      || config.types.length !== 1) {
      filtered_types.push({
        title: 'Uploadable files',
        extensions: config.types.join(','),
      });
    }

    const upload_url = (config.upload_location_uri() ||
      (`${config.base_url}/drop/${config.app_id}`));

    function formatFileObject(file) {
      /**
       * Format a file info dict to be emitted to the API.
       *
       * Returns a subset of the info (rather than returning a
       * Pluploadfile object) to avoid exposing internals that may
       * change.
       */
      return {
        id: file.id,
        name: file.name,
        size: file.size,
        mime_type: file.type,
      };
    }

    // Default cancel button action.
    $('#cancel-button').click(() => {
      // eslint-disable-next-line no-use-before-define
      explorer.view_model.cancel();
    });

    $('#uploader').plupload({
      // Required
      url: upload_url,
      // browse_button: "uploader",

      // Filters
      filters: (function () {
        const filters = {
          max_file_size: '50000mb',
          prevent_duplicates: false, // unique_names instead.
          mime_types: filtered_types,
        };

        // Don't set to 0, because it forces 0 files to be selected.
        // Happens even though the default is supposed to be 0.
        if (!config.multiselect()) {
          filters.max_file_count = 1;
        }

        return filters;
      }()),

      // Multipart / Chunking
      multipart: false,
      multipart_params: {},
      chunk_size: config.chunk_size,
      max_retries: 2,

      // Parallelize
      max_upload_slots: 6,

      // Misc
      // See http://www.plupload.com/docs/Frequently-Asked-Questions#when-to-use-chunking-and-when-not
      // for omitting flash when chunking is possible.
      runtimes: 'html5',

      // Rename files by clicking on their titles
      rename: true,

      // Unique file names
      // This is set to false because we use the file ID
      // to identify the file instead.
      unique_names: false,

      // Sort files
      sortable: true,

      // Enable ability to drag'n'drop files onto the widget
      // (currently only HTML5 supports that)
      dragdrop: true,

      browse_button: 'custom-add',

      container: 'custom-add-container',

      // Views to activate
      views: {
        list: true,
        thumbs: false, // Hide thumbs
        active: 'list', // 'thumbs' is another possible view.
      },

      init: {
        PostInit() {
          const uploader = this;

          // Add drag & dropped files
          for (let i = 0; i < filesQueue.length; i += 1) {
            uploader.addFile(filesQueue[i]);
          }
          filesQueue = [];

          // enable the browse button
          $('#uploader_browse').removeAttr('disabled');
          // Add pause/resume upload handler
          $('#upload-button').click(function () {
            if ($(this).text() === 'Upload') {
              $(this).text('Pause');
              uploader.start();
              // eslint-disable-next-line no-use-before-define
              explorer.view_model.loading(true);
            } else if ($(this).text() === 'Pause') {
              $(this).text('Resume');
              uploader.stop();
              // eslint-disable-next-line no-use-before-define
              explorer.view_model.loading(false);
            } else if ($(this).text() === 'Resume') {
              $(this).text('Pause');
              uploader.start();
              // eslint-disable-next-line no-use-before-define
              explorer.view_model.loading(true);
            }
          });
          // Add confirmation when closing tabs during uploading process
          // eslint-disable-next-line consistent-return
          $(window).bind('beforeunload', () => {
            // Add confirmation if not IE or IE 11 only.
            // eslint-disable-next-line eqeqeq
            if (util.isIE == false || util.ieVersion == 11) {
              if (uploader.total.queued > 0) {
                const msg = (
                  'Are you sure you want to close this tab? You have an' +
                  ' upload in progress.');
                return msg;
              }
            }
          });

          // Add abort upload handler
          $('#cancel-button').off();
          $('#cancel-button').on('click', () => {
            const msg = (
              'Are you sure you want to cancel? You have an' +
              ' upload in progress.');
            if (uploader.total.queued > 0) {
              uploader.stop();
              if (window.confirm(msg)) {
                $('#upload-button').text('Upload');

                const file_ids_to_abort = uploader.files
                  .filter(f => (
                    [plupload.QUEUED, plupload.UPLOADING].includes(f.status)))
                  .map(f => f.id);

                uploader.splice();
                // eslint-disable-next-line no-use-before-define
                explorer.view_model.cancel();

                // Abort asynchronously.
                window.setTimeout(() => {
                  $.each(file_ids_to_abort, (index, id) => {
                    // eslint-disable-next-line no-use-before-define
                    const headers = { 'X-Explorer-Id': explorer.id };
                    const uploadAccount = config.upload_location_account();
                    const uploadFolder = config.upload_location_folder();
                    if (uploadAccount && uploadFolder) {
                      // A specific Upload Location is being used.
                      headers['X-Drop-Account'] = uploadAccount;
                      headers['X-Drop-Folder'] = uploadFolder;
                    }

                    // Add a query parameter.
                    const parser = document.createElement('a');
                    parser.href = upload_url;
                    parser.search += `file_id=${id}`;

                    $.ajax({
                      url: parser.href,
                      type: 'DELETE',
                      headers,
                    });
                  });
                }, 0);
              } else {
                uploader.start();
              }
            } else {
              // eslint-disable-next-line no-use-before-define
              explorer.view_model.cancel();
            }
          });

          $(window).off('offline').on('offline', () => {
            // eslint-disable-next-line eqeqeq
            if (uploader.state == plupload.STARTED) {
              uploader.stop();
              uploader._offline_pause = true;
              $('#upload-button').text('Resume');
              // eslint-disable-next-line no-use-before-define
              explorer.view_model.error(
                'Uploading has been paused due to disconnection.',
              );
            }
          });

          $(window).off('online').on('online', () => {
            if (uploader._offline_pause) {
              uploader._offline_pause = false;
              uploader.start();
              $('#upload-button').text('Pause');
              // eslint-disable-next-line no-use-before-define
              explorer.view_model.error('');
            }
          });
        },
        BeforeUpload(up, file) {
          /**
           * Called just before a file begins to upload. Called once
           * per file being uploaded.
           */
          up.settings.multipart_params = up.settings.multipart_params || {};
          up.settings.multipart_params.file_id = file.id;
          up.settings.multipart_params.file_size = file.size;
          if (config.link()) {
            up.settings.multipart_params.link = true;
            up.settings.multipart_params.link_options = JSON.stringify(
              config.link_options(),
            );
          }

          up.settings.headers = up.settings.headers || {};
          // Not using up.id because it changes with every plUpload().
          // eslint-disable-next-line no-use-before-define
          up.settings.headers['X-Explorer-Id'] = explorer.id;
          const uploadAccount = config.upload_location_account();
          const uploadFolder = config.upload_location_folder();
          if (uploadAccount && uploadFolder) {
            // A specific Upload Location is being used.
            up.settings.headers['X-Drop-Account'] = uploadAccount;
            up.settings.headers['X-Drop-Folder'] = uploadFolder;
          }

          // eslint-disable-next-line no-use-before-define
          explorer.view_model.error('');
          // eslint-disable-next-line no-use-before-define
          explorer.view_model.postMessage('startFileUpload',
            formatFileObject(file));
        },
        FileUploaded(up, file, info) {
          /**
           * Called just after a file has been successfully uploaded to
           * Kloudless. Called once per file being uploaded.
           */
          // eslint-disable-next-line eqeqeq
          if (info.status == 200 || info.status == 201) {
            const responseData = JSON.parse(info.response);
            if (Object.keys(responseData).length > 5) {
              selections.push(responseData);
            }

            const data = formatFileObject(file);
            data.metadata = responseData;
            // eslint-disable-next-line no-use-before-define
            explorer.view_model.postMessage('finishFileUpload', data);
          }
        },
        Error(up, args) {
          // file extension error
          // eslint-disable-next-line eqeqeq
          if (args.code == plupload.FILE_EXTENSION_ERROR) {
            const filter_msg = `Please upload files of the following types: ${
              config.types.join(', ')}.`;
            // eslint-disable-next-line no-use-before-define
            explorer.view_model.error(filter_msg);
            // eslint-disable-next-line eqeqeq
          } else if (args.code == plupload.HTTP_ERROR) {
            logger.error(`Error uploading file '${args.file.name}': ${
              args.response}`);
            if (config.uploads_pause_on_error()) {
              // eslint-disable-next-line no-use-before-define
              explorer.view_model.error(
                'Uploading has been paused due to errors. Resume to retry.',
              );

              // Reset the % loaded for the file in the UI
              // plupload only resets file.loaded in handleError(),
              // so we need to fix file.percent.
              args.file.percent = Math.ceil(
                args.file.loaded / args.file.size * 100,
              );
              args.file.status = plupload.UPLOADING;
              up.trigger('UploadFile', args.file);

              setTimeout(() => {
                // Update the UI after re-queueing the file to allow the file to
                // be deleted from the queue if needed.
                args.file.status = plupload.QUEUED;
                up.trigger('UploadFile', args.file);
              }, 50);

              $('#upload-button').click(); // Pause the upload.
            } else {
              up.removeFile(args.file);
              up.stop();
              up.start();
            }
          }
        },
        UploadComplete() {
          $('#upload-button').text('Upload');
          // eslint-disable-next-line no-use-before-define
          explorer.view_model.postMessage('success', selections);
          selections = [];
          this.splice();
        },
      },
    });
  });
}

FileExplorer.prototype.cleanUp = function () {
  // File Explorer will close. Clean up.
  const self = this;
  processingConfirm = false;

  if ($('#search-query').is(':visible')) {
    $('#search-back-button').click();
  }
  self.view_model.loading(false);
  self.view_model.error('');
  if (self.view_model.files.table) {
    self.view_model.files.table.finderSelect('unHighlightAll');
  }
  self.fileManager.files.removeAll(); // Saver
};

ko.bindingHandlers.finderSelect = {
  init(element, valueAccessor) {
    const selector = $(element).finderSelect({
      children: 'tr[data-type="file"]',
      enableClickDrag: config.multiselect(),
      enableShiftClick: config.multiselect(),
      enableCtrlClick: config.multiselect(),
      enableSelectAll: config.multiselect(),
    });
    const files = ko.unwrap(valueAccessor());
    files.table = selector;
  },
  update(element) {
    $(element).finderSelect('update');
  },
};

// Explorer initialisation.
const explorer = new FileExplorer();
// TODO: we can display err.message if the new error handling is deployed
// for now use default error message
const error_message = 'Error! Please try again or contact support.';

// Router.
let first_account = true;
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
    explorer.switchViewTo('accounts');
  });

  // Reconnect an erroneously disconnected account.
  // WARNING: THIS HAS NOT YET BEEN IMPLEMENTED.
  this.get('#/account/reconnect/:id', function () {
    logger.debug(`Account reconnection invoked for id: ${this.params.id}.`);
  });

  // Disconnect an account.
  this.get('#/account/disconnect/:id', function () {
    logger.debug(`Account disconnection invoked for id: ${this.params.id}.`);

    explorer.manager.deleteAccount(this.params.id, true, (account_data) => {
      // post message for account
      explorer.view_model.postMessage('deleteAccount',
        account_data.account);
      // store accounts
      storage.storeAccounts(config.app_id, explorer.manager.accounts());
    });
  });

  // Switch to the files page.
  this.get('#/files', () => {
    logger.debug('File view requested.');
    explorer.switchViewTo('files');
  });
  // Switch to the files view of a particular account.
  // TODO: test.
  this.get('#/files/:account', function () {
    logger.debug(`Switching to files of account: ${this.params.account}.`);
    explorer.switchViewTo('files');
    explorer.manager.active(explorer.manager.getByAccount(this.params.account));
  });
  // Switch to the computer view
  this.get('#/computer', () => {
    logger.debug('Switching to computer view');
    explorer.switchViewTo('computer');
  });
  // Switch to the dropzone view
  this.get('#/dropzone', () => {
    explorer.switchViewTo('dropzone');
  });
  // Confirm add account button
  this.get('#/addConfirm', () => {
    explorer.switchViewTo('addConfirm');
  });

  /*
   * Additional initialization steps.
   */

  this.get('#/', () => {
    router.setLocation('#/accounts');
  });
});

const accountSub = config.all_services.subscribe(() => {
  // This is only for the initial load.
  if (!config._retrievedServices) {
    return;
  }

  accountSub.dispose();

  // Default to the accounts page if no accounts in local storage
  // storage.removeAllAccounts(config.app_id);
  const accounts = storage.loadAccounts(config.app_id);

  if (accounts.length > 0) {
    explorer.view_model.sync(accounts, true);
  }
});

// Expose hooks for debugging.
if (config.debug) {
  window.explorer = explorer;
  window.ko = ko;
  window.router = router;
}

/*
 * Message Event listener, dispatch and handlers.
 * TODO: Move to separate module?
 */

// Initialize to '#/' route.
window.addEventListener('message', (message) => {
  logger.debug('Explorer hears message: ', message.data);
  if (message.origin !== config.origin) {
    return;
  }

  const { action, data, callbackId } = JSON.parse(message.data);
  // TODO: future config options
  if (action === 'INIT') {
    // eslint-disable-next-line no-use-before-define
    dataMessageHandler(data);
    if (startView && startView !== 'accounts') {
      router.run(`#/${startView}`);
    } else {
      router.run('#/');
    }
  } else if (action === 'DATA') {
    // eslint-disable-next-line no-use-before-define
    dataMessageHandler(data);
  } else if (action === 'CLOSING') {
    explorer.cleanUp();
  } else if (action === 'LOGOUT') {
    explorer.view_model.accounts.logout(false);
  } else if (action === 'LOGOUT:DELETE_ACCOUNT') {
    explorer.view_model.accounts.logout(true);
  } else if (action === 'CALLBACK' && callbackId
    && EVENT_CALLBACKS[callbackId]) {
    EVENT_CALLBACKS[callbackId](data);
    delete EVENT_CALLBACKS[callbackId];
  }
});

function dataMessageHandler(data) {
  // Used to initialize the explorer with data and config options.
  // Can also be used to update config options.

  /*
   * NOTE: This code is bad practice. config.flavor should be an observable
   * that is subscribed to by any methods wanting to be notified of a change.
   * TODO: Change this.
   */

  if (!data) {
    logger.error('dataMessageHandler: No data found to configure with.');
    return;
  }

  const { flavor, options, files } = data;

  // Differentiate between saver and chooser
  // Check the flavor on init call
  if (flavor) {
    // refresh and go back to accounts if going from saver to chooser
    // or vice versa
    if (config.flavor() !== flavor) {
      logger.debug('SWITCHING FLAVORS');
      router.setLocation('#/accounts');
    }

    config.flavor(flavor);
  }

  // Primary way of updating config options
  if (options) {
    config.update(options);
  }

  if (flavor === 'saver') {
    // Add files to fileManager
    if (files && files.length > 0) {
      // first clear all files.
      explorer.fileManager.files.removeAll();
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        explorer.fileManager.add(file.url, file.name);
      }
    }
  } else if (flavor === 'chooser') {
    // Default to computer view if account management is disabled and no
    // tokens are provided.
    if (config.visible_computer() && !config.account_management() &&
      !(options && options.tokens && options.tokens.length > 0)) {
      router.setLocation('#/computer');
    }
  } else if (flavor === 'dropzone') {
    router.setLocation('#/dropzone');
  }

  // Call sync if frame has already been initialized and there are differences
  // between storage and current accounts
  if (explorer.manager.accounts().length !== 0) {
    const accounts = storage.loadAccounts(config.app_id);
    const local_accounts = explorer.manager.accounts();
    const accountSet = new Set(accounts.map(acc => String(acc.account)));
    const different = accounts.length !== local_accounts.length
      || local_accounts.some(acc => !accountSet.has(String(acc.account)));
    // logger.debug(different || accounts.length != local_accounts.length);
    if (different) {
      // Call asynchronously to give other options some time to load.
      window.setTimeout(() => {
        explorer.view_model.sync(accounts, true);
      }, 0);
    }
  }

  /*
   * Options
   */

  // account key and token data

  if (data.options && data.options.keys) {
    config.api_version = 'v0';
    window.setTimeout(() => {
      explorer.view_model.sync(
        data.options.keys.map(k => ({ key: k, scheme: 'AccountKey' })), true,
      );
    }, 0);
  }

  if (data.options && data.options.tokens) {
    window.setTimeout(() => {
      explorer.view_model.sync(
        data.options.tokens.map(k => ({ key: k, scheme: 'Bearer' })), true,
      );
    }, 0);
  }

  if (config.visible_computer() && !loadedDropConfig
    && !config.upload_location_uri()) {
    // Looking up chunk size. Since the drop location doesn't really
    // change we look it up based on that. The /drop end point for the
    // API returns the chunk size for that drop location.
    $.ajax({
      method: 'GET',
      url: `${config.base_url}/drop/${config.app_id}`,
      beforeSend(xhr) {
        if (config.upload_location_account()) {
          xhr.setRequestHeader(
            'X-Drop-Account', config.upload_location_account(),
          );
          xhr.setRequestHeader(
            'X-Drop-Folder', config.upload_location_folder(),
          );
        }
      },
    }).done((drop_information) => {
      config.chunk_size = drop_information.chunk_size;
      loadedDropConfig = true;
      config.computer(true);
    }).fail(() => {
      // Disable computer if no drop location is set.
      logger.warn('Disabling Computer since no Upload Location set.');
      config.computer(false);
    });
  }
}

// This signal is placed last and indicates all the JS has loaded
// and events can be received.
explorer.view_model.postMessage('load');
