/* eslint-disable camelcase, no-underscore-dangle, func-names,
                  prefer-destructuring */
/* global EXPLORER_URL */
import '../css/modal.styl';
import '../../explorer/js/polyfills';

/**
 * Define the module and the interface with which developers interact.
 */
/**
 * Helper methods and objects
 */
// Element class helper methods
function addClass(el, newClassName) {
  el.classList.add(newClassName);
}

function removeClass(el, removeClassName) {
  el.classList.remove(removeClassName);
}

function isMobile() {
  return (!!navigator.userAgent.match(/(iPad|iPhone|iPod|android|Android)/g));
}

const FX = {
  easing: {
    linear(progress) {
      return progress;
    },
    quadratic(progress) {
      return progress ** 2;
    },
  },
  animate(options) {
    const start = new Date();
    const id = setInterval(() => {
      const timePassed = new Date() - start;
      let progress = timePassed / options.duration;
      if (progress > 1) {
        progress = 1;
      }
      options.progress = progress;
      const delta = options.delta(progress);
      options.step(delta);
      if (progress === 1) {
        clearInterval(id);
        if (typeof (options.complete) !== 'undefined') {
          options.complete();
        }
      }
    }, options.delay || 10);
  },
  fadeOut(element, options) {
    const to = 1;
    this.animate({
      duration: options.duration,
      delta(progress) {
        return FX.easing.quadratic(progress);
      },
      complete: options.complete,
      step(delta) {
        element.style.opacity = to - delta;
      },
    });
  },
  fadeIn(element, options) {
    const to = 0;
    this.animate({
      duration: options.duration,
      delta(progress) {
        progress = this.progress; // eslint-disable-line
        return FX.easing.quadratic(progress);
      },
      complete: options.complete,
      step(delta) {
        element.style.opacity = to + delta;
      },
    });
  },
};
/*
 * Track all variables
 *
 * fileExplorer object, frames, explorers.
 */

/**
 * Global Options
 */
const globalOptions = {
  explorerUrl: '',
  explorerOrigin: '', // computed options
};

const fileExplorer = {
  _frames: {},
  _explorers: {},
  _queuedAction: {},
};

// Keep track of all frames and explorers
const frames = fileExplorer._frames;
const explorers = fileExplorer._explorers;
const queuedAction = fileExplorer._queuedAction;
let backdropDiv = null;
let bodyOverflow = null;

/**
 * setGlobalOptions()
 */
fileExplorer.setGlobalOptions = ({ explorerUrl }) => {
  const oldExplorerUrl = globalOptions.explorerUrl;
  const pathParts = explorerUrl.split('://', 2);
  const explorerOrigin = `${pathParts[0]}://${pathParts[1].split('/')[0]}`;
  // update existing frames when changing explorerUrl
  Object.keys(frames).forEach((key) => {
    const frame = frames[key];
    const src = frame.getAttribute('src');
    frame.setAttribute('src', src.replace(oldExplorerUrl, `${explorerUrl}`));
  });
  globalOptions.explorerUrl = explorerUrl;
  globalOptions.explorerOrigin = explorerOrigin;
};

/**
 * getGlobalOptions()
 */
fileExplorer.getGlobalOptions = () => ({ ...globalOptions });

let explorerUrl = EXPLORER_URL;
if (explorerUrl.indexOf('://') === -1) {
  const location = window.location;
  explorerUrl = `${location.protocol}//${location.host}${explorerUrl}`;
}
fileExplorer.setGlobalOptions({ explorerUrl });

/**
 * Set up messaging, frames, explorers.
 */
