/* global plupload */
/* eslint-disable no-underscore-dangle, camelcase */

import 'plupload/moxie';
import 'plupload/plupload.dev';
import 'plupload/jquery.ui.plupload/jquery.ui.plupload';
import logger from 'loglevel';
import config from './config';
import localization from './localization';
import util from './util';
import iziToastHelper from './izitoast-helper';

let filesQueue = [];

function addFiles(files) {
  filesQueue.push(...files);
}

function init(picker) {
  $(() => {
    // Can't use ko.applyBindings(picker.view_model, $('.computer')[0]);
    // to bind the dynamic content because it'll occur the error blow:
    // "You cannot apply bindings multiple times to the same element"
    // So we have to translate the text manually
    const textUpload = localization.formatAndWrapMessage('global/upload');
    const textPause = localization.formatAndWrapMessage('global/pause');
    const textResume = localization.formatAndWrapMessage('global/resume');
    const textProcessing = localization.formatAndWrapMessage(
      'global/processing',
    );

    let selections = [];
    const filtered_types = [];
    const types = config.types();
    // if not default 'all' or 'files', add the mimetypes
    if (!types.includes('files')) {
      filtered_types.push({
        title: 'Uploadable files',
        extensions: types.join(','),
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

    $('#computer_uploader').plupload({
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
        PostInit() {
          const $btnCancel = $('#plupload_btn_cancel');
          const $btnUpload = $('#plupload_btn_upload');
          $btnUpload.text(textUpload);
          const uploader = this;

          // Add drag & dropped files
          for (let i = 0; i < filesQueue.length; i += 1) {
            uploader.addFile(filesQueue[i]);
          }
          filesQueue = [];

          // Add pause/resume upload handler
          $btnUpload.click(() => {
            if ($($btnUpload).text() === textUpload) {
              $($btnUpload).text(textPause);
              uploader.start();
            } else if ($($btnUpload).text() === textPause) {
              $($btnUpload).text(textResume);
              uploader.stop();
            } else if ($($btnUpload).text() === textResume) {
              $($btnUpload).text(textPause);
              uploader.start();
            }
          });
          // Add confirmation when closing tabs during uploading process
          // eslint-disable-next-line consistent-return
          $(window).bind('beforeunload', () => {
            // Add confirmation if not IE or IE 11 only.
            // eslint-disable-next-line eqeqeq
            if (util.isIE == false || util.ieVersion == 11) {
              if (uploader.total.queued > 0) {
                const msg = localization.formatAndWrapMessage(
                  'computer/confirmClose',
                );
                return msg;
              }
            }
          });

          // Add abort upload handler
          $btnCancel.off();
          $btnCancel.on('click', () => {
            const msg = localization.formatAndWrapMessage(
              'computer/confirmCancel',
            );
            if (uploader.total.queued > 0) {
              uploader.stop();
              if (window.confirm(msg)) { // eslint-disable-line no-alert
                $btnUpload.text(textUpload);

                const file_ids_to_abort = uploader.files
                  .filter(f => (
                    [plupload.QUEUED, plupload.UPLOADING].includes(f.status)))
                  .map(f => f.id);

                uploader.splice();
                // eslint-disable-next-line no-use-before-define
                picker.view_model.cancel();

                // Abort asynchronously.
                window.setTimeout(() => {
                  $.each(file_ids_to_abort, (index, id) => {
                    // TODO-v3: remove X-Explorer-Id
                    // eslint-disable-next-line no-use-before-define
                    const headers = {
                      'X-Explorer-Id': picker.id,
                      'X-Picker-Id': picker.id,
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
              } else if ($btnUpload.text() === textPause
                  || $btnUpload.text() === textProcessing) {
                // means it was uploading, so we should resume the process
                uploader.start();
              }
            } else {
              $btnUpload.text(textUpload);
              picker.view_model.cancel();
            }
          });

          $(window).off('offline').on('offline', () => {
            // eslint-disable-next-line eqeqeq
            if (uploader.state == plupload.STARTED) {
              uploader.stop();
              uploader._offline_pause = true;
              $btnUpload.text(textResume);
              const msg = localization.formatAndWrapMessage(
                'computer/disconnect',
              );
              iziToastHelper.error(msg, { timeout: 0 });
            }
          });

          $(window).off('online').on('online', () => {
            if (uploader._offline_pause) {
              uploader._offline_pause = false;
              uploader.start();
              $btnUpload.text(textPause);
              iziToastHelper.destroy();
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
          // TODO-v3: remove X-Explorer-Id
          // eslint-disable-next-line no-use-before-define
          up.settings.headers['X-Explorer-Id'] = picker.id;
          // eslint-disable-next-line no-use-before-define
          up.settings.headers['X-Picker-Id'] = picker.id;
          const uploadAccount = config.upload_location_account();
          const uploadFolder = config.upload_location_folder();
          if (uploadAccount && uploadFolder) {
            // A specific Upload Location is being used.
            up.settings.headers['X-Drop-Account'] = uploadAccount;
            up.settings.headers['X-Drop-Folder'] = uploadFolder;
          }

          iziToastHelper.destroy();
          // eslint-disable-next-line no-use-before-define
          picker.view_model.postMessage('startFileUpload',
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
            picker.view_model.postMessage('finishFileUpload', data);
          }
        },
        UploadProgress(up) {
          if (up.total.percent === 100) {
            $('#plupload_btn_upload').attr('disabled', true);
            $('#plupload_btn_upload').text(textProcessing);
            $('#computer_uploader_browse').attr('disabled', true);
          }
        },
        Error(up, args) {
          // file extension error
          // eslint-disable-next-line eqeqeq
          if (args.code == plupload.FILE_EXTENSION_ERROR) {
            const filter_msg = localization.formatAndWrapMessage(
              'computer/pleaseUploadFilesOfTypes',
              { types: types.join(', ') },
            );
            iziToastHelper.error(filter_msg, { timeout: 0 });
            // eslint-disable-next-line eqeqeq
          } else if (args.code == plupload.HTTP_ERROR) {
            logger.error(`Error uploading file '${args.file.name}': ${
              args.response}`);
            if (config.uploads_pause_on_error()) {
              const msg = localization.formatAndWrapMessage('computer/error');
              iziToastHelper.error(msg, { timeout: 0 });

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

              $('#plupload_btn_upload').click(); // Pause the upload.
            } else {
              up.removeFile(args.file);
              up.stop();
              up.start();
            }
          }
        },
        UploadComplete() {
          $('#plupload_btn_upload').text(textUpload);
          $('#plupload_btn_upload').removeAttr('disabled');
          $('#computer_uploader_browse').removeAttr('disabled');
          picker.view_model.postMessage('success', selections);
          selections = [];
          this.splice();
        },
      },
    });
  });
}

export default {
  init,
  addFiles,
};
