(function() {
  'use strict';

  define(['jquery', 'config', 'vendor/loglevel', 'util'],
         function($, config, logger, util) {

    var requests = {},
      iframeLoaded = false,
      queuedRequests = [],
      popup, iframe;

    /*
     * Find or create the iframe messages are posted to and received via.
     *
     * Instead of directly opening a popup window and postMessage-ing to it, we
     * first load an iframe (iexd.html) from the api.kloudless.com server. The
     * iframe is responsible for opening the popup; when we want one opened, we
     * send a message to the iframe, which then acts as a proxy between us and
     * the OAuth popup.
     *
     * This is necessary because IE 9 and 10 only accept postMessages between
     * iframes (and not popup windows) if the domains are not the same. Other
     * browsers correctly implement postMessage and don't have this arbitrary
     * limitation.
     *
     * Without this hack, we wouldn't be able to post messages to the OAuth
     * popup on IE < 11.
     */
    if (!util.supportsCORS() || !util.supportsPopupPostMessage()) {
      iframe = (function() {
        var el = $('<iframe />');
        el.attr({
            seamless: 'seamless',
            src: config.base_url + '/static/iexd.html?cache=' + util.randomID(),

            // not technically HTML5, but needed for old IE
            frameBorder: 0,
            scrolling: 'no',
          })
          .addClass('iexd')
          .appendTo('body')

          // simulate hovering over the button the frame covers
          .hover(function() {
            $('#confirm-add-button').addClass('hover');
          }, function() {
            $('#confirm-add-button').removeClass('hover');
          });
        return el[0];
      })();

      iframe.onload = function() {
        // when the iframe loads, post any pending messages.
        iframeLoaded = true;
        while (queuedRequests.length) {
          postMessage.apply(this, queuedRequests.pop());
        }
      };
    }

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
      var url = config.base_url + '/' + config.api_version + '/oauth/'
      var randomID = util.randomID();
      var query_params = {
        client_id: config.app_id,
        response_type: 'token',
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
        scope: service + ':normal.storage ' + service + ':normal.basic',
        state: randomID,
        request_id: randomID,
        origin: window.location.protocol + '//' + window.location.host,
        referrer: 'explorer',
      };
      if (config.account_key)
        query_params['account_key'] = 1

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
      url += "?" + $.param(query_params)

      /**
       * On reasonable browsers, we can open the OAuth popup here, and it will
       * be able to postMessage back to us.
       *
       * On unreasonable browsers (like IE < 11), cross-origin postMessage only
       * works between iframes and not between popups. So we need to use the
       * 'iexd' iframe, hosted on the API server, to open the OAuth popup.
       * It basically proxies data back-and-forth between us and the OAuth
       * popup.
       */
      var close,
        popupCallback = function(response) {
          close();
          if (response.data && response.data.state === randomID) {
            callback(response.data);
          } else {
            logger.error("Received state doesn't match sent state.")
          }
        };

      if (util.supportsPopupPostMessage()) { // open popup directly
        close = function() {
          if (popup) {
            popup.close();
            popup = null;
          }
        };

        popup = window.open(url, 'kloudlessIEXD', params);
        popup.focus();

        requests[query_params.request_id] = {
          callback: popupCallback
        };

        return {authUsingIEXDFrame: false};
      } else { // use iexd iframe
        close = function() {
          postMessage({type: 'close'});
        };

        // we ask the iexd to show a "Confirm" button, which we then overlay
        // and make the user click (as a work-around for popup blockers)
        postMessage({
          type: 'prepareToOpen',
          url: url,
          params: params.join(',')
        }, query_params.request_id, popupCallback);

        return {authUsingIEXDFrame: true};
      }
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

    return {
      authenticate: authenticate,
      postMessage: postMessage,
      iframe: iframe
    };
  });
})();
