/* global $, ko */
/**
 * Hot reload explorer templates in dev-server.
 * Support hot reloading templates without reloading the explorer page.
 *
 * For now, the hot reload functionality is limited:
 * 1. We need to update explorer.pug once after page load to make hot
 * reloading start working. I.E. editing other pug files won't trigger
 * hot reload until explorer.pug is hot reloaded once.
 * One workaround is to add an empty div under #kloudless-file-explore, save,
 * then revert.
 *
 * 2. The hot reload function assumes a div with id="kloudless-file-explorer"
 * exists in explorer.pug and is served as the main container for
 * explorer templates.
 */

import getTemplateHtml from 'explorer/templates/explorer.pug';

function onHotAccept() {
  // getTemplateHtml has been reloaded when this callback is executed

  /* eslint-disable no-console */
  console.log('Hot reloading explorer templates...');

  // remove current ko binding and HTML
  let $explorer = $('#kloudless-file-explorer');
  ko.cleanNode($explorer[0]);
  $('#kloudless-file-explorer').remove();

  // explorer is exposed in window when in development mode
  const { explorer } = window;

  // insert updated templates and rebind ko
  $('body').prepend(getTemplateHtml());
  // get the newly rendered template DOM reference
  $explorer = $('#kloudless-file-explorer');
  ko.applyBindings(explorer.view_model, $explorer[0]);

  // force reloading jquery plugins like dropdown and plupload
  explorer.switchViewTo(explorer.view_model.current());

  console.log('[Done] Hot reloaded explorer templates.');
}

module.hot.accept('explorer/templates/explorer.pug', onHotAccept);
