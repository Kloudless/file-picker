import $ from 'jquery';
import ko from 'knockout';
import logger from 'loglevel';
import config from '../config';
import util from '../util';

// TODO: replace some methods by using knockouts utils library
// http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html

function Filesystem(id, key, callback, rootFolderId = 'root') {
  this.id = id;
  this.key = key; // This key may change if we need to reconnect.
  this.path = ko.observableArray();
  this.request = null; // The currently active request.
  this.page = 1;
  this.page_size = 1000;
  this.sortOption = null;

  // This is later replaced with updated folder metadata.
  this.current = ko.observable({
    id: null,
    name: null,
    type: 'folder',
    parent_obs: null,
    path: null,
    children: ko.observableArray(),
  });

  // Some logic requires access root folder metadata while this.current points
  // to other folders. This is set after getting metadata from API below.
  this.rootMetadata = ko.observable({
    id: rootFolderId,
  });

  this.cwd = ko.computed(() => {
    const folder = this.current();
    return folder.children();
  });

  this._init(callback); // eslint-disable-line no-underscore-dangle
}

/**
 * query the root folder for this id to find can_create_folders and
 * can_upload_files
 */
// eslint-disable-next-line no-underscore-dangle
Filesystem.prototype._init = function _init(callback) {
  const rootFolderId = this.rootMetadata().id;
  let success = false;
  return $.ajax({
    url: config.getAccountUrl(this.id, 'storage', `/folders/${rootFolderId}`),
    type: 'GET',
    headers: {
      Authorization: `${this.key.scheme} ${this.key.key}`,
    },
  }).done((data) => {
    const updatedCurrent = this.filterChildren([data])[0];
    updatedCurrent.children = this.current().children;
    this.current(updatedCurrent);
    const {
      children, parent_obs, id, ...rest // eslint-disable-line camelcase
    } = this.current();
    // never update root folder ID, in case the returned ID is different
    // and break the UI
    this.rootMetadata({ id: rootFolderId, ...rest });
    success = true;
  }).fail((xhr, status, err) => {
    logger.warn('Retrieving root folder failed: ', status, err, xhr);
    callback(new Error('failed to retrieve root folder'), null);
  }).always(() => {
    logger.info('Filesystem construction finished. Refreshing...');
    if (success) {
      this.refresh(false, callback);
    }
  });
};

// This flag indicates that we want to go to the parent folder.
Filesystem.prototype.PARENT_FLAG = 'PARENT';

/**
 * This method refreshes the current directory, NOT the whole tree.
 * It lets you specify a callback to fire on completion and whether to force
 * refresh.
 * By default, it will NOT force refresh i.e. if the files have already been
 * cached, it will load the cache.
 * TODO: if the current directory doesn't exist, kick all the way up to the
 * root.
 */
// eslint-disable-next-line func-names
Filesystem.prototype.refresh = function (force = false, callback = () => {}) {
  if (this.request !== null) {
    this.request.abort();
  }
  if (!force && this.current().children().length > 0) {
    callback(null, this.current().children);
    return;
  }

  // reset page
  this.page = 1;
  this.getPage(callback);
};

// eslint-disable-next-line func-names
Filesystem.prototype.getPage = function (callback = () => {}) {
  // If there is no next page or the previous request hasn't done yet.
  // Return the current children.
  if (!this.page || this.request) {
    callback(null, this.current().children);
    return;
  }

  let url = config.getAccountUrl(
    this.id, 'storage', `/folders/${this.current().id}/contents`,
  );
  url += `?page=${this.page}&page_size=${this.page_size}`;

  logger.debug('Loading the next page of infinite scroll data.');

  this.request = $.ajax({
    url,
    type: 'GET',
    headers: {
      Authorization: `${this.key.scheme} ${this.key.key}`,
    },
  }).done((data) => {
    logger.debug('Received new data.');

    let currentChildren;
    if (this.page === 1 || this.page === data.next_page) {
      currentChildren = [];
    } else {
      currentChildren = this.current().children();
    }

    this.page = data.next_page;

    // Add filtered children.
    ko.utils.arrayPushAll(currentChildren, this.filterChildren(data.objects));

    this.display(currentChildren);

    logger.debug('Directory updated: ', this.current());

    callback(null, this.current().children);
  }).fail((xhr, status, err) => {
    logger.info('Refresh failed: ', status, err, xhr);
    if (status !== 'abort') {
      // then we have a real problem
      callback(new Error(err), null);
    }
  }).always(() => {
    logger.info('Refresh/pagination completed.');

    this.request = null;
  });
};

