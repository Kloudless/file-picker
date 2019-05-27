(function () {
  /**
   * Localization module that provides translation and localization services.
   */
  'use strict';

  /**
   * Dictionary of supported locales. This object specifies which locales are
   * supported before attempting to load the files. Items in this dictionary
   * should have the following format:
   *   locale: {
   *     id: the id of the locale (i.e. 'en-US')
   *     messages: name of message file (in /localization/messages )
   *     plUpload_i18n: path to plUpload i18n file (in lib/plupload/i18n)
   *     dateTimeFormat: Optional. Override default date format when displaying
   *       date + time. Uses globalize time format (i.e. 'MMMdhm' for 12 hour
   *       clock, 'MMMdHm' for 24 hour).  Defaults to MMMdHm
   *   }
   *
   * The specific locales (i.e. 'en-US') and the parent language (i.e 'en')
   * should have separate entries in this dictionary. The parent language will
   * be used as the default if the specific locale is not supported (i.e. 'en-??'
   * will default to 'en')
   *
   * Example:
   * 'es': {
   *      id: 'es',
   *      messages: 'es.json',
   *      plUpload_i18n: 'es.js'
   *    }
   */

  //TODO: Should dateTimeFormat be specified according to specific locale?
  var supportedLocales = {
    'en': {
      id: 'en',
      messages: 'en.json',
      plUpload_i18n: 'en.js',
      dateTimeFormat: 'MMMdhm' // special case default en to 12 hour clock
    },
    'cs-cz': {
      id: 'cs',
      messages: 'cs-CZ.json',
      plUpload_i18n: 'cs.js',
      dateTimeFormat: 'MMMdhm'
    },
    'da-dk': {
      id: 'da',
      messages: 'da-DK.json',
      plUpload_i18n: 'da.js',
      dateTimeFormat: 'MMMdhm'
    },
    'de-de': {
      id: 'de',
      messages: 'de-DE.json',
      plUpload_i18n: 'de.js',
      dateTimeFormat: 'MMMdhm'
    },
    'en-gb': {
      id: 'en-GB',
      messages: 'en-GB.json',
      plUpload_i18n: 'en.js',
      dateTimeFormat: 'MMMdhm'
    },
    'en-us': {
      id: 'en-US-POSIX',
      messages: 'en-US.json',
      plUpload_i18n: 'en.js',
      dateTimeFormat: 'MMMdhm'
    },
    'es-es': {
      id: 'es',
      messages: 'es-ES.json',
      plUpload_i18n: 'es.js',
      dateTimeFormat: 'MMMdhm'
    },
    'es-la': {
      id: 'es',
      messages: 'es-LA.json',
      plUpload_i18n: 'es.js',
      dateTimeFormat: 'MMMdhm'
    },
    'et-ee': {
      id: 'et',
      messages: 'et-EE.json',
      plUpload_i18n: 'et.js',
      dateTimeFormat: 'MMMdhm'
    },
    'fi-fi': {
      id: 'fi',
      messages: 'fi-FI.json',
      plUpload_i18n: 'fi.js',
      dateTimeFormat: 'MMMdhm'
    },
    'fr-ca': {
      id: 'fr',
      messages: 'fr-CA.json',
      plUpload_i18n: 'fr.js',
      dateTimeFormat: 'MMMdhm'
    },
    'fr-fr': {
      id: 'fr',
      messages: 'fr-FR.json',
      plUpload_i18n: 'fr.js',
      dateTimeFormat: 'MMMdhm'
    },
    'he': {
      id: 'he',
      messages: 'he.json',
      plUpload_i18n: 'he.js',
      dateTimeFormat: 'MMMdhm'
    },
    'id-id': {
      id: 'id',
      messages: 'id-ID.json',
      plUpload_i18n: 'id.js',
      dateTimeFormat: 'MMMdhm'
    },
    'it-it': {
      id: 'it',
      messages: 'it-IT.json',
      plUpload_i18n: 'it.js',
      dateTimeFormat: 'MMMdhm'
    },
    'ja-jp': {
      id: 'ja',
      messages: 'ja-JP.json',
      plUpload_i18n: 'ja.js',
      dateTimeFormat: 'MMMdhm'
    },
    'ko-kr': {
      id: 'ko',
      messages: 'ko-KR.json',
      plUpload_i18n: 'ko.js',
      dateTimeFormat: 'MMMdhm'
    },
    'nl-nl': {
      id: 'nl',
      messages: 'nl-NL.json',
      plUpload_i18n: 'nl.js',
      dateTimeFormat: 'MMMdhm'
    },
    'pl-pl': {
      id: 'pl',
      messages: 'pl-PL.json',
      plUpload_i18n: 'pl.js',
      dateTimeFormat: 'MMMdhm'
    },
    'pt-br': {
      id: 'pt',
      messages: 'pt-BR.json',
      plUpload_i18n: 'pt_BR.js',
      dateTimeFormat: 'MMMdhm'
    },
    'pt-pt': {
      id: 'pt-PT',
      messages: 'pt-PT.json',
      plUpload_i18n: 'pt_BR.js',
      dateTimeFormat: 'MMMdhm'
    },
    'ro-ro': {
      id: 'ro',
      messages: 'ro-RO.json',
      plUpload_i18n: 'ro.js',
      dateTimeFormat: 'MMMdhm'
    },
    'ru-ru': {
      id: 'ru',
      messages: 'ru-RU.json',
      plUpload_i18n: 'ru.js',
      dateTimeFormat: 'MMMdhm'
    },
    'sv-se': {
      id: 'sv',
      messages: 'sv-SE.json',
      plUpload_i18n: 'sv.js',
      dateTimeFormat: 'MMMdhm'
    },
    'th-th': {
      id: 'th-TH',
      messages: 'th-TH.json',
      plUpload_i18n: 'th.js',
      dateTimeFormat: 'MMMdhm'
    },
    'tr-tr': {
      id: 'tr',
      messages: 'tr-TR.json',
      plUpload_i18n: 'tr.js',
      dateTimeFormat: 'MMMdhm'
    },
    'vi-vn': {
      id: 'vi',
      messages: 'vi-VN.json',
      plUpload_i18n: 'vi.js',
      dateTimeFormat: 'MMMdhm'
    },
    'zh-cn': {
      id: 'zh',
      messages: 'zh-CN.json',
      plUpload_i18n: 'zh_CN.js',
      dateTimeFormat: 'MMMdhm'
    },
    'zh-hant': {
      id: 'zh-Hant',
      messages: 'zh-HANT.json',
      plUpload_i18n: 'zh_CN.js',
      dateTimeFormat: 'MMMdhm'
    }
  };

  define([
    'jquery',
    'vendor/knockout',
    'globalize',
    'util',

    // localization data
    'json!../localization/cldr-data/supplemental/likelySubtags.json',
    'json!../localization/cldr-data/supplemental/timeData.json',
    'json!../localization/cldr-data/supplemental/weekData.json',
    'json!../localization/cldr-data/main/en/ca-gregorian.json',
    'json!../localization/cldr-data/main/en/numbers.json',
    'json!../localization/cldr-data/main/en/timeZoneNames.json',
    'json!../localization/messages/en.json',

    // Globalize modules
    'globalize/date',
    'globalize/message',
    'globalize/number',
  ], function ($, ko, globalize, util,
               likelySubtags, timeData, weekData, caGregorian, numbers, timeZoneNames, messages) {

    // Used to wrap text when in the TEST locale
    // e.g. "#This is a localized string#"
    var TEST_WRAPPER = '#';

    // Used to wrap messages keys that do not have translated text when using
    // the TEST locale e.g. "!!!Missing translation!!!"
    var WARNING_WRAPPER = "!!!";

    // CLDR localization root folder
    var CLDR_DATA_URL = util.getBaseUrl() + '/localization/cldr-data/';

    // folder containing translated strings
    var LOCALIZATION_MESSAGES_URL = (
      util.getBaseUrl() + '/localization/messages/');

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
       * Gets the supported locale that most closely matches the requested
       * locale
       * @param locale The locale desired
       */
      getEffectiveLocale: function(locale) {
        // normalize the locale code
        locale = (locale || DEFAULT_LOCALE).toLowerCase();
        if (locale === 'test') {
          // special case for the test locale.  Use 'en'
          locale = 'en';
        }
        var effectiveLocale = locUtil.getSupportedLocales()[locale];
        if (!effectiveLocale) {
          // no exact match, try the language code
          var language = locale.split('-')[0]
          effectiveLocale = locUtil.getSupportedLocales()[language];
        }

        // return the detected locale if found, or return the default locale
        // if no suitable locale is found
        return effectiveLocale || locUtil.getSupportedLocales()[DEFAULT_LOCALE];
      },


      /**
       * Changes the current locale.  Loads the supplemental data and locale
       * specific data if necessary
       * @param locale New locale ('en-US', 'es-ES', etc...)
       * @param [callback] Called when the locale is loaded
       */
      setCurrentLocale: function (locale, callback) {
        callback = callback || function() {};

        var effectiveLocale = locUtil.getEffectiveLocale(locale);
        isTestLocale(locale === 'TEST');

        // Load the plupload i18n script now.  Don't need to wait on this;
        // plupload will handle it.
        // Append the timestamp on the end to force re-exectuion of the script.
        $.getScript(
          util.getBaseUrl() + '/js/vendor/plupload/i18n/' +
          effectiveLocale.plUpload_i18n + '?timestamp=' + Date.now()
        );

        if (loadedLocales[effectiveLocale.id]) {
          // this locale has already been loaded
          currentLocale(loadedLocales[effectiveLocale.id]);
          return callback();
        }
        else {
          // load the necessary language files
          var cldrBaseUrl = CLDR_DATA_URL + 'main/' + effectiveLocale.id + '/';

          var deferreds = [
            $.getJSON(cldrBaseUrl + 'ca-gregorian.json'),
            $.getJSON(cldrBaseUrl + 'numbers.json'),
            $.getJSON(cldrBaseUrl + 'timeZoneNames.json'),
            $.getJSON(LOCALIZATION_MESSAGES_URL + effectiveLocale.messages)
          ];

          if (!isSupplementalCldrLoaded) {
            // if the supplemental data is not loaded yet, then load it now
            deferreds.push(
              $.getJSON(CLDR_DATA_URL + 'supplemental/likelySubtags.json'),
              $.getJSON(CLDR_DATA_URL + 'supplemental/timeData.json'),
              $.getJSON(CLDR_DATA_URL + 'supplemental/weekData.json')
            );

            // ok to mark the supplemental data as loaded even though it
            // hasn't finished yet
            isSupplementalCldrLoaded = true;
          }

          $.when.apply($, deferreds)
            .done(
              function (gregorianDataStatusXhr, numbersDataStatusXhr,
                        timeZoneNamesDataStatusXhr, messagesDataStatusXhr,
                        likelySubtagsDataStatusXhr, timeDataDataStatusXhr,
                        weekDataDataStatusXhr) {
                if (likelySubtagsDataStatusXhr) {
                  globalize.load(likelySubtagsDataStatusXhr[0]);
                }
                if (timeDataDataStatusXhr) {
                  globalize.load(timeDataDataStatusXhr[0]);
                }
                if (weekDataDataStatusXhr) {
                  globalize.load(weekDataDataStatusXhr[0]);
                }

                globalize.load(
                  gregorianDataStatusXhr[0], numbersDataStatusXhr[0],
                  timeZoneNamesDataStatusXhr[0]);

                globalize.loadMessages(messagesDataStatusXhr[0]);

                locUtil.updateCurrentLocaleOfKo(effectiveLocale);

                return callback();
              }.bind(locUtil)
            );
        }
      },

      /**
       * Update current locale of knockout
       *
       * @param {Object} effectiveLocale
       */
      updateCurrentLocaleOfKo: function (effectiveLocale) {
          var globalizeLocaleObject = globalize(effectiveLocale.id);

          loadedLocales[effectiveLocale.id] = {
              globalize: globalizeLocaleObject,
              locale: effectiveLocale
          };
          currentLocale(loadedLocales[effectiveLocale.id]);
      },

      /**
       * Load 'en' cldr data.
       * If you want to load different locale data.
       * Modify the loading path in `define` function on the beginning of this file.
       */
      loadDefaultLocaleData: function () {
          globalize.load(likelySubtags, timeData, weekData, caGregorian, numbers, timeZoneNames);
          globalize.loadMessages(messages);

          var effectiveLocale = locUtil.getEffectiveLocale('en');

          locUtil.updateCurrentLocaleOfKo(effectiveLocale);
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
       * @param [variables] Optional. Extra variables for the localization
       * tokens
       * @returns {string} Translated text
       */
      formatMessage: function (message, variables) {
        if (locUtil.getCurrentLocale()) {
          try {
            return locUtil.getCurrentLocale().globalize.formatMessage(
              message, variables);
          } catch (e) {
            if (isTestLocale()) {
              // if this is the test locale, and no translation was found,
              // then wrap it in a warning to make it more obvious
              return WARNING_WRAPPER + message + WARNING_WRAPPER;
            }
          }
        }

        // if no messages are found, return the token itself
        return message;
      },


      /**
       * Formats the given date for the current locale
       * @param date Date to format
       */
      formatDateTime: function (date) {
        var format = DEFAULT_DATETIME_FORMAT;

        if (locUtil.getCurrentLocale() &&
            locUtil.getCurrentLocale().locale.dateTimeFormat)
          format = locUtil.getCurrentLocale().locale.dateTimeFormat;

        return locUtil.getCurrentLocale().globalize.dateFormatter(
          {skeleton: format})(date);
      },


      /**
       * Formats the given number for the current locale
       * @param n Number to format
       */
      formatNumber: function(n) {
        if ((typeof n) === 'number')
          return locUtil.getCurrentLocale().globalize.formatNumber(n);
        else
          return n
      },


      /**
       * Handles wrapping text with the test wrapper if the test locale is
       * enabled, so that untranslated tokens within the page are more
       * noticable. Only HTML properties that are safe to change, such as the
       * 'title', 'placeholder', 'html', and 'value', are changed.
       * Unsafe values, such as an image 'src' property are not changed.
       * 
       * @param translatedText Previously translated text
       * @param [propertyName] Optional. The HTML property being localized
       *
       * @returns {string} Returns the unmodified translatedText property if
       * the test locale is disabled or if the propertyName can't be changed
       * safely.
       */
      wrapTestLocale: function (translatedText, propertyName) {
        var textWrapper = '';

        // some properties, such as urls, won't work with the text wrapper.
        var safeProps = ['title', 'placeholder', 'html', 'value'];

        if (isTestLocale()) {
          if (propertyName == null || safeProps.indexOf(propertyName) >= 0) {
            textWrapper = TEST_WRAPPER;
          }
        }

        return textWrapper + translatedText + textWrapper;
      },


      /**
       * Translates and wraps the text (if necessary).
       * Also formats number/date variables to the current locale.
       * @param message Message key defined in /localization/*.json
       * @param [variables] Optional. Extra vars for the localization tokens
       * @param [propertyName] Optional. The HTML property being localized
       * @returns {string} Translated and wrapped text
       */
      formatAndWrapMessage: function (message, variables, propertyName) {
        // format the variables if necessary
        var formattedVariables = {};

        if (variables) {
          var self = locUtil;
          Object.keys(variables).forEach(function (key) {
            var value = variables[key];
            if ((typeof value) === 'number') {
              formattedVariables[key] = self.formatAndWrapNumber(
                value, propertyName);
            } else if (value instanceof Date) {
              formattedVariables[key] = self.formatAndWrapDateTime(
                value, propertyName);
            } else {
              formattedVariables[key] = value;
            }
          });
        }

        return locUtil.wrapTestLocale(
          locUtil.formatMessage(message, formattedVariables), propertyName);
      },


      /**
       * Formats the given date to the current locale and wraps the text
       * if necessary.
       * @param d The Date to format
       * @param [propertyName] Optional. The HTML property being localized
       * @returns {*|string}
       */
      formatAndWrapDateTime: function(d, propertyName) {
        return locUtil.wrapTestLocale(locUtil.formatDateTime(d), propertyName);
      },


      /**
       * Formats the given number to the current locale and wraps the text
       * if necessary.
       * @param n The number to format
       * @param [propertyName] Optional. The HTML property being localized
       */
      formatAndWrapNumber: function(n, propertyName) {
        return locUtil.wrapTestLocale(locUtil.formatNumber(n), propertyName);
      }
    };


    /**
     * Knockout.js Binding handler to translate HTML elements.
     *
     * Examples:
     * 
     * simple example:
     *   - translates the accounts/chooseaccount key
     *   <span data-bind='translate: "accounts/chooseaccount"'>
     *
     * more complex example:
     *   - translates the somekey key, specifying a variable used during the
     *     translation.
     *   - specifies that the translated text should go into the 'value'
     *     property.
     *   <input (data-bind='translate: {value: { message: "somekey", variables: { var1: somevariable }}}'>
     */
    ko.bindingHandlers.translate = {
      'update': function (element, valueAccessor) {
        var values = ko.utils.unwrapObservable(valueAccessor());

        if (values && typeof values === 'object') {
          Object.keys(values).forEach(function (property) {
            var token = values[property] || {};
            var translatedText = locUtil.formatAndWrapMessage(
              token.message, token.variables, property);

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
        var localizedDateString = locUtil.formatAndWrapDateTime(
          new Date(dateString.substring(0, 19)));

        $(element).html(localizedDateString);
      }
    };

    return locUtil;
  });
})();
