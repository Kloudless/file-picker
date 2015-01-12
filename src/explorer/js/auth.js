(function() {
  'use strict';

  define(['jquery', 'config', 'vendor/loglevel', 'util'],
         function($, config, logger, util) {

    var requests = {},
      iframeLoaded = false,
      queuedRequests = [];

    /*
     * Find or create the iframe messages are posted to and received via.
     * This is because IE 9 only accepts postMessages between frames if
     * the domains are not the same.
     */
    var iframe = (function() {
      var i = document.createElement('iframe');
      i.setAttribute('id', 'kloudless_iexd-' + util.randomID());
      i.setAttribute('src', config.base_url + '/static/iexd.html?cache=' + util.randomID());
      i.style.display = 'none';
      document.getElementsByTagName('body')[0].appendChild(i);
      return i;
    })();

    /*
     * Listen for events that are responses to requests we made.
     */
    window.addEventListener('message', function(message) {
      var ns = "kloudless:";
      if (message.origin !== config.base_url) {
        return;
      }
      else if (message.data.indexOf(ns) !== 0) {
        return;
      }

      var contents = JSON.parse(message.data.substring(ns.length));

      // Enable popups
      if (contents.type == 'error') {
        alert('Please enable popups on your in Browser Settings > Advanced > Disable/Block Pop-ups');
        return;
      }

      if (requests[contents.id] !== undefined) {
        (function(callback) {
          window.setTimeout(function() {
            callback(contents);
          }, 0);
        })(requests[contents.id].callback);
        delete requests[contents.id];
      }
      else {
        logger.error("Unknown message type for message: ", message.data);
      }
    });

    // Display popup window
    var authenticate = function (service, callback) {
      var url = config.base_url + '/services/' + service
        , query_params = {
            app_id: config.app_id,
            referrer: 'explorer',
            retrieve_account_key: 'true',
            request_id: util.randomID(),
            origin: window.location.protocol + '//' + window.location.host,
        };

      var opt
        , h = 500
        , w = 700
        , options = {
            height: 500,
            width: 700,
            toolbar: false, // display toolbar.
            scrollbars: true, // display scrollbars (webkit always does).
            status: true, // display status bar at the bottom of the window.
            resizable: true, // resizable
            left: (screen.width - w) / 2, // Not relevant if center is true.
            top: ((screen.height - h) / 2) - 50, // Not relevant if center is true.
            center: true, // auto-center
            createNew: false, // open a new window, or re-use existing popup
            name: null, // specify custom name for window (overrides createNew option)
            location: true, // display address field
            menubar: false, // display menu bar.
            onUnload: null // callback when window closes
          };

      // center the window
      if (options.center) {
        // 50px is a rough estimate for the height of the chrome above the document area
        options.top = ((screen.height - options.height) / 2) - 50;
        options.left = (screen.width - options.width) / 2;
      }

      // params
      var params = [
        'location=' + (options.location ? 'yes' : 'no'),
        'menubar=' + (options.menubar ? 'yes' : 'no'),
        'toolbar=' + (options.toolbar ? 'yes' : 'no'),
        'scrollbars=' + (options.scrollbars ? 'yes' : 'no'),
        'status=' + (options.status ? 'yes' : 'no'),
        'resizable=' + (options.resizable ? 'yes' : 'no'),
        'height=' + options.height,
        'width=' + options.width,
        'left=' + options.left,
        'top=' + options.top,
      ];

      var data = {
        type: 'open',
        url: url + "?" + $.param(query_params),
        params: params.join(',')
      };

      postMessage(data, query_params.request_id, function(response_contents) {
        postMessage({type: 'close'});
        callback(response_contents.data);
      });
    };

    var postMessage = function(data, identifier, callback) {
      if (!iframeLoaded) {
        queuedRequests.push(arguments);
        return;
      }

      if (identifier && callback) {
        requests[identifier] = {
          callback: callback
        };
      }

      iframe.contentWindow.postMessage('kloudless:' + JSON.stringify(data),
                                       iframe.src);
    };

    iframe.onload = function() {
      // when the iframe loads, post any pending messages.
      iframeLoaded = true;
      while (queuedRequests.length) {
        postMessage.apply(this, queuedRequests.pop());
      }
    };

    return {
      authenticate: authenticate,
      postMessage: postMessage
    };
  });
})();
