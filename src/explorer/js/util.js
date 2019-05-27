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

  var roundFileSize = function(num) {
    return Math.round(num*100)/100;
  };


  define({
    /**
     * Generate random string suitable for use as a request ID
     */
    randomID: function() {
      return parseInt(Math.random() * 10e10).toString();
    },

    /**
     * IE Version
     */
    ieVersion: ieVersion,
    isIE: isIE,
    /**
     * isMobile (check if agent is mobile)
     */
    isMobile: (!!navigator.userAgent.match(/(iPad|iPhone|iPod|android|Android)/g)),
    /**
      * Formats the sizes for files in the FileSystem.
      */
    formatSize: function(size){
      var fileSize;
      var unitOfMeasure;
        if (size === null || size === undefined || size === '')
          return null;
        if (size < Math.pow(2,10)) {
          fileSize = size;
          unitOfMeasure = 'files/sizes/b';
        } else if (size < Math.pow(2,20)) {
          fileSize = roundFileSize(size / Math.pow(2,10));
          unitOfMeasure = 'files/sizes/kb';
        } else if (size < Math.pow(2,30)) {
          fileSize = roundFileSize(size / Math.pow(2,20));
          unitOfMeasure = 'files/sizes/mb';
        } else {
          fileSize = roundFileSize(size / Math.pow(2,30));
          unitOfMeasure = 'files/sizes/gb';
        }

        // map the result so that it can be used directly with the ko
        // translate binding handler
        return {
          message: unitOfMeasure,
          variables: {
            fileSize: fileSize
          }
        };
      },

    /**
     * Gets the base URL (one level above the js folder) for loading any
     * scripts or JSON files. Figures out the base url based on the script tag
     * for either app.js (dev) or explorer.js (production)
     */
    getBaseUrl: function() {
      // get the app.js (for dev) or explorer.js (for production) script tag
      var scriptUrl = $('script[src*=\'app.js\'], script[src*=\'explorer.js\']').
            first().attr('src').split('/');

      // then remove the script file name and 'js' directory parts from the url
      // and return the result

      var scriptDepth = 1;
      if (scriptUrl[scriptUrl.length - 1] === 'app.js')
        scriptDepth = 2;

      scriptDepth = 2;

      return scriptUrl.slice(0, scriptUrl.length - scriptDepth).join('/');
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
