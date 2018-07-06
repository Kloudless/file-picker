(function() {
  'use strict';

  define(['jquery', 'text!config.json', 'vendor/knockout', 'localization',
          // Imports below don't need to be assigned to variables.
          'polyfills'],
  function($, config_text, ko, localization) {

    var get_query_variable = function(name) {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
          results = regex.exec(location.search);
      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    var config = JSON.parse(config_text);

    Object.assign(config, {
      exp_id: get_query_variable('exp_id'),
      app_id: get_query_variable('app_id'),
      origin: get_query_variable('origin'),
      custom_css: get_query_variable('custom_css'),
      // data options move to post messaging
      flavor: ko.observable(get_query_variable('flavor')),
      multiselect: JSON.parse(get_query_variable('multiselect')),
      link: JSON.parse(get_query_variable('link')),
      link_options: ko.observable({}),
      account_management: ko.observable(true),
      retrieve_token: ko.observable(),
      computer: ko.observable(
        JSON.parse(get_query_variable('computer')) ||
          get_query_variable('flavor') === 'dropzone'),
      services: JSON.parse(get_query_variable('services')),
      all_services: ko.observableArray().extend({
        // We want the initial load to trigger one run of initialization
        // logic only.
        rateLimit: 500
      }),
      persist: JSON.parse(get_query_variable('persist')),
      types: JSON.parse(get_query_variable('types')).map(function(str) {
        /**
         * Make sure all types are lowercase since we do a case-insensitive
         * search by lowercasing the search key and using types#indexOf.
         */
        return str.toLowerCase();
      }),
      user_data: ko.observable(), // Get asynchronously.
      copy_to_upload_location: JSON.parse(get_query_variable('copy_to_upload_location')),
      api_version: get_query_variable('api_version'),
      upload_location_account: ko.observable(),
      upload_location_folder: ko.observable(),
      uploads_pause_on_error: ko.observable(true),
      upload_location_uri: ko.observable(get_query_variable('upload_location_uri')),
      create_folder: JSON.parse(get_query_variable('create_folder')),
      chunk_size: 5*1024*1024,
      locale: ko.observable('en'),

      // b/w compatibility
      account_key: JSON.parse(get_query_variable('account_key')),
    });

    if (config.debug) {
        window.config = config;
    }

    if (!config.api_version) {
      config.api_version = 'v1';
      if (config.account_key) {
        // Also forced to v0 in app.js if keys are provided.
        config.api_version = 'v0';
      }
    }

    config.update = function (data) {
      var configKeys = Object.keys(config);

      $.each(data, function(k, v) {
        if (configKeys.indexOf(k) === -1)
          return;

        // Ignore setting non-observables as that behavior is not expected
        // and the rest of the app cannot respond to it.
        if (typeof config[k] === 'function' && config[k].notifySubscribers) {
          // This is a ko.observable
          config[k](v);
        }
      });
    };
    /*
       *Check custom cc and include
       */
    var custom_css_include = function () {
      if (String(config.custom_css) !== "false" && config.user_data().trusted) {
        if ("//" === config.custom_css.substring(0, 2)) {
          config.custom_css = config.origin.split("/")[0] + config.custom_css;
        } else if (!config.custom_css.match(/^https?:/)) {
          config.custom_css = config.origin.replace(/\/+$/, "") + "/"
            + config.custom_css.replace(/^\/+/, "");
        }

        var expression = /^https?:\/\/\w[\.\w\-]*(:[0-9]+)?[^\s<>'"]*$/;
        var regex = new RegExp(expression);
        if (config.custom_css.match(regex)) {
          var cssId = 'custom_style';
          if (!document.getElementById(cssId)) {
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = config.custom_css;
            link.media = 'all';
            head.appendChild(link);
          } else {
            document.getElementById(cssId).href = config.custom_css;
          }
        } else {
          window.console.log("Custom Style link incorrect format: "
            + config.custom_css);
        }
      }
    };
    
    /*
     * Get user_data
     */
    var retrieveConfig = function() {
      var query_params = {app_id: config.app_id}
      if (config.account_key || config.retrieve_token()
          || String(config.custom_css) !== "false") {
        // Only do origin check if we need to.
        query_params['origin'] = config.origin;
      }
      if (config.upload_location_uri()) {
        query_params['upload_location_uri'] = config.upload_location_uri();
      }
      $.get(
        config.base_url + "/file-explorer/config/",
        query_params,
        function(config_data) {
          config.user_data((config_data && config_data.user_data) || {});
          custom_css_include();
        }
      );
    }
    config.retrieve_token.subscribe(retrieveConfig);
    retrieveConfig();

    /*
     * Get service data
     */
    config._retrievedServices = false;

    /*
     * compare function for sorting service order
     */
    var serviceOrderCompare = function () {
      // this anonymous function will execute instantly and return compare function
      var servicesOrder = {};
      if (config.services) {
        // exchange the key and value of config.services
        for (var i = 0; i < config.services.length; i++) {
          if (servicesOrder[config.services[i]] === undefined) {
            servicesOrder[config.services[i]] = i;
            if (config.services === 'all') {
              // break because 'all' cover whole services
              break;
            }
          }
        }
        // servicesOrder is like
        // {ftp: 0, gdrive: 1, object_store:2, all: 3}
      }

      /**
       * Get the minimum index
       * If the service doesn't exist in config.services,
       * this function will return Number.MAX_SAFE_INTEGER
       *
       * @param {Object} service
       * @returns {number}
       */
      function getServiceOrderIndex (service) {
        var allIndex = servicesOrder.all;
        var categoryIndex = servicesOrder[service.category];
        var idIndex = servicesOrder[service.id];

        var minIndex = Number.MAX_SAFE_INTEGER;

        if (allIndex !== undefined) {
          minIndex = allIndex;
        }
        if (categoryIndex !== undefined) {
          minIndex = Math.min(minIndex, categoryIndex);
        }
        if (idIndex !== undefined) {
          minIndex = Math.min(minIndex, idIndex);
        }

        return minIndex;
      }

      /**
       * compare function for sorting service order
       *
       * @param {Object} left - element of config.all_services
       * @param {Object} right - element of config.all_services
       *
       * config.all_services[0] = {
       *    id: ,
       *    name: ,
       *    logo:
       * }
       */
      return function (left, right) {
        var leftIndex = getServiceOrderIndex(left);
        var rightIndex = getServiceOrderIndex(right);
        if (leftIndex === rightIndex) {
          // if the indices are equal, use alphabetical order
          return left.name === right.name ? 0 :
            (left.name < right.name ? -1 : 1);
        } else {
          return leftIndex < rightIndex ? -1 : 1;
        }
      };
    }();

    $.get(
      config.base_url + '/' + config.api_version + '/public/services',
      {apis: 'storage'},
      function(serviceData) {          
        config._retrievedServices = true;

        if (config.services == undefined) {
          config.services = ['file_store'];
        }
        else if (config.services.indexOf('all') > -1) {
          config.services = ['file_store', 'object_store'];
        }
        var objStoreServices = ['s3', 'azure'];

        ko.utils.arrayForEach(serviceData.objects, function(serviceDatum) {
          var serviceCategory = 'file_store';
          if (objStoreServices.indexOf(serviceDatum.name) > -1) {
            serviceCategory = 'object_store';
          }
          var localeName = localization.formatAndWrapMessage(
            'servicenames/' + serviceDatum.name);
          if (localeName.indexOf('/') > -1)
            localeName = serviceDatum.friendly_name;

          var service = {
            id: serviceDatum.name,
            name: localeName,
            logo: serviceDatum.logo_url || (
              config.static_path + '/webapp/sources/' +
              serviceDatum.name + '.png'),
            category: serviceCategory,
            visible: false
          };

          if (config.services.indexOf(serviceDatum.name) > -1 ||
              config.services.indexOf(serviceCategory) > -1) {
            service.visible = true;
          }
          config.all_services.push(service);
        });

        config.all_services.sort(serviceOrderCompare);

        config.visible_computer.subscribe(toggleComputer);
        toggleComputer(config.visible_computer());
      }
    );

    // Handle the Computer service being enabled/disabled.

    config.visible_computer = ko.pureComputed(function() {
      return config.computer() && config.flavor() != 'saver' &&
        // Types other than 'folders' are present.
        (
          config.types.length === 0 || config.types.filter(function (f) {
            return f != 'folders'
          }).length > 0
        );
    });

    var toggleComputer = function(computerEnabled) {
      // Called after services are retrieved.
      if (computerEnabled && !(config.all_services()[0] || {}).computer) {
        config.all_services.unshift({
          computer: true,
          id: 'computer',
          name: 'My Computer',
          visible: true,
          logo: config.static_path + '/webapp/sources/computer.png'
        });
      }
      else if (!computerEnabled &&
               (config.all_services()[0] || {}).computer) {
        config.all_services.shift();
      }
    };

    /*
     * Create API server URLs
     */
    config.getAccountUrl = function(accountId, api, path) {
      var url = config.base_url + '/' + config.api_version + '/accounts/';
      if (!accountId) return url;

      url += accountId + '/';

      if (config.api_version === 'v0')
        api = ''
      else if (!api)
        api = 'storage';

      if (path)
        url += (api ? api + '/' : '') + path.replace(/^\/+/g, '')

      return url;
    }


    // Type aliases

    var aliases = {
      all: [
        'all'
      ],
      text: [
        'applescript',
        'as',
        'as3',
        'c',
        'cc',
        'clisp',
        'coffee',
        'cpp',
        'cs',
        'css',
        'csv',
        'cxx',
        'def',
        'diff',
        'erl',
        'fountain',
        'ft',
        'h',
        'hpp',
        'htm',
        'html',
        'hxx',
        'inc',
        'ini',
        'java',
        'js',
        'json',
        'less',
        'log',
        'lua',
        'm',
        'markdown',
        'mat',
        'md',
        'mdown',
        'mkdn',
        'mm',
        'mustache',
        'mxml',
        'patch',
        'php',
        'phtml',
        'pl',
        'plist',
        'properties',
        'py',
        'rb',
        'sass',
        'scss',
        'sh',
        'shtml',
        'sql',
        'tab',
        'taskpaper',
        'tex',
        'text',
        'tmpl',
        'tsv',
        'txt',
        'url',
        'vb',
        'xhtml',
        'xml',
        'yaml',
        'yml',
        ''],
      documents: [
        'csv',
        'doc',
        'dochtml',
        'docm',
        'docx',
        'docxml',
        'dot',
        'dothtml',
        'dotm',
        'dotx',
        'eps',
        'fdf',
        'key',
        'keynote',
        'kth',
        'mpd',
        'mpp',
        'mpt',
        'mpx',
        'nmbtemplate',
        'numbers',
        'odc',
        'odg',
        'odp',
        'ods',
        'odt',
        'pages',
        'pdf',
        'pdfxml',
        'pot',
        'pothtml',
        'potm',
        'potx',
        'ppa',
        'ppam',
        'pps',
        'ppsm',
        'ppsx',
        'ppt',
        'ppthtml',
        'pptm',
        'pptx',
        'pptxml',
        'prn',
        'ps',
        'pwz',
        'rtf',
        'tab',
        'template',
        'tsv',
        'txt',
        'vdx',
        'vsd',
        'vss',
        'vst',
        'vsx',
        'vtx',
        'wbk',
        'wiz',
        'wpd',
        'wps',
        'xdf',
        'xdp',
        'xlam',
        'xll',
        'xlr',
        'xls',
        'xlsb',
        'xlsm',
        'xlsx',
        'xltm',
        'xltx',
        'xps'],
      images: [
        'bmp',
        'cr2',
        'gif',
        'ico',
        'ithmb',
        'jpeg',
        'jpg',
        'nef',
        'png',
        'raw',
        'svg',
        'tif',
        'tiff',
        'wbmp',
        'webp'],
      videos: [
        '3g2',
        '3gp',
        '3gpp',
        '3gpp2',
        'asf',
        'avi',
        'dv',
        'dvi',
        'flv',
        'm2t',
        'm4v',
        'mkv',
        'mov',
        'mp4',
        'mpeg',
        'mpg',
        'mts',
        'ogv',
        'ogx',
        'rm',
        'rmvb',
        'ts',
        'vob',
        'webm',
        'wmv'],
      audio: [
        'aac',
        'aif',
        'aifc',
        'aiff',
        'au',
        'flac',
        'm4a',
        'm4b',
        'm4p',
        'm4r',
        'mid',
        'mp3',
        'oga',
        'ogg',
        'opus',
        'ra',
        'ram',
        'spx',
        'wav',
        'wma'],
      ebooks: [
        'acsm',
        'aeh',
        'azw',
        'cb7',
        'cba',
        'cbr',
        'cbt',
        'cbz',
        'ceb',
        'chm',
        'epub',
        'fb2',
        'ibooks',
        'kf8',
        'lit',
        'lrf',
        'lrx',
        'mobi',
        'opf',
        'oxps',
        'pdf',
        'pdg',
        'prc',
        'tebr',
        'tr2',
        'tr3',
        'xeb',
        'xps']
      }
      , additions = [];

    config.types = config.types.filter(function(type) {
      if (type in aliases) {
        additions = additions.concat(aliases[type]);
        return false;
      }
      return true;
    }).concat(additions);

    // remove any duplicates
    config.types = config.types.filter(function(elem, pos) {
        return config.types.indexOf(elem) == pos;
    });

    // default to 'all'
    if (config.types.length === 0) {
        config.types.push('all');
    }
      
    // update the locale when the config changes
    config.locale.subscribe(localization.setCurrentLocale);

    // load the default locale
    localization.loadDefaultLocaleData();

    return config;
  });
})();
