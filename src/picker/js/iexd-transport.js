/* eslint-disable */
import $ from 'jquery';
import config from './config';
import auth from './auth';
import util from './util';

/**
 * Compatability module which proxies requests to the Kloudless API via
 * iexd.html (hosted on the API domain) to avoid IE9 restrictions on
 * cross-domain requests.
 *
 * Adds a jQuery AJAX transport which handles all requests to the API server.
 *
 * In particular, IE9 has some limitations on use of XDomainRequest that
 * prevent us from using it to talk to the API server:
 *  - can't send custom headers like Authorization
 *  - protocol of the page needs to be https (protocols must match)
 *  - only GET and POST methods can be used
 *  - can only use text/plain for the request's Content-Type
 */
'use strict';

// do nothing if proper cross-domain requests are supported

if (!util.supportsCORS()) {
  $.ajaxTransport('+*', function (options, originalOptions, jqXHR) {
    if (!canHandleRequest(options)) {
      return;
    }

    return {
      send: function (headers, completeCallback) {
        var requestId = util.randomID();
        options.headers = headers;

        var data = {
          type: 'proxy',
          origin: document.URL,
          id: requestId,
          options: options
        };

        auth.postMessage(data, requestId, function (response) {
          completeCallback(
            response.status, response.statusText, response.responses, response.headers);
        });
      },

      /* we don't support aborting requests on IE9 :-) */
      abort: function () {
      }
    };
  });
}

function canHandleRequest(options) {
  return options.crossDomain &&
    options.url.substring(0, config.base_url.length) == config.base_url;
}
