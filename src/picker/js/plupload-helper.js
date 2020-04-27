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

// Translation keys
const TRANSLATION_KEYS = {
  UPLOAD: 'global/upload',
  PAUSE: 'global/pause',
  RESUME: 'global/resume',
  PROCESSING: 'global/processing',
};

// Selectors
const SELECTORS = {
  PLUPLOAD: '#computer_uploader',
  BTN_UPLOAD: '#plupload_btn_upload',
  BTN_CANCEL: '#plupload_btn_cancel',
  BTN_ADD_MORE: '#computer_uploader_browse',
  BTN_ADD: '#plupload_btn_add_files',
};

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
   *   error?: <Kloudless Error Object>
   * }
   * @param {plupload.File} file
   * @param {Object=} error - The error object returns by Kloudless API server.
   */
  static formatFileObject(file, error) {
    const result = {
      id: file.id,
      name: file.name,
      size: file.size,
      mime_type: file.type,
    };
    if (error) {
      result.error = error;
    }
    return result;
  }

  static showError(msg, detail) {
    iziToastHelper.error(msg, { detail, timeout: 0 });
  }

  static clearError() {
    iziToastHelper.destroy();
  }

  // Init data except buttons and texts.
  initData() {
    // Record the files that are dropped into Dropzone before Plupload
    // setup.
    this.files = [];
    // The list of Kloudless file metadata that are uploaded successfully.
    this.uploadedFiles = [];
    /**
     * The files that are failed to upload. See
     * PluploadHelper.formatFileObject() for the format.
     * */
    this.failedFiles = [];
    // Used to determine whether to show 'Resume' or 'Upload' for the button.
    this.hasStarted = false;
  }

  addFiles(files) {
    this.files.push(...files);
  }

  /**
   * @param {Object} file - The file object that is formatted by
   *  PluploadHelper.formatFileObject().
   */
  addFailedFile(file) {
    const index = this.failedFiles.findIndex(f => f.id === file.id);
    if (index > -1) {
      this.failedFiles.splice(index, 1);
    }
    this.failedFiles.push(file);
  }

  removeFailedFile(fileId) {
    const index = this.failedFiles.findIndex(file => file.id === fileId);
    if (index > -1) {
      this.failedFiles.splice(index, 1);
    }
  }

  /**
   * Close FP and emit proper event.
   * This won't destroy the Plupload, just reset some data.
   * @param {plupload.Uploader} up
   * @param {boolean=} cancel - Whether the FP is closed due to cancelling.
   *                            Defaults to false.
   */
  close(up, cancel = false) {
    this.picker.view_model.postMessage('success', this.uploadedFiles);
    if (cancel) {
      this.picker.view_model.cancel();
    } else if (this.failedFiles.length > 0) {
      this.picker.view_model.postMessage('error', this.failedFiles);
    }

    this.initData();
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

    // TODO: disable addMore button if multiselect is false.
    // Reset upload and addMore button.
    this.buttons.upload.removeAttr('disabled');
    this.buttons.addMore.removeAttr('disabled');

    if (up.state === plupload.STARTED) {
      const isProcessing = up.total.percent === 100;
      if (isProcessing) {
        // All the file data are uploaded but server hasn't response yet.
        // Disable buttons to prevent users performing any actions.
        this.buttons.upload.attr('disabled', true);
        this.buttons.addMore.attr('disabled', true);
        this.buttons.upload.text(this.texts.processing);
      } else {
        this.buttons.upload.text(this.texts.pause);
      }
    } else {
      // up.state === plupload.STOPPED
      this.buttons.upload.text(
        this.hasStarted ? this.texts.resume : this.texts.upload,
      );
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
      processing: null,
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
      // Required
      url: upload_url,
      // browse_button: "uploader",

      // Filters
      filters: {
        max_file_size: '50000mb',
        prevent_duplicates: false, // unique_names instead.
        mime_types: filtered_types,
        max_file_count: config.multiselect() ? undefined : 1,
      },
      // Multipart / Chunking
      multipart: false,
      multipart_params: {},
      chunk_size: config.chunk_size,
      max_retries: 2,

      // Parallelize
      max_upload_slots: 6,

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
          this.texts.processing = localization.formatAndWrapMessage(
            TRANSLATION_KEYS.PROCESSING,
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

                this.close(up, true);

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
              this.close(up, true);
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
            const responseData = JSON.parse(info.response);
            if (Object.keys(responseData).length > 5) {
              this.uploadedFiles.push(responseData);
              this.removeFailedFile(file.id);
            }

            const data = PluploadHelper.formatFileObject(file);
            data.metadata = responseData;
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
          // file extension error
          // eslint-disable-next-line eqeqeq
          if (args.code == plupload.FILE_EXTENSION_ERROR) {
            const filter_msg = localization.formatAndWrapMessage(
              'computer/pleaseUploadFilesOfTypes',
              { types: types.join(', ') },
            );
            PluploadHelper.showError(filter_msg);
            // eslint-disable-next-line eqeqeq
          } else if (args.code == plupload.HTTP_ERROR) {
            up.stop();
            logger.error(`Error uploading file '${args.file.name}': ${
              args.response}`);
            if (config.uploads_pause_on_error()) {
              const msg = localization.formatAndWrapMessage(
                'computer/error', { file: args.file.name },
              );
              PluploadHelper.showError(msg, args.response);
              // Reset file progress to 0.
              args.file.offset = 0;
              args.file.loaded = 0;
              args.file.percent = 0;
              args.file.status = plupload.UPLOADING;
              up.trigger('UploadProgress', args.file);
              // Set the file status to QUEUED so users can re-upload it.
              args.file.status = plupload.QUEUED;
              up.trigger('UploadProgress', args.file);
            } else {
              const msg = localization.formatAndWrapMessage(
                'computer/uploadFail', { file: args.file.name },
              );
              PluploadHelper.showError(msg, args.response);
              let error = {};
              try {
                error = JSON.parse(args.response);
              } catch (ex) {
                logger.error(`Un-expected response format: ${args.response}`);
              }
              const file = PluploadHelper.formatFileObject(args.file, error);
              this.addFailedFile(file);
              // TODO: DEV-3117: fix xhr racing issue.
              up.removeFile(args.file);
              up.start();
            }
          }
        },
        UploadComplete: (up) => {
          // All files are either DONE or FAILED.
          logger.debug('UploadComplete');
          this.updateButton(up);
          this.close(up);
        },
        StateChanged: (up) => {
          // STOPPED: 1, STARTED: 2
          logger.debug(`StateChanged: ${up.state}`);
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
