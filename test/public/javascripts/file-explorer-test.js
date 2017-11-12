(function() {
  'use strict';

  /*
   * Helper methods
   */

  function addResult(resultText) {
    console.log(resultText)
    var result = document.createElement('p');
    result.appendChild(document.createTextNode(resultText));
    document.body.appendChild(result);
  }

  function addResultWithData(resultText, dataObject) {
    console.log(resultText, ' ', dataObject)
    var result = document.createElement('p');
    result.appendChild(document.createTextNode(resultText));
    var data = document.createElement('pre');
    data.appendChild(document.createTextNode(
        JSON.stringify(dataObject, null, 2)));
    result.appendChild(data);
    document.body.appendChild(result);
  }

  function startFileUpload(file) {
    addResultWithData("File upload started:", file);
  }

  function finishFileUpload(file) {
    addResultWithData("File upload finished:", file);
  }

  /*
   * Event Handlers
   */

  // Test file explorer.
  var explorer = window.Kloudless.explorer({
    app_id: window.app_id,
    multiselect: true,
    link: false,
    custom_css: '/stylesheets/custom.css',
    computer: true,
    services: ['all'],
    types: ['all'],
    display_backdrop: true
  });
  window.chooser1 = explorer;

  // Uncomment the line below to test out event queueing
  // till the File Explorer is ready.
  // explorer.choose();

  explorer.on('success', function(files) {
    addResultWithData('Files chosen:', files);
  });
  explorer.on('selected', function(files) {
    addResultWithData('Files selected:', files);
  });

  explorer.on('startFileUpload', startFileUpload);
  explorer.on('finishFileUpload', finishFileUpload);

  explorer.on('cancel', function() {
    addResult('File selection cancelled.');
  });
  explorer.on('error', function(error) {
    addResultWithData('An error occurred in file selection:', error);
  });

  explorer.on('addAccount', function(account) {
    addResultWithData('Account added:', account);
  });

  explorer.on('deleteAccount', function(account) {
    addResultWithData('Deleted account:', account);
  });

  explorer.choosify(document.getElementById('file-test'));

  explorer.on('open', function() {
    console.log("File Explorer opened.");
  });

  explorer.on('close', function() {
    console.log("File Explorer closed.");
  });

  // Test second file explorer.
  var second = window.Kloudless2.explorer({
    app_id: window.app_id,
    multiselect: true,
    link: false,
    computer: true,
    services: ['file_store'],
    types: ['folders'],
  });
  window.chooser2 = second;

  second.on('success', function(files) {
    addResultWithData('Folder selected:', files);
  });
  second.on('cancel', function() {
    addResult('Folder selection cancelled!');
  });
  second.on('error', function(error) {
    addResult('An error occurred in file selection!');
  });

  second.choosify(document.getElementById('folder-test'));

  // Test saver.
  var saver = window.Kloudless.explorer({
    app_id: window.app_id,
    flavor: 'saver',
  });
  window.saver = saver;

  saver.on('success', function(files) {
    addResultWithData('Saved files:', files);
  });
  saver.on('cancel', function() {
    addResult('Save cancelled.');
  });
  saver.on('error', function(error) {
    addResultWithData('An error occurred in saving:', error);
  });
  saver.on('startFileUpload', startFileUpload);
  saver.on('finishFileUpload', finishFileUpload);

  saver.savify(document.getElementById('saver-test'), [
    {'url': 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/webapp/sources/gdrive.png',
     'name': 'drive-logo.png'}
  ]);

  // Test drop zone.
  var dropzone = window.Kloudless2.dropzone({
    app_id: window.app_id,
    elementId: 'dropzone',
    computer: true, // This applies to the clickExplorer.
    multiselect: true, // Must be true if you want to upload more than 1 file at a time.
  });
  window.dropzone = dropzone;

  dropzone.on('open', function() {
    console.log("File Explorer opened.");
  });

  dropzone.on('close', function() {
    console.log("File Explorer closed.");
  });

  dropzone.on('success', function(files) {
    addResultWithData('Files chosen:', files);
  });

  dropzone.on('selected', function(files) {
    addResultWithData('Files selected:', files);
  });

  dropzone.on('startFileUpload', startFileUpload);

  dropzone.on('finishFileUpload', finishFileUpload);

  dropzone.on('cancel', function() {
    addResult('File selection cancelled.');
  });

  dropzone.on('error', function(error) {
    addResultWithData('An error occurred in file selection:', error);
  });

  // Test close
  var cl = document.getElementById('close-test');
  cl.addEventListener('click', function() {
    explorer.close();
    second.close();
    saver.close();
    dropzone.close();
  });

})();
