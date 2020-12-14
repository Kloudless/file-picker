/* global plupload */
/* eslint-disable camelcase */

import 'plupload/moxie';
import 'plupload/plupload.dev';
import 'plupload/jquery.ui.plupload/jquery.ui.plupload';
import logger from 'loglevel';
import config from './config';
import localization from './localization';
import util from './util';
import iziToastHelper from './izitoast-helper';
import { LOADER_FEATURES } from '../../constants';

// Translation keys
const TRANSLATION_KEYS = {
  UPLOAD: 'global/upload',
  PAUSE: 'global/pause',
  RESUME: 'global/resume',
};

// Selectors
const SELECTORS = {
  PLUPLOAD: '#computer_uploader',
  BTN_UPLOAD: '#plupload_btn_upload',
  BTN_CANCEL: '#plupload_btn_cancel',
  BTN_ADD_MORE: '#computer_uploader_browse',
  BTN_ADD: '#plupload_btn_add_files',
};

const MAX_UPLOAD_SLOTS = 6;
const MAX_UPLOAD_RETRIES = 2;

class PluploadHelper {
  constructor(picker) {
    // Resolved when document is ready.
    this.documentReady = new Promise(resolve => $(document).ready(resolve));
    this.picker = picker;
    // Plupload instance
    this.pluploader = null;

    this.initData();
    this.initButtonsAndTexts();
  }

  /**
   * Format a Plupload.File info the following format:
   * {
   *   id: <string>,
   *   name: <string>,
   *   size: <number>,
   *   mime_type: <string>,
   *   error?: <Kloudless Error Object>,
   *   metadata?: <Kloudless File/Folder Object>
   * }
   * `error` is presented if file.status is plupload.FAILED.
   * `metadata` is presented if file.status is plupload.DONE.
   * @param {plupload.File} file
   */
  static formatFileObject(file) {
    const result = {
      id: file.id,
      name: file.name,
      size: file.size,
      mime_type: file.type,
    };
    if (file.status === plupload.FAILED) {
      result.error = file._error || {};
    }
    if (file.status === plupload.DONE) {
      result.metadata = file._metadata || {};
    }
    return result;
  }

  /**
   * @param {plupload.Uploader} up
   * @param {plupload.File} file
   * @param {string} response
   */
  static handleFileError(up, file, response) {
    up.stop();
    // Force update file status.
    file.status = plupload.FAILED;
    up.trigger('UploadProgress', file);
    if (config.uploads_pause_on_error()) {
      const msg = localization.formatAndWrapMessage(
        'computer/error', { file: file.name },
      );
      PluploadHelper.showError(msg, response);
    } else {
      const msg = localization.formatAndWrapMessage(
        'computer/uploadFail', { file: file.name },
      );
      PluploadHelper.showError(msg, response);
      try {
        file._error = JSON.parse(response);
      } catch (ex) {
        // Response may be "" when there is no network.
        logger.error(`Un-expected response format: ${response}`);
      }
      up.start();
    }
  }

  static showError(msg, detail) {
    iziToastHelper.error(msg, { detail });
  }

  static clearError() {
    iziToastHelper.destroy();
  }

  static supportNoSuccessOnCancelOrFail() {
    return config.isSupported(
      LOADER_FEATURES.COMPUTER_NO_SUCCESS_ON_CANCEL_OR_FAIL,
    );
  }

  // Init data except buttons and texts.
  initData() {
    // Record the files that are dropped into Dropzone before Plupload
    // setup.
    this.files = [];
    // Used to determine whether to show 'Resume' or 'Upload' for the button.
    this.hasStarted = false;
  }

  addFiles(files) {
    this.files.push(...files);
  }

