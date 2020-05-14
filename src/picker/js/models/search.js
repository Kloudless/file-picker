/* eslint-disable */
import $ from 'jquery';
import logger from 'loglevel';
import config from '../config';
import util from '../util';

'use strict';

//Create a search object
var Search = function (account, key, query, rootFolderId = 'root') {
  this.account = account;
  this.key = key;
  this.q = query;
  this.results = null;
  this.request = null;
  this.rootFolderId = rootFolderId;
};

Search.prototype.search = function (callback, errback) {
  var self = this;

  let searchUrl = `/search/?q=${self.q}`;
  if (self.rootFolderId !== 'root') {
    searchUrl += `&parents=${self.rootFolderId}`;
  }

  self.request = $.ajax({
    url: config.getAccountUrl(self.account, 'storage', searchUrl),
    type: 'GET',
    headers: {
      Authorization: self.key.scheme + ' ' + self.key.key
    },
    success: function (data) {
      self.results = data;
      logger.debug('[Account ' + self.account + '] Search results on ',
        self.q, ': ', self.results);
      self.results.objects = self.results.objects.map((obj)=>{
        obj.friendlySize = util.getFriendlySize(obj.size);
        return obj;
      });
      if (callback) callback();
    },
    error: function () {
      logger.error('[Account ' + self.account + '] Search request failed.');
      if (errback) errback();
    },
    datatype: 'json'
  })
};

export default Search;
