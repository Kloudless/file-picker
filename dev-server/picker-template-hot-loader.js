/* global $, ko */
/**
 * Hot reload file picker templates in dev-server.
 * Support hot reloading templates without reloading the file picker page.
 *
 * For now, the hot reload functionality is limited:
 * 1. We need to update index.pug once after page load to make hot
 * reloading start working. I.E. editing other pug files won't trigger
 * hot reload until index.pug is hot reloaded once.
 * One workaround is to add an empty div under #kloudless-file-explore, save,
 * then revert.
 *
 * 2. The hot reload function assumes a div with id="kloudless-file-picker"
 * exists in index.pug and is served as the main container for
 * file picker templates.
 */

import getTemplateHtml from 'picker/templates/index.pug';

function onHotAccept() {
  // getTemplateHtml has been reloaded when this callback is executed

  /* eslint-disable no-console */
  console.log('Hot reloading file picker templates...');

  // remove current ko binding and HTML
  let $picker = $('#kloudless-file-picker');
  ko.cleanNode($picker[0]);
  $('#kloudless-file-picker').remove();

  // file picker is exposed in window when in development mode
  const { picker } = window;

  // insert updated templates and rebind ko
  $('body').prepend(getTemplateHtml());
  // get the newly rendered template DOM reference
  $picker = $('#kloudless-file-picker');
  ko.applyBindings(picker.view_model, $picker[0]);

  // force reloading jquery plugins like dropdown and plupload
  picker.switchViewTo(picker.view_model.current());

  console.log('[Done] Hot reloaded file picker templates.');
}

module.hot.accept('picker/templates/index.pug', onHotAccept);