  /**
   * Close FP and emit proper event.
   * This won't destroy the Plupload, just reset some data.
   * @param {plupload.Uploader} up
   */
  finish(up) {
    const successFiles = up.files.filter(f => f.status === plupload.DONE)
      .map(f => f._metadata || {});
    const failedFiles = up.files.filter(f => f.status === plupload.FAILED)
      .map(f => PluploadHelper.formatFileObject(f));
    this.picker.finish(
      successFiles,
      failedFiles,
      localization.formatAndWrapMessage(
        'global/computerSuccess',
        { number: successFiles.length },
      ),
      {
        successOnAllFail: !PluploadHelper.supportNoSuccessOnCancelOrFail(),
      },
    );
    this.initData();
    // Removed all the files.
    up.splice();
  }

  /**
   * Invoke picker.cancel() and clear plupload.
   * @param {plupload.Uploader} up
   */
  cancel(up) {
    this.picker.view_model.cancel({
      fireSuccess: !PluploadHelper.supportNoSuccessOnCancelOrFail(),
    });
    this.initData();
    // Removed all the files.
    up.splice();
  }

  /**
   * Destroy plupload and reset data and listeners
   */
  destroyPlupload() {
    this.initData();
    this.initButtonsAndTexts();
    try {
      this.pluploader.plupload('destroy');
    } catch (ex) {
      // In case of the Plupload element is removed by knockout while switching
      // between views.
    } finally {
      this.pluploader = null;
    }
  }

  /**
   * Update buttons' status and text.
   * @param {plupload.Uploader} up
   */
  updateButton(up) {
    // Disable add if there are more than one files.
    if (up.files.length > 0) {
      this.buttons.add.attr('disabled', true);
    } else {
      this.buttons.add.removeAttr('disabled');
    }

    // Reset upload and addMore button.
    this.buttons.upload.removeAttr('disabled');
    this.buttons.addMore.removeAttr('disabled');

    if (up.state === plupload.STARTED) {
      this.buttons.upload.text(this.texts.pause);
    } else {
      // up.state === plupload.STOPPED
      this.buttons.upload.text(
        this.hasStarted ? this.texts.resume : this.texts.upload,
      );
    }

    // disable addMore button if multiselect is false and there are files
    // selected.
    if (!config.multiselect() && up.files.length > 0) {
      this.buttons.addMore.attr('disabled', true);
    }
  }

  initButtonsAndTexts() {
    // remove event listeners if any.
    if (this.buttons) {
      Object.values(this.buttons).forEach((button) => {
        if (button) {
          button.off();
        }
      });
    }

    this.buttons = {
      cancel: null,
      upload: null,
      addMore: null,
      // The button in the initial page where no file is selected.
      add: null,
    };

    this.texts = {
      pause: null,
      upload: null,
      resume: null,
    };
  }

