const ICON_HTML = '<div class="icon"><div class="icon__next"></div></div>';
const ROOT_DIR_HTML = `
  <div class="icon icon--button icon--large">
    <div class="icon__root-dir"></div>
  </div>`;
const TOGGLE_BTN_HTML = `
  <div class="breadcrumb__toggle-btn">
    ${ICON_HTML}
    <div class="breadcrumb__text">...</div>
  </div>`;

/**
 * @param {Object[]} breadcrumbs
 * @param {string} breadcrumbs[].path
 * @param {boolean} breadcrumbs[].visible
 * @param {number} maxWidth
 */
function isBreadcrumbOverflow(breadcrumbs, maxWidth) {
  const hiddenContainer = $('.breadcrumb__hidden');
  const showToggleButton = breadcrumbs.includes(e => e.visible === false);
  const els = [ROOT_DIR_HTML];
  if (showToggleButton) {
    els.push(TOGGLE_BTN_HTML);
  }
  breadcrumbs.filter(e => e.visible).forEach((breadcrumb) => {
    els.push(
      ICON_HTML,
      `<div class="breadcrumb__text">${breadcrumb.path}</div>`,
    );
  });
  const html = `<div class="breadcrumb">${els.join('')}</div>`;
  hiddenContainer.html(html);
  const width = hiddenContainer.outerWidth();
  return width >= maxWidth;
}

/**
 * @param {Object[]} breadcrumbs
 * @param {string} breadcrumbs[].path
 * @param {boolean} breadcrumbs[].visible
 */
function adjustBreadcrumbWidth(breadcrumbs) {
  if (breadcrumbs === null || breadcrumbs.length <= 1) {
    return breadcrumbs;
  }
  const maxWidth = $('.breadcrumb').outerWidth();
  const { length } = breadcrumbs;
  let index = breadcrumbs.findIndex(e => e.visible);
  while (index < length - 1 && isBreadcrumbOverflow(breadcrumbs, maxWidth)) {
    breadcrumbs[index].visible = false;
    index += 1;
  }
  return breadcrumbs;
}

export default adjustBreadcrumbWidth;
