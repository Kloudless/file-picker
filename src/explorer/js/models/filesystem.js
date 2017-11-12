(function() {
  'use strict';

  // TODO: replace some methods by using knockouts utils library
  // http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html

  define(['vendor/knockout', 'vendor/loglevel', 'jquery', 'config', 'util'],
      function(ko, logger, $, config, util) {
    // Construct a filesystem, which keeps track of file operations for an account and fire a callback on init.
    var Filesystem = function(id, key, callback) {
      this.id = id;
      this.key = key; // This key may change if we need to reconnect.
      this.path = ko.observableArray();
      this.request = null; // The currently active request.
      this.page = 1;
      this.page_size = 1000;
      this.sortOrder = 1;
      this.sortOption = null;

      // default - 'root'
      // This is later replaced with updated metadata.
      this.current = ko.observable({
        id: 'root',
        name: 'root',
        type: 'folder',
        parent_obs: null,
        path: '/',
        children: ko.observableArray(),
      });

      this.cwd = ko.computed(function() {
        var folder = this.current();
        return folder.children();
      }, this);

      // query the root folder for this id to find can_create_folders and
      // can_upload_files
      (function(fs) {
        var success = false;
        var request = $.ajax({
          url: config.getAccountUrl(fs.id, 'storage', '/folders/root'),
          type: 'GET',
          headers: {
            Authorization: fs.key.scheme + ' ' + fs.key.key
          }
        }).done(function(data) {
          var updatedCurrent = fs.filterChildren([data])[0];
          updatedCurrent.children = fs.current().children
          fs.current(updatedCurrent);
          success = true;
        }).fail(function(xhr, status, err) {
          logger.warn('Retrieving root folder failed: ', status, err, xhr);
          callback(new Error("failed to retrieve root folder"), null);
        }).always(function() {
          logger.info('Filesystem construction finished. Refreshing...');
          request = null;
          if (success) {
            fs.refresh(false, callback);
          }
        });
      })(this);
    };

    // This flag indicates that we want to go to the parent folder.
    Filesystem.prototype.PARENT_FLAG = 'PARENT';

    // This method refreshes the current directory, NOT the whole tree.
    // It lets you specify a callback to fire on completion and whether to force refresh.
    // By default, it will NOT force refresh i.e. if the files have already been cached, it will load the cache.
    // TODO: if the current directory doesn't exist, kick all the way up to the root.
    Filesystem.prototype.refresh = function(force, callback) {
      // Default arguments.
      if (force === undefined) {
        force = false;
      }
      if (callback === undefined) {
        callback = function(){};
      }

      var self = this;

      if (self.request !== null) {
        self.request.abort();
      }
      if (!force && self.current().children().length > 0) {
        return callback(null, self.current().children);
      }

      // reset page
      self.page = 1;

      self.getPage(callback);
    };

    Filesystem.prototype.getPage = function(callback) {
      var self = this;

      if (callback === undefined) {
        callback = function(){};
      }

      if (!self.page) {
        callback(null, self.current().children);
        return;
      }

      var page_url = config.getAccountUrl(self.id, 'storage', '/folders/' + self.current().id + '/contents');
      page_url += '?page=' + self.page + '&page_size=' + self.page_size;

      logger.debug('Loading the next page of infinite scroll data.');

      self.request = $.ajax({
        url: page_url,
        type: 'GET',
        headers: {
          Authorization: self.key.scheme + ' ' + self.key.key
        }
      }).done(function(data) {
        logger.debug('Received new data.');

        var currentChildren;
        if (self.page === 1 || self.page === data.next_page) {
          currentChildren = [];
        } else {
          currentChildren = self.current().children();
        }

        self.page = data.next_page;

        // Add filtered children.
        ko.utils.arrayPushAll(currentChildren, self.filterChildren(data.objects));

        self.display(currentChildren);

        logger.debug('Directory updated: ', self.current());

        callback(null, self.current().children);
      }).fail(function(xhr, status, err) {
        logger.info('Refresh failed: ', status, err, xhr);
        if (status != 'abort') {
          // then we have a real problem
          callback(new Error(err), null);
        }
      }).always(function() {
        logger.info('Refresh/pagination completed.');

        self.request = null;
      });
    }

    Filesystem.prototype.display = function(files) {
      // Be sure to call filterChildren on any new objects in
      // files prior to calling this method with files.
      var self = this;
      self.current().children(files);
      self.sort();
    };

    Filesystem.prototype.filterChildren = function(data) {
      var self = this;
      return data.filter(function(child) {
        // Filter types.
        var extension = child.name.substr(child.name.lastIndexOf('.') + 1);
        logger.debug('Filtering child: ', child.name, extension);

        if (child.type == 'folder' ||
            (((config.types.length === 1 && config.types.indexOf('files') != -1) ||
              (config.types.length === 1 && config.types.indexOf('all') != -1) ||
              (config.types.indexOf(extension.toLowerCase()) != -1) ||
              (config.types.indexOf('') != -1 && child.name.indexOf('.') == -1))
             && config.flavor() == 'chooser')) {
          logger.debug('Child passed type test.');
          return true;
        } else if (config.types.indexOf('folders') != -1 || config.flavor() == 'saver') {
          // add grayed out files
          child.type = 'disabled';
          return true;
        }
        logger.debug('Child failed type test.');
        return false;
      }).map(function(child) {
        // Set custom attributes.
        child.parent_obs = self.current();
        if (child.size == null) {
          child.friendlySize = "";
        } else {
          child.friendlySize = util.formatSize(child.size);
        }
        return child;
      });
    }

    // Navigate to a file relative to the current working directory and fire a callback on completion.
    Filesystem.prototype.navigate = function(next, callback) {
      // Default arguments.
      if (callback === undefined) {
        callback = function(){};
      }

      logger.debug('FS Nav: ', next, typeof next == 'string', next == this.PARENT_FLAG, this.PARENT_FLAG);

      if (typeof next == 'string' && next == this.PARENT_FLAG) {
        logger.debug('Shifting to parent...');
        if (this.current().id === 'root') {
          return callback(new Error('Attempting to navigate above root.'), null);
        }
        this.path.pop();
        this.current(this.current().parent_obs);
      } else if (next.type == 'folder') {
        var target = ko.utils.arrayFirst(this.current().children(), function(f) {
          return f.id == next.id;
        });

        if (target === null) {
          return callback(new Error('Target file does not exist.'), null);
        }

        if (target.children === undefined) {
          target.children = ko.observableArray();
        }

        this.path.push(next.name);
        this.current(target);
      }

      return this.refresh(false, callback);
    };

    // Go up a certain number of directories.
    Filesystem.prototype.up = function(count, callback) {
      while (count > 0) {
        if (this.current().id === 'root') {
          return callback(new Error('Attempting to navigate above root.'), null);
        }
        this.path.pop();
        this.current(this.current().parent_obs);
        count--;
      }

      return this.refresh(false, callback);
    };

    Filesystem.prototype.newdir = function() {
      // This function shows an input field for the new folder
      var self = this;
      var list = self.current().children();
      var first = list[0];
      var el = {};

      if (!first || first.type !== 'newfolder') {
        el.name = 'new';
        el.parent_obs = self.current();
        el.type = 'newfolder';
        el.size = null;
        el.friendlySize = null;
        el.modified = null;
        el.path = self.path() ? "/" + self.path().join('/') + "/new" : self.path();

        list.unshift(el);

        self.current().children(list);
      }
    };

    Filesystem.prototype.rmdir = function() {
      // This function removes the input field for the new folder
      var self = this;
      var list = self.current().children();
      var first = list[0];

      if (first.type == 'newfolder') {
        list.shift();
        self.current().children(list);
      }
    };

    Filesystem.prototype.updatedir = function(data) {
      // This function updates the new folder data
      var self = this;
      var list = self.current().children();
      var first = list[0];

      if (first.type == 'newfolder') {
        first.type = 'folder';
        for (var data_key in data) {
          if (data_key === 'parent_obs') continue;
          first[data_key] = data[data_key];
        }
        self.sort();
        return first;
      }
    }

    Filesystem.prototype.mkdir = function(folder_name, callback) {
      var self = this;

      if (callback === undefined) {
        callback = function(){};
      }

      if (self.request !== null) {
        self.request.abort();
      }

      self.request = $.ajax({
        url: config.getAccountUrl(self.id, 'storage', '/folders/'),
        type: 'POST',
        headers: {
          Authorization: self.key.scheme + ' ' + self.key.key
        },
        contentType: 'application/json',
        data: JSON.stringify({
          name: folder_name,
          parent_id: self.current().id
        }),
      }).done(function(data) {
        logger.debug('Create new folder succeeded.');

        callback(null, data);
      }).fail(function(xhr, status, err) {
        logger.debug('Create new folder failed.');

        if (status != 'abort') {
          // then we have a real problem
          callback(new Error(err), null);
        }
      }).always(function() {
        logger.debug('Create new folder completed.');

        self.request = null;
      });
    };

    // Sort by preference
    Filesystem.prototype.sort = function(option) {
      var self = this;

      $(".arrow-down").hide();
      $(".arrow-up").hide();

      if (option === undefined) {
          option = "name";
          self.sortOrder++;
          if (self.sortOption != null) {
            option = self.sortOption;
          }
      }
      self.sortOption = option;

      var reverse = Math.pow(-1, self.sortOrder);
      $("#sort-" + option + "-" + (reverse > 0 ? "up" : "down")).show();

      self.current().children.sort(function(left, right) {
        if (left.type == 'folder' && right.type != 'folder') {
          return -1;
        } else if (left.type != 'folder' && right.type == 'folder') {
          return 1;
        } else {
          var lname = left.name.toLowerCase();
          var rname = right.name.toLowerCase();
          if (option === "name") {
            return lname == rname ? 0 : (lname < rname ? -1*reverse : 1*reverse);
          } else if (option === "recent" && left.modified != right.modified) {
            if (left.modified > right.modified) {
              return 1*reverse;
            } else if (left.modified < right.modified) {
              return -1*reverse;
            }
          } else if (option === "largest" && left.size != right.size) {
            if (left.size > right.size) {
              return 1*reverse;
            } else if (left.size < right.size) {
              return -1*reverse;
            }
          } else {
            return lname == rname ? 0 : (lname < rname ? -1: 1);
          }

        }
      });

      self.sortOrder++;
    };

    return Filesystem;
  });
})();
