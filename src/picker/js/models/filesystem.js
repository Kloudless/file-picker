import $ from 'jquery';
import ko from 'knockout';
import logger from 'loglevel';
import config from '../config';
import util from '../util';

// TODO: replace some methods by using knockouts utils library
// http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html

const DEFAULT_SORT_OPTION = 'name';
const DEFAULT_ROOT_FOLDER_ID = 'root';
const FIRST_PAGE = 1;
const PAGE_SIZE = 1000;

function Filesystem(id, key, callback) {
  this.id = id;
  this.key = key; // This key may change if we need to reconnect.
  this.path = ko.observableArray();
  this.request = null; // The currently active request.
  this.getPageTask = Promise.resolve();
  this.isLoadingNextPage = ko.observable(false);
  this.sortOption = DEFAULT_SORT_OPTION;

  // This is later replaced with updated folder metadata.
  this.current = ko.observable({
    id: null,
    name: null,
    type: 'folder',
    parent_obs: null,
    path: null,
    page: FIRST_PAGE,
    children: ko.observableArray(),
  });

  this.cwd = ko.computed(() => {
    const folder = this.current();
    return folder.children();
  });

  // rootMetadata is stored here for referencing during traversal as well
  // as comparisons when the default root configured changes.
  // It is deliberately not a computed observable so that the state remains
  // unchanged until we set it ourselves, so we can use it for comparisons.
  this.rootMetadata = ko.observable({
    id: config.root_folder_id()[this.id] || DEFAULT_ROOT_FOLDER_ID,
  });

  config.root_folder_id.subscribe((newRootFolderIds) => {
    const newRootFolderId = newRootFolderIds[this.id] || DEFAULT_ROOT_FOLDER_ID;
    if (newRootFolderId !== this.rootMetadata().id) {
      this.rootMetadata({ id: newRootFolderId });
      this._init(callback);
    }
  }, this);

  this._init(callback);
}

