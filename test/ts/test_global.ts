/* eslint-disable no-console, max-len */

// eslint-disable-next-line spaced-comment, @typescript-eslint/triple-slash-reference
/// <reference path="../../src/loader/js/interface.d.ts" />

const options: Kloudless.fileExplorer.ChooserOptions = {
  app_id: 'APP_ID',
  types: ['files'],
};
const explorer = Kloudless.fileExplorer.explorer(options);
explorer.choosify(document.getElementById('button'));
explorer.on('success', (files: Kloudless.fileExplorer.FileMetadata[]) => {
  files.forEach((file) => {
    console.log(file.id, file.name);
  });
});