(function () {
  function parseJsonString(data) {
    try {
      return JSON.parse(data);
    } catch (err) {
      return null;
    }
  }

  /**
   * Listen for incoming postMessages relating to widget events.
   */

  window.addEventListener('message', (message) => {
    if (message.origin !== globalOptions.explorerOrigin) {
      return;
    }
    const contents = parseJsonString(message.data);
    if (contents === null) {
      return;
    }

    // Grab the explorer id
    const { exp_id } = contents;

    // Listen for file explorer events.
    // postMessage based on explorer id
    const explorer = fileExplorer._explorers[exp_id];
    if (explorer) {
      explorer._fire(contents.action, contents.data);
    }
  });
}());

// Initialize an iframe.
// eslint-disable-next-line
const initialize_frame = function (options, elementId) {
  const exp_id = Math.floor(Math.random() * (10 ** 12));
  const frame = document.createElement('iframe');

  if (isMobile()) {
    frame.setAttribute('scrolling', 'no');
  }
  frame.setAttribute('class', 'kloudless-modal');
  const queryStrings = [
    `app_id=${options.app_id}`,
    `exp_id=${exp_id}`,
    `flavor=${options.flavor}`,
    `origin=${encodeURIComponent(`${window.location.protocol}//${window.location.host}`)}`,
    `custom_css=${encodeURIComponent(options.custom_css)}`,
    `multiselect=${options.multiselect}`,
    `link=${options.link}`,
    `computer=${options.computer}`,
    `copy_to_upload_location=${options.copy_to_upload_location}`,
    `upload_location_uri=${options.upload_location_uri}`,
    `services=${JSON.stringify(options.services)}`,
    `persist=${JSON.stringify(options.persist)}`,
    `account_key=${options.account_key}`,
    `create_folder=${options.create_folder}`,
    `types=${JSON.stringify(options.types)}`,
  ];
  frame.setAttribute(
    'src', `${globalOptions.explorerUrl}?${queryStrings.join('&')}`,
  );
  frame.style.display = 'none';
  frames[exp_id] = frame;

  const body = document.getElementsByTagName('body')[0];

  if (elementId) {
    const el = document.getElementById(elementId);
    el.appendChild(frame);
  } else {
    body.appendChild(frame);
  }

  if (!backdropDiv) {
    const div = document.createElement('div');
    backdropDiv = body.appendChild(div);
    addClass(backdropDiv, 'backdrop_div');
  }
  return exp_id;
};

// Common file widget methods.
fileExplorer._fileWidget = function (options) {
  this._setOptions(options);
  this.handlers = {};
  this.defaultHandlers = {};
  this.elements = [];
  this.clickHandlers = [];
};

// Set options.
fileExplorer._fileWidget.prototype._setOptions = function (options = {}) {
  /*
     * This method has historically set data on `this`, and passed it in
     * via the querystring. Since this isn't scalable, and pollutes the
     * self/this namespace, we should store it namespaced under an `options`
     * object for future options, and pass it in via the DATA call for vars
     * not essential to instantiation.
     */

  if (!options.app_id) {
    throw new Error('You need to specify an app ID.');
  }

  this.options = options;
  this.app_id = options.app_id;
  this.exp_id = options.exp_id;
  this.custom_css = (options.custom_css) ? options.custom_css : false;
  // These don't need to be passed for query variables
  this.elementId = options.elementId;
  this.flavor = (options.flavor === undefined) ? 'chooser' : options.flavor;
  this.multiselect = (
    options.multiselect === undefined) ? false : options.multiselect;
  this.link = (options.link === undefined) ? true : options.link;
  this.computer = (options.computer === undefined) ? false : options.computer;
  this.copy_to_upload_location = (
    (options.copy_to_upload_location === undefined)
      ? null : options.copy_to_upload_location);
  this.upload_location_uri = window.encodeURIComponent(
    options.upload_location_uri || '',
  );
  this.create_folder = (
    options.create_folder === undefined) ? true : options.create_folder;
  this.account_key = (
    options.account_key === undefined) ? false : options.account_key;
  this.persist = (
    options.persist === undefined) ? 'local' : options.persist;
  this.display_backdrop = (
    options.display_backdrop === undefined)
    ? false : options.display_backdrop;
  this.services = options.services || null;
  this.files = options.files || [];
  this.types = options.types || [];
  if (!(this.files instanceof Array)) {
    this.files = [];
  }
  if (!(this.types instanceof Array)) {
    this.types = [this.types];
  }
  this.types = this.types.map(type => type.substr(type.lastIndexOf('.') + 1));

  // Backwards compatibility for direct_link
  if (!this.options.link_options) {
    this.options.link_options = {};
  }
  if (options.direct_link !== undefined
    && this.options.link_options.direct === undefined) {
    this.options.link_options.direct = options.direct_link;
  }

  return this;
};

