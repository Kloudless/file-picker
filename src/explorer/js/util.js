(function() {
  'use strict';

  define({
    randomID: function() {
      /**
       * Generate random string suitable for use as a request ID
       */
      return parseInt(Math.random() * 10e10).toString();
    }
  });
})();
