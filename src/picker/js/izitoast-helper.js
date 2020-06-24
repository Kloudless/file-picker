/* eslint no-unused-vars: ["error", { "args": "none" }] */
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.css';
import '../css/izitoast.less';
import localization from './localization';
import util from './util';
import { ERROR_MSG_TIMEOUT } from './constants';

const supportsCopy =
  (typeof document.queryCommandSupported === 'function') &&
  (typeof document.execCommand === 'function') &&
  document.queryCommandSupported('Copy');

/**
 * Show an error toast.
 * @param {string} message
 * @param {object=} options
 * @param {string} options.detail - Detail message.
 * @param {number} options.timeout - Defaults to 1000ms. 0 to not close the
 * toast and clear old toasts as well.
 */
function error(message, options = {}) {
  if (message === undefined || message === null || message === '') {
    return;
  }
  const {
    detail,
    timeout = ERROR_MSG_TIMEOUT,
    buttons = [],
  } = options;

  const copyButton = [
    `<button>${localization.formatAndWrapMessage('global/copy')}</button>`,
    (instance, toast) => {
      const msg = detail ? `${message} (detail: ${detail})` : message;
      const eltemp = document.createElement('textarea');
      eltemp.value = msg;
      eltemp.readOnly = true;
      eltemp.className = 'visual-invisible';
      eltemp.setAttribute('aria-hidden', 'true');
      document.body.appendChild(eltemp);
      eltemp.select();
      document.execCommand('copy');
      document.body.removeChild(eltemp);
    }, false,
  ];

  let msg = message;
  if (detail) {
    if (util.isIE) {
      // IE11 doesn't support <details>. https://caniuse.com/#feat=details
      msg = `${msg}<br/><small>${detail}</small>`;
    } else {
      msg = `
      ${msg}
      <details>
        <summary class="iziToast__details-toggle-button">show details</summary>
        ${detail}
      </details>`;
    }
  }
  if (timeout === 0) {
    iziToast.destroy();
  }
  iziToast.error({
    pauseOnHover: true,
    drag: false, // to allow user to select text
    timeout: timeout || false,
    position: 'bottomCenter',
    title: 'Error',
    message: msg,
    buttons: supportsCopy ? [copyButton, ...buttons] : [...buttons],
  });
}

/**
 * Clear all toasts.
 */
function destroy() {
  iziToast.destroy();
}

export default { error, destroy };