// Define handlers. New handlers will override pre-existing ones.
fileExplorer._fileWidget.prototype.on = function (event, handler) {
  if (this.handlers[event] === undefined) {
    this.handlers[event] = [];
  }
  this.handlers[event].push(handler);
  return this;
};

// Fire an event handler. Called by the message listeners.
fileExplorer._fileWidget.prototype._fire = function (event, data) {
  if (['success', 'cancel'].indexOf(event) !== -1) {
    this.close();
  }

  const defaultHandler = this.defaultHandlers[event];
  if (defaultHandler) {
    window.setTimeout(() => {
      defaultHandler.call(this, data);
    }, 0);
  }

  if (this.handlers[event] !== undefined) {
    for (let i = 0; i < this.handlers[event].length; i += 1) {
      (function (handler) {
        window.setTimeout(() => {
          handler.call(this, data);
        }, 0);
      }(this.handlers[event][i]));
    }
  }

  if ('raw' in this.handlers) {
    // `raw` event is used by the react/vue binding
    window.setTimeout(() => this.handlers.raw[0]({ action: event, data }), 0);
  }

  return this;
};

/*
   * Explorer
   */

fileExplorer.explorer = function (options) {
  // first step is to return a new object
  const exp = new fileExplorer._explorer(options);

  exp.on('load', () => {
    // TODO: INIT post message with all config variables
    exp.message('INIT', { options });

    exp.loaded = true;
    if (queuedAction[exp.exp_id]) {
      const { method, args } = queuedAction[exp.exp_id];
      delete queuedAction[exp.exp_id];
      method.apply(exp, args);
    }
  });

  const id = initialize_frame({
    app_id: exp.app_id,
    exp_id: exp.exp_id,
    flavor: exp.flavor,
    custom_css: exp.custom_css,
    multiselect: exp.multiselect,
    link: exp.link,
    computer: exp.computer,
    copy_to_upload_location: exp.copy_to_upload_location,
    upload_location_uri: exp.upload_location_uri,
    account_key: exp.account_key,
    services: exp.services,
    persist: exp.persist,
    types: exp.types,
    create_folder: exp.create_folder,
  }, exp.elementId);
  exp.exp_id = id;

  exp.defaultHandlers.close = function () {
    const frame = frames[exp.exp_id];
    if (frame) {
      FX.fadeOut(frame, {
        duration: 200,
        complete() {
          frame.style.display = 'none';
        },
      });
    }
  };

  explorers[exp.exp_id] = exp;

  return exp;
};

// Construct the explorer.
fileExplorer._explorer = function (options) {
  fileExplorer._fileWidget.call(this, options);
};
fileExplorer._explorer.prototype = Object.create(
  fileExplorer._fileWidget.prototype,
);
fileExplorer._explorer.prototype.constructor = fileExplorer._explorer;
Object.defineProperty(fileExplorer._explorer.prototype, 'constructor', {
  enumerable: false,
  value: fileExplorer._explorer,
});

// Send a message to the explorer frame
fileExplorer._explorer.prototype.message = function (action, data) {
  const frame = frames[this.exp_id];
  if (frame) {
    frame.contentWindow.postMessage(JSON.stringify({
      action,
      data,
    }), globalOptions.explorerUrl);
  }
  // console.log('Explorer message sent.');
};

