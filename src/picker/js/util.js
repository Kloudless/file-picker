
const nav = navigator.userAgent.toLowerCase();
let isIE = false;
let ieVersion = -1;

/*
  * IE 11 removes 'msie' from the UA string so that apps which sniff it to
  * determine capabilities won't serve it crippled code.
  *
  * This might have been a good idea if we didn't still need to workaround its
  * annoying bugs. But we do.
  */
if (nav.indexOf('msie') !== -1) { // IE < 11
  isIE = true;
  ieVersion = parseInt(nav.split('msie')[1], 10);
} else if (nav.indexOf('trident/') !== -1) { // IE 11+
  isIE = true;
  ieVersion = parseInt(nav.split('rv:')[1], 10);
}

const roundFileSize = num => Math.round(num * 100) / 100;

const util = {
  /**
   * Generate random string suitable for use as a request ID
   */
  randomID: () => parseInt(Math.random() * 10e10, 10).toString(),

  /**
   * IE Version
   */
  ieVersion,
  isIE,
  /**
   * isMobile (check if agent is mobile)
   */
  isMobile: !!navigator.userAgent.match(/(iPad|iPhone|iPod|android|Android)/g),
  /**
    * Formats the sizes for files in the FileSystem.
    */
  formatSize: (size) => {
    let fileSize;
    let unitOfMeasure;
    if (size === null || size === undefined || size === '') return null;
    if (size < 2 ** 10) {
      fileSize = size;
      unitOfMeasure = 'files/sizes/b';
    } else if (size < 2 ** 20) {
      fileSize = roundFileSize(size / (2 ** 10));
      unitOfMeasure = 'files/sizes/kb';
    } else if (size < 2 ** 30) {
      fileSize = roundFileSize(size / (2 ** 20));
      unitOfMeasure = 'files/sizes/mb';
    } else {
      fileSize = roundFileSize(size / (2 ** 30));
      unitOfMeasure = 'files/sizes/gb';
    }

    // map the result so that it can be used directly with the ko
    // translate binding handler
    return {
      message: unitOfMeasure,
      variables: {
        fileSize,
      },
    };
  },

  /**
   * Gets the base URL any JSON files.
   * Figures out the base url based on the script tag for picker.js
   */
  getBaseUrl: () => {
    // get the picker.js script tag
    // TODO-v3: remove #kloudless-file-explorer-script
    const el = $('#kloudless-file-picker-script')
     || $('#kloudless-file-explorer-script');
    const scriptUrl = el.attr('src').split('/');

    // then remove the script file name and 'js' directory parts from the url
    // and return the result
    return scriptUrl.slice(0, scriptUrl.length - 1).join('/');
  },

  /**
   * Determines if the browser supports cross-domain requests via the normal
   * XMLHttpRequest object, or if we need to use the special IE-only
   * XDomainRequest object (proxied through the iexd iframe).
   *
   * Supported by most non-IE and IE >= 10.
   */
  supportsCORS: () => !isIE || !(ieVersion < 10),

  /**
   * Determines if the browser supports postMessage to popups with a
   * different origin.
   *
   * Supported by most non-IE; not supported IE <= 11. Seems to be supported
   * on (currently unreleased version of) IE 12, but needs testing after
   * release.
   */
  supportsPopupPostMessage: () => !isIE,

  isObject: (input) => {
    const { toString } = Object.prototype;
    return toString.call({}) === toString.call(input);
  },
};

export default util;
