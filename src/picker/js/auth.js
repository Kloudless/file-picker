/* eslint-disable camelcase */
import $ from 'jquery';
import logger from 'loglevel';
import config from './config';
import util from './util';

const requests = {};
let iframeLoaded = false;
const queuedRequests = [];
let popup;
let iframe;

/**
 * @param {string} requestId
 * @param {string} service service Id
 * @param {object} oauthParams OAuth parameters provided by devs.
 */
function getEffectiveOauthParams(requestId, service, oauthParams) {
  const queryParams = {
    client_id: config.app_id,
    response_type: 'token',
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    scope: `${service}:normal.storage ${service}:normal.basic`,
    state: requestId,
    request_id: requestId,
    origin: `${window.location.protocol}//${window.location.host}`,
    referrer: 'picker',
  };

  const forbiddenKeys = [
    'client_id', 'response_type', 'redirect_uri', 'origin', 'state',
    'request_id', 'origin', 'referrer',
  ];

  Object.keys(oauthParams).forEach((key) => {
    if (forbiddenKeys.includes(key)) {
      return;
    }
    const value = oauthParams[key];
    if (value === undefined || value === null) {
      return;
    }

    if (key === 'raw') {
      Object.keys(value).forEach((rawKey) => {
        queryParams[`raw[${rawKey}]`] = value[rawKey];
      });
    } else if (typeof value === 'object') {
      queryParams[key] = JSON.stringify(value);
    } else {
      queryParams[key] = value;
    }
  });

  if (config.account_key) {
    queryParams.account_key = 1;
  }
  return queryParams;
}

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
  iframe = (function () { // eslint-disable-line func-names
    const el = $('<iframe />');
    el.attr({
      seamless: 'seamless',
      src: `${config.base_url}/static/iexd.html?cache=${util.randomID()}`,
      // not technically HTML5, but needed for old IE
      frameBorder: 0,
      scrolling: 'no',
    })
      .addClass('iexd')
      .appendTo('body')
      // simulate hovering over the button the frame covers
      .hover(() => {
        $('#confirm-add-button').addClass('hover');
      }, () => {
        $('#confirm-add-button').removeClass('hover');
      });
    return el[0];
  }());

  iframe.onload = function () { // eslint-disable-line func-names
    // when the iframe loads, post any pending messages.
    iframeLoaded = true;
    while (queuedRequests.length) {
      // eslint-disable-next-line no-use-before-define
      postMessage.apply(this, queuedRequests.pop());
    }
  };
}

/*
 * Listen for events that are responses to requests we made.
 */
window.addEventListener('message', (message) => {
  const ns = 'kloudless:';
  if (message.origin !== config.base_url) {
    return;
  }
  if (message.data.indexOf(ns) !== 0) {
    return;
  }

  const contents = JSON.parse(message.data.substring(ns.length));

  // Enable popups
  if (contents.type === 'error') {
    // eslint-disable-next-line no-alert, max-len
    alert('Please enable popups on your in Browser Settings > Advanced > Disable/Block Pop-ups');
    return;
  }

  if (requests[contents.id] !== undefined) {
    (function (callback) { // eslint-disable-line func-names
      window.setTimeout(() => {
        callback(contents);
      }, 0);
    }(requests[contents.id].callback));
    delete requests[contents.id];
  } else {
    logger.error('Unknown message type for message: ', message.data);
  }
});

// Display popup window
function authenticate(service, oauthParams, callback) {
  let url = `${config.base_url}/${config.api_version}/oauth/`;
  const requestId = util.randomID();
  const queryParams = getEffectiveOauthParams(requestId, service, oauthParams);
  const h = 500;
  const w = 700;
  const options = {
    height: 500,
    width: 700,
    toolbar: false, // display toolbar.
    scrollbars: true, // display scrollbars (webkit always does).
    status: true, // display status bar at the bottom of the window.
    resizable: true, // resizable
    // left, top: Not relevant if center is true.
    left: (window.screen.width - w) / 2,
    top: ((window.screen.height - h) / 2) - 50,
    center: true, // auto-center
    createNew: false, // open a new window, or re-use existing popup
    name: null, // specify custom name for window (overrides createNew option)
    location: true, // display address field
    menubar: false, // display menu bar.
    onUnload: null, // callback when window closes
  };

  // center the window
  if (options.center) {
    // 50px is a rough estimate for the height of the chrome above the document
    // area.
    options.top = ((window.screen.height - options.height) / 2) - 50;
    options.left = (window.screen.width - options.width) / 2;
  }

  // params
  const params = [
    `location=${options.location ? 'yes' : 'no'}`,
    `menubar=${options.menubar ? 'yes' : 'no'}`,
    `toolbar=${options.toolbar ? 'yes' : 'no'}`,
    `scrollbars=${options.scrollbars ? 'yes' : 'no'}`,
    `status=${options.status ? 'yes' : 'no'}`,
    `resizable=${options.resizable ? 'yes' : 'no'}`,
    `height=${options.height}`,
    `width=${options.width}`,
    `left=${options.left}`,
    `top=${options.top}`,
  ];
  url += `?${$.param(queryParams)}`;

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
  let close;
  function popupCallback(response) {
    close();
    if (response.data && response.data.state === queryParams.state) {
      callback(response.data);
    } else {
      logger.error("OAuth failed: Received state doesn't match sent state.");
    }
  }

  if (util.supportsPopupPostMessage()) { // open popup directly
    close = () => {
      if (popup) {
        popup.close();
        popup = null;
      }
    };

    popup = window.open(url, 'kloudlessIEXD', params);
    popup.focus();

    requests[queryParams.request_id] = {
      callback: popupCallback,
    };

    return { authUsingIEXDFrame: false };
  }
  // use iexd iframe
  close = () => {
    postMessage({ type: 'close' }); // eslint-disable-line no-use-before-define
  };

  // we ask the iexd to show a "Confirm" button, which we then overlay
  // and make the user click (as a work-around for popup blockers)
  postMessage({ // eslint-disable-line no-use-before-define
    type: 'prepareToOpen',
    url,
    params: params.join(','),
  }, queryParams.request_id, popupCallback);

  return { authUsingIEXDFrame: true };
}

function postMessage(data, identifier, callback) {
  if (!iframeLoaded) {
    queuedRequests.push(arguments); // eslint-disable-line prefer-rest-params
    return;
  }

  if (identifier && callback) {
    requests[identifier] = { callback };
  }

  iframe.contentWindow.postMessage(
    `kloudless:${JSON.stringify(data)}`,
    iframe.src,
  );
}

export default {
  authenticate,
  postMessage,
  iframe,
  getEffectiveOauthParams,
};