/**
 * query the root folder for this id to find can_create_folders and
 * can_upload_files
 */
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
    const updatedCurrent = data;
    updatedCurrent.page = FIRST_PAGE;
    updatedCurrent.children = this.current().children;
    this.current(updatedCurrent);
    this.path.removeAll();

    const {
      children, parent_obs, id, page, ...rest // eslint-disable-line camelcase
    } = this.current();
    // never update root folder ID, in case the returned ID is different
    // and breaks the UI or subscribe() check above.
    this.rootMetadata({ id: rootFolderId, ...rest });

    success = true;
  }).fail((xhr, status, err) => {
    logger.warn('Retrieving root folder failed: ', status, err, xhr);
    callback(new Error('failed to retrieve root folder'), null);
  }).always(() => {
    logger.info('Filesystem construction finished. Refreshing...');
    if (success) {
      this.refresh(true, callback);
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
    this.rmdir();
    this.sort();
    callback(null, this.current().children);
    return;
  }

  // reset page
  this.current().page = FIRST_PAGE;
  this.getPage(callback);
};

/**
 * Return a promise that makes a get folder content request.
 * If the request success, reject if errors occur.
 */
Filesystem.prototype._getPage = function _getPage() {
  return new Promise((resolve, reject) => {
    const current = this.current();
    // Resolve if there is no next page.
    if (!current.page) {
      resolve();
      return;
    }

    this.isLoadingNextPage(current.page !== FIRST_PAGE);

    let url = config.getAccountUrl(
      this.id, 'storage', `/folders/${current.id}/contents`,
    );
    url += `?page=${current.page}&page_size=${PAGE_SIZE}`;

    logger.debug('Loading the next page of infinite scroll data.');

    this.request = $.ajax({
      url,
      type: 'GET',
      headers: {
        Authorization: `${this.key.scheme} ${this.key.key}`,
      },
    }).always(() => {
      logger.info('Refresh/pagination completed.');
      this.isLoadingNextPage(false);
      this.request = null;
    }).done((data) => {
      logger.debug('Received new data.');

      let newChildren;
      let newLoaded;
      if (current.page === FIRST_PAGE || current.page === data.next_page) {
        newChildren = [];
        // If there're no old items, we don't need to highlight new items to
        // distinguish them.
        newLoaded = false;
      } else {
        newChildren = current.children();
        // set the old items newLoaded to false
        newChildren = ko.utils.arrayMap(newChildren, (obj) => {
          if (obj.newLoaded === undefined) {
            obj.newLoaded = ko.observable(false);
          }
          obj.newLoaded(false);
          return obj;
        });

        newLoaded = true;
      }

      current.page = data.next_page;

      // Add parent_obs and friendlySize
      data.objects = data.objects.map((obj) => {
        obj.parent_obs = this.current();
        obj.friendlySize = util.getFriendlySize(obj.size);
        obj.newLoaded = ko.observable(newLoaded);
        return obj;
      });

      ko.utils.arrayPushAll(newChildren, data.objects);

      // Don't display but just update children in case that the current folder
      // is changed.
      if (current.id === this.current().id) {
        this.display(newChildren);
      } else {
        current.children(newChildren);
      }

      logger.debug('Directory updated: ', this.current());
      /**
       * TODO: It's a bit confusing that we're not sure whether the next task or
       * the always callback will be executed first if we call resolve() here
       * instead of in the always callback method.
       * Using async/await or refactoring to the following pattern may help:
       *  $.ajax(...).then(doneFunc, failFunc).then((err) => {
       *    // resolve() or reject() here.
       *  })
       */
      resolve();
    }).fail((xhr, status, err) => {
      logger.info('Refresh failed: ', status, err, xhr);
      if (status === 'abort') {
        // Ignore this case.
        resolve();
      } else {
        reject(new Error(err));
      }
    });
  });
};

Filesystem.prototype.getPage = function getPage(callback = () => {}) {
  if (this.isLoadingNextPage()) {
    // Don't trigger multiple _getPage() when loading the next page.
    this.getPageTask = this.getPageTask.then(() => callback(null));
  } else {
    // Ensure there is only one request on the fly.
    this.getPageTask = this.getPageTask
      .then(() => this._getPage())
      .then(() => callback(null))
      .catch(callback);
  }
};

// eslint-disable-next-line func-names
Filesystem.prototype.display = function (files) {
  // Be sure to call filterChildren on any new objects in
  // files prior to calling this method with files.
  this.current().children(files);
  this.sort();
};

// Treat a file as no extension if the extension does not match the format
const PATTERN_EXT = /\.([\w-]+)$/;
const getExt = (filename) => {
  const result = filename.match(PATTERN_EXT);
  return result ? result[1] : '';
};

/**
 * Check if the file/folder is disabled or not based on config.types().
 * Setting 'excludeDisabled' to true to filter out the disabled items.
 * @param {Array<Object>} data Array of files and folders' metadata.
 * @param {Boolean} excludeDisabled Whether to filter out the disabled items.
 *  Defaults to 'false'.
 */
// eslint-disable-next-line func-names
Filesystem.prototype.filterChildren = function (data, excludeDisabled = false) {
  const copyToUploadLocation = !!config.copy_to_upload_location();
  const createDirectLink = config.link() && config.link_options().direct;
  const result = data.map((child) => {
    const { type: childType, mime_type: mimeType, name } = child;
    const ext = getExt(name);
    const allowedTypes = config.types();
    const allowedMIMETypes = config.mimeTypes;

    logger.debug('Filtering child: ', name, ext);

    if (child.disabled === undefined) {
      child.disabled = ko.observable(false);
    }
    child.disabled(false);

    // Type checking.
    if (childType === 'file') {
      // This relies on that allowedTypes is impossible to be empty or contain
      // duplicated entries.
      if (allowedTypes.length === 1 && allowedTypes[0] === 'folders') {
        child.disabled(true);
      }
      if (!allowedTypes.includes('files') && !allowedTypes.includes(ext)
          && !allowedMIMETypes.includes(mimeType)) {
        child.disabled(true);
      }
      // Downloadable checking: the file must be downloadable in case of copy
      // to upload location and create direct link.
      if (!child.downloadable && (copyToUploadLocation || createDirectLink)) {
        child.disabled(true);
      }
    }
    if (childType === 'folder' && !allowedTypes.includes('folders')) {
      child.disabled(true);
    }
    return child;
  });
  return excludeDisabled ? result.filter(e => !e.disabled()) : result;
};

/**
 * Navigate to a file relative to the current working directory and fire a
 * callback on completion.
 */
// eslint-disable-next-line func-names
Filesystem.prototype.navigate = function (id, callback = () => {}) {
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

    if (target.page === undefined) {
      target.page = FIRST_PAGE;
    }

    this.path.push(target.name);
    this.current(target);
  }

  return this.refresh(false, callback);
};

// Go up a certain number of directories.
// eslint-disable-next-line func-names
Filesystem.prototype.up = function (count, callback) {
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
  const list = this.current().children();
  const first = list[0];
  const el = {};

  if (!first || first.type !== 'newfolder') {
    el.name = 'new';
    el.parent_obs = this.current();
    el.type = 'newfolder';
    el.size = null;
    el.modified = null;
    el.path = this.path() ? `/${this.path().join('/')}/new` : this.path();
    el.friendlySize = util.getFriendlySize(el.size);
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

/**
 * Sort this.current().children() by this.sortOption and current sorting
 * direction.
 * The priority:
 * 1. The item whose id is `newfolder`.
 * 2. The item whose type is `folder`.
 * 3. Compare by this.sortOption.
 * 4. Compare by name.
 */
// eslint-disable-next-line func-names
Filesystem.prototype.sort = function (option) {
  const self = this;
  const _option = option || self.sortOption;
  if (!_option) {
    return;
  }
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
    if (left.type === 'newfolder') {
      return -1;
    }
    if (right.type === 'newfolder') {
      return 1;
    }
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
