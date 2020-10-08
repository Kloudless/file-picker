/**
 * A helper to wrap Puppeteer Page to help operate on File Picker.
 */
import puppeteer from 'puppeteer';
import { EventEmitter } from 'events';
import {
  EVENTS, LOADER_E2E_SELECTORS,
} from '../../../../src/constants';
import { E2E_SELECTORS } from '../../../../src/picker/js/constants';
import {
  BASE_URL, PICKER_URL, KLOUDLESS_ACCOUNT_TOKEN, KLOUDLESS_APP_ID,
} from '../../../config';

const IPHONE = puppeteer.devices['iPhone 6'];

class PuppeteerHelper {
  constructor() {
    this.page = null;
    this.loaderFrame = null;
    this.viewFrame = null;
    this.pickerEventEmitter = new EventEmitter();
    this.isMac = false;
    this.isMobile = false;
    this.interceptors = [];
  }

  /**
   *
   * @param {string} url The URL of story
   * @param {object=} options
   * @param {boolean=} options.mobile whether to emulate mobile device.
   *  Defaults to false.
   */
  async init(url, options = {}) {
    // Somehow requests pending when re-use the same page among test cases.
    // Not sure why, just resetPage() every test to workaround it.
    // jestPuppeteer and page are exposed by jest-puppeteer.
    // https://github.com/smooth-code/jest-puppeteer#configure-eslint
    await jestPuppeteer.resetPage();
    const { mobile = false } = options;
    this.page = page;

    if (mobile) {
      this.isMobile = true;
      await this.page.emulate(IPHONE);
    }

    await this.page.setRequestInterception(true);
    this.page.on('request', this._onRequestEventHandler.bind(this));

    const wait = this.page.waitForNavigation();
    await this.page.goto(url);
    await wait;

    this.isMac = await this.page.evaluate(() => (
      /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)));

