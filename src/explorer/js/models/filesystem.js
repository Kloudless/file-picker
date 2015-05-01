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
      this.paging = true;
      this.page_size = 1000;

      // default - 'root' is a special file type.
      this.current = ko.observable({
        id: 'root',
        name: 'root',
        type: 'root',
        modified: null,
        size: null,
        friendlySize: null,
        parent_obs: null,
        children: ko.observableArray()
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
          url: config.base_url + '/v0/accounts/' + fs.id + '/folders/root',
          type: 'GET',
          headers: {
            Authorization: 'AccountKey ' + fs.key
          }
        }).done(function(data) {
          var current = fs.current();
          success = true;
          current.can_create_folders = data.can_create_folders;
          current.can_upload_files = data.can_upload_files;
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

      // reset paging and page
      self.page = 1;
      self.paging = true;

      self.getPage(callback);
    };

    Filesystem.prototype.getPage = function(callback) {
      var self = this;
      
      if (callback === undefined) {
        callback = function(){};
      }

      if (!self.paging) {
        callback(null, self.current().children);
        return;
      }
      var page_url = config.base_url + '/v0/accounts/' + self.id + '/folders/' + self.current().id + '/contents';
      page_url += '?page=' + self.page + '&page_size=' + self.page_size;

      logger.debug('Firing page refresh: ', {
        url: page_url,
        type: 'GET',
        headers: {
          Authorization: 'AccountKey ' + self.key
        }
      });

      self.request = $.ajax({
        url: page_url,
        type: 'GET',
        headers: {
          Authorization: 'AccountKey ' + self.key
        }
      }).done(function(data) {
        logger.debug('Received refresh: ', data);

        // replace old values?
        var oldArray;
        if (self.page == 1) {
          oldArray = [];
        } else {
          oldArray = self.current().children();
        }

        if (data.has_next) {
          self.page += 1;
        } else {
          self.paging = false;
        }

        var newArray = data.objects.filter(function(child) {
          // Filter types.
          var extension = child.name.substr(child.name.lastIndexOf('.') + 1);
          logger.debug('Filtering child: ', child.name, extension);

          if (child.type == 'folder' ||
              (((config.types.length === 1 && config.types.indexOf('files') != -1) ||
                (config.types.length === 1 && config.types.indexOf('all') != -1) ||
                (config.types.indexOf(extension.toLowerCase()) != -1) ||
                (config.types.indexOf('') != -1 && child.name.indexOf('.') == -1))
                  && config.flavor == 'chooser')) {
            logger.debug('Child passed type test.');
            return true;
          } else if (config.types.indexOf('folders') != -1 || config.flavor == 'saver') {
            // add grayed out files
            child.type = 'disabled';
            return true;
          }
          logger.debug('Child failed type test.');
          return false;
        }).map(function(child) {
          // Set custom attributes.
          child.parent_obs = self.current();
          if(child.size == null){
            child.friendlySize = "";
          } else {
            child.friendlySize = util.formatSize(child.size);
          }
          return child;
        });

        // add back old values
        ko.utils.arrayPushAll(oldArray, newArray);
        self.current().children(oldArray);

        // sort array
        self.sort();

        logger.debug('Directory updated: ', self.current());

        callback(null, self.current().children);
      }).fail(function(xhr, status, err) {
        logger.info('Refresh failed: ', status, err, xhr);
        if (status != 'abort') {
          // then we have a real problem
          callback(new Error(err), null);
        }
      }).always(function() {
        logger.info('Refresh completed.');

        self.request = null;
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
        if (this.current().type == 'root') {
          return callback(new Error('Attempting to navigate above root.'), null);
        }
        this.path.pop();
        this.current(this.current().parent_obs);
      } else if (next.type == 'folder') {
        var target = this.current().children().reduce(function(a, b) {
          if (b.id == next.id) {
            return b;
          }
          return a;
        }, null);

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
        if (this.current().type == 'root') {
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
        el.modified = null;

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
        url: config.base_url + '/v0/accounts/' + self.id + '/folders/',
        type: 'POST',
        headers: {
          Authorization: 'AccountKey ' + self.key
        },
        data: {
          name: folder_name,
          parent_id: self.current().id
        }
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

    Filesystem.prototype.display = function(files) {
      var self = this;
      self.current().children(files); 
      self.sort();
    };

    Filesystem.prototype.sort = function() {
      var self = this;
      self.current().children.sort(function(left, right) {
        if (left.type == 'folder' && right.type != 'folder') {
          return -1;
        } else if (left.type != 'folder' && right.type == 'folder') {
          return 1;
        } else {
          var lname = left.name.toLowerCase();
          var rname = right.name.toLowerCase();
          return lname == rname ? 0 : (lname < rname ? -1 : 1);
        }
      });
    };

    return Filesystem;
  });
})();
