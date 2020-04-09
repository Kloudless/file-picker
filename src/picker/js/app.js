/* global mOxie, VERSION */
/* eslint-disable func-names, no-underscore-dangle, camelcase, no-alert */
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import $ from 'jquery';
import 'jquery-ui/ui/jquery-ui';
import 'jquery-scrollstop/jquery.scrollstop';
import 'jquery.finderSelect';
import 'cldrjs';
import ko from 'knockout';
import logger from 'loglevel';
import debounce from 'lodash.debounce';
import config from './config';
import storage from './storage';
import AccountManager from './accounts';
import FileManager from './files';
import auth from './auth';
import Search from './models/search';
import util from './util';
import localization from './localization';
import Account from './models/account';
import setupDropdown from './dropdown';
import adjustBreadcrumbWidth from './breadcrumb';
import './iexd-transport';
import 'normalize.css';
import '../css/index.less';
import routerHelper from './router-helper';
import pluploadHelper from './plupload-helper';
import iziToastHelper from './izitoast-helper';
import { VIEW, FLAVOR } from './constants';

const FOCUSED_FOLDER_SELECTOR = 'tr.ftable__row--focus:not([data-selectable])';
const EVENT_CALLBACKS = {};

// Initialise and configure.
logger.setLevel(config.logLevel);

// Enable cors
$.support.cors = true;
let dropzoneLoaded = false;
let loadedDropConfig = false;

// Set Kloudless source header
$.ajaxSetup({
  headers: {
    // VERSION will be replaced by Babel.
    // eslint-disable-next-line prefer-template
    'X-Kloudless-Source': 'file-picker/' + VERSION,
  },
});

// This can be generalized in the future with a config option
const startView = (config.flavor() === FLAVOR.dropzone) ?
  VIEW.dropzone : VIEW.accounts;

const services = ko.pureComputed(() => {
  const result = {};
  ko.utils.arrayForEach(config.all_services(), (service) => {
    result[service.id] = service;
  });
  return result;
});

