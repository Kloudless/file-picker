/**
 * Export fileExplorer to the following global variables:
 * - window.Kloudless.fileExplorer
 * - window.Kloudless (b/w compatible)
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import fileExplorer from '../src/loader/js/interface';

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
  Object.assign(window[customExportTarget], fileExplorer);
} else {
  window.Kloudless = window.Kloudless || {};
  // Backward compatible
  Object.assign(window.Kloudless, fileExplorer);
  window.Kloudless.fileExplorer = fileExplorer;
}