// eslint-disable-next-line func-names
Filesystem.prototype.display = function (files) {
  // Be sure to call filterChildren on any new objects in
  // files prior to calling this method with files.
  this.current().children(files);
  this.sort();
};

/**
 * Attach disabled and friendlySize attributes to the file/folder metadata.
 * Setting 'excludeDisabled' to true to filter out the disabled items.
 * @param {Array<Object>} data Array of files and folders' metadata.
 * @param {Boolean} excludeDisabled Whether to filter out the disabled items.
 *  Defaults to 'false'.
 */
// eslint-disable-next-line func-names
Filesystem.prototype.filterChildren = function (data, excludeDisabled = false) {
  const allowedTypes = config.types();
  const copyToUploadLocation = !!config.copy_to_upload_location();
  const createDirectLink = config.link() && config.link_options().direct;
  const result = data.map((child) => {
    const { type: childType, name } = child;
    const ext = name.includes('.') ?
      name.substr(name.lastIndexOf('.') + 1).toLowerCase() : '';

    logger.debug('Filtering child: ', name, ext);

    if (childType === 'file') {
      // Type checking.
      if (!allowedTypes.some(t => t !== 'folders')) {
        child.disabled = true;
      }
      if (!allowedTypes.includes('files') && !allowedTypes.includes(ext)) {
        child.disabled = true;
      }
      // Downloadable checking: the file must be downloadable in case of copy
      // to upload location and create direct link.
      if (!child.downloadable && (copyToUploadLocation || createDirectLink)) {
        child.disabled = true;
      }
    }
    if (childType === 'folder' && !allowedTypes.includes('folders')) {
      child.disabled = true;
    }
    // Set custom attributes.
    child.parent_obs = this.current();
    if (child.size == null) {
      child.friendlySize = '';
    } else {
      child.friendlySize = util.formatSize(child.size);
    }
    return child;
  });
  return excludeDisabled ? result.filter(e => !e.disabled) : result;
};

/**
 * Navigate to a file relative to the current working directory and fire a
 * callback on completion.
 */
// eslint-disable-next-line func-names
Filesystem.prototype.navigate = function (id, callback = () => {}) {
  this.clearSort();

  logger.debug('FS Nav: ', id);

  if (id === this.PARENT_FLAG) {
    logger.debug('Shifting to parent...');
    if (this.current().id === this.rootMetadata().id) {
      return callback(new Error('Attempting to navigate above root.'), null);
    }
    this.path.pop();
    this.current(this.current().parent_obs);
  } else {
    const target = ko.utils.arrayFirst(
      this.current().children(), f => f.id === id && f.type === 'folder',
    );

    if (target === null) {
      return callback(new Error('Target file does not exist.'), null);
    }

    if (target.children === undefined) {
      target.children = ko.observableArray();
    }

    this.path.push(target.name);
    this.current(target);
  }

  return this.refresh(false, callback);
};

// Go up a certain number of directories.
// eslint-disable-next-line func-names
Filesystem.prototype.up = function (count, callback) {
  this.clearSort();
  while (count > 0) {
    if (this.current().id === this.rootMetadata().id) {
      return callback(new Error('Attempting to navigate above root.'), null);
    }
    this.path.pop();
    this.current(this.current().parent_obs);
    count -= 1; // eslint-disable-line no-param-reassign
  }

  return this.refresh(false, callback);
};

