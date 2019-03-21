import fileExplorer from '../interface';

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