// Update the explorer config
fileExplorer._explorer.prototype.update = function (opts) {
  this.message('DATA', { options: opts });

  // Also update this.options
  this.options = { ...this.options, ...opts };
};

// Open the chooser
fileExplorer._explorer.prototype.choose = function () {
  if (!this.loaded) {
    queuedAction[this.exp_id] = { method: this.choose };
    return;
  }

  this._open({
    flavor: 'chooser',
  });

  return this; // eslint-disable-line
};

// Open the saver
fileExplorer._explorer.prototype.save = function (files) {
  if (!this.loaded) {
    queuedAction[this.exp_id] = { method: this.save, args: [files] };
    return;
  }

  if (!(files instanceof Array)) {
    files = []; // eslint-disable-line
  }
  files = this.files.concat(files); // eslint-disable-line

  // Need to have at least 1 file to save
  if (files.length < 1) {
    console.log('ERROR: No files to save');
    return;
  }

  // Send over files inside the options or those sent with save()
  this._open({
    flavor: 'saver',
    files,
  });

  return this; // eslint-disable-line
};

fileExplorer._explorer.prototype._open = function (data) {
  const body = document.getElementsByTagName('body')[0];

  data.options = this.options;
  this.message('DATA', data);

  // Store the last scrollTop value so we can reset it when the explorer
  // closes
  fileExplorer._fileWidget.lastScrollTop = body.scrollTop;
  // Then scroll to the top of the file explorer after it's set
  // if the user is mobile
  if (isMobile()) {
    body.scrollTop = 0;
  }

  frames[this.exp_id].style.display = 'block';
  frames[this.exp_id].style.opacity = 0;
  addClass(body, 'kfe-active');

  if (data.flavor !== 'dropzone') {
    FX.fadeIn(frames[this.exp_id], {
      duration: 200,
    });
  }

  if (this.display_backdrop) {
    backdropDiv.style.display = 'block';
    bodyOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
  }

  this._fire('open');

  return this;
};

// Close the explorer
fileExplorer._explorer.prototype.close = function () {
  const body = document.getElementsByTagName('body')[0];

  if (!this.loaded) {
    queuedAction[this.exp_id] = { method: this.close };
    return;
  }

  this.message('CLOSING');

  removeClass(body, 'kfe-active');

  const { lastScrollTop } = fileExplorer._fileWidget;
  if (typeof (lastScrollTop) !== 'undefined') {
    if (isMobile()) {
      body.scrollTop = lastScrollTop;
    }
  }

  if (this.display_backdrop) {
    backdropDiv.style.display = 'none';
    body.style.overflow = bodyOverflow;
  }

  this._fire('close');
};

fileExplorer._explorer.prototype._bindElement = function (
  element, clickHandler,
) {
  let elements = [];
  if (element instanceof Array) {
    elements = element;
  } else if (window.jQuery !== undefined && element instanceof window.jQuery) {
    elements = element.toArray();
  } else {
    elements = [element];
  }
  elements.forEach(e => e.addEventListener('click', clickHandler));
  this.elements.push(...elements);
  this.clickHandlers.push(clickHandler);
  return this;
};

// Bind the file exploring dialogue to an element.
fileExplorer._explorer.prototype.choosify = function (element) {
  const clickHandler = this.choose.bind(this);
  return this._bindElement(element, clickHandler);
};

// Bind the file exploring dialogue to an element.
fileExplorer._explorer.prototype.savify = function (element, files) {
  const clickHandler = this.save.bind(this, files);
  return this._bindElement(element, clickHandler);
};

fileExplorer._explorer.prototype.destroy = function () {
  const frame = frames[this.exp_id];
  delete frames[this.exp_id];
  delete explorers[this.exp_id];
  this.close();
  this.elements.forEach((e) => {
    this.clickHandlers.forEach((handler) => {
      e.removeEventListener('click', handler);
    });
  });
  frame.parentNode.removeChild(frame);
  delete queuedAction[this.exp_id];
};

