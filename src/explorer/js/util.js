(function() {
  'use strict';

  var nav = navigator.userAgent.toLowerCase(),
    isIE = nav.indexOf('msie') !== -1,
    ieVersion = isIE ? parseInt(nav.split('msie')[1]) : -1;

  define({
    /**
     * Generate random string suitable for use as a request ID
     */
    randomID: function() {
      return parseInt(Math.random() * 10e10).toString();
    },

    /**
     * Determines if the browser supports cross-domain requests via the normal
     * XMLHttpRequest object, or if we need to use the special IE-only
     * XDomainRequest object (proxied through the iexd iframe).
     *
     * Supported by most non-IE and IE >= 10.
     */
    supportsCORS: function() {
      return !isIE || !(ieVersion < 10);
    },

    /**
     * Determines if the browser supports postMessage to popups with a
     * different origin.
     *
     * Supported by most non-IE and IE >= 11
     */
    supportsPopupPostMessage: function() {
      return !isIE || !(ieVersion < 11);
    },
  });
})();