// eslint-disable-next-line func-names
Filesystem.prototype.newdir = function () {
  // This function shows an input field for the new folder
  this.clearSort();
  const list = this.current().children();
  const first = list[0];
  const el = {};

  if (!first || first.type !== 'newfolder') {
    el.name = 'new';
    el.parent_obs = this.current();
    el.type = 'newfolder';
    el.size = null;
    el.friendlySize = null;
    el.modified = null;
    el.path = this.path() ? `/${this.path().join('/')}/new` : this.path();

    list.unshift(el);

    this.current().children(list);
  }
};

// eslint-disable-next-line func-names
Filesystem.prototype.rmdir = function () {
  // This function removes the input field for the new folder
  const list = this.current().children();
  if (list.length > 0) {
    const first = list[0];
    if (first.type === 'newfolder') {
      list.shift();
      this.current().children(list);
    }
  }
};

// eslint-disable-next-line func-names, consistent-return
Filesystem.prototype.updatedir = function (data) {
  // This function updates the new folder data
  const list = this.current().children();
  const first = list[0];

  if (first.type === 'newfolder') {
    const { parent_obs, ...rest } = data; // eslint-disable-line camelcase
    Object.assign(first, { type: 'folder', ...rest });
    this.sort();
    return first;
  }
};

// eslint-disable-next-line func-names
Filesystem.prototype.mkdir = function (folderName, callback = () => {}) {
  this.clearSort();

  if (this.request !== null) {
    this.request.abort();
  }

  this.request = $.ajax({
    url: config.getAccountUrl(this.id, 'storage', '/folders/'),
    type: 'POST',
    headers: {
      Authorization: `${this.key.scheme} ${this.key.key}`,
    },
    contentType: 'application/json',
    data: JSON.stringify({
      name: folderName,
      parent_id: this.current().id,
    }),
  }).done((data) => {
    logger.debug('Create new folder succeeded.');

    callback(null, data);
  }).fail((xhr, status, err) => {
    logger.debug('Create new folder failed.');

    if (status !== 'abort') {
      // then we have a real problem
      callback(new Error(err), null);
    }
  }).always(() => {
    logger.debug('Create new folder completed.');
    this.request = null;
  });
};

// eslint-disable-next-line func-names
Filesystem.prototype.clearSort = function () {
  this.sortOption = null;
  $('.icon__sort').removeClass('icon__sort--asc icon__sort--desc');
};

// Sort by preference
// eslint-disable-next-line func-names
Filesystem.prototype.sort = function (option) {
  const self = this;
  // eslint-disable-next-line no-underscore-dangle
  const _option = option || self.sortOption || 'name';
  const reverse = !!option;
  self.sortOption = _option;

  const element = $(`#sort-${_option}`);
  let direction = 'asc';
  if (reverse && element.hasClass('icon__sort--asc')) {
    direction = 'desc';
  } else if (!reverse && element.hasClass('icon__sort--desc')) {
    direction = 'desc';
  }
  $('.icon__sort').removeClass('icon__sort--asc icon__sort--desc');
  element.addClass(`icon__sort--${direction}`);

  const factor = direction === 'asc' ? 1 : -1;
  self.current().children.sort((left, right) => {
    if (left.type === 'folder' && right.type !== 'folder') {
      return -1;
    } if (left.type !== 'folder' && right.type === 'folder') {
      return 1;
    }
    const lname = left.name.toLowerCase();
    const rname = right.name.toLowerCase();
    if (_option === 'name') {
      if (lname === rname) {
        return 0;
      }
      return lname < rname ? -1 * factor : 1 * factor;
    }
    if (_option === 'recent' && left.modified !== right.modified) {
      return left.modified > right.modified ? 1 * factor : -1 * factor;
    }
    if (_option === 'largest' && left.size !== right.size) {
      return left.size > right.size ? 1 * factor : -1 * factor;
    }
    if (lname === rname) {
      return 0;
    }
    return lname < rname ? -1 : 1;
  });
};

export default Filesystem;
