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
  });

  /* Uncomment the line below to test out event queueing
   * till the File Explorer is ready.
   */
  // explorer.choose();

  explorer.on('success', function(files) {
    console.log('Successfully chose files: ', files);

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('Files selected:'));
    var data = document.createElement('pre');
    data.appendChild(document.createTextNode(
        JSON.stringify(files, null, 2)));
    result.appendChild(data);
    document.body.appendChild(result);
  });
  explorer.on('cancel', function() {
    console.log('File selection cancelled.');

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('File selection cancelled!'));
    document.body.appendChild(result);
  });
  explorer.on('error', function(error) {
    console.log('An error occurred: ', error);

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('An error occurred in file selection!'));
    document.body.appendChild(result);
  });

  explorer.on('addAccount', function(account) {
    console.log('Succesfully added account: ', account);

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('Account added: ' +
        JSON.stringify(account)));
    document.body.appendChild(result);
  });

  explorer.on('deleteAccount', function(account) {
    console.log('Succesfully deleted account: ', account);

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('Deleted account: ' +
        JSON.stringify(account)));
    document.body.appendChild(result);
  });

  explorer.choosify(document.getElementById('file-test'));

  // Test second file explorer.
  var second = window.Kloudless.explorer({
    app_id: window.app_id,
    multiselect: true,
    link: false,
    computer: true,
    services: ['file_store'],
    types: ['folder']
  });

  second.on('success', function(files) {
    console.log('Successfully chose folder: ', files);

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('Folder selected: ' + JSON.stringify(files)));
    document.body.appendChild(result);
  });
  second.on('cancel', function() {
    console.log('Folder selection cancelled.');

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('Folder selection cancelled!'));
    document.body.appendChild(result);
  });
  second.on('error', function(error) {
    console.log('An error occurred: ', error);

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('An error occurred in file selection!'));
    document.body.appendChild(result);
  });

  second.choosify(document.getElementById('folder-test'));


  // Test saver.
  var saver = window.Kloudless.explorer({
    app_id: window.app_id,
    flavor: 'saver',
    files: [{
      'url': 'https://dt8kf6553cww8.cloudfront.net/static/images/icons/blue_dropbox_glyph-vflJ8-C5d.png',
      'name': 'dropboxlogo.png'
    },{
      'url': 'http://upload.wikimedia.org/wikipedia/commons/7/75/Google_Drive_Logo.svg',
      'name': 'drivelogo.svg'
    }]
  });

  saver.on('success', function(files) {
    console.log('Successfully saved file: ', files);

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('Saved files: ' + JSON.stringify(files)));
    document.body.appendChild(result);
  });
  saver.on('cancel', function() {
    console.log('Save cancelled.');

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('Save cancelled!'));
    document.body.appendChild(result);
  });
  saver.on('error', function(error) {
    console.log('An error occurred: ', error);

    var result = document.createElement('p');
    result.appendChild(document.createTextNode('An error occurred in saving!'));
    document.body.appendChild(result);
  });

  saver.savify(document.getElementById('saver-test'));


})();