  /**
   * Initialize Plupload
   */
  async setupPlupload() {
    if (this.pluploader !== null) {
      this.destroyPlupload();
    }

    await this.documentReady;

    const types = config.types();
    const filtered_types = [];
    // if not 'files', add the mime-types
    if (!types.includes('files')) {
      // TODO: deal with mime-types
      filtered_types.push({
        title: 'Uploadable files',
        extensions: types.join(','),
      });
    }

    const upload_url = (config.upload_location_uri() ||
      (`${config.base_url}/drop/${config.app_id}`));

    this.pluploader = $(SELECTORS.PLUPLOAD).plupload({
      multi_selection: config.multiselect(),
      // Required
      url: upload_url,
      // browse_button: "uploader",

      // Filters
      filters: {
        max_file_size: config.max_size(),
        prevent_duplicates: false, // unique_names instead.
        mime_types: filtered_types,
        max_file_count: config.multiselect() ? undefined : 1,
      },
      // Multipart / Chunking
      multipart: false,
      multipart_params: {},
      chunk_size: config.chunk_size,
      max_retries: MAX_UPLOAD_RETRIES,
      delayStrategy: util.getExpBackoffDelayMs,

      // Parallelize
      max_upload_slots: MAX_UPLOAD_SLOTS,

      // Misc
      // eslint-disable-next-line max-len
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
      // sortable: true,

      // Enable ability to drag'n'drop files onto the widget
      // (currently only HTML5 supports that)
      dragdrop: true,

      browse_button: 'plupload_btn_add',

      container: 'plupload_btn_container',

      // Views to activate
      views: {
        list: true,
        thumbs: false, // Hide thumbs
        active: 'list', // 'thumbs' is another possible view.
      },

      init: {
        PostInit: (up) => {
          logger.debug('PostInit');
          /**
           * KNOWN ISSUE:
           * The translation texts only get refreshed when initializing
           * plupload. Therefore, we don't really support dynamic locale
           * changes.
           * */
          this.texts.pause = localization.formatAndWrapMessage(
            TRANSLATION_KEYS.PAUSE,
          );
          this.texts.upload = localization.formatAndWrapMessage(
            TRANSLATION_KEYS.UPLOAD,
          );
          this.texts.resume = localization.formatAndWrapMessage(
            TRANSLATION_KEYS.RESUME,
          );

          this.buttons.cancel = $(SELECTORS.BTN_CANCEL);
          this.buttons.upload = $(SELECTORS.BTN_UPLOAD);
          this.buttons.addMore = $(SELECTORS.BTN_ADD_MORE);
          this.buttons.add = $(SELECTORS.BTN_ADD);

          this.updateButton(up);

          // Add drag & dropped files
          up.addFile(this.files);

          // Add pause/resume upload handler
          this.buttons.upload.click(() => {
            if (up.state === plupload.STARTED) {
              up.stop();
            } else {
              PluploadHelper.clearError();
              // Set the failed file status to QUEUED so plupload will re-upload
              // it.
              up.files.filter(
                f => f.status === plupload.FAILED,
              ).forEach((f) => {
                f.status = plupload.QUEUED;
                up.trigger('UploadProgress', f);
              });
              up.start();
              this.hasStarted = true;
            }
          });
          // Add confirmation when closing tabs during uploading process
          // eslint-disable-next-line consistent-return
          $(window).bind('beforeunload', (event) => {
            // Add confirmation if not IE or IE 11 only.
            if (util.isIE === false || util.ieVersion === 11) {
              if (up.total.queued > 0) {
                // Show the confirmation dialog before unload the page.
                event.preventDefault();
                // Set returnValue and return the custom message in case that
                // some browsers don't support event.preventDefault().
                // Also, it seems like the custom message doesn't work when
                // running in storybook.
                // eslint-disable-next-line max-len
                // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
                const msg = localization.formatAndWrapMessage(
                  'computer/confirmClose',
                );
                event.returnValue = msg;
                return msg;
              }
            }
          });

          // Add abort upload handler
          this.buttons.cancel.on('click', () => {
            const msg = localization.formatAndWrapMessage(
              'computer/confirmCancel',
            );
            if (up.total.queued > 0) {
              const originState = up.state;
              up.stop();
              if (window.confirm(msg)) { // eslint-disable-line no-alert
                const file_ids_to_abort = up.files
                  .filter(f => (
                    [plupload.QUEUED, plupload.UPLOADING].includes(f.status)))
                  .map(f => f.id);

                this.cancel(up);

                // Abort asynchronously.
                window.setTimeout(() => {
                  $.each(file_ids_to_abort, (index, id) => {
                    // TODO-v3: remove X-Explorer-Id
                    const headers = {
                      'X-Explorer-Id': this.picker.id,
                      'X-Picker-Id': this.picker.id,
                    };
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
              } else if (originState === plupload.STARTED) {
                // means it was uploading, so we should resume the process
                up.start();
              }
            } else {
              this.cancel(up);
            }
          });

          $(window).off('offline').on('offline', () => {
            if (up.state === plupload.STARTED) {
              up.stop();
              up._offline_pause = true;
              const msg = localization.formatAndWrapMessage(
                'computer/disconnect',
              );
              PluploadHelper.showError(msg);
            }
          });

          $(window).off('online').on('online', () => {
            if (up._offline_pause) {
              up._offline_pause = false;
              up.start();
              PluploadHelper.clearError();
            }
          });
        },
        BeforeUpload: (up, file) => {
          logger.debug('BeforeUpload');
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
          // TODO-v3: remove X-Explorer-Id
          up.settings.headers['X-Explorer-Id'] = this.picker.id;
          up.settings.headers['X-Picker-Id'] = this.picker.id;
          const uploadAccount = config.upload_location_account();
          const uploadFolder = config.upload_location_folder();
          if (uploadAccount && uploadFolder) {
            // A specific Upload Location is being used.
            up.settings.headers['X-Drop-Account'] = uploadAccount;
            up.settings.headers['X-Drop-Folder'] = uploadFolder;
          }

          this.picker.view_model.postMessage(
            'startFileUpload', PluploadHelper.formatFileObject(file),
          );
        },
        FileUploaded: (up, file, info) => {
          logger.debug('FileUploaded');
          /**
           * Called just after a file has been successfully uploaded to
           * Kloudless. Called once per file being uploaded.
           */
          // eslint-disable-next-line eqeqeq
          if (info.status == 200 || info.status == 201) {
            file._metadata = JSON.parse(info.response);
            const data = PluploadHelper.formatFileObject(file);
            this.picker.view_model.postMessage('finishFileUpload', data);
          }
        },
        UploadProgress: (up) => {
          logger.debug('UploadProgress:', up.total.percent);
          if (up.total.percent === 100) {
            this.updateButton(up);
          }
        },
        Error: (up, args) => {
          logger.debug('Error');
          if (args.code === plupload.FILE_SIZE_ERROR) {
            // file size exceeds
            const msg = localization.formatAndWrapMessage(
              'computer/exceedMaxSize',
              { file: args.file.name, maxSize: config.max_size() },
            );
            PluploadHelper.showError(msg);
          } else if (args.code === plupload.FILE_EXTENSION_ERROR) {
            // file extension error
            const filter_msg = localization.formatAndWrapMessage(
              'computer/pleaseUploadFilesOfTypes',
              { types: types.join(', ') },
            );
            PluploadHelper.showError(filter_msg);
            // eslint-disable-next-line eqeqeq
          } else if (args.code == plupload.HTTP_ERROR) {
            // Suppose this kind of error only happens when uploading files.
            PluploadHelper.handleFileError(
              up, args.file, args.response || args.message,
            );
          } else {
            const msg = localization.formatAndWrapMessage('global/error');
            PluploadHelper.showError(msg, { detail: JSON.stringify(args) });
          }
        },
        UploadComplete: (up) => {
          // All files are either DONE or FAILED.
          logger.debug('UploadComplete');
          this.updateButton(up);

          // Don't finish in the following cases:
          // 1. Users remove all the files.
          // 2. uploads_pause_on_error is enabled and there are failures.
          if (
            up.files.length > 0
            && (
              config.uploads_pause_on_error() === false
              || !up.files.some(f => f.status === plupload.FAILED)
            )
          ) {
            this.finish(up);
          }
        },
        StateChanged: (up) => {
          // STOPPED: 1, STARTED: 2
          logger.debug(`StateChanged: ${up.state}`);
          if (up.state === plupload.STOPPED) {
            // The file status remains 'uploading' when plupload pauses so we
            // have to manually remove the loading spinner. The spinner will be
            // added back by _handleFileStatus() in jquery.ui.plupload.js when
            // uploads resume.
            document.querySelectorAll(
              '.plupload__file-status--uploading',
            ).forEach((el) => {
              el.classList.remove('plupload__file-status--uploading');
            });
          }
          this.updateButton(up);
        },
        FilesRemoved: (up) => {
          logger.debug('FilesRemoved');
          this.updateButton(up);
        },
        FilesAdded: (up) => {
          logger.debug('FilesAdded');
          this.updateButton(up);
        },
      },
    });
  }
}

export default PluploadHelper;