// File Picker declaration.
const FilePicker = function () {
  this.manager = new AccountManager();
  this.fileManager = new FileManager();
  this.router = routerHelper.init(this);

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
    selectingFilesFrom: ko.pureComputed(() => {
      const current = this.view_model.current();
      if (current === VIEW.files) {
        const activeAccount = this.manager.active();
        const service = services()[activeAccount.service];
        if (service) {
          return {
            fromComputer: false,
            account: activeAccount.account,
            text: activeAccount.account_name,
            icon: service.logo,
          };
        }
        return {};
      }
      if (current === VIEW.computer) {
        return {
          fromComputer: true,
          text: this.view_model.accounts.name(),
        };
      }
      return {};
    }),
    filteredAccounts: ko.pureComputed(() => {
      const data = this.view_model.selectingFilesFrom();
      const accounts = this.view_model.accounts.all();
      if (data.account) {
        return accounts.filter(account => account.account !== data.account);
      }
      return accounts;
    }),
    isDesktop: !util.isMobile,
    // Save all files in FileManager to the selected directory
    save: () => {
      const { view_model, fileManager, manager } = this;
      const selected = view_model.files.selected();
      if (selected.length > 0) {
        // If user selects a folder, then navigate into that folder.
        const id = selected[0].getAttribute('data-id');
        this.view_model.files.navigate(id);
        return;
      }
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
        const inputText = $('.ftable__saver-input').val();
        for (let i = 0; i < fileManager.files().length; i += 1) {
          const newFileName = inputText || fileManager.files()[i].name;
          for (let k = 0; k < (current.children().length); k += 1) {
            if (current.children()[k].name === newFileName) {
              const msg = localization.formatAndWrapMessage(
                'files/confirmOverwrite',
              );
              overwrite = window.confirm(msg);
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
            name: inputText || f.name,
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
        const msg = localization.formatAndWrapMessage(
          'files/cannotUploadFiles',
        );
        iziToastHelper.error(msg);
      }
    },

    processingConfirm: ko.observable(false),

    // Select files or a folder.
    confirm: () => {
      if (this.view_model.processingConfirm()) {
        return;
      }
      if (this.view_model.files.chooserButtonTextKey() === 'global/open') {
        const tr = document.querySelector(FOCUSED_FOLDER_SELECTOR);
        const id = tr.getAttribute('data-id');
        this.view_model.files.navigate(id);
        return;
      }

      const fs = this.manager.active().filesystem();
      const current = fs.current();
      const selections = [];
      const copyToUploadLocation = config.copy_to_upload_location();
      const copyFolder = ['async', 'sync'].includes(copyToUploadLocation);
      const link = config.link();
      const types = config.types();
      const { table } = this.view_model.files;

      if (table) {
        const selectedElements = table.finderSelect('selected');
        for (let i = 0; i < selectedElements.length; i += 1) {
          // removing the parent reference.
          const { parent_obs, ...rest } = ko.dataFor(selectedElements[i]);
          selections.push(rest);
        }
      }

      // in case of the following cases, select the current folder if no items
      // are selected:
      // 1. in mobile devices
      // 2. in chooser mode and in root folder
      if (selections.length === 0 && types.includes('folders')) {
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
          this.view_model.processingConfirm(false);
          window.clearInterval(requestLauncherInterval);
          return;
        }

        // All requests are done
        if (requestCountSuccess + requestCountError === selections.length) {
          window.clearInterval(requestLauncherInterval);
          this.view_model.postMessage(
            requestCountError ? 'error' : 'success', selections,
          );
          this.view_model.processingConfirm(false);
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

      // Should select at least one item
      if (selections.length === 0) {
        const msg = localization.formatAndWrapMessage('files/noFileSelected');
        iziToastHelper.error(msg);
        return;
      }

      // Emit 'selected' event with selected files
      if (selections.some(s => s.type === 'file')) {
        logger.debug('Files selected! ', selections);
        this.view_model.postMessage(
          'selected', selections.filter(s => s.type === 'file'),
        );
      }

      // Confirm copy to upload location
      if (copyFolder) {
        const folders = selections.filter(s => s.type === 'folder');
        const files = selections.filter(s => s.type === 'file');
        const hasRootDir = folders.some(f => f.id === fs.rootMetadata().id);
        let msg = null;
        if (hasRootDir) {
          // Copy root folder is not allowed
          msg = localization.formatAndWrapMessage(
            'files/forbidCopyRootFolder',
          );
          iziToastHelper.error(msg);
          return;
        }
        if (folders.length === 1 && files.length === 0) {
          // when only selecting one folder
          msg = localization.formatAndWrapMessage(
            'files/confirmCopyFolder', { folderName: folders[0].name },
          );
        } else if (folders.length > 0) {
          // when selecting multiple folders and any number of files
          msg = localization.formatAndWrapMessage(
            'files/confirmCopy',
            { folderNum: folders.length, fileNum: files.length },
          );
        }

        // Only show confirmation if folder is selected
        if (msg && !window.confirm(msg)) {
          return;
        }
      }

      this.view_model.processingConfirm(true);
      selections.forEach((selection, i) => {
        /**
         * process each selected item according to configuration and item's type
         * 1. type='file', copy_to_upload_location='async'/'sync'/true
         * 2. type='file', link=true
         * 3. type='folder', copy_to_upload_location='async'/'sync'
         * 4. else
         */
        const { type } = selection;
        if (type === 'file' && copyToUploadLocation) {
          // Case 1
          requestsToLaunch.push({ fn: moveToDrop, args: [type, i] });
        } else if (type === 'file' && link) {
          // Case 2
          requestsToLaunch.push({ fn: createLink, args: [i] });
        } else if (type === 'folder' && copyFolder) {
          // Case 3
          requestsToLaunch.push({ fn: moveToDrop, args: [type, i] });
        } else {
          // Case 4
          // No need to make a request, just pretend the request succeed
          requestCountStarted += 1;
          selectionComplete(true);
        }
      });
    },

    // Quit the file picker.
    cancel: () => {
      logger.debug('Quitting!');
      this.lastCancelTime = new Date();
      if (this.manager.active().account) {
        // Remove mkdir form
        this.view_model.files.rmdir();
      }
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
        // shallow copy data
        if (Array.isArray(data)) {
          // eslint-disable-next-line no-param-reassign
          data = [...data];
        } else {
          // eslint-disable-next-line no-param-reassign
          data = { ...data };
        }
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
        if (['success', 'error', 'selected'].includes(action)) {
          // eslint-disable-next-line no-param-reassign
          data = data.map((file) => {
            // remove properties that are only for internal use
            delete file.friendlySize;
            return file;
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
              this.router.setLocation('#/accounts');
            } else if (config.flavor() !== FLAVOR.dropzone) {
              this.router.setLocation('#/files');
            }
          },
          (err) => {
            /**
             * If the account errors on getting metadata due to invalid token,
             * it will be removed from the storage.
             *
             * If there is no account metadata that means this account object
             * is created by config.tokens, so there's no need to update
             * the account manager.
             */
            if (err && err.invalidToken === true && account.account) {
              logger.warn('failed to load account from localStorage');
              this.manager.removeAccount(account.account);
              // store accounts
              storage.storeAccounts(config.app_id, this.manager.accounts());
            // else if it errors on folder contents, we should show an error
            } else if (err) {
              logger.warn('failed to refresh filesystem', err);
              const msg = localization.formatAndWrapMessage('files/error');
              iziToastHelper.error(msg);
            }

            // need to make sure on files view since we're loading
            // asynchronously from local storage
            // eslint-disable-next-line no-use-before-define
            if (first_account && this.view_model.current() === VIEW.files) {
              this.router.setLocation('#/files');
              first_account = false; // eslint-disable-line no-use-before-define
            }

            // need to make sure on accounts view since... ^^^
            if (this.manager.accounts().length === 0) {
              this.router.setLocation('#/accounts');
            }
          },
        );
      });
    },

    setLocation: (path) => {
      /*
       We override setLocation in the router, so this let's us bypass the
       hash actually changing.
       */
      this.router.setLocation(path);
    },

    loading: ko.observable(false),

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
        if (this.view_model.current() === VIEW.computer) {
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
        this.router.setLocation('#/accounts');
        this.view_model.postMessage('logout');
      },

      // Current active service name
      name: ko.pureComputed(function () {
        if (this.view_model.current() === VIEW.computer) {
          return localization.formatAndWrapMessage('serviceNames/computer');
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
          this.router.setLocation('#/computer');
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
              this.router.setLocation('#/addConfirm');

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
                this.router.setLocation('#/files');
              } else {
                this.router.setLocation('#/accounts');
              }
            },
            on_fs_ready: (err) => {
              if (err) {
                // eslint-disable-next-line no-use-before-define
                iziToastHelper.error(error_message, { detail: err.message });
              }

              // eslint-disable-next-line no-use-before-define
              if (first_account) {
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
    /**
     * It's better to return empty object / array instead of null
     * to reduce the chance of breaking File Table UI, sepecially for the case
     * when this.manager.active() is an empty object.
     */
    files: {
      selected: ko.observable([]),
      enableChooserButton: ko.computed(() => {
        /**
         * In the following cases, the chooser button is enabled:
         * - in mobile device
         * - in the root directory and folder is selectable
         * - there are more than 1 item selected
         * - chooserButtonTextKey = 'global/open'
         */
        const activeAccount = this.manager.active();
        if (Object.keys(activeAccount).length === 0) {
          return false;
        }
        if (util.isMobile) {
          return true;
        }
        const path = activeAccount.filesystem().path();
        if (path.length === 0 && config.types().includes('folders')) {
          return true;
        }
        if (this.view_model.files.chooserButtonTextKey() === 'global/open') {
          return true;
        }
        const selected = this.view_model.files.selected();
        return selected.length > 0;
      }),
      chooserButtonTextKey: ko.observable('global/select'),
      saverButtonTextKey: ko.pureComputed(() => {
        /**
         * If user selects folder then show 'Open' for the saver button;
         * otherwise, show 'Save'.
         */
        const activeAccount = this.manager.active();
        if (Object.keys(activeAccount).length === 0) {
          return 'global/save';
        }
        const selected = this.view_model.files.selected();
        return selected.length > 0 ? 'global/open' : 'global/save';
      }),
      all: this.fileManager.files,
      // Compute breadcrumbs.
      breadcrumbs: ko.computed(() => {
        const activeAccount = this.manager.active();
        // check to make sure an active account is set
        if (Object.keys(activeAccount).length === 0) {
          return [];
        }
        const breadcrumbs = activeAccount.filesystem().path().map(
          path => ({ path, visible: true }),
        );
        return adjustBreadcrumbWidth(breadcrumbs);
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

      root_folder_name: ko.pureComputed(() => {
        const activeAccount = this.manager.active();
        // check to make sure an active account is set
        if (Object.keys(activeAccount).length === 0) {
          return '';
        }
        return activeAccount.filesystem().rootMetadata().name;
      }),

      // Compute current working directory.
      cwd: ko.computed(() => {
        const activeAccount = this.manager.active();
        // check to make sure an active account is set
        if (Object.keys(activeAccount).length === 0) {
          return [];
        }
        logger.debug('Recomputing cwd...');
        return activeAccount.filesystem().cwd();
      }),
      // Relative navigation.
      navigate: (id) => {
        logger.debug('Navigating to file: ', id);
        this.manager.active().filesystem().navigate(id, (err, result) => {
          logger.debug('Navigation result: ', err, result);
          if (err) {
            // eslint-disable-next-line no-use-before-define
            iziToastHelper.error(error_message, { detail: err.message });
          }
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

        this.manager.active().filesystem().up(count, (err) => {
          if (err) {
            // eslint-disable-next-line no-use-before-define
            iziToastHelper.error(error_message, { detail: err.message });
          }
        });
      },
      mkdir: (formElement) => {
        const name = formElement[0].value;
        logger.debug('New folder name:', name);
        this.manager.active().filesystem().mkdir(name, (err, result) => {
          // update first entry
          if (err) {
            // eslint-disable-next-line no-use-before-define
            iziToastHelper.error(error_message, { detail: err.message });
          } else {
            const dir = this.manager.active().filesystem().updatedir(result);
            if (dir) {
              this.view_model.files.navigate(dir.id);
            }
          }
        });
      },
      newdir: () => {
        if (this.manager.active().filesystem().current().can_create_folders) {
          this.manager.active().filesystem().newdir();
        } else {
          const msg = localization.formatAndWrapMessage(
            'files/cannotCreateFolder',
          );
          iziToastHelper.error(msg);
        }
      },
      rmdir: () => {
        this.manager.active().filesystem().rmdir();
      },
      refresh: () => {
        logger.debug('Refreshing current directory');
        if (!this.manager.active().account) {
          return;
        }
        this.manager.active().filesystem().refresh(true, (err) => {
          if (err) {
            // eslint-disable-next-line no-use-before-define
            iziToastHelper.error(error_message, { detail: err.message });
          }
        });
      },
      sort: (option) => {
        this.manager.active().filesystem().sort(option);
      },
      searchQuery: ko.observable(''),
      startSearchMode: () => {
        if (!this.view_model.loading()) {
          this.router.setLocation('#/search');
          this.view_model.files.search();
        }
      },
      exitSearchMode: () => {
        this.router.setLocation('#/files');
        this.view_model.files.refresh();
        this.view_model.files.searchQuery('');
      },
      search: () => {
        const { manager, view_model } = this;

        // de-select files/folders
        const selector = view_model.files.table;
        selector.finderSelect('unHighlightAll');

        const searchQuery = view_model.files.searchQuery();
        const fs = manager.active().filesystem();
        if (searchQuery === '') {
          fs.display([]);
          return;
        }
        const s = new Search(fs.id, fs.key, searchQuery, fs.rootMetadata().id);
        s.search(
          () => {
            fs.display(fs.filterChildren(s.results.objects, true));
          },
          () => {
            const msg = localization.formatAndWrapMessage('files/searchFail');
            iziToastHelper.error(msg);
          },
        );
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
  ko.applyBindings(this.view_model, $('#kloudless-file-picker')[0]);
};

// Switch views between 'accounts', 'files', and 'computer', 'search'
FilePicker.prototype.switchViewTo = function (to) {
  this.view_model.current(to);

  // When view is changed, the old view template is unloaded.
  if (to !== VIEW.dropzone) {
    dropzoneLoaded = false;
  }

  if (to === VIEW.dropzone) {
    const dz = $('#dropzone');
    dz.on('click', () => {
      this.view_model.postMessage('dropzoneClicked');
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
      dropzone.ondrop = () => {
        this.view_model.postMessage('drop');
        pluploadHelper.addFiles(dropzone.files);
        this.router.setLocation('#/computer');
      };

      dropzone.init();
      dropzoneLoaded = true;
    }
  }

  if (to !== VIEW.addConfirm) {
    $(auth.iframe).hide();
  }

  if ($('#search-query').is(':visible')) {
    $('#search-back-button').trigger('click');
  }

  // Initialise the dropdowns
  if (to === VIEW.files || to === VIEW.computer) {
    setupDropdown();

    // Since we're not using foundation, add click handler to 'x'
    $('.close').off('click');
    $('.close').on('click', (e) => {
      iziToastHelper.destroy();
      e.preventDefault();
      e.stopPropagation();
    });
  }

  // Initialise infinite scroll
  if (to === VIEW.files || to === VIEW.search) {
    const fileTable = $('.j-ftable');
    // eslint-disable-next-line no-use-before-define
    fileTable.off('scroll', onFileTableScroll);
    // eslint-disable-next-line no-use-before-define
    fileTable.on('scroll', onFileTableScroll);
  }

  if (to === VIEW.files) {
    // Remove mkdir dir form at first
    this.view_model.files.rmdir();
  }

  if (to === VIEW.computer) {
    // eslint-disable-next-line no-use-before-define
    pluploadHelper.init(picker);
  }
};

FilePicker.prototype.cleanUp = function () {
  // File Picker will close. Clean up.
  const self = this;
  self.view_model.processingConfirm(false);

  if ($('#search-query').is(':visible')) {
    $('#search-back-button').click();
  }
  iziToastHelper.destroy();
  if (self.view_model.files.table) {
    self.view_model.files.table.finderSelect('unHighlightAll');
  }
  self.fileManager.files.removeAll(); // Saver
};

// File Picker initialization.
const picker = new FilePicker();

ko.bindingHandlers.finderSelect = {
  init(element, valueAccessor, allBindings, viewModel) {
    const selector = $(element).finderSelect({
      selectAllExclude: '.mkdir-form',
      selectClass: 'ftable__row--selected',
      children: 'tr[data-selectable]',
      enableClickDrag: config.multiselect(),
      enableShiftClick: config.multiselect(),
      enableCtrlClick: config.multiselect(),
      enableSelectAll: config.multiselect(),
    });

    viewModel.files.table = selector;

    const findClosestTr = (event) => {
      const target = $(event.target);
      return target.is('tr') || target.closest('tr');
    };

    const navigate = (event) => {
      const tr = findClosestTr(event);
      const type = tr.attr('data-type');
      const id = tr.attr('data-id');
      if (type === 'folder' && id) {
        viewModel.files.navigate(id);
      }
    };

    selector.dblclick(navigate);
    selector.click((event) => {
      if (util.isMobile) {
        navigate(event);
      } else {
        const tr = findClosestTr(event);
        if (tr.attr('data-type') === 'folder' && !tr.attr('data-selectable')) {
          selector.finderSelect('unHighlightAll');
          tr.addClass('ftable__row--focus');
          viewModel.files.chooserButtonTextKey('global/open');
        }
      }
    });

    const onHighlightChange = () => {
      $(FOCUSED_FOLDER_SELECTOR).removeClass('ftable__row--focus');
      viewModel.files.chooserButtonTextKey('global/select');
      const selected = selector.finderSelect('selected');
      viewModel.files.selected(selected);
    };
    selector.finderSelect('addHook', 'highlight:after', onHighlightChange);
    selector.finderSelect('addHook', 'unHighlight:after', onHighlightChange);
  },
  update(element, valueAccessor, allBindings, viewModel) {
    ko.unwrap(valueAccessor());
    const selector = viewModel.files.table;
    selector.finderSelect('update');
    selector.finderSelect('unHighlightAll');
  },
};

ko.bindingHandlers.selectInputText = {
  init: (element, valueAccessor) => {
    element.value = valueAccessor();
    element.focus();
    element.select();
  },
};

// TODO: we can display err.message if the new error handling is deployed
// for now use default error message
const error_message = localization.formatAndWrapMessage('global/error');

let first_account = true;

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
    picker.view_model.sync(accounts, true);
  }
});

// Expose hooks for debugging.
if (config.debug) {
  window.picker = picker;
  window.ko = ko;
}

/*
 * Message Event listener, dispatch and handlers.
 * TODO: Move to separate module?
 */

// Initialize to '#/' route.
window.addEventListener('message', (message) => {
  logger.debug('File Picker hears message: ', message.data);
  if (message.origin !== config.origin) {
    return;
  }

  const { action, data, callbackId } = JSON.parse(message.data);
  // TODO: future config options
  if (action === 'INIT') {
    // eslint-disable-next-line no-use-before-define
    dataMessageHandler(data);
    if (startView && startView !== VIEW.accounts) {
      picker.router.run(`#/${startView}`);
    } else {
      picker.router.run('#/');
    }
  } else if (action === 'DATA') {
    // eslint-disable-next-line no-use-before-define
    dataMessageHandler(data);
  } else if (action === 'CLOSING') {
    picker.cleanUp();
  } else if (action === 'LOGOUT') {
    picker.view_model.accounts.logout(false);
  } else if (action === 'LOGOUT:DELETE_ACCOUNT') {
    picker.view_model.accounts.logout(true);
  } else if (action === 'CALLBACK' && callbackId
    && EVENT_CALLBACKS[callbackId]) {
    EVENT_CALLBACKS[callbackId](data);
    delete EVENT_CALLBACKS[callbackId];
  }
});

function dataMessageHandler(data) {
  // Used to initialize the file picker with data and config options.
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
    config.flavor(flavor);
  }

  // Primary way of updating config options
  if (options) {
    config.update(options);
  }

  if (flavor === FLAVOR.saver) {
    // Add files to fileManager
    if (files && files.length > 0) {
      // first clear all files.
      picker.fileManager.files.removeAll();
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        picker.fileManager.add(file.url, file.name);
      }
    }
  } else if (flavor === FLAVOR.chooser) {
    // Default to computer view if account management is disabled and no
    // tokens are provided.
    if (config.visible_computer() && !config.account_management() &&
      !(options && options.tokens && options.tokens.length > 0)) {
      picker.router.setLocation('#/computer');
    }
  } else if (flavor === FLAVOR.dropzone) {
    picker.router.setLocation('#/dropzone');
  }

  // Call sync if frame has already been initialized and there are differences
  // between storage and current accounts
  if (picker.manager.accounts().length !== 0) {
    const accounts = storage.loadAccounts(config.app_id);
    const local_accounts = picker.manager.accounts();
    const accountSet = new Set(accounts.map(acc => String(acc.account)));
    const different = accounts.length !== local_accounts.length
      || local_accounts.some(acc => !accountSet.has(String(acc.account)));
    // logger.debug(different || accounts.length != local_accounts.length);
    if (different) {
      // Call asynchronously to give other options some time to load.
      window.setTimeout(() => {
        picker.view_model.sync(accounts, true);
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
      picker.view_model.sync(
        data.options.keys.map(k => (
          { key: { key: k, scheme: 'AccountKey' } })), true,
      );
    }, 0);
  }

  if (data.options && data.options.tokens) {
    window.setTimeout(() => {
      picker.view_model.sync(
        data.options.tokens.map(k => (
          { key: { key: k, scheme: 'Bearer' } })), true,
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

config.flavor.subscribe(() => {
  // refresh and go back to accounts when flavor changes
  logger.debug('SWITCHING FLAVOR');
  picker.router.setLocation('#/accounts');
  picker.view_model.files.refresh();
});

$(document).ajaxStart(() => {
  picker.view_model.loading(true);
});

$(document).ajaxStop(() => {
  picker.view_model.loading(false);
});

const onResize = debounce(() => {
  // force re-evaluate breadcrumb's width
  const { view_model, manager } = picker;
  if (view_model.current() === VIEW.files && manager.active().filesystem) {
    manager.active().filesystem().path.notifySubscribers();
  }
}, 200);

const onFileTableScroll = debounce(() => {
  const fileTable = $('.j-ftable');
  const scrolled = fileTable.scrollTop();
  const tableHeight = fileTable.outerHeight();
  const contentHeight = fileTable[0].scrollHeight;
  const { manager } = picker;
  const fileSystem = manager.active().filesystem();
  if (fileSystem.page && (scrolled + tableHeight * 2) >= contentHeight) {
    fileSystem.getPage();
  }
}, 200);

window.removeEventListener('resize', onResize);
window.addEventListener('resize', onResize);

// This signal is placed last and indicates all the JS has loaded
// and events can be received.
picker.view_model.postMessage('load');
