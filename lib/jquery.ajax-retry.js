/*
 * jquery.ajax-retry
 * https://github.com/johnkpaul/jquery-ajax-retry
 *
 * Copyright (c) 2012 John Paul
 * Licensed under the MIT license.
 */
(function(factory) {
    if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS
        factory(require('jquery'));
    } else {
      // Browser globals
      factory(jQuery);
    }
})(function($) {
  var DEFAULT_TIMES = 3;

  function defaultDelayStrategy(n) {
    return 1000;
  };

  function getLogger(isDebug){
    return isDebug ? console.log : function() {};
  };
  // enhance all ajax requests with our retry API
  $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
    /**
      @param {Object} opts
        @param {Number} opts.times: maximum number of times to do the ajax
        @param {Array} opts.statusCodes: Array of status codes
        @param {Number} opts.timeout: milliseconds to wait before the next request
        @param {delayCallback} opts.delayStrategy=defaultDelayStrategy
          The callback that returning ms to wait for retrying after
          each failed uploading.
        @param {isAbortedCallback} opts.checkIsAborted
          The callback takes null as input and return boolean value
          to indicate if the request has been aborted or not.
        @param {Boolean} opts._debug: true for showing debug log.
        @param {Boolean} opts._id: task id as log information

      @callback delayCallback
        @param {Number} n-th times to retry.
        @returns {Number} time in milliseconds.
      @callback isAbortedCallback
        @returns {Boolean} the request has been aborted or not.
    */
    jqXHR.retry = function(opts) {
      var debugLog = getLogger(opts._debug);
      if(opts.timeout) {
        this.timeout = opts.timeout;
      }
      if (opts.statusCodes) {
        this.statusCodes = opts.statusCodes;
      }
      if (typeof opts.delayStrategy !== 'function'){
        opts.delayStrategy = defaultDelayStrategy;
      }
      if (typeof opts.times === 'undefined'){
        opts.times = DEFAULT_TIMES;
      }
      if (typeof opts.leftTimes === 'undefined'){
         opts.leftTimes = opts.times - 1;
      }
      
      debugLog(`checkIsAborted: ${typeof opts.checkIsAborted}` )
      return this.pipe(null, pipeFailRetry(this, opts));
    };
  });

  // generates a fail pipe function that will retry `jqXHR` `times` more times
  function pipeFailRetry(jqXHR, opts) {
    var times = opts.times;
    var leftTimes = opts.leftTimes;
    var timeout = jqXHR.timeout;
    var delayStrategy = opts.delayStrategy;
    var debugLog = getLogger(opts._debug);
    var checkIsAborted = opts.checkIsAborted;


    // takes failure data as input, returns a new deferred
    return function(input, status, msg) {
      var ajaxOptions = this;
      var output = new $.Deferred();
      var retryAfter = jqXHR.getResponseHeader('Retry-After');

      // whenever we do make this request, pipe its output to our deferred
      function nextRequest() {
        if (typeof checkIsAborted === 'function' && checkIsAborted()){
          // user clicked cancel while setTimeout waiting for the next retry
          // do not send out the retry ajax
          debugLog(`AJAX task id[${opts._id}] has been cancelled.`);
          output.rejectWith(this, [input, 'abort']);
        } else {
          debugLog(`AJAX task id[${ opts._id }] ` +
            `starts for the ${ times - leftTimes + 1}-th attempt...`);
          $.ajax(ajaxOptions)
            .retry({
              times,
              delayStrategy,
              leftTimes: leftTimes - 1,
              checkIsAborted: opts.checkIsAborted,
              timeout: opts.timeout,
              statusCodes: opts.statusCodes,
              _id: opts._id,
              _debug: opts._debug,
            }).pipe(output.resolve, output.reject);
        }
      }

      debugLog(`AJAX task id[${ opts._id }] ` +
        `failed for the ${ times - leftTimes }-th attempt.`);

      if (leftTimes >= 1 && (!jqXHR.statusCodes ||
          $.inArray(input.status, jqXHR.statusCodes) > -1)) {

        if (typeof checkIsAborted ==='function' && checkIsAborted() ){
          // User clicked cancel during the previous ajax request
          // do not settimeout to retry
          debugLog(`AJAX task id[${opts._id}] has been cancelled.`);
          output.rejectWith(this, [input, 'abort']);

        } else {
          // implement Retry-After rfc
          // http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.37
          if (retryAfter) {
            // it must be a date
            if (isNaN(retryAfter)) {
              timeout = new Date(retryAfter).getTime() - $.now();
            // its a number in seconds
            } else {
              timeout = parseInt(retryAfter, 10) * 1000;
            }
            // ensure timeout is a positive number
            if (isNaN(timeout) || timeout < 0) {
              timeout = jqXHR.timeout;
            }
          }

          if (timeout !== undefined) {
            setTimeout(nextRequest, timeout);
          } else {
            // When timeout is not specified either from opts or from Retry-After,
            // use delayStrategy backoff with retry up to the maximum times.
            // The { times - leftTimes }-th retry
            var delayMs = delayStrategy(times - leftTimes);
            debugLog(`AJAX task id[${opts._id}] ` +
              `the ${ times - leftTimes + 1 }-th attempt ` +
              `will start after ${delayMs} ms.`);
            setTimeout(nextRequest, delayMs);
          }
        }
      } else {
        // no leftTimes left, reject our deferred with the current arguments
        output.rejectWith(this, arguments);
      }

      return output;
    };
  }

});
