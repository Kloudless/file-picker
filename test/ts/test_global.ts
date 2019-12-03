/* eslint-disable no-console, max-len */

// eslint-disable-next-line spaced-comment, @typescript-eslint/triple-slash-reference
/// <reference path="../../src/loader/js/interface.d.ts" />

const options: Kloudless.filePicker.ChooserOptions = {
  app_id: 'APP_ID',
  types: ['files'],
};
const picker = Kloudless.filePicker.picker(options);
picker.choosify(document.getElementById('button'));
picker.on('success', (files: Kloudless.filePicker.FileMetadata[]) => {
  files.forEach((file) => {
    console.log(file.id, file.name);
  });
});
