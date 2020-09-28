/* eslint no-unused-vars: ["error", { "args": "none" }] */
import iziToast from 'izitoast';
import localization from './localization';
import util from './util';
import { ERROR_MSG_TIMEOUT } from './constants';

const supportsCopy =
  (typeof document.queryCommandSupported === 'function') &&
  (typeof document.execCommand === 'function') &&
  document.queryCommandSupported('Copy');

/**
 * Show an error toast.
 * If there is detail message, a copy button is present and timeout is disabled.
 * @param {string} message
 * @param {object=} options
 * @param {string} options.detail - Detail message.
 */
function error(message, options = {}) {
  if (message === undefined || message === null || message === '') {
    return;
  }
  const { detail } = options;

  const buttons = [];
  let msg = message;
  if (detail) {
    if (util.isIE) {
      // IE11 doesn't support <details>. https://caniuse.com/#feat=details
      msg = `${msg}<br/><small>${detail}</small>`;
    } else {
      msg = `
      ${msg}
      <details>
        <summary class="iziToast__details-toggle-btn">show details</summary>
        ${detail}
      </details>`;
    }
    if (supportsCopy) {
      buttons.push([
        `<button class="iziToast__copy-btn">
          ${localization.formatAndWrapMessage('global/copy')}
        </button>`,
        (instance, toast) => {
          const eltemp = document.createElement('textarea');
          eltemp.value = `${message} (detail: ${detail})`;
          eltemp.readOnly = true;
          eltemp.className = 'visual-invisible';
          eltemp.setAttribute('aria-hidden', 'true');
          document.body.appendChild(eltemp);
          eltemp.select();
          document.execCommand('copy');
          document.body.removeChild(eltemp);
        }, false,
      ]);
    }
  }

  iziToast.show({
    buttons,
    progressBar: !detail,
    timeout: detail ? false : ERROR_MSG_TIMEOUT,
    layout: detail ? 2 : 1, // 1: small layout, 2: medium layout
    pauseOnHover: true,
    drag: false, // to allow user to select text
    position: 'bottomCenter',
    title: 'Error',
    message: msg,
    theme: 'custom-error',
    icon: 'material-icons',
    iconText: 'highlight_off',
  });
}

function success(message) {
  iziToast.show({
    close: false,
    drag: false, // to allow user to select text
    timeout: false,
    position: 'center',
    title: 'Success',
    message,
    progressBar: false,
    layout: 1,
    overlay: true,
    icon: 'material-icons',
    iconText: 'check_circle',
    theme: 'custom-success',
    displayMode: 'replace',
    buttons: [[
      `<button class="iziToast__ok-btn">
        ${localization.formatAndWrapMessage('global/ok')}
      </button>`,
      (instance, toast) => { instance.hide({}, toast); },
      false,
    ]],
  });
}

/**
 * Clear all toasts.
 */
function destroy() {
  iziToast.destroy();
}

export default { error, destroy, success };
