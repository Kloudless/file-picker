import PuppeteerHelper from './core/PuppeteerHelper';
import { STORY_URL } from '../../config';

describe('Chooser Tests', () => {
  const helper = new PuppeteerHelper();

  beforeEach(async () => {
    await helper.init(STORY_URL.chooser);
  });

  afterEach(async () => {
    await helper.cleanup();
  });

  it('select a file', async () => {
    await helper.launch();
    const selectedFile = global.FOLDER_CONTENT.find(
      f => f.type === 'file' && f.downloadable !== false,
    );
    if (!selectedFile) {
      throw new Error('No file to tests.');
    }
    await helper.clickFile(selectedFile.id);
    const [
      selectedEventData, successEventData,
    ] = await helper.clickSelectBtn();

    expect(selectedEventData).toEqual([selectedFile]);
    expect(successEventData).toEqual([selectedFile]);
  });
});
