/**
 * Based on BasePuppeteerHelper, do the following stuff to make sure the
 * snapshots are consistent.
 * 1. Disable CSS animations and transitions.
 * 2. Mock response data.
 * 3. Make sure font and image resources are loaded before taking snapshots.
 */
import BasePuppeteerHelper from '../../integration/core/PuppeteerHelper';
import ListFolderContentResponse from './folder_content_response.json';
import GetAccountResponse from './get_account_response.json';

const STYLE_DISABLE_ANIMATION = `
  *,
  *::after,
  *::before {
      transition-delay: 0s !important;
      transition-duration: 0s !important;
      animation-delay: -0.0001s !important;
      animation-duration: 0s !important;
      animation-play-state: paused !important;
      caret-color: transparent !important;
      color-adjust: exact !important;
      -webkit-animation-play-state: paused;
      -moz-animation-play-state: paused;
  }`;

class PuppeteerHelper extends BasePuppeteerHelper {
  async init(...args) {
    // Call super's init();
    await super.init(...args);

    this.addRequestInterceptor(
      { url: '/storage/folders/root/contents' },
      { body: ListFolderContentResponse },
      { global: true },
    );
    this.addRequestInterceptor(
      { url: '/accounts/me/?active=True' },
      { body: GetAccountResponse },
      { global: true },
    );
    // Disable loader's animation.
    await this.loaderFrame.addStyleTag({ content: STYLE_DISABLE_ANIMATION });
  }

  async launch(...args) {
    await super.launch(...args);
    // Disable picker's animations.
    await this.viewFrame.addStyleTag({ content: STYLE_DISABLE_ANIMATION });
  }

  _waitForImage(options = {}) {
    const { timeout = 3000 } = options;
    // Wait for images of <img> to be loaded
    const waitForImageTag = this.viewFrame.waitForFunction(
      () => Array.from(document.images).every(i => i.complete),
      { timeout },
    );
    // Wait for background images to be loaded
    const waitForBgImage = this.viewFrame.waitForFunction(() => {
      const regexp = /url\("([^"]+)"\)/;
      const els = document.querySelectorAll('.icon > div');
      const loadBackgroundImgs = [];
      els.forEach((el) => {
        const { background } = window.getComputedStyle(el);
        const matches = background.match(regexp);
        if (matches !== null) {
          loadBackgroundImgs.push(new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            // eslint-disable-next-line prefer-destructuring
            img.src = matches[1];
          }));
        }
      });
      return Promise.all(loadBackgroundImgs);
    }, { timeout });
    return Promise.all([waitForImageTag, waitForBgImage]);
  }

  _waitForFont(options = {}) {
    const { timeout = 3000 } = options;
    // wait for fonts ready
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts
    return this.page.evaluateHandle('document.fonts.ready', { timeout });
  }

  async assertScreenshot() {
    await this._waitForFont();
    await this._waitForImage();
    const image = await this.page.screenshot();
    expect(image).toMatchImageSnapshot();
  }
}

export default PuppeteerHelper;
