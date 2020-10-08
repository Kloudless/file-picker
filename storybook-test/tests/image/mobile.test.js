import PuppeteerHelper from './core/PuppeteerHelper';
import { STORY_URL } from '../../config';

describe('Mobile Image Tests', () => {
  const helper = new PuppeteerHelper();

  beforeEach(async () => {
    await helper.init(STORY_URL.chooser, { mobile: true });
  });

  afterEach(async () => {
    await helper.cleanup();
  });

  it('file view', async () => {
    await helper.launch();
    await helper.assertScreenshot();
  });
});
