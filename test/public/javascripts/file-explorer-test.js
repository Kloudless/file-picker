(function() {
  'use strict';

  // Test file explorer.
  var explorer = window.Kloudless.explorer({
    app_id: window.app_id,
    multiselect: true,
    link: false,
    computer: true,
    services: ['all'],
    types: ['all'],
    display_backdrop: true,
  });

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
    addResult('File upload started: ' + file.name)
  }

  function finishFileUpload(file) {
    addResult('File upload finished: ' + file.name);
  }

  /*
   * Event Handlers
   */

  /* Uncomment the line below to test out event queueing
   * till the File Explorer is ready.
   */
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

  var cl = document.getElementById('close-test');
  cl.addEventListener('click', function() {
    explorer.close();
  });

  // Test second file explorer.
  var second = window.Kloudless.explorer({
    app_id: window.app_id,
    multiselect: true,
    link: false,
    computer: true,
    services: ['file_store'],
    types: ['folders']
  });

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
    {'url': 'http://kloudl.es/l/VfGt5lyl7tSFCbt0jvxd/logo.png',
     'name': 'kloudless logo.png'},
    /*{'url': 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/webapp/sources/gdrive.png',
     'name': 'drive-logo.png'}*/
  ]);

})();
