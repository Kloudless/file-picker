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

  console.log(second);

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
})();
