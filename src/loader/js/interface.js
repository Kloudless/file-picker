/* eslint-disable camelcase, no-underscore-dangle, func-names,
                  prefer-destructuring */
/* global PICKER_URL, VERSION, PICKER_URL_V1 */
import '../css/modal.less';
import { FLAVOR } from '../../picker/js/constants';

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
 * filePicker object, frames, pickers.
 */

/**
 * Global Options
 */
const globalOptions = {
  pickerUrl: '',
  pickerOrigin: '', // computed options
};

const filePicker = {
  _frames: {},
  _pickers: {},
  _queuedAction: {},
};

// Keep track of all frames and pickers
const frames = filePicker._frames;
const pickers = filePicker._pickers;
const queuedAction = filePicker._queuedAction;
let backdropDiv = null;
let bodyOverflow = null;
const { protocol, host } = window.location;

/**
 * setGlobalOptions()
 */
filePicker.setGlobalOptions = ({ pickerUrl, explorerUrl }) => {
  // TODO-v3: remove explorerUrl
  if (!pickerUrl && !explorerUrl) {
    return;
  }
  const newPickerUrl = pickerUrl || explorerUrl;
  const oldPickerUrl = globalOptions.pickerUrl;
  const pathParts = newPickerUrl.split('://', 2);
  const pickerOrigin = `${pathParts[0]}://${pathParts[1].split('/')[0]}`;
  // update existing frames when changing pickerUrl
  Object.keys(frames).forEach((key) => {
    const frame = frames[key];
    const src = frame.getAttribute('src');
    frame.setAttribute('src', src.replace(oldPickerUrl, `${newPickerUrl}`));
  });
  globalOptions.pickerUrl = newPickerUrl;
  globalOptions.pickerOrigin = pickerOrigin;
};

/**
 * getGlobalOptions()
 */
filePicker.getGlobalOptions = () => ({ ...globalOptions });

let pickerUrl = PICKER_URL;
if (pickerUrl.indexOf('://') === -1) {
  pickerUrl = `${protocol}//${host}${pickerUrl}`;
}
filePicker.setGlobalOptions({ pickerUrl });

/**
 * Set up messaging, frames, pickers.
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

  window.addEventListener('message', (event) => {
    if (event.origin !== globalOptions.pickerOrigin) {
      return;
    }
    const message = parseJsonString(event.data);
    if (message === null) {
      return;
    }

    // Grab the file picker id
    const {
      exp_id, action, data, callbackId,
    } = message;

    // Listen for file picker events.
    // postMessage based on picker id.
    // TODO-v3: remove exp_id
    const picker = filePicker._pickers[exp_id];
    if (picker) {
      if (action === 'GET_OAUTH_PARAMS') {
        picker._getOAuthParams(callbackId, data);
      } else {
        picker._fire(action, data);
      }
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
    `origin=${encodeURIComponent(`${protocol}//${host}`)}`,
    `custom_css=${encodeURIComponent(options.custom_css)}`,
    `services=${JSON.stringify(options.services)}`,
    `persist=${JSON.stringify(options.persist)}`,
    `account_key=${options.account_key}`,
    `create_folder=${options.create_folder}`,
    `types=${JSON.stringify(options.types)}`,
  ];

  frame.setAttribute(
    'src', `${globalOptions.pickerUrl}?${queryStrings.join('&')}`,
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
    addClass(backdropDiv, 'backdrop-div');
  }
  return exp_id;
};

// Common file widget methods.
filePicker._fileWidget = function (options) {
  this._setOptions(options);
  this.handlers = {};
  this.defaultHandlers = {};
  this.elements = [];
  this.clickHandlers = [];
};

// Set options.
filePicker._fileWidget.prototype._setOptions = function (options = {}) {
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
  this.flavor = (
    options.flavor === undefined) ? FLAVOR.chooser : options.flavor;
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
filePicker._fileWidget.prototype.on = function (event, handler) {
  if (this.handlers[event] === undefined) {
    this.handlers[event] = [];
  }
  this.handlers[event].push(handler);
  return this;
};

filePicker._fileWidget.prototype._getOAuthParams = function (
  callbackId, data,
) {
  try {
    const { oauth } = this.options;
    const oauthParams = oauth ? oauth(data.service) : {};
    this.message('CALLBACK', { oauthParams }, callbackId);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    window.alert( // eslint-disable-line no-alert
      'An error occurred. ' +
      'Please contact Support for further assistance connecting your ' +
      `${data.service} account.`,
    );
  }
};

// Fire an event handler. Called by the message listeners.
filePicker._fileWidget.prototype._fire = function (event, data) {
  if (['success', 'cancel', 'error'].indexOf(event) !== -1) {
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
    window.setTimeout(() => (
      this.handlers.raw[0]({ action: event, data })
    ), 0);
  }

  return this;
};

/*
   * Picker
   */

