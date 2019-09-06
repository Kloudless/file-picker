/* global KLOUDLESS_APP_ID */
/* eslint-disable func-names, no-console */
import 'core-js/stable';
import 'regenerator-runtime/runtime';

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
    explorerOptions: {
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
    explorerOptions: {
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
    explorerOptions: {
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
    explorerOptions: {
      elementId: 'dropzone',
      // This applies to the clickExplorer.
      computer: true,
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
    global = window.Kloudless.fileExplorer, name, type = 'chooser',
    explorerOptions, elementId, objId,
  }) {
    const appId = KLOUDLESS_APP_ID || window.appId;
    const options = { app_id: appId, ...explorerOptions };

    if (type === 'dropzone') {
      window.explorers[objId] = global.dropzone(options);
      return;
    }

    /** For chooser and saver, delay creation until the first click
     * to avoid too many root/contents calls on load when there is a connected
     * account saved.
     */
    const element = document.getElementById(elementId);

    function createExplorer() {
      // remove this function so that file explorer can bound click event on it
      element.removeEventListener('click', createExplorer);

      const obj = global.explorer(options);
      EVENTS.forEach(event => obj.on(
        event,
        data => addResultWithData(name, event, data),
      ));
      window.explorers[objId] = obj;
      if (type === 'chooser') {
        obj.choosify(element);
      } else {
        obj.savify(element);
      }

      // load the explorer
      setTimeout(() => {
        element.click();
      }, 0);
    }

    element.addEventListener('click', createExplorer);
  }

  window.explorers = {};

  /**
   * File Chooser
   */
  create(FILE_CHOOSER_OPTIONS);

  document.getElementById('file-chooser-renew').addEventListener(
    'click', () => {
      window.explorers.fileChooser.destroy();
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
      window.explorers.dropzone.destroy();
      create(DROPZONE_OPTIONS);
    },
  );

  // Test close
  const closeButton = document.getElementById('close');
  closeButton.addEventListener('click', () => {
    Object.values(window.explorers).forEach(explorer => explorer.close());
  });

  // Test setGlobalOptions
  const updateExplorerURL = document.getElementById('update-explorer-url');
  updateExplorerURL.addEventListener('click', () => {
    window.Kloudless.fileExplorer.setGlobalOptions({
      explorerUrl:
        'https://static-cdn.kloudless.com/p/platform/explorer/explorer.html',
    });
  });
}());
