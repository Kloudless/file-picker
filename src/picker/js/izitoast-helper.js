import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.css';
import util from './util';

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
    timeout = 10000,
  } = options;
  let msg = message;
  if (detail) {
    if (util.isIE) {
      // IE11 doesn't support <details>. https://caniuse.com/#feat=details
      msg = `${msg}<br/><small>${detail}</small>`;
    } else {
      msg = `
      ${msg}
      <details>
        <summary>show details</summary>
        ${detail}
      </details>`;
    }
  }
  if (timeout === 0) {
    iziToast.destroy();
  }
  iziToast.error({
    timeout: timeout || false,
    position: 'bottomCenter',
    title: 'Error',
    message: msg,
  });
}

/**
 * Clear all toasts.
 */
function destroy() {
  iziToast.destroy();
}

export default { error, destroy };