filePicker.picker = function (options) {
  if (options.custom_css) {
    console.warn(
      'custom_css option is deprecated.',
      'Please use custom_style_vars instead.',
    );
    filePicker.setGlobalOptions({ pickerUrl: PICKER_URL_V1 });
  }
  // first step is to return a new object
  const picker = new filePicker._picker(options);

  picker.on('load', () => {
    // TODO: INIT post message with all config variables
    picker.message('INIT', { options });

    picker.loaded = true;
    if (queuedAction[picker.exp_id]) {
      const { method, args } = queuedAction[picker.exp_id];
      delete queuedAction[picker.exp_id];
      method.apply(picker, args);
    }
  });

  // only need to pass the options that can't be updated after initialization
  // the rest will be passed in when calling `_open()`
  const id = initialize_frame({
    app_id: picker.app_id,
    exp_id: picker.exp_id,
    flavor: picker.flavor,
    custom_css: picker.custom_css,
    account_key: picker.account_key,
    services: picker.services,
    persist: picker.persist,
    types: picker.types,
    create_folder: picker.create_folder,
  }, picker.elementId);
  picker.exp_id = id;

  picker.defaultHandlers.close = function () {
    const frame = frames[picker.exp_id];
    if (frame) {
      FX.fadeOut(frame, {
        duration: 200,
        complete() {
          frame.style.display = 'none';
        },
      });
    }
  };

  pickers[picker.exp_id] = picker;

  return picker;
};
// TODO-v3: remove filePicker.explorer
filePicker.explorer = filePicker.picker;

// Construct the picker.
filePicker._picker = function (options) {
  filePicker._fileWidget.call(this, options);
};
filePicker._picker.prototype = Object.create(
  filePicker._fileWidget.prototype,
);
filePicker._picker.prototype.constructor = filePicker._picker;
Object.defineProperty(filePicker._picker.prototype, 'constructor', {
  enumerable: false,
  value: filePicker._picker,
});

// Send a message to the picker frame
filePicker._picker.prototype.message = function (action, data, callbackId) {
  const frame = frames[this.exp_id];
  if (frame) {
    frame.contentWindow.postMessage(JSON.stringify({
      callbackId,
      action,
      data,
    }), globalOptions.pickerUrl);
  }
  // console.log('File Picker message sent.');
};

// Update the file picker config
filePicker._picker.prototype.update = function (opts) {
  this.message('DATA', { options: opts });

  // Also update this.options
  this.options = { ...this.options, ...opts };
};

// Open the chooser
filePicker._picker.prototype.choose = function () {
  if (!this.loaded) {
    queuedAction[this.exp_id] = { method: this.choose };
    return;
  }

  this._open({
    flavor: FLAVOR.chooser,
  });

  return this; // eslint-disable-line
};

// Open the saver
filePicker._picker.prototype.save = function (files) {
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
    flavor: FLAVOR.saver,
    files,
  });

  return this; // eslint-disable-line
};

filePicker._picker.prototype._open = function (data) {
  const body = document.getElementsByTagName('body')[0];

  data.options = this.options;
  this.message('DATA', data);

  // Store the last scrollTop value so we can reset it when the file picker
  // closes
  filePicker._fileWidget.lastScrollTop = body.scrollTop;
  // Then scroll to the top of the file picker after it's set
  // if the user is mobile
  if (isMobile()) {
    body.scrollTop = 0;
  }

  frames[this.exp_id].style.display = 'block';
  frames[this.exp_id].style.opacity = 0;
  addClass(body, 'kfe-active');

  if (data.flavor !== FLAVOR.dropzone) {
    FX.fadeIn(frames[this.exp_id], {
      duration: 200,
    });
  }

  if (this.display_backdrop) {
    backdropDiv.style.display = 'block';
    bodyOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    addClass(frames[this.exp_id], 'kloudless-modal--backdrop');
  } else {
    removeClass(frames[this.exp_id], 'kloudless-modal--backdrop');
  }

  this._fire('open');

  return this;
};

