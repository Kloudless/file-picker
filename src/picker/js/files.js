/* eslint-disable */
import ko from 'knockout';
import logger from 'loglevel';

'use strict';

// TODO: better handling of file uploads?
var FileManager = function () {
  this.files = ko.observableArray([]);
  this.current = ko.observable({});
};

// Add a file to upload.
FileManager.prototype.add = function (url, name) {
  logger.debug('Adding file: ', url)
  this.files.push({
    url: url,
    name: name
  });
};

// Cancel current upload.
FileManager.prototype.cancel = function () {
  this.files.remove(function (file) {
    return file.url == this.current().url;
  });
};

// Upload current file. Fire callback
FileManager.prototype.upload = function (location_data, callbacks) {
  if (this.current()) {
    var file = this.current();
    logger.debug('Uploading current file: ', file.url);
  }
};

export default FileManager;
