(function () {
  /**
   * Localization module that provides translation and localization services.
   */
  'use strict';

  /**
   * Dictionary of supported locales.  This object specifies which locales are supported before
   * attempting to load the files.  Items in this dictionary should have the following format:
   *   locale: {
   *     id: the id of the locale (i.e. 'en-US')
   *     messages: name of message file (in /localization/messages )
   *     plUpload_i18n: path to plUpload i18n file (in lib/plupload/i18n)
   *     dateTimeFormat: optional, override default date format when displaying date + time.  Uses
   *                     globalize time format (i.e. 'MMMdhm' for 12 hour clock, 'MMMdHm' for 24 hour).  Defaults to MMMdHm
   *   }
   *
   * The specific locales (i.e. 'en-US') and the parent language (i.e 'en') should have separate
   * entries in this dictionary.  The parent language will be used as the default if the specific
   * locale is not supported (i.e. 'en-??' will default to 'en')
   *
   * Example:
   * 'es': {
   *      id: 'es',
   *      messages: 'es.json',
   *      plUpload_i18n: 'es.js'
   *    }
   */
  var supportedLocales = {
    'en': {
      id: 'en',
      messages: 'en.json',
      plUpload_i18n: 'en.js',
      dateTimeFormat: 'MMMdhm' // special case default en to 12 hour clock
    }
  };

  define([
    'jquery',
    'vendor/knockout',
    'globalize',
    'util',

    // Globalize modules
    'globalize/date',
    'globalize/message',
    'globalize/number'
  ], function ($, ko, globalize, util) {

    var TEST_WRAPPER = '#'; // used to wrap text when in the TEST locale i.e. "#This is a localized string#"
    var WARNING_WRAPPER = "!!!"; // used to wrap messages keys with no translated text when using the TEST locale i.e. "!!!Missing translation!!!"
    var CLDR_DATA_URL = util.getBaseUrl() + '/localization/cldr-data/';  // CLDR localization root folder
    var LOCALIZATION_MESSAGES_URL = util.getBaseUrl() + '/localization/messages/'; // folder containing translated strings
    var DEFAULT_LOCALE = 'en';
    var DEFAULT_DATETIME_FORMAT = 'MMMdHm';

    var currentLocale = ko.observable();
    var isTestLocale = ko.observable(false);
    var loadedLocales = {};
    var isSupplementalCldrLoaded = false;

    var locUtil = {
      /**
       * Returns the currently supported locales
       */
      getSupportedLocales: function() {
        return supportedLocales;
      },
      /**
       * Gets the supported locale that most closely matches the requested locale
       * @param locale The locale desired
       */
      getEffectiveLocale: function(locale) {
        // normalize the locale code
        locale = (locale || DEFAULT_LOCALE).toLowerCase();
        if (locale === 'test') {
          // special case for the test locale.  Use 'en'
          locale = 'en';
        }
        var effectiveLocale = this.getSupportedLocales()[locale];
        if (!effectiveLocale) {
          // no exact match, try the language code
          var language = locale.split('-')[0]
          effectiveLocale = this.getSupportedLocales()[language];
        }

        // return the detected locale if found, or return the default locale
        // if no suitable locale is found
        return effectiveLocale || this.getSupportedLocales()[DEFAULT_LOCALE];
      },
      /**
       * Changes the current locale.  Loads the supplemental data and locale specific data if necessary
       * @param locale New locale ('en-US', 'es-ES', etc...)
       * @param [callback] Called when the locale is loaded
       */
      setCurrentLocale: function (locale, callback) {
        callback = callback || function() {};

        var effectiveLocale = this.getEffectiveLocale(locale);
        isTestLocale(locale === 'TEST');

        // load the plupload i18n script now.  Don't need to wait on this -- plupload will handle it
        // append the timestamp on the end to force re-exectuion of the script
        $.getScript(util.getBaseUrl() + '/js/vendor/plupload/i18n/' + effectiveLocale.plUpload_i18n + '?timestamp=' + Date.now());

        if (loadedLocales[effectiveLocale.id]) {
          // this locale has already been loaded
          currentLocale(loadedLocales[effectiveLocale.id]);
          return callback();
        } else {
          // load the necessary language files
          var cldrBaseUrl = CLDR_DATA_URL + 'main/' + effectiveLocale.id + '/';

          var deferreds = [
            $.getJSON(cldrBaseUrl + 'ca-gregorian.json'),
            $.getJSON(cldrBaseUrl + 'numbers.json'),
            $.getJSON(cldrBaseUrl + 'timeZoneNames.json'),
            $.getJSON(LOCALIZATION_MESSAGES_URL + effectiveLocale.id + '.json')
          ];

          if (!isSupplementalCldrLoaded) {
            // if the supplemental data is not loaded yet, then load it now
            deferreds.push($.getJSON(CLDR_DATA_URL + 'supplemental/likelySubtags.json'));
            deferreds.push($.getJSON(CLDR_DATA_URL + 'supplemental/timeData.json'));
            deferreds.push($.getJSON(CLDR_DATA_URL + 'supplemental/weekData.json'));

            // ok to mark the supplemental data as loaded even though it hasn't finished yet
            isSupplementalCldrLoaded = true;
          }

          $.when.apply($, deferreds)
            .done(function (gregorianDataStatusXhr, numbersDataStatusXhr, timeZoneNamesDataStatusXhr, messagesDataStatusXhr,
                            likelySubtagsDataStatusXhr, timeDataDataStatusXhr, weekDataDataStatusXhr) {
              if (likelySubtagsDataStatusXhr) {
                globalize.load(likelySubtagsDataStatusXhr[0]);
              }
              if (timeDataDataStatusXhr) {
                globalize.load(timeDataDataStatusXhr[0]);
              }
              if (weekDataDataStatusXhr) {
                globalize.load(weekDataDataStatusXhr[0]);
              }
              globalize.load(gregorianDataStatusXhr[0], numbersDataStatusXhr[0], timeZoneNamesDataStatusXhr[0]);
              globalize.loadMessages(messagesDataStatusXhr[0]);
              var globalizeLocaleObject = globalize(effectiveLocale.id);
              loadedLocales[effectiveLocale.id] = {
                globalize: globalizeLocaleObject,
                locale: effectiveLocale
              };
              currentLocale(loadedLocales[effectiveLocale.id]);
              return callback();
            });
        }
      },
      /**
       * Returns the currently selected locale
       */
      getCurrentLocale: function () {
        return currentLocale();
      },
      /**
       * Translates the given message into the current locale
       * @param message Message key defined in /localization/*.json
       * @param [variables] Optional. Extra variables for the localization tokens
       * @returns {string} Translated text
       */
      formatMessage: function (message, variables) {
        if (this.getCurrentLocale()) {
          try {
            return this.getCurrentLocale().globalize.formatMessage(message, variables);
          } catch (e) {
            if (isTestLocale()) {
              // if this is the test locale, and no translation was found, then wrap it in a warning to make it more obvious
              return WARNING_WRAPPER + message + WARNING_WRAPPER;
            }
          }
        }
        return message; // if no messages are found, return the token itself
      },
      /**
       * Formats the given date for the current locale
       * @param d Date to format
       */
      formatDateTime: function (d) {
        var format = (this.getCurrentLocale() && locUtil.getCurrentLocale().locale.dateTimeFormat) ?
          locUtil.getCurrentLocale().locale.dateTimeFormat : DEFAULT_DATETIME_FORMAT;
        return this.getCurrentLocale().globalize.dateFormatter({skeleton: format})(d);
      },
      /**
       * Formats the given number for the current locale
       * @param n Number to format
       */
      formatNumber: function(n) {
        return ((typeof n) === 'number') ? this.getCurrentLocale().globalize.formatNumber(n) : n;
      },
      /**
       * Handles wrapping text with the test wrapper if the test locale is enabled, so that untranslated tokens within
       * the page are more noticable.  Only HTML properties that are safe to change, such as the 'title', 'placeholder', 'html', and
       * 'value', are changed.  Unsafe values, such as an image 'src' property are not changed
       * @param translatedText Previously translated text
       * @param [propertyName] Optional. The HTML property being localized
       *
       * @returns {string} Returns the unmodified translatedText property if the test locale is disabled or if the
       * propertyName can't be changed safely.
       */
      wrapTestLocale: function (translatedText, propertyName) {
        var textWrapper = '';
        if (isTestLocale()) {
          // some properties, such as urls, won't work with the text wrapper.
          if (propertyName == null || ['title', 'placeholder', 'html', 'value'].indexOf(propertyName) >= 0) {
            textWrapper = TEST_WRAPPER;
          }
        }

        return textWrapper + translatedText + textWrapper;
      },
      /**
       * Translates and wraps the text (if necessary).  Also formats number/date variables to the current locale
       * @param message Message key defined in /localization/*.json
       * @param [variables] Optional. Extra variables for the localization tokens
       * @param [propertyName] Optional. The HTML property being localized
       * @returns {string} Translated and wrapped text
       */
      formatAndWrapMessage: function (message, variables, propertyName) {
        // format the variables if necessary
        var formattedVariables = {};
        if (variables) {
          var self = this;
          Object.keys(variables).forEach(function (key) {
            var value = variables[key];
            if ((typeof value) === 'number') {
              formattedVariables[key] = self.formatAndWrapNumber(value, propertyName)
            } else if (value instanceof Date) {
              formattedVariables[key] = self.formatAndWrapDateTime(value, propertyName)
            } else {
              formattedVariables[key] = value;
            }
          });
        }

        return this.wrapTestLocale(this.formatMessage(message, formattedVariables), propertyName);
      },
      /**
       * Formats the given date to the current locale and wraps the text (if necessary)
       * @param d The Date to format
       * @param [propertyName] Optional. The HTML property being localized
       * @returns {*|string}
       */
      formatAndWrapDateTime: function(d, propertyName) {
        return this.wrapTestLocale(this.formatDateTime(d), propertyName);
      },
      /**
       * Formats the given number to the current locale and wraps the text (if necessary)
       * @param n The number to format
       * @param [propertyName] Optional. The HTML property being localized
       */
      formatAndWrapNumber: function(n, propertyName) {
        return this.wrapTestLocale(this.formatNumber(n), propertyName);
      }
    };

    /**
     * Knockout.js Binding handler to translate HTML elements.
     *
     * Examples:
     * simple example: translates the accounts/chooseaccount key:
     * <span data-bind='translate: "accounts/chooseaccount"'>
     *
     * more complex example: translates the somekey key, specifying a variable used during the translation,
     * and specifies that the translated text should go into the 'value' property:
     * <input (data-bind='translate: {value: { message: "somekey", variables: { var1: somevariable }}}'>
     */
    ko.bindingHandlers.translate = {
      'update': function (element, valueAccessor) {
        var values = ko.utils.unwrapObservable(valueAccessor());
        if (values && typeof values === 'object') {
          Object.keys(values).forEach(function (property) {
            var token = values[property] || {};
            var translatedText = locUtil.formatAndWrapMessage(token.message, token.variables, property);
            if (property === 'html') {
              $(element).html(translatedText);
            } else {
              $(element).attr(property, translatedText);
            }
          });
        } else {
          // default to html property
          $(element).html(locUtil.formatAndWrapMessage(values));
        }
      }
    };

    /**
     * Knockout.js binding handler to translate dates in HTML elements.
     *
     * Example:
     * <span data-bind='formatDate: created'>
     */
    ko.bindingHandlers.formatDate = {
      'update': function (element, valueAccessor) {
        var dateString = ko.utils.unwrapObservable(valueAccessor());
        var localizedDateString = locUtil.formatAndWrapDateTime(new Date(dateString.substring(0, 19)));
        $(element).html(localizedDateString);
      }
    };

    return locUtil;
  });
})();