// Close the file picker
filePicker._picker.prototype.close = function () {
  const body = document.getElementsByTagName('body')[0];

  if (!this.loaded) {
    queuedAction[this.exp_id] = { method: this.close };
    return;
  }

  this.message('CLOSING');

  removeClass(body, 'kfe-active');

  const { lastScrollTop } = filePicker._fileWidget;
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

filePicker._picker.prototype._bindElement = function (
  element, clickHandler,
) {
  let elements = [];
  if (element instanceof Array) {
    elements = element;
  } else if (typeof element.toArray === 'function'
              && typeof element.toggleClass === 'function') {
    /** Guess element is a jQuery object.
     * Don't use instanceof $ here because $ could be a different library
     * imported by devs.
     */
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
filePicker._picker.prototype.choosify = function (element) {
  const clickHandler = this.choose.bind(this);
  return this._bindElement(element, clickHandler);
};

// Bind the file exploring dialogue to an element.
filePicker._picker.prototype.savify = function (element, files) {
  const clickHandler = this.save.bind(this, files);
  return this._bindElement(element, clickHandler);
};

filePicker._picker.prototype.destroy = function () {
  const frame = frames[this.exp_id];
  delete frames[this.exp_id];
  delete pickers[this.exp_id];
  this.close();
  this.elements.forEach((e) => {
    this.clickHandlers.forEach((handler) => {
      e.removeEventListener('click', handler);
    });
  });
  frame.parentNode.removeChild(frame);
  delete queuedAction[this.exp_id];
};

filePicker._picker.prototype.logout = function (deleteAccount) {
  /**
   *  Removes all account tokens from file picker localStorage or
   *  sessionStorage.
   *
   *  @param {Boolean} deleteAccount - If true, deletes all accounts which
   *  connected to Kloudless server.
   */
  if (deleteAccount) {
    this.message('LOGOUT:DELETE_ACCOUNT');
  } else {
    this.message('LOGOUT');
  }
};

/**
 * Dropzone
 */

filePicker.dropzone = function (options) {
  return new filePicker._dropzone({ ...options });
};

filePicker._dropzone = function (options = {}) {
  this.isDestroyed = false;
  this.elementId = options.elementId;
  delete options.elementId;
  if (!this.elementId) {
    throw new Error(
      'Please specify the elementId for the dropzone to be bound to.',
    );
  }

  const dropzoneOptions = { ...options, computer: true };

  this.dropPicker = filePicker.picker({
    ...dropzoneOptions,
    flavor: FLAVOR.dropzone,
    elementId: this.elementId,
  });

  this.clickPicker = filePicker.picker(dropzoneOptions);

  this.dropPickerFrame = frames[this.dropPicker.exp_id];
  this.clickPickerFrame = frames[this.clickPicker.exp_id];

  this._configureFrame();
};

filePicker._dropzone.prototype._configureFrame = function () {
  /**
   * The drop picker is always opened. But set its iframe opacity to 0 before
   * users dropping files or after uploading process succeed/canceled.
   */
  const element = document.getElementById(this.elementId);
  const frame = this.dropPickerFrame;
  const dropPicker = this.dropPicker;
  const clickPicker = this.clickPicker;
  // Cannot set opacity to 0 because that makes the iframe not clickable in
  // Chrome.
  const transparentOpacity = '0.000000001';

  element.classList.add('kloudless-dropzone-container');
  if (element.getElementsByTagName('span').length === 0) {
    // Add span only if not exists
    const content = document.createElement('span');
    content.innerHTML =
      'Drag and drop files here, or click to open the File Picker';
    element.appendChild(content);
  }

  // Override default close handler so frame isn't set to 'display: none'
  dropPicker.defaultHandlers.close = function () {
    frame.style.opacity = transparentOpacity;
  };

  frame.style.display = 'block';
  frame.style.opacity = transparentOpacity;
  frame.style.height = '100%';
  frame.style.width = '100%';
  frame.setAttribute('class', 'kloudless-modal-dropzone');

  frame.onload = () => {
    if (frame._hasLoadedOnce) {
      // prevent `setPickerUrl` from duplicate event listener registration
      return;
    }
    dropPicker.on('dropzoneClicked', () => {
      clickPicker._open({
        flavor: FLAVOR.chooser,
      });
    });

    dropPicker.on('drop', () => {
      element.style.width = '700px';
      element.style.height = '515px';
      element.style['border-style'] = 'none';
      frame.style.opacity = '1';
    });

    // Since the drop event will override CSS properties, we need
    // to retain original values so we can restore them on close.
    const style = window.getComputedStyle(element);
    const { height, width, 'border-style': borderStyle } = style;

    dropPicker.on('close', () => {
      element.style.height = height;
      element.style.width = width;
      element.style['border-style'] = borderStyle;
      if (!this.isDestroyed) {
        dropPicker._open({
          flavor: FLAVOR.dropzone,
        });
      }
      frame.style.opacity = transparentOpacity;
    });
    frame._hasLoadedOnce = true;
  };

  return frame;
};

filePicker._dropzone.prototype.on = function (event, handler) {
  this.dropPicker.on(event, handler);
  this.clickPicker.on(event, handler);
  return this;
};

filePicker._dropzone.prototype.close = function () {
  this.dropPicker.close();
  this.clickPicker.close();
};

filePicker._dropzone.prototype.update = function (opts) {
  this.dropPicker.update(opts);
  this.clickPicker.update(opts);
};

filePicker._dropzone.prototype.destroy = function () {
  this.isDestroyed = true;
  this.dropPicker.destroy();
  this.clickPicker.destroy();
  this.dropPicker = null;
  this.clickPicker = null;
};

filePicker.version = VERSION;

export default filePicker;