    this.loaderFrame = this.page.mainFrame();
    await this.loaderFrame.waitForSelector('input');
    await this.page.exposeFunction(
      'puppeteerEventHandler',
      (event, ...args) => {
        this.pickerEventEmitter.emit(event, ...args);
      },
    );
  }

  async cleanup() {
    await page.setRequestInterception(false);
    this.interceptors = [];
    this.pickerEventEmitter.removeAllListeners();
    this.page.removeAllListeners();
    this.page = null;
    this.loaderFrame = null;
    this.viewFrame = null;
    this.isMobile = false;
    this.isMac = false;
  }

  /**
   * Launch picker.
   * @param {Object} launchOptions - Launch options.
   * @param {Object} globalOptions - Global options.
   */
  async launch(launchOptions = {}, globalOptions = {}) {
    try {
      const { baseUrl = BASE_URL, pickerUrl = PICKER_URL } = globalOptions;
      const { tokens = [KLOUDLESS_ACCOUNT_TOKEN], ...rest } = launchOptions;

      rest.app_id = rest.app_id || KLOUDLESS_APP_ID;

      if (baseUrl) {
        await this._typeLaunchOptions('input[name="baseUrl"]', baseUrl);
      }
      if (pickerUrl) {
        await this._typeLaunchOptions('input[name="pickerUrl"]', pickerUrl);
      }
      if (tokens.length > 0) {
        await this._typeLaunchOptions('input[name="token"]', tokens[0]);
      }

      await this._typeLaunchOptions(
        'textarea[name="launchOptions"]', JSON.stringify(rest),
      );
      const launchButton = await this.page.waitForSelector(
        `.${LOADER_E2E_SELECTORS.J_LAUNCH_BTN}`, { timeout: 3000 },
      );
      const waitOpenEvent = this._waitPickerEvent(EVENTS.OPEN);
      await launchButton.click();
      await waitOpenEvent;
      this.viewFrame = this.page.frames().find(
        f => f.name() === LOADER_E2E_SELECTORS.IFRAME_NAME,
      );
      // Somehow there is no loading spinner at the first opening.
      // So check tr.ftable__row instead.
      await this.viewFrame.waitForSelector(
        `.${E2E_SELECTORS.J_ROW}`, { timeout: 10000 },
      );
    } catch (err) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  async clickFile(fileId) {
    try {
      await this.viewFrame.click(
        `tr[data-type="file"][data-id="${fileId}"][data-selectable]`,
      );
    } catch (err) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  async clickFolder(folderId) {
    try {
      await this.viewFrame.click(
        `tr[data-type="folder"][data-id="${folderId}"]`,
      );
    } catch (err) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  async clickCancelBtn() {
    const waitEvents = [
      this._waitPickerEvent(EVENTS.CANCEL),
      this._waitPickerEvent(EVENTS.CLOSE),
    ];
    const btn = await this.viewFrame.$(`.${E2E_SELECTORS.J_CLOSE_BTN}`);
    await btn.click();
    await Promise.all(waitEvents);
  }

  async multiselect(fileIds = [], folderIds = []) {
    if (this.isMobile) {
      throw new Error(
        "File Picker isn't supporting multiselect on mobile devices.",
      );
    }
    const key = this.isMac ? 'Meta' : 'Control';
    await this.page.keyboard.down(key);
    // eslint-disable-next-line no-restricted-syntax
    for (const fileId of fileIds) {
      // eslint-disable-next-line no-await-in-loop
      await this.clickFile(fileId);
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const folderId of folderIds) {
      // eslint-disable-next-line no-await-in-loop
      await this.clickFolder(folderId);
    }
    await this.page.keyboard.up(key);
  }

  /**
   * Click Select button to confirm the selections in Chooser.
   *
   * @param {object=} options
   * @param {boolean=} options.shouldClose whether should fired close event.
   *  Defaults to true.
   * @param {boolean=} options.shouldError whether should fired error event.
   *  Defaults to false.
   * @returns {Promise<Array>} An array of event data. In the order of
   *  [SelectedEventData, SuccessEventData, CloseEventData, ErrorEventData].
   *  Event data will be `null` if no corresponded event.
   */
  async clickSelectBtn(options = { }) {
    try {
      const { shouldClose = true, shouldError = false } = options;
      const waitEvents = [
        this._waitPickerEvent(EVENTS.SELECTED),
        this._waitPickerEvent(EVENTS.SUCCESS),
        shouldClose ? this._waitPickerEvent(EVENTS.CLOSE) : null,
        shouldError ? this._waitPickerEvent(EVENTS.ERROR) : null,
      ];

      await this.viewFrame.click(`.${E2E_SELECTORS.J_SELECT_BTN}`);
      return Promise.all(waitEvents);
    } catch (err) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  /**
   * Click Open button to navigate into a folder in Chooser or Saver.
   */
  async clickOpenBtn() {
    try {
      await this.viewFrame.click(`.${E2E_SELECTORS.J_SELECT_BTN}`);
    } catch (err) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  /**
   *
   * @param {object} request
   * @param {string} request.url
   * @param {string=} request.method Defaults to 'GET'.
   * @param {object=} request.body Match if request's body contains this object.
   * @param {object} response
   * @param {number=} response.status Defaults to 200.
   * @param {object} response.body
   * @param {object=} response.headers
   */
  addRequestInterceptor(request, response) {
    const { url, method = 'GET', body = {} } = request;
    const {
      body: resBody = {}, status = 200, headers = {},
    } = response;
    if (headers['Access-Control-Allow-Origin'] === undefined) {
      headers['Access-Control-Allow-Origin'] = '*';
    }
    this.interceptors.push({
      request: { url, method, body },
      response: {
        body: JSON.stringify(resBody),
        status,
        headers,
        contentType: 'application/json',
      },
    });
  }

  /**
   * Inner Methods
   */

  /**
   * Type launch options or global options.
   * @param {String} selector
   * @param {String} value
   */
  async _typeLaunchOptions(selector, value) {
    try {
      const oldValue = await this.loaderFrame.evaluate((_selector) => {
        const el = document.querySelector(_selector);
        return el.value;
      }, selector);
      if (oldValue === value) {
        return;
      }
      const inputEl = await this.loaderFrame.$(selector);
      for (let i = 0; i < oldValue.length; i += 1) {
        if (selector.includes('textarea')) {
          // Somehow we don't know where the cursor is when focusing on a multi
          // line textarea. So it's best to press both "Delete" and "Backspace".
          // eslint-disable-next-line no-await-in-loop
          await inputEl.press('Delete');
          // eslint-disable-next-line no-await-in-loop
          await inputEl.press('Backspace');
        } else {
          // eslint-disable-next-line no-await-in-loop
          await inputEl.press('Backspace');
        }
      }
      await inputEl.type(value);
    } catch (err) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  /**
   * Wait for .container--is-loading disappear.
   * @param {Number=} timeout - Defaults to 5000 milliseconds.
   */
  async _waitForLoadingSpinner(timeout = 5000) {
    await this.viewFrame.waitForFunction(() => (
      !document.querySelector('.container.container--is-loading')
    ), { timeout });
  }

  async _onRequestEventHandler(request) {
    const interceptor = this.interceptors.find((i) => {
      const { request: req } = i;
      if (!request.url().includes(req.url) || request.method() !== req.method) {
        return false;
      }
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const reqBody = JSON.parse(request.postData() || '{}');
        const notMatch = Object.keys(req.body).some(
          key => reqBody[key] !== req.body[key],
        );
        return !notMatch;
      }
      return true;
    });
    if (interceptor) {
      request.respond(interceptor.response);
    } else {
      request.continue();
    }
  }

  _waitPickerEvent(event, options = {}) {
    const { timeout = 10000 } = options;
    return new Promise((resolve, reject) => {
      const timeoutHandler = setTimeout(() => {
        reject(new Error(
          `Expect receive "${event}" from File Picker within ${timeout} ms.`,
        ));
      }, timeout);
      this.pickerEventEmitter.once(event, (...args) => {
        clearTimeout(timeoutHandler);
        resolve(...args);
      });
    });
  }

  /**
   * Helper method for assertion.
   */

  async assertSuccessDialog() {
    await this.viewFrame.waitForSelector(
      `.${E2E_SELECTORS.J_SUCCESS_DIALOG}`,
      { visible: true, timeout: 1000 },
    );
    await this.viewFrame.click(`.${E2E_SELECTORS.J_DIALOG_OK_BTN}`);
    await this.viewFrame.waitForTimeout(1000);
  }

  async assertErrorDialog() {
    return this.viewFrame.waitForSelector(
      `.${E2E_SELECTORS.J_ERROR_DIALOG}`,
      { visible: true, timeout: 1000 },
    );
  }

  async assertClose() {
    const selector = 'iframe.kloudless-modal.kloudless-modal--opened';
    return this.loaderFrame.waitForFunction(
      s => (!document.querySelector(s)),
      { timeout: 1000 },
      selector,
    );
  }
}

export default PuppeteerHelper;
