/* eslint-disable func-names, no-console */

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
    app_id: window.app_id,
    multiselect: true,
    link: false,
    custom_css: '/stylesheets/custom.css',
    computer: true,
    services: ['all'],
    types: ['all'],
    display_backdrop: true,
    locale: 'fr-FR'
  };

  const FOLDER_CHOOSER_OPTIONS = {
    app_id: window.app_id,
    multiselect: true,
    link: false,
    computer: true,
    services: ['file_store'],
    types: ['folders'],
    locale: 'fr-FR'
  };

  const SAVER_OPTIONS = {
    app_id: window.app_id,
    flavor: 'saver',
    files: [
      {
        url: 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/static/kloudless-logo-white.png',
        name: 'kloudless-logo.png',
      },
    ],
  };

  const DROPZONE_OPTIONS = {
    app_id: window.app_id,
    elementId: 'dropzone',
    computer: true, // This applies to the clickExplorer.
    multiselect: true, // Must be true if you want to upload more than 1 file at a time.
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
    global = window.Kloudless.fileExplorer, name, type = 'chooser', options,
    elementId,
  }) {

    global.setGlobalOptions({
      explorerUrl: 'http://localhost:3000/dist/explorer/explorer.html',
    });

    const obj = (type === 'dropzone'
      ? global.dropzone(options) : global.explorer(options));
    EVENTS.forEach(event => obj.on(
      event,
      data => addResultWithData(name, event, data),
    ));
    if (type === 'dropzone') {
      return obj;
    }
    const element = document.getElementById(elementId);
    if (type === 'chooser') {
      obj.choosify(element);
    } else {
      obj.savify(element);
    }
    return obj;
  }

  /**
   * File Chooser
   */
  window.fileChooser = create({
    name: 'File Chooser',
    options: FILE_CHOOSER_OPTIONS,
    elementId: 'file-chooser',
  });

  document.getElementById('file-chooser-renew').addEventListener(
    'click', () => {
      window.fileChooser.destroy();
      window.fileChooser = create({
        name: 'File Chooser',
        options: FILE_CHOOSER_OPTIONS,
        elementId: 'file-chooser',
      });
    },
  );

  /**
   * Folder Chooser
   */
  window.folderChooser = create({
    global: window.Kloudless2,
    name: 'Folder Chooser',
    options: FOLDER_CHOOSER_OPTIONS,
    elementId: 'folder-chooser',
  });

  /**
   * Saver
   */
  window.saver = create({
    name: 'Saver',
    type: 'saver',
    options: SAVER_OPTIONS,
    elementId: 'saver',
  });

  /**
   * Dropzone
   */
  window.dropzone = create({
    name: 'Dropzone',
    type: 'dropzone',
    options: DROPZONE_OPTIONS,
  });

  document.getElementById('dropzone-renew').addEventListener(
    'click', () => {
      window.dropzone.destroy();
      window.dropzone = create({
        name: 'Dropzone',
        type: 'dropzone',
        options: DROPZONE_OPTIONS,
      });
    },
  );

  // Test close
  const closeButton = document.getElementById('close');
  closeButton.addEventListener('click', () => {
    window.fileChooser.close();
    window.folderChooser.close();
    window.saver.close();
    window.dropzone.close();
  });

  // Test setGlobalOptions
  const updateExplorerURL = document.getElementById('update-explorer-url');
  updateExplorerURL.addEventListener('click', () => {
    window.Kloudless.fileExplorer.setGlobalOptions({
      explorerUrl: 'https://static-cdn.kloudless.com/p/platform/explorer/explorer.html',
    });
  });
}());
