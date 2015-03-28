/**
 * Define the module and the interface with which developers interact.
 */
(function() {
  'use strict';

  // Element class helper methods
  function addClass(el, newClassName){
    el.className += ' ' + newClassName;
  }

  function removeClass(el, removeClassName){
      var elClass = el.className;
      while(elClass.indexOf(removeClassName) != -1) {
          elClass = elClass.replace(removeClassName, '');
          elClass = elClass.trim();
      }
      el.className = elClass;
  }

  function isMobile() {
    return ( navigator.userAgent.match(/(iPad|iPhone|iPod|android|Android)/g) ? true : false )
  }

  var FX = {
    easing: {
      linear: function(progress) {
        return progress;
      },
      quadratic: function(progress) {
        return Math.pow(progress, 2);
      }
    },
    animate: function(options) {
      var start = new Date;
      var id = setInterval(function() {
        var timePassed = new Date - start;
        var progress = timePassed / options.duration;
        if (progress > 1) {
          progress = 1;
        }
        options.progress = progress;
        var delta = options.delta(progress);
        options.step(delta);
        if (progress == 1) {
          clearInterval(id);
          if(typeof(options.complete) != "undefined") {
            options.complete();
          }
        }
      }, options.delay || 10);
    },
    fadeOut: function(element, options) {
      var to = 1;
      this.animate({
        duration: options.duration,
        delta: function(progress) {
          progress = this.progress;
          return FX.easing.quadratic(progress);
        },
        complete: options.complete,
        step: function(delta) {
          element.style.opacity = to - delta;
        }
      });
    },
    fadeIn: function(element, options) {
      var to = 0;
      this.animate({
        duration: options.duration,
        delta: function(progress) {
          progress = this.progress;
          return FX.easing.quadratic(progress);
        },
        complete: options.complete,
        step: function(delta) {
          element.style.opacity = to + delta;
        }
      });
    }
  };
  window.FX = FX;

  // For now, we don't need to worry about having more than one independent widget.
  // When we do, we can namespace postMessages per widget and use system time to salt an id hash.

  if (window.Kloudless === undefined) {
    window.Kloudless = {};
  }

  window.Kloudless.explorerUrl = EXPLORER_URL;

  // Keep track of all frames and explorers
  window.Kloudless._frames = {};
  window.Kloudless._explorers = {};
  window.Kloudless._queuedAction = {};
  var frames = window.Kloudless._frames;
  var explorers = window.Kloudless._explorers;
  var queuedAction = window.Kloudless._queuedAction;
  var shadowDiv = null;
  // Add iframe styling.
  var style = document.createElement('style');
  var loaderCSS = LOADER_CSS;
  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = loaderCSS;
  } else {
    style.appendChild(document.createTextNode(loaderCSS));
  }
  document.getElementsByTagName('head')[0].appendChild(style);

  // Initialise an iframe.
  var initialise_frame = function(options) {
    var exp_id = Math.floor(Math.random() * Math.pow(10, 12));
    var frame = document.createElement('iframe');

    if (isMobile()) frame.setAttribute('scrolling', 'no');
    frame.setAttribute('class', 'kloudless-modal');
    frame.setAttribute('src', window.Kloudless.explorerUrl + '?' +
      'app_id=' + options.app_id +
      '&exp_id=' + exp_id +
      '&flavor=' + options.flavor +
      '&origin=' + encodeURIComponent(window.location.protocol + '//' + window.location.host) +
      '&multiselect=' + options.multiselect +
      '&link=' + options.link +
      '&direct_link=' + options.direct_link +
      '&computer=' + options.computer +
      '&copy_to_upload_location=' + options.copy_to_upload_location +
      '&services=' + JSON.stringify(options.services) +
      '&persist=' + JSON.stringify(options.persist) +
      '&account_key=' + options.account_key +
      '&create_folder=' + options.create_folder +
      '&types=' + JSON.stringify(options.types));
    frame.style.display = 'none';
    frames[exp_id] = frame;

    document.getElementsByTagName('body')[0].appendChild(frame);
    if (!shadowDiv){
      var div = document.createElement('div');
      shadowDiv = document.getElementsByTagName('body')[0].appendChild(div);
      addClass(shadowDiv, "shadowDiv");
    }
    return exp_id;
  };

  // Common file widget methods.
  window.Kloudless._fileWidget = function(options) {
    this._setOptions(options);
    this.handlers = {};
  };

  // Set options.
  window.Kloudless._fileWidget.prototype._setOptions = function(options) {
    options = options || {};
    if (!options.app_id) {
      throw new Error('You need to specify an app ID.');
    }

    this.app_id = options.app_id;
    this.exp_id = options.exp_id;

    // These don't need to be passed for query variables
    this.flavor = (options.flavor === undefined) ? 'chooser' : options.flavor;
    this.multiselect = (options.multiselect === undefined) ? false : options.multiselect;
    this.link = (options.link === undefined) ? true : options.link;
    this.direct_link = (options.direct_link === undefined) ? false : options.direct_link;
    this.computer = (options.computer === undefined) ? false : options.computer;
    this.copy_to_upload_location = ((options.copy_to_upload_location == undefined) ?
                                    false : options.copy_to_upload_location);
    this.create_folder = (options.create_folder === undefined) ? true : options.create_folder;
    this.account_key = (options.account_key === undefined) ? false : options.account_key;
    this.persist = (options.persist === undefined) ? "local" : options.persist;
    this.services = options.services || null;
    this.files = options.files || [];
    this.types = options.types || [];
    if (!(this.types instanceof Array)) {
      this.types = [this.types];
    }
    this.types = this.types.map(function(type) {
      return type.substr(type.lastIndexOf('.') + 1);
    });

    return this;
  };

  // Define handlers. New handlers will override pre-existing ones.
  window.Kloudless._fileWidget.prototype.on = function(event, handler) {
    if (this.handlers[event] === undefined)
      this.handlers[event] = [];
    this.handlers[event].push(handler);
    return this;
  };

  // Fire an event handler. Called by the message listeners.
  window.Kloudless._fileWidget.prototype._fire = function(event, data) {
    var self = this;
    if(["success", "cancel"].indexOf(event) != -1) {
      self.close();
    }

    if (self.handlers[event] !== undefined) {
      for (var i=0; i < self.handlers[event].length; i++) {
        (function(handler) {
          window.setTimeout(function(){
            handler.call(self, data);
          }, 0);
        })(self.handlers[event][i])
      }
    }

    return self;
  };

  window.Kloudless.explorer = function(options) {
    // first step is to return a new object
    var exp = new window.Kloudless._explorer(options);

    exp.on('load', function() {
      // TODO: INIT post message with all config variables
      exp.message('INIT', null);

      exp.loaded = true;
      if (queuedAction[exp.exp_id]) {
        var method = queuedAction[exp.exp_id];
        queuedAction[exp.exp_id] = null;
        method.apply(exp);
      }
    });

    var id = initialise_frame({
      app_id: exp.app_id,
      exp_id: exp.exp_id,
      flavor: exp.flavor,
      multiselect: exp.multiselect,
      link: exp.link,
      direct_link: exp.direct_link,
      computer: exp.computer,
      copy_to_upload_location: exp.copy_to_upload_location,
      account_key: exp.account_key,
      services: exp.services,
      persist: exp.persist,
      types: exp.types,
      create_folder: exp.create_folder,
    });
    exp.exp_id = id;

    if (options.keys) {
      exp.keys = options.keys;
    }

    explorers[exp.exp_id] = exp;

    return exp;
  };

  // Construct the explorer.
  window.Kloudless._explorer = function(options) {
    window.Kloudless._fileWidget.call(this, options);
  };
  window.Kloudless._explorer.prototype = Object.create(window.Kloudless._fileWidget.prototype);
  window.Kloudless._explorer.prototype.constructor = window.Kloudless._explorer;
  Object.defineProperty(window.Kloudless._explorer.prototype, 'constructor', {
    enumerable: false,
    value: window.Kloudless._explorer
  });

  // Open the chooser
  window.Kloudless._explorer.prototype.choose = function() {
    var self = this;

    if (!self.loaded) {
      queuedAction[self.exp_id] = self.choose;
      return;
    }

    self._open({
      flavor: 'chooser',
    });

    return self;
  };

  // Open the saver
  window.Kloudless._explorer.prototype.save = function(files) {
    var self = this;

    if (!self.loaded) {
      queuedAction[self.exp_id] = self.save;
      return;
    }

    // Need to have at least 1 file to save
    if (files.length < 1 && self.files.length < 1) {
      console.log('No files to save');
      return;
    }

    // Send over files inside the options or those sent with save()
    self._open({
      flavor: 'saver',
      files: self.files.concat(files)
    });

    return self;
  };

  window.Kloudless._explorer.prototype._open = function(data) {
    var self = this;
    var body = document.getElementsByTagName("body")[0];

    self.message('DATA', data);

    if (self.keys) {
      self.message('DATA', {
        keys: self.keys,
      });
    }

    // Store the last scrollTop value so we can reset it when the explorer closes
    window.Kloudless._fileWidget['lastScrollTop'] = body.scrollTop;
    // Then scroll to the top of the file explorer after it's set
    // if the user is mobile
    if (isMobile()) {
      body.scrollTop = 0;
    }

    frames[self.exp_id].style.display = 'block';
    frames[self.exp_id].style.opacity = 0;


    addClass(body, "kfe-active");

    FX.fadeIn(frames[self.exp_id], {
      duration: 200
    });

    shadowDiv.style.display = 'block';

    self._fire('open');


    return self;
  };

  // Close the explorer
  window.Kloudless._explorer.prototype.close = function() {
    var self = this;
    var body = document.getElementsByTagName("body")[0];

    if (!self.loaded) {
      queuedAction[self.exp_id] = self.close;
      return;
    }

    removeClass(body, "kfe-active");

    if(typeof(window.Kloudless._fileWidget['lastScrollTop']) != "undefined") {
      if(isMobile) {
        body.scrollTop = window.Kloudless._fileWidget['lastScrollTop'];
      }

    shadowDiv.style.display = 'none';

      FX.fadeOut(frames[self.exp_id],{
        duration: 200,
        complete: function() {
          frames[self.exp_id].style.display = 'none';
        }
      });
    }

    self._fire('close');
  }

  // Send a message to the explorer frame
  window.Kloudless._explorer.prototype.message = function(action, data) {
    var self = this;
    frames[self.exp_id].contentWindow.postMessage(JSON.stringify({
      action: action,
      data: data
    }), window.Kloudless.explorerUrl);

    // console.log('Explorer message sent.');
  }

  // Bind the file exploring dialogue to an element.
  window.Kloudless._explorer.prototype.choosify = function(element) {
    var self = this;
    if (element instanceof Array) {
      for (var i = 0; i < element.length; i++) {
        var el = element[i];
        el.addEventListener('click', function() {
          self.choose();
        });
      }
    } else if (window.jQuery !== undefined && element instanceof window.jQuery) {
      for (var i = 0; i < element.length; i++) {
        var el = element.get(i);
        el.addEventListener('click', function() {
          self.choose();
        });
      }
    } else {
      element.addEventListener('click', function() {
        self.choose();
      });
    }
    return this;
  };

  // Bind the file exploring dialogue to an element.
  window.Kloudless._explorer.prototype.savify = function(element, files) {
    var self = this;
    if (!files) {
      files = [];
    }

    if (element instanceof Array) {
      for (var i = 0; i < element.length; i++) {
        el.addEventListener('click', function() {
          self.save(files);
        });
      }
    } else if (window.jQuery !== undefined && element instanceof window.jQuery) {
      for (var i = 0; i < element.length; i++) {
        var el = element.get(i);
        el.addEventListener('click', function() {
          self.save(files);
        });
      }
    } else {
      element.addEventListener('click', function() {
        self.save(files);
      });
    }
    return this;
  }
})();
