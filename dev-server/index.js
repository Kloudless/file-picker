/* global $, KLOUDLESS_APP_ID */
/* eslint-disable func-names, no-console */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
/**
 * DO NOT import the npm installed jQuery here, to simulate the case
 * where the jquery script is imported by devs integrating
 * the file-picker, instead of from the file-picker itself.
 */

(function () {
  /**
   * Constants
   */
  const EVENTS = [
    'success',
    'cancel',
    'error',
    'open',
    'close',
    'selected',
    'addAccount',
    'deleteAccount',
    'startFileUpload',
    'finishFileUpload',
    'logout',
    'drop',
  ];

  const FILE_CHOOSER_OPTIONS = {
    name: 'File Chooser',
    elementId: 'file-chooser',
    objId: 'fileChooser',
    pickerOptions: {
      multiselect: true,
      link: false,
      computer: true,
      services: ['all'],
      types: ['all'],
      display_backdrop: true,
      // enable options below to test localization
      // locale: 'zh',
      // translations: window.translations,
    },
  };

  const FOLDER_CHOOSER_OPTIONS = {
    global: window.Kloudless2,
    name: 'Folder Chooser',
    elementId: 'folder-chooser',
    objId: 'folderChooser',
    pickerOptions: {
      multiselect: true,
      link: false,
      computer: true,
      services: ['file_store'],
      types: ['folders'],
    },
  };

  const SAVER_OPTIONS = {
    name: 'Saver',
    type: 'saver',
    elementId: 'saver',
    objId: 'saver',
    pickerOptions: {
      flavor: 'saver',
      files: [
        {
          url: 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/'
            + 'static/kloudless-logo-white.png',
          name: 'kloudless-logo.png',
        },
      ],
    },
  };

  const DROPZONE_OPTIONS = {
    name: 'Dropzone',
    type: 'dropzone',
    objId: 'dropzone',
    pickerOptions: {
      elementId: 'dropzone',
      // Must be true if you want to upload more than 1 file at a time.
      multiselect: true,
    },
  };

  /*
   * Helper methods
   */
  function addResultWithData(target, event, args) {
    const message = `${target} gets ${event} event`;
    console.log(`${message}: `, args);
    const result = document.createElement('p');
    result.appendChild(document.createTextNode(message));
    if (args) {
      const data = document.createElement('pre');
      data.appendChild(document.createTextNode(
        JSON.stringify(args, null, 2),
      ));
      result.appendChild(data);
    }
    const logger = document.getElementById('logger');
    if (logger.hasChildNodes()) {
      logger.insertBefore(result, logger.firstChild);
    } else {
      logger.appendChild(result);
    }
  }

  function create({
    global = window.Kloudless.filePicker, name, type = 'chooser',
    pickerOptions, elementId, objId,
  }) {
    const appId = KLOUDLESS_APP_ID || window.appId;
    const options = { app_id: appId, ...pickerOptions };

    function createEvents(picker) {
      EVENTS.forEach(event => picker.on(
        event,
        data => addResultWithData(name, event, data),
      ));
    }

    if (type === 'dropzone') {
      window.pickers[objId] = global.dropzone(options);
      createEvents(window.pickers[objId]);
      return;
    }

    /** For chooser and saver, delay creation until the first click
     * to avoid too many root/contents calls on load when there is a connected
     * account saved.
     */
    const element = document.getElementById(elementId);

    function createPicker() {
      // remove this function so that file picker can bound click event on it
      element.removeEventListener('click', createPicker);

      const obj = global.picker(options);
      createEvents(obj);
      window.pickers[objId] = obj;
      if (type === 'chooser') {
        obj.choosify($(`#${elementId}`));
      } else {
        obj.savify(element);
      }

      // load the file picker
      setTimeout(() => {
        element.click();
      }, 0);
    }

    element.addEventListener('click', createPicker);
  }

  window.pickers = {};

  /**
   * File Chooser
   */
  create(FILE_CHOOSER_OPTIONS);

  document.getElementById('file-chooser-renew').addEventListener(
    'click', () => {
      window.pickers.fileChooser.destroy();
      create(FILE_CHOOSER_OPTIONS);
    },
  );

  /**
   * Folder Chooser
   */
  create(FOLDER_CHOOSER_OPTIONS);

  /**
   * Saver
   */
  create(SAVER_OPTIONS);

  /**
   * Dropzone
   */
  const dropzoneCreateButton = document.getElementById(
    'dropzone-create-button',
  );
  function createDropZone() {
    dropzoneCreateButton.removeEventListener('click', createDropZone);
    create(DROPZONE_OPTIONS);
  }
  dropzoneCreateButton.addEventListener('click', createDropZone);

  document.getElementById('dropzone-renew').addEventListener(
    'click', () => {
      window.pickers.dropzone.destroy();
      create(DROPZONE_OPTIONS);
    },
  );

  // Test close
  const closeButton = document.getElementById('close');
  closeButton.addEventListener('click', () => {
    Object.values(window.pickers).forEach(picker => picker.close());
  });

  // Test setGlobalOptions
  const updatePickerURL = document.getElementById('update-picker-url');
  updatePickerURL.addEventListener('click', () => {
    window.Kloudless.filePicker.setGlobalOptions({
      pickerUrl:
        'https://static-cdn.kloudless.com/p/platform/file-picker/v2/index.html',
    });
  });
}());
