(function() {
  'use strict';

  // RequireJS configuration.
  require.config({
    paths: {
      'jquery': 'vendor/jquery',
      'jqueryui': 'vendor/jquery-ui',
      'moxie': 'vendor/plupload/moxie',
      'plupload': 'vendor/plupload/plupload.dev',
      'pluploadui': 'vendor/plupload/jquery.ui.plupload/jquery.ui.plupload',
      'cldr': 'vendor/cldr',
      'globalize': 'vendor/globalize',
      'json': 'vendor/requirejs-plugins/src/json',
    },
    shim: {
      'vendor/jquery-cookie': {
        deps: ['jquery']
      },
      'vendor/jquery.finderSelect': {
        deps: ['jquery']
      },
      'vendor/jquery-placeholder': {
        deps: ['jquery']
      },
      'vendor/sammy': {
        deps: ['jquery']
      },
      'vendor/jquery-ui': {
        deps: ['jquery']
      },
      'vendor/jquery-dropdown': {
        deps: ['jquery']
      },
      'vendor/jquery-scrollstop': {
        deps: ['jquery']
      },
      'jqueryui': {
        deps: ['jquery']
      },
      'plupload': {
        deps: ['jquery', 'moxie'],
        exports: 'plupload'
      },
      'pluploadui': {
        deps: ['jquery', 'jqueryui', 'plupload'],
        exports: 'pluploadui'
      }
    },
  });

  // Load dependencies.
  require(['jquery', 'vendor/knockout', 'vendor/sammy',
           'vendor/loglevel', 'vendor/moment',
           'config', 'storage', 'accounts', 'files', 'auth',
           'models/search', 'util', 'localization',
           // Imports below don't need to be assigned to variables.
           'jqueryui', 'vendor/jquery-dropdown', 'vendor/jquery-scrollstop',
           'moxie', 'plupload', 'pluploadui', 'vendor/jquery.finderSelect',
           'iexd-transport', 'polyfills'],
  function($, ko, sammy, logger, moment, config, storage, AccountManager,
    FileManager, auth, Search, util, localization) {

    // Initialise and configure.
    logger.setLevel(config.logLevel);

    // Enable cors
    $.support.cors = true;
    var dropzoneLoaded = false;
    var filesQueue = [];
    var processingConfirm = false;
    var loadedDropConfig = false;

    // Set Kloudless source header
    $.ajaxSetup({
      headers: {
        "X-Kloudless-Source": "file-explorer"
      }
    });

    // This can be generalized in the future with a config option
    var startView = (config.flavor() === 'dropzone') ? 'dropzone' : 'accounts';

    var services = ko.pureComputed(function() {
      var services = {};
      ko.utils.arrayForEach(config.all_services(), function(service) {
        services[service.id] = service;
      });
      return services;
    });

    /*
    * Add mobile view class to body if mobile
    * */
    if(util.isMobile){
      $("body").addClass('mobile-view');
    }
    // Explorer declaration.
    var FileExplorer = function() {
      this.manager = new AccountManager();
      this.fileManager = new FileManager();

      this.id = (function() {
        var _id = storage.loadId();
        if (!_id) {
          _id = Math.floor(Math.random() * Math.pow(10, 12));
          storage.storeId(_id);
        }
        return _id;
      })();

      this.exp_id = config.exp_id;

      // Track the last cancellation so Chooser responses received after
      // a cancellation are ignored. Saves are allowed to proceed due to
      // the new file already having been saved to the location.
      this.lastCancelTime = new Date();

      var self = this;

      // View model setup.
      this.view_model = {
        // config
        flavor: config.flavor,
        enable_logout: config.enable_logout,

        // The current view: alternates between 'files', 'accounts', 'computer', etc.
        current: ko.observable(startView),
        isDesktop: !util.isMobile,

        // Save all files in FileManager to the selected directory
        save: function() {
          // Set loading to true
          explorer.view_model.loading(true);

          // Grab the current location
          var current = explorer.manager.active().filesystem().current();
          var saves = [];

          // If you can save here
          if (current.can_upload_files) {
            var accountId = explorer.manager.active().filesystem().id;
            var authKey = explorer.manager.active().filesystem().key;
            var requestCountSuccess = 0;
            var requestCountError = 0;

            // Save Complete Callback
            var saveComplete = function(success) {
              if (success) {
                requestCountSuccess++;
              }
              else {
                requestCountError++;
                logger.warn('Error with ajax requests for save');
              }

              // All requests are done
              if (requestCountSuccess + requestCountError == explorer.fileManager.files().length) {
                explorer.view_model.postMessage('success', saves);
                logger.debug('Successfully uploaded files: ', saves);
              }
            };

            var choseOverwrite = false;
            var overwrite = false;
            for (var i = 0; i < explorer.fileManager.files().length; i++) {
              for (var k = 0; k < (current.children().length); k++) {
                if (current.children()[k].name == explorer.fileManager.files()[i].name) {
                  overwrite = window.confirm(
                    "Files already exist with the same names as the ones being uploaded." +
                    " Click OK to overwrite existing files with the same name" +
                    " or Cancel to proceed without overwriting.");
                  choseOverwrite = true;
                  break;
                }
              }
              if (choseOverwrite)
                break;
            }

            for (var i = 0; i < explorer.fileManager.files().length; i++) {
              var f = explorer.fileManager.files()[i];
              var file_data = {
                url: f.url,
                parent_id: current.id,
                name: $('.kloudless-saver-name').val() || f.name
              };
              logger.debug('file_data.name: ', file_data.name);

              (function(event_data) {
                explorer.view_model.postMessage('startFileUpload', event_data);

                var request = $.ajax({
                  url: config.getAccountUrl(accountId, 'storage', '/files/?overwrite=' + overwrite),
                  type: 'POST',
                  contentType: 'application/json',
                  headers: { Authorization: authKey.scheme + ' ' + authKey.key },
                  data: JSON.stringify(file_data)
                }).done(function(data) {
                  saves.push(data);
                  event_data.metadata = data;
                  explorer.view_model.postMessage('finishFileUpload', event_data);
                  saveComplete(true);
                }).fail(function(xhr, status, err) {
                  logger.warn('Error uploading file: ', status, err, xhr);
                  saveComplete(false);
                });
              })({name: file_data.name, url: file_data.url});
            }
          } else {
            explorer.view_model.error('Files cannot be saved to this folder. Please choose again.');
            explorer.view_model.loading(false);
          }
        },

        // Select a file.
        confirm: function() {
          if (processingConfirm) return;

          // Set loading to true
          explorer.view_model.loading(true);

          // Clone the selections, removing the parent reference.
          var current = explorer.manager.active().filesystem().current();
          var selections = [];
          var clones = [];

          var table = self.view_model.files.table;
          if (table) {
            var selectedElements = table.finderSelect('selected');
            for (var i = 0; i < selectedElements.length; i++) {
              selections.push(ko.dataFor(selectedElements[i]));
            }
          }

          for (var i = 0; i < selections.length; i++) {
            var selection = selections[i];
            var clone = {};
            for (var attr in selection) {
              if (selection.hasOwnProperty(attr) && attr != 'parent_obs') {
                clone[attr] = selection[attr];
              }
            }
            clones.push(clone);
          }
          selections = clones;

          // postMessage to indicate success.
          if (selections.length > 0) {
            logger.debug('Files selected! ', selections);
            explorer.view_model.postMessage('selected', selections);

            var accountId = explorer.manager.active().filesystem().id;
            var authKey = explorer.manager.active().filesystem().key;
            var lastCancelTime = explorer.lastCancelTime;

            var requestCountSuccess = 0;
            var requestCountError = 0;
            var requestCountStarted = 0;
            var maxRequestsInProgress = 4;
            var requestsToLaunch = [];

            var requestLauncherInterval = window.setInterval(function() {
              var requestsComplete = requestCountSuccess + requestCountError;
              var requestsInProgress = requestCountStarted - requestsComplete;
              while (requestsToLaunch.length > 0 &&
                     requestsInProgress < maxRequestsInProgress) {
                var callData = requestsToLaunch.shift();
                callData.fn(callData.i);
                requestsInProgress = requestCountStarted - requestsComplete;
              }
            }, 200);

            // Selection Complete Callback
            var selectionComplete = function(success) {
              if (success) {
                requestCountSuccess++;
              }
              else {
                requestCountError++;
                logger.warn('Error with ajax requests for selection');
              }

              if (explorer.lastCancelTime > lastCancelTime) {
                logger.info("A cancellation occurred prior to the operation " +
                            "being completed. Ignoring response.")
                processingConfirm = false;
                window.clearInterval(requestLauncherInterval);
                return;
              }

              // All requests are done
              // TODO handle case if requestCountError != 0
              if (requestCountSuccess + requestCountError == selections.length) {
                window.clearInterval(requestLauncherInterval);
                explorer.view_model.postMessage('success', selections);
                processingConfirm = false;
              }
            };

            // Add the link at the last possible moment for error/async handling
            var createLink = function(selection_index) {
              var linkData = $.extend({}, config.link_options());
              linkData.file_id = selections[selection_index].id;

              var request = $.ajax({
                url: config.getAccountUrl(accountId, 'storage', '/links/'),
                type: 'POST',
                headers: {
                  Authorization: authKey.scheme + ' ' + authKey.key
                },
                contentType: 'application/json',
                data: JSON.stringify(linkData),
              }).done(function(data) {
                selections[selection_index]['link'] = data['url'];
                selectionComplete(true);
              }).fail(function(xhr, status, err) {
                logger.warn('Error creating link: ', status, err, xhr);
                selectionComplete(false);
              });
              requestCountStarted += 1;
            };

            var pollTask = function(task_id, callbacks) {
              var POLLING_INTERVAL = 3000; // in millisecond
              callbacks = callbacks || {};
              setTimeout(function() {
                $.ajax({
                  url: config.getAccountUrl(accountId, 'tasks', '/' + task_id),
                  type: 'GET',
                  headers: { Authorization: authKey.scheme + ' ' + authKey.key },
                }).done(function(data) {
                  if (data.state && data.state.toUpperCase() === 'PENDING') {
                    pollTask(task_id, callbacks);
                  } else {
                    callbacks.onComplete && callbacks.onComplete(data);
                  }
                }).fail(function(xhr, status, err) {
                  callbacks.onError && callbacks.onError(err);
                });
              }, POLLING_INTERVAL);
            };

            var moveToDrop = function(selection_index) {
              var copyMode = config.copy_to_upload_location;
              var isTask = (copyMode === 'sync' || copyMode === 'async');
              var url = config.getAccountUrl(
                accountId, 'storage', '/files/' +
                  selections[selection_index].id + '/copy/?link=' + config.link +
                  '&link_options=' + encodeURIComponent(JSON.stringify(config.link_options()))
              );
              var data = {
                account: 'upload_location'
              }
              var ajax = function(url) {
                return $.ajax({
                  url: url,
                  type: 'POST',
                  contentType: 'application/json',
                  headers: { Authorization: authKey.scheme + ' ' + authKey.key },
                  data: JSON.stringify(data),
                });
              };

              if (config.upload_location_account()) {
                data['drop_account'] = config.upload_location_account()
                data['parent_id'] = config.upload_location_folder()
              }
              else if (config.upload_location_uri()) {
                data['drop_uri'] = config.upload_location_uri()
              }

              ajax(isTask ? url + '&return_type=task' : url).done(function(res) {
                if (copyMode === 'sync') {
                  // polling for the result (file metadata)
                  var taskInfo = 'Task[' + res.id + '] ';
                  pollTask(res.id, {
                    onComplete: function(metadata) {
                      selections[selection_index] = metadata;
                      selectionComplete(true);
                    },
                    onError: function(err) {
                      logger.error(taskInfo + 'failed: ' + JSON.stringify(err));
                      selectionComplete(false);
                    },
                  });
                } else {
                  selections[selection_index] = res;
                  selectionComplete(true);
                }
              }).fail(function() {
                selectionComplete(false);
              });
              requestCountStarted += 1;
            }

            if (config.copy_to_upload_location) {
              // Move to upload location.
              for (var i=0; i<selections.length; i++) {
                requestsToLaunch.push({fn: moveToDrop, i: i});
              }
            } else if (config.link) {
              for (var i=0; i < selections.length; i++) {
                processingConfirm = true;
                requestsToLaunch.push({fn: createLink, i: i});
              }
            } else {
              explorer.view_model.postMessage('success', selections);
            }
            // assuming 'folders' or 'all' is part of what can be selected
          } else if (config.types.indexOf('all') != -1 || config.types.indexOf('folders') != -1) {
            // if no files are selected, return folder currently in
            // TODO: for now don't allow root folders for all sources later check
            // the can_upload_files attribute
            if (current.can_upload_files) {
              logger.debug('Folder selected! ', current);
              var clone = {};
              for (var attr in current) {
                if (current.hasOwnProperty(attr) && attr != 'parent_obs') {
                  clone[attr] = current[attr];
                }
              }
              explorer.view_model.postMessage('success', [clone]);
            } else {
              explorer.view_model.error('This folder cannot be selected. Please choose again.');
              explorer.view_model.loading(false);
            }
          } else {
            explorer.view_model.error('No files selected. Please select a file.');
            explorer.view_model.loading(false);
          }
        },

        // Quit the file explorer.
        cancel: function() {
          logger.debug('Quitting!');
          explorer.lastCancelTime = new Date()
          // postMessage to indicate failure.
          explorer.view_model.postMessage('cancel');
        },

        postMessage: function(action, data) {
          var post_data = {
            exp_id: self.exp_id,
            type: 'explorer',
            action: action,
          };

          if (data !== undefined) {
            if (['selected', 'success', 'addAccount'].indexOf(action) > -1 &&
                (config.account_key || config.retrieve_token())
                && config.user_data().trusted) {
              // Add in OAuth Token on success for files.

              var accountMap = {}
              ko.utils.arrayForEach(self.manager.accounts(), function(account) {
                accountMap[account.account] = account;
              });

              // Separate variable for cases where it isn't an array,
              // to reuse code.
              var addKeyToData = data;
              var accountIdField = 'account';
              if (action == 'addAccount') {
                addKeyToData = [data];
                accountIdField = 'id';
              }

              // Add OAuth Token
              ko.utils.arrayForEach(addKeyToData, function(d) {
                var account = accountMap[d[accountIdField]];
                if (account !== undefined) {
                  var keyIdent = 'account_key'
                  if (config.retrieve_token())
                    d.bearer_token = {key: account.bearer_token}
                  if (config.account_key)
                    d.account_key = {key: account.account_key}
                }
              });
            }
            post_data.data = data;
          }

          window.parent.postMessage(JSON.stringify(post_data), config.origin);
        },

        sync: function(accounts, loadStorage) {
          // if loadStorage, remove local accounts and load from storage
          // if not loadStorage, store local accounts into storage

          logger.debug('syncing...');

          // remove all old accounts
          if (loadStorage) {
            explorer.manager.accounts.removeAll();
          }

          // add new accounts because data may have changed
          require(['models/account'], function(Account) {
            var i, local_data, active;
            for (i = 0; i < accounts.length; i++) {
              (function(local_data) {
                var created = new Account(local_data, function(acc) {

                  if (acc.connected()) {
                    explorer.manager.addAuthedAccount(acc);

                    if (!active) {
                      active = true;
                      explorer.manager.active(explorer.manager.getByAccount(acc.account));
                    }

                    if (!loadStorage) {
                      storage.storeAccounts(config.app_id, explorer.manager.accounts());
                    }
                  }

                  // if no valid accounts from local storage are loaded
                  if (explorer.manager.accounts().length === 0) {
                    router.setLocation('#/accounts');
                  } else if (config.flavor() !== 'dropzone') {
                    router.setLocation('#/files');
                  }
                }, function(err, result) {
                  explorer.view_model.loading(false);

                  // if it errors on root folder metadata, we shouldn't add it
                  if (err && err.message === 'failed to retrieve root folder') {
                    logger.warn('failed to load account from localStorage');
                    explorer.manager.removeAccount(local_data.account);
                    // store accounts
                    storage.storeAccounts(config.app_id, explorer.manager.accounts());
                  // else if it errors on folder contents, we should show an error
                  } else if (err) {
                    logger.warn('failed to refresh filesystem', err);
                    explorer.view_model.error('Error occurred. Please try again.');
                  } else {
                    explorer.view_model.error('');
                  }

                  // need to make sure on files view since we're loading asynchronously
                  // from local storage
                  if (first_account && explorer.view_model.current() == 'files') {
                    router.setLocation('#/files');
                    first_account = false;
                  }

                  // need to make sure on accounts view since... ^^^
                  if (explorer.manager.accounts().length === 0) {
                    router.setLocation('#/accounts');
                  }
                });
              })(accounts[i]);

            }
          });
        },

        setLocation: function (path) {
          /*
           We override setLocation in the router, so this let's us bypass the
           hash actually changing.
           */
          router.setLocation(path);
        },

        // Request states.
        error: ko.observable(''),
        loading: ko.observable(true),

        localizedConfirmPopup: function(token, variables) {
          try{
            window.top.document
          } catch(e) {
            //DOMException: the widget is embedded by a page from different domain
            //we cannot inspect if allow-modals is set in the parent page, so assume it is disabled
            return true;
          }
          return confirm(localization.formatAndWrapMessage(token, variables));
        },

        logo_url: ko.pureComputed(function() {
          return (config.user_data() || {}).logo_url || '';
        }),

        static: function(path) {
          return config.static_path.replace(/\/$/, '') + '/' +
            path.replace(/^\//, '');
        },

        // Accounts view model.
        accounts: {
          // List of all account objects.
          all: self.manager.accounts,

          // Current active service
          active: ko.pureComputed(function() {
            if (this.view_model.current() === 'computer')
              return 'computer';
            return this.manager.active().service;
          }, self),

          active_logo: ko.pureComputed(function() {
            return config.static_path + '/webapp/sources/' +
              this.view_model.accounts.active() + ".png";
          }, self),

          logout: function () {
            var accounts = explorer.manager.accounts();
            for (var i =0; i < accounts.length; i++) {
              explorer.manager.deleteAccount(accounts[i].account, function(account_data) {
                // post message for account
                explorer.view_model.postMessage('deleteAccount',
                  account_data.account);
              });
            }

            storage.removeAllAccounts(config.app_id);
            router.setLocation('#/accounts');
            explorer.view_model.postMessage('logout');
          },

          // Current active service name
          name: ko.pureComputed(function() {
            if (this.view_model.current() === 'computer')
              return 'My Computer';
            return this.manager.active().account_name;
          }, self),

          // Returns hash mapping a string service name to an array of account objects.
          by_service: ko.computed(function() {
            var accounts = this(); // gimmick to register observer with KO
            var output = {};

            for (var i = 0; i < accounts.length; i++) {
              if (!(accounts[i].service in output)) {
                output[accounts[i].service] = [];
              }
              output[accounts[i].service].push(accounts[i]);
            }

            return output;
          }, self.manager.accounts),

          // Connect new account.
          connect: function(service) {
            // if clicking on computer, switch to computer view
            if (service == 'computer') {
              router.setLocation('#/computer');
              return;
            }

            logger.debug('Account connection invoked for service: ' + service + '.');
            var serviceData = services()[service];

            explorer.manager.addAccount(service, {
              on_confirm_with_iexd: function() {
                explorer.view_model.addconfirm.serviceName = serviceData.name;
                explorer.view_model.addconfirm.serviceLogo = serviceData.logo;

                router.setLocation('#/addconfirm');

                // position the iframe on the modal;
                //
                // note that we can't move the iframe in the DOM (e.g. to be a
                // child of some element in our template) because that will
                // force a reload, and we'll lose all existing state
                // --> http://stackoverflow.com/q/7434230/612279

                setTimeout(function() {
                  var button = $('#confirm-add-button');
                  var pos = button.offset();

                  $(auth.iframe).css({
                    top: pos.top + 'px',
                    left: pos.left + 'px',
                    width: button.outerWidth(),
                    height: button.outerHeight()
                  }).show();
                }, 0);
              },
              on_account_ready: function(account) {
                logger.debug('Redirecting to files view? ', first_account);

                // Don't allow duplicate accounts
                for (var i = 0; i < explorer.manager.accounts().length; i++) {
                  var acc = explorer.manager.accounts()[i];
                  if (acc.account == account.account) {
                    //Delete existing account to be overridden by new account
                    explorer.manager.removeAccount(acc.account);
                  }
                }

                explorer.manager.accounts.push(account);

                if (Object.keys(ko.toJS(explorer.manager.active)).length === 0) {
                  explorer.manager.active(explorer.manager.getByAccount(account.account));
                }

                // post message for account
                explorer.view_model.postMessage('addAccount', {
                  id: account.account,
                  name: account.account_name,
                  service: account.service
                });

                if (first_account) {
                  explorer.view_model.loading(true);
                  router.setLocation('#/files');
                }
                else {
                  router.setLocation('#/accounts');
                }
              },
              on_fs_ready: function(err, result) {
                if (err && error_message) {
                  explorer.view_model.error(error_message);
                } else if (err) {
                  explorer.view_model.error(err.message);
                } else {
                  explorer.view_model.error('');
                }

                if (first_account) {
                  explorer.view_model.loading(false);
                  first_account = false;
                }

                // store accounts
                storage.storeAccounts(config.app_id, explorer.manager.accounts());
              }
            });
          },
          computer: config.visible_computer,
          account_management: config.account_management,
        },

        // addconfirm view model
        addconfirm: {},

        // Files view model.
        files: {
          all: self.fileManager.files,

          // Compute breadcrumbs.
          breadcrumbs: ko.computed(function() {
            var self = this(); // gimmick to register observer with KO

            if (Object.keys(self).length === 0) { // check to make sure an active account is set
              return util.isMobile ? ['/'] : null;
            }
            var paths = self.filesystem().path();
            return util.isMobile ? ['/'].concat(paths) : paths;
          }, self.manager.active),
          // Return active service
          service: ko.computed(function() {
            return this().service;
          }, self.manager.active),
          service_friendly: ko.computed(function() {
            if (!this().service)
              return "";
            if (!services()[this().service])
              return "";

            return services()[this().service].name;
          }, self.manager.active),
          // Compute current working directory.
          cwd: ko.computed(function() {
            var self = this();

            if (Object.keys(self).length === 0) {
              return null;
            }
            logger.debug('Recomputing cwd...');
            return self.filesystem().cwd();
          }, self.manager.active),
          // Relative navigation.
          navigate: function(file) {
            logger.debug('Navigating to file: ', file);
            var target = file;
            var parent = self.manager.active().filesystem().PARENT_FLAG;
            if (typeof file == 'string' && file == parent) {
              target = parent;
            }
            // remove properties that are only for internal use
            // IE 11 does not support Object.assign
            var target2 = {};
            Object.keys(target).forEach(function(key){
              target2[key] = target[key];
            });
            delete target2.friendlySize;

            self.view_model.loading(true);
            self.manager.active().filesystem().navigate(target2, function(err, result) {
              logger.debug('Navigation result: ', err, result);
              self.view_model.loading(false);
              if (err && error_message) {
                return self.view_model.error(error_message);
              } else if (err) {
                return self.view_model.error(err.message);
              }
              self.view_model.error('');
            });
          },
          // Breadcrumb navigation.
          navUp: function(obj, event) {
            // prevent up() from being called recursively (by `change` binding)
            if (obj.navTimer) return;
            obj.navTimer = setTimeout(function() {
              delete obj.navTimer;
            }, 1000);
            var index = this.breadcrumbs().indexOf($('.navigator').val());
            var level = this.breadcrumbs().length - index - 1;
            level = level < 0 ? 0 : level;
            this.up(level);
          },
          up: function(count) {
            logger.debug('Going up ' + count + ' directories.');

            self.view_model.loading(true);
            self.manager.active().filesystem().up(count, function(err, result) {
              self.view_model.loading(false);
              if (err && error_message) {
                return self.view_model.error(error_message);
              } else if (err) {
                return self.view_model.error(err.message);
              }
              self.view_model.error('');
            });
          },
          mkdir: function() {
            self.view_model.loading(true);
            var name = $('.new-folder-name').val();
            logger.debug('New folder name', name);
            self.manager.active().filesystem().mkdir(name, function(err, result) {
              // update first entry
              if (err && error_message) {
                self.view_model.error(error_message);
              } else if (err) {
                self.view_model.error(err.message);
              } else {
                self.view_model.error('');
                var dir = self.manager.active().filesystem().updatedir(result);
                if (dir) {
                  self.view_model.files.navigate(dir);
                }
              }
              self.view_model.loading(false);
            });
          },
          newdir: function() {
            if (self.manager.active().filesystem().current().can_create_folders) {
              self.manager.active().filesystem().newdir();
            } else {
              self.view_model.error('Sorry! Folders cannot be created in this directory');
            }
          },
          rmdir: function() {
            self.manager.active().filesystem().rmdir();
          },
          refresh: function() {
            logger.debug('Refreshing current directory');
            $('input[type="search"]').val('');
            self.view_model.loading(true);
            self.manager.active().filesystem().refresh(true, function(err, result) {
              self.view_model.loading(false);
              if (err && error_message) {
                return self.view_model.error(error_message);
              } else if (err) {
                return self.view_model.error(err.message);
              }
              self.view_model.error('');
            });
          },
          sort: function(option) {
            self.manager.active().filesystem().sort(option);
          },
          searchQuery: ko.observable(""),
          search: function() {
            (function(query) {
              if (query === "") {
                self.view_model.files.refresh();
                return;
              }
              self.view_model.loading(true);
              var currentFs = explorer.manager.active().filesystem();
              var s = new Search(currentFs.id, currentFs.key, query);
              s.search(function() {
                var fs = self.manager.active().filesystem();
                fs.display(fs.filterChildren(s.results.objects));
                self.view_model.loading(false);
              }, function() {
                self.view_model.error("The search request was not successful.");
                self.view_model.loading(false);
              });
            })(self.view_model.files.searchQuery());
          },

          allow_newdir: config.create_folder,

          // Placeholder for finderSelect'd jQuery object.
          table: null,
        },

        // Computer view model.
        computer: {

        },

        // List of supported services. Used to render things on the accounts page.
        services: services,
      };


      this.view_model.files.searchQuery.extend({
        rateLimit: {
          timeout: 250,
          method: "notifyWhenChangesStop"
        }
      });
      this.view_model.files.searchQuery.subscribe(this.view_model.files.search, this);

      ko.applyBindings(this.view_model);
    };

    // Switch views between 'accounts', 'files', and 'computer'.
    FileExplorer.prototype.switchViewTo = function(to) {
      var explorer = this;
      explorer.view_model.current(to);

      // When view is changed, the old view template is unloaded.
      if (to !== 'dropzone') {
        dropzoneLoaded = false;
      }

      if (to === 'dropzone') {
        var dz = $('#dropzone');
        dz.on('click', function() {
          explorer.view_model.postMessage('dropzoneClicked');
        });

        // Make sure to only load the dropzone once
        if (!dropzoneLoaded) {
          var dropzone = new mOxie.FileDrop({
            drop_zone: dz.get(0)
          });

          // Because templates are re-rendered on view change, don't add
          // dropped files to the computer view uploader immediately.
          // Instead, add it to a queue that will be processed after
          // the router switches to the computer view.
          dropzone.ondrop = function(event) {
            explorer.view_model.postMessage('drop');
            filesQueue.push(dropzone.files);
            router.setLocation('#/computer');
          };

          dropzone.init();
          dropzoneLoaded = true;
        }
      }

      if (to !== 'addconfirm') {
        $(auth.iframe).hide();
      }

      if ($("#search-query").is(":visible"))
        $("#search-back-button").trigger("click");

      if ($('.accountsbutton'))
        $('.accountsbutton').dropdown('hide');

      // Initialise jQuery dropdown plugin.
      if (to == 'files' || to == 'computer') {
        $('.accountsbutton').dropdown('attach', ['#account-dropdown']);

        // Since we're not using foundation, add click handler to 'x'
        $('.close').off('click');
        $('.close').on('click', function(e) {
          // clear the error
          explorer.view_model.error('');
          e.preventDefault();
          e.stopPropagation();
        });
      }

      // Initialise infinite scroll
      if (to == 'files') {
        $("#fs-scroller").off("scrollstop");
        $("#fs-scroller").on("scrollstop", function(e) {
          var scrolled = $(this).scrollTop();
          var tableHeight = $(this).outerHeight();
          var contentHeight = $("#fs-view-body").outerHeight();

          // load more
          if ((scrolled + tableHeight) >= contentHeight) {
            explorer.view_model.loading(true);
            explorer.manager.active().filesystem().getPage(function() {
              explorer.view_model.loading(false);
            });
          }
        });

        //Search jquery actions
        $(".search").off('click');
        $("#search-enable-button, #search-back-button").on('click', function() {
          $(".refresh-button, #search-back-button").toggle();
          var duration = 150;
          if ($("#search-query").is(":visible")) {
            $("#search-enable-button").removeClass('search-active');
            explorer.view_model.files.refresh();
            //Slide along with search query
            $("#search-enable-button").animate({
              left: "+=360"
            }, duration);
            $("#search-enable-button").animate({
              left: "-=360"
            }, 0);
            $("#search-query").toggle('slide', {
              direction: "right"
              }, duration, function() {
                $(".breadcrumbs, .new-folder-button").toggle();
            });
            $("#search-query").val("");
          } else{
            $("#search-enable-button").addClass('search-active');
            $(".new-folder-button, .breadcrumbs").toggle();
            $("#search-enable-button").animate({
              left: "+=360"
            }, 0);
            $("#search-enable-button").animate({
              left: "-=360"
            }, duration);
            $("#search-query").toggle('slide', {
              direction: "right"
            }, duration);
            $("#search-query").focus()
              .off("keyup")
              .on("keyup", function(e) {
                if (e.keyCode == 27) { // Escape key
                  $("#search-back-button").click();
                  e.stopPropagation();
                }
              });
          }
        });
      }

      if (to == 'computer') {
        initializePlUpload();
      }
    };

    function initializePlUpload() {
      $(function() {
        var selections = [];
        var filtered_types = [];
        // if not default 'all' or 'files', add the mimetypes
        if ((config.types.indexOf('all') == -1 && config.types.indexOf('files') == -1) ||
            (config.types.length != 1)) {
          filtered_types.push({
            title: "Uploadable files",
            extensions: config.types.join(",")
          });
        }

        var upload_url = (config.upload_location_uri() ||
                          (config.base_url + '/drop/' + config.app_id))

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
            mime_type: file.type
          };
        }

        // Default cancel button action.
        $('#cancel-button').click(function() {
          explorer.view_model.cancel();
        });

        $('#uploader').plupload({
          // Required
          url: upload_url,
          // browse_button: "uploader",

          // Filters
          filters : (function() {
            var filters = {
              max_file_size: '50000mb',
              prevent_duplicates: false, // unique_names instead.
              mime_types: filtered_types
            };

            // Don't set to 0, because it forces 0 files to be selected.
            // Happens even though the default is supposed to be 0.
            if (!config.multiselect)
              filters['max_file_count'] = 1;

            return filters;
          })(),

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
          runtimes : 'html5',

          // Rename files by clicking on their titles
          rename: true,

          // Unique file names
          // This is set to false because we use the file ID
          // to identify the file instead.
          unique_names: false,

          // Sort files
          sortable: true,

          // Enable ability to drag'n'drop files onto the widget (currently only HTML5 supports that)
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
            PostInit: function() {
              var uploader = this;

              // Add drag & dropped files
              for (var i = 0; i < filesQueue.length; i++) {
                uploader.addFile(filesQueue[i]);
              }
              filesQueue = [];

              // enable the browse button
              $('#uploader_browse').removeAttr('disabled');
              // Add pause/resume upload handler
              $('#upload-button').click(function() {
                if ($(this).text() == 'Upload') {
                  $(this).text('Pause');
                  uploader.start();
                  explorer.view_model.loading(true);
                } else if ($(this).text() == 'Pause') {
                  $(this).text('Resume');
                  uploader.stop();
                  explorer.view_model.loading(false);
                } else if ($(this).text() == 'Resume') {
                  $(this).text('Pause');
                  uploader.start();
                  explorer.view_model.loading(true);
                }
              });
              // Add confirmation when closing tabs during uploading process
              $(window).bind('beforeunload', function() {
                // Add confirmation if not IE or IE 11 only.
                if (util.isIE == false || util.ieVersion == 11) {
                  if (uploader.total.queued > 0) {
                    var msg = ('Are you sure you want to close this tab? You have an' +
                               ' upload in progress.');
                    return msg;
                  }
                }
              });

              // Add abort upload handler
              $('#cancel-button').off();
              $('#cancel-button').on('click', function() {
                var msg = ('Are you sure you want to cancel? You have an' +
                           ' upload in progress.');
                if (uploader.total.queued > 0) {
                  uploader.stop();
                  if (confirm(msg)) {
                    $('#upload-button').text('Upload');

                    var file_ids_to_abort = uploader.files.filter(function(f) {
                      return $.inArray(f.status, [plupload.QUEUED, plupload.UPLOADING]) > -1;
                    }).map(function(f) { return f.id; });

                    uploader.splice();
                    explorer.view_model.cancel();

                    // Abort asynchronously.
                    window.setTimeout(function() {
                      $.each(file_ids_to_abort, function(index, id) {
                        var headers = {"X-Explorer-Id": explorer.id};
                        if (config.upload_location_account() && config.upload_location_folder()) {
                          // A specific Upload Location is being used.
                          headers['X-Drop-Account'] = config.upload_location_account();
                          headers['X-Drop-Folder'] = config.upload_location_folder();
                        }

                        // Add a query parameter.
                        var parser = document.createElement('a');
                        parser.href = upload_url
                        parser.search += "file_id=" + id

                        $.ajax({
                          url: parser.href,
                          type: 'DELETE',
                          headers: headers,
                        });
                      });
                    }, 0);

                  } else {
                    uploader.start();
                  }
                } else {
                  explorer.view_model.cancel();
                }
              });

              $(window).off('offline').on('offline', function(ev) {
                if (uploader.state == plupload.STARTED) {
                  uploader.stop();
                  uploader._offline_pause = true;
                  $('#upload-button').text('Resume');
                  explorer.view_model.error(
                    'Uploading has been paused due to disconnection.');
                }
              });
        
              $(window).off('online').on('online', function(ev) {
                if (uploader._offline_pause) {
                  uploader._offline_pause = false;
                  uploader.start();
                  $('#upload-button').text('Pause');
                  explorer.view_model.error('');
                }
              });
              
            },
            BeforeUpload: function(up, file) {
              /**
               * Called just before a file begins to upload. Called once
               * per file being uploaded.
               */
              up.settings.multipart_params = up.settings.multipart_params || {};
              up.settings.multipart_params['file_id'] = file.id;
              up.settings.multipart_params['file_size'] = file.size;
              if (config.link) {
                up.settings.multipart_params['link'] = true;
                up.settings.multipart_params['link_options'] = JSON.stringify(config.link_options());
              }

              up.settings.headers = up.settings.headers || {};
              // Not using up.id because it changes with every plUpload().
              up.settings.headers["X-Explorer-Id"] = explorer.id;
              if (config.upload_location_account() && config.upload_location_folder()) {
                // A specific Upload Location is being used.
                up.settings.headers['X-Drop-Account'] = config.upload_location_account();
                up.settings.headers['X-Drop-Folder'] = config.upload_location_folder();
              }

              explorer.view_model.error('');
              explorer.view_model.postMessage('startFileUpload',
                                              formatFileObject(file));
            },
            FileUploaded: function(up, file, info) {
              /**
               * Called just after a file has been successfully uploaded to
               * Kloudless. Called once per file being uploaded.
               */
              if (info.status == 200 || info.status == 201) {
                var responseData = JSON.parse(info.response);
                if (Object.keys(responseData).length > 5) {
                  selections.push(responseData);
                }

                var data = formatFileObject(file);
                data.metadata = responseData;
                explorer.view_model.postMessage('finishFileUpload', data);
              }
            },
            Error: function(up, args) {
              // file extension error
              if (args.code == plupload.FILE_EXTENSION_ERROR) {
                var filter_msg = 'Please upload files of the following types: ';
                filter_msg += config.types.join(", ") + '.';
                explorer.view_model.error(filter_msg);
              }
              else if (args.code == plupload.HTTP_ERROR) {
                logger.error("Error uploading file '" + args.file.name + "': " +
                             args.response);
                if (config.uploads_pause_on_error()) {
                  explorer.view_model.error(
                    "Uploading has been paused due to errors. Resume to retry.")

                  // Reset the % loaded for the file in the UI
                  // plupload only resets file.loaded in handleError(),
                  // so we need to fix file.percent.
                  args.file.percent = Math.ceil(args.file.loaded / args.file.size * 100);
                  args.file.status = plupload.UPLOADING;
                  up.trigger('UploadFile', args.file);

                  setTimeout(function() {
                    // Update the UI after re-queueing the file to allow the file to be
                    // deleted from the queue if needed.
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
            UploadComplete: function(files) {
              $('#upload-button').text('Upload');
              explorer.view_model.postMessage('success', selections);
              selections = [];
              this.splice();
            }
          }
        });

      });
    }

    FileExplorer.prototype.cleanUp = function() {
      // File Explorer will close. Clean up.
      var self = this;
      processingConfirm = false;

      if ($("#search-query").is(":visible"))
        $("#search-back-button").click();
      self.view_model.loading(false);
      self.view_model.error('');
      if (self.view_model.files.table) {
        self.view_model.files.table.finderSelect('unHighlightAll');
      }
      self.fileManager.files.removeAll(); // Saver
    };

    ko.bindingHandlers.finderSelect = {
      init: function(element, valueAccessor) {
        var selector = $(element).finderSelect({
          children: 'tr[data-type="file"]',
          enableClickDrag: config.multiselect,
          enableShiftClick: config.multiselect,
          enableCtrlClick: config.multiselect,
          enableSelectAll: config.multiselect,
        });
        var files = ko.unwrap(valueAccessor());
        files.table = selector;
      },
      update: function(element) {
        $(element).finderSelect('update');
      }
    };

    // Explorer initialisation.
    var explorer = new FileExplorer();
    // TODO: we can display err.message if the new error handling is deployed
    // for now use default error message
    var error_message = "Error! Please try again or contact support.";

    // Router.
    var first_account = true;
    var router = sammy(function() {
      var self = this;

      // Override setLocation to disable history modifications.
      this.disable_push_state = true;
      this.setLocation = function (path) {
        self.runRoute('get', path);
      }

      /*
       * Routes
       */

      // Switch to the accounts page.
      this.get('#/accounts', function() {
        logger.debug('Accounts page requested.');
        explorer.switchViewTo('accounts');
      });

      // Reconnect an erroneously disconnected account.
      // WARNING: THIS HAS NOT YET BEEN IMPLEMENTED.
      this.get('#/account/reconnect/:id', function() {
        logger.debug('Account reconnection invoked for id: ' + this.params.id + '.');
      });

      // Disconnect an account.
      this.get('#/account/disconnect/:id', function() {
        logger.debug('Account disconnection invoked for id: ' + this.params.id + '.');

        explorer.manager.deleteAccount(this.params.id, function (account_data) {
          // post message for account
          explorer.view_model.postMessage('deleteAccount',
            account_data.account);
          // store accounts
          storage.storeAccounts(config.app_id, explorer.manager.accounts());
        });
      });

      // Switch to the files page.
      this.get('#/files', function() {
        logger.debug('File view requested.');
        explorer.switchViewTo('files');
      });
      // Switch to the files view of a particular account.
      // TODO: test.
      this.get('#/files/:account', function() {
        logger.debug('Switching to files of account: ' + this.params.account + '.');
        explorer.switchViewTo('files');
        explorer.manager.active(explorer.manager.getByAccount(this.params.account));
      });
      // Switch to the computer view
      this.get('#/computer', function() {
        logger.debug('Switching to computer view');
        explorer.switchViewTo('computer');
      });
      // Switch to the dropzone view
      this.get('#/dropzone', function() {
        explorer.switchViewTo('dropzone');
      });
      // Confirm add account button
      this.get('#/addconfirm', function() {
        explorer.switchViewTo('addconfirm');
      });

      /*
       * Additional initialization steps.
       */

      this.get('#/', function(ctx) {
        router.setLocation('#/accounts');
      });
    });

    var accountSub = config.all_services.subscribe(function() {
      // This is only for the initial load.
      if (!config._retrievedServices)
        return

      accountSub.dispose();

      // Default to the accounts page if no accounts in local storage
      // storage.removeAllAccounts(config.app_id);
      var accounts = storage.loadAccounts(config.app_id);

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

    // Initialise to '#/' route.
    window.addEventListener('message', function(message) {
      logger.debug('Explorer hears message: ', message.data);
      if (message.origin !== config.origin) {
        return;
      }

      var contents = JSON.parse(message.data);
      // TODO: future config options
      if (contents.action == 'INIT') {
        dataMessageHandler(contents.data)
        if (startView && startView !== 'accounts') {
          router.run('#/' + startView);
        } else {
          router.run('#/');
        }
      } else if (contents.action == 'DATA') {
        dataMessageHandler(contents.data);
      } else if (contents.action == 'CLOSING') {
        explorer.cleanUp();
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
        logger.error("dataMessageHandler: No data found to configure with.")
        return
      }

      // Differentiate between saver and chooser
      // Check the flavor on init call
      if (data.flavor) {
        // refresh and go back to accounts if going from saver to chooser
        // or vice versa
        if (config.flavor() !== data.flavor) {
          logger.debug('SWITCHING FLAVORS');
          router.setLocation('#/accounts');
        }

        config.flavor(data.flavor);
      }

      // Primary way of updating config options
      if (data.options) {
        config.update(data.options);
      }

      if (data.flavor == 'saver') {
        // Add files to fileManager
        if (data.files && data.files.length > 0) {
          // first clear all files.
          explorer.fileManager.files.removeAll();
          for (var i = 0; i < data.files.length; i++) {
            var file = data.files[i];
            explorer.fileManager.add(file.url, file.name);
          }
        }
      } else if (data.flavor == 'chooser') {
        // Default to computer view if account management is disabled and no
        // tokens are provided.
        if (config.visible_computer() && !config.account_management() &&
            !(data.options && data.options.tokens && data.options.tokens.length > 0)) {
          router.setLocation('#/computer');
        }
      } else if (data.flavor == 'dropzone') {
        router.setLocation('#/dropzone');
      }

      // Call sync if frame has already been initialized and there are differences
      // between storage and current accounts
      if (explorer.manager.accounts().length !== 0) {
        var accounts = storage.loadAccounts(config.app_id);
        var account_ids = {};
        var local_accounts = explorer.manager.accounts();
        var i, different = false;
        for (var i = 0; i < accounts.length; i++) {
          var account = accounts[i];
          account_ids[account.account] = true;
        }
        for (var i = 0; i < local_accounts.length; i++) {
          var local_account = local_accounts[i];
          if (! local_account.account in account_ids) {
            different = true;
            break;
          }
        }
        // logger.debug(different || accounts.length != local_accounts.length);
        if (different || accounts.length != local_accounts.length) {
          // Call asynchronously to give other options some time to load.
          window.setTimeout(function () {
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
        window.setTimeout(function () {
          explorer.view_model.sync(
            data.options.keys.map(function (k) {
              return {key: k, scheme: 'AccountKey'};
            }), true);
        }, 0);
      }

      if (data.options && data.options.tokens) {
        window.setTimeout(function () {
          explorer.view_model.sync(
            data.options.tokens.map(function (k) {
              return {key: k, scheme: 'Bearer'};
            }), true);
        }, 0);
      }

      if (config.visible_computer() && !loadedDropConfig && !config.upload_location_uri()) {
        // Looking up chunk size. Since the drop location doesn't really
        // change we look it up based on that. The /drop end point for the
        // API returns the chunk size for that drop location.
        $.ajax({
          method: 'GET',
          url: config.base_url + '/drop/' + config.app_id,
          beforeSend: function(xhr) {
            if (config.upload_location_account()) {
              xhr.setRequestHeader('X-Drop-Account', config.upload_location_account());
              xhr.setRequestHeader('X-Drop-Folder', config.upload_location_folder());
            }
          },
        }).done(function(drop_information) {
          config.chunk_size = drop_information.chunk_size;
          loadedDropConfig = true;
          config.computer(true);
        }).fail(function() {
          // Disable computer if no drop location is set.
          logger.warn("Disabling Computer since no Upload Location set.");
          config.computer(false);
        });
      }

    }

    // This signal is placed last and indicates all the JS has loaded
    // and events can be received.
    explorer.view_model.postMessage('load');
  });
})();
