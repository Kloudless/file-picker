(function() {
  'use strict';

  var nav = navigator.userAgent.toLowerCase(),
    isIE = false,
    ieVersion = -1;

  /*
   * IE 11 removes 'msie' from the UA string so that apps which sniff it to
   * determine capabilities won't serve it crippled code.
   *
   * This might have been a good idea if we didn't still need to workaround its
   * annoying bugs. But we do.
   */
  if (nav.indexOf('msie') !== -1) { // IE < 11
    isIE = true;
    ieVersion = parseInt(nav.split('msie')[1]);
  } else if (nav.indexOf('trident/') !== -1) { // IE 11+
    isIE = true;
    ieVersion = parseInt(nav.split('rv:')[1]);
  }

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
     * Supported by most non-IE; not supported IE <= 11. Seems to be supported
     * on (currently unreleased version of) IE 12, but needs testing after
     * release.
     */
    supportsPopupPostMessage: function() {
      return !isIE;
    },
  });
})();
