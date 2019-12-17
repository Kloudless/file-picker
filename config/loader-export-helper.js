/**
 * Export filePicker to the following global variables:
 * - window.Kloudless.filePicker
 * - window.Kloudless.fileExplorer (b/w compatible)
 * - window.Kloudless (b/w compatible)
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import filePicker from '../src/loader/js/interface';

// Determine export target
let currentScript;
if (document.currentScript) {
  currentScript = document.currentScript; // eslint-disable-line
} else {
  const scripts = document.getElementsByTagName('script');
  currentScript = scripts[scripts.length - 1];
}

const customExportTarget = currentScript.getAttribute('data-kloudless-object');
if (customExportTarget) {
  window[customExportTarget] = window[customExportTarget] || {};
  Object.assign(window[customExportTarget], filePicker);
} else {
  window.Kloudless = window.Kloudless || {};
  // b/c with <=1.0.0
  Object.assign(window.Kloudless, filePicker);
  // b/c with ^1.0.1
  window.Kloudless.fileExplorer = filePicker;

  window.Kloudless.filePicker = filePicker;
}