/**
 * Dropzone
 */

fileExplorer.dropzone = function (options) {
  return new fileExplorer._dropzone({ ...options });
};

fileExplorer._dropzone = function (options = {}) {
  this.isDestroyed = false;
  this.elementId = options.elementId;
  delete options.elementId;
  if (!this.elementId) {
    throw new Error(
      'Please specify the elementId for the dropzone to be bound to.',
    );
  }

  this.dropExplorer = fileExplorer.explorer({
    app_id: options.app_id,
    flavor: 'dropzone',
    multiselect: options.multiselect,
    elementId: this.elementId,
  });

  this.clickExplorer = fileExplorer.explorer(options);

  this.dropExplorerFrame = frames[this.dropExplorer.exp_id];
  this.clickExplorerFrame = frames[this.clickExplorer.exp_id];

  this._configureFrame();
};

fileExplorer._dropzone.prototype._configureFrame = function () {
  /**
   * The drop explorer is always opened. But set its iframe opacity to 0 before
   * users dropping files or after uploading process succeed/canceled.
   */
  const element = document.getElementById(this.elementId);
  const frame = this.dropExplorerFrame;
  const dropExp = this.dropExplorer;
  const clickExp = this.clickExplorer;
  // Cannot set opacity to 0 because that makes the iframe not clickable in
  // Chrome.
  const transparentOpacity = '0.000000001';

  element.classList.add('kloudless_dropzone_container');
  if (element.getElementsByTagName('span').length === 0) {
    // Add span only if not exists
    const content = document.createElement('span');
    content.innerHTML = 'Drag and drop files here, or click to open the File Explorer';
    element.appendChild(content);
  }

  // Override default close handler so frame isn't set to 'display: none'
  dropExp.defaultHandlers.close = function () {
    frame.style.opacity = transparentOpacity;
  };

  frame.style.display = 'block';
  frame.style.opacity = transparentOpacity;
  frame.style.height = '100%';
  frame.style.width = '100%';
  frame.setAttribute('class', 'kloudless-modal-dropzone');

  frame.onload = () => {
    if (frame._hasLoadedOnce) {
      // prevent `setExplorerUrl` from duplicate event listener registration
      return;
    }
    dropExp.on('dropzoneClicked', () => {
      clickExp._open({
        flavor: 'chooser',
      });
    });

    dropExp.on('drop', () => {
      element.style.width = '700px';
      element.style.height = '515px';
      element.style['border-style'] = 'none';
      frame.style.opacity = '1';
    });

    // Since the drop event will override CSS properties, we need
    // to retain original values so we can restore them on close.
    const style = window.getComputedStyle(element);
    const { height, width, 'border-style': borderStyle } = style;

    dropExp.on('close', () => {
      element.style.height = height;
      element.style.width = width;
      element.style['border-style'] = borderStyle;
      if (!this.isDestroyed) {
        dropExp._open({
          flavor: 'dropzone',
        });
      }
      frame.style.opacity = transparentOpacity;
    });
    frame._hasLoadedOnce = true;
  };

  return frame;
};

fileExplorer._dropzone.prototype.on = function (event, handler) {
  this.dropExplorer.on(event, handler);
  this.clickExplorer.on(event, handler);
  return this;
};

fileExplorer._dropzone.prototype.close = function () {
  this.dropExplorer.close();
  this.clickExplorer.close();
};

fileExplorer._dropzone.prototype.update = function (opts) {
  this.dropExplorer.update(opts);
  this.clickExplorer.update(opts);
};

fileExplorer._dropzone.prototype.destroy = function () {
  this.isDestroyed = true;
  this.dropExplorer.destroy();
  this.clickExplorer.destroy();
  this.dropExplorer = null;
  this.clickExplorer = null;
};

export default fileExplorer;
