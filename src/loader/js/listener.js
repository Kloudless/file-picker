/**
 * Listen for incoming postMessages relating to widget events.
 */
(function() {

  var pathParts = window.Kloudless.explorerUrl.split('://', 2);
  var explorerOrigin = pathParts[0] + "://" + pathParts[1].split('/')[0];

  window.addEventListener('message', function(message) {
    if (message.origin !== explorerOrigin) {
      return;
    }

    var contents = JSON.parse(message.data);

    // console.log('postMessage heard: ', contents);
    // Grab the explorer id
    var exp_id = contents.exp_id;
    var explorer;

    // Listen for file explorer events.
    // postMessage based on explorer id
    explorer = window.Kloudless._explorers[exp_id];
    explorer._fire.apply(explorer, [contents.action, contents.data]);
  });

})();
