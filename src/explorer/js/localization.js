import $ from 'jquery';
import ko from 'knockout';
import globalize from 'globalize';
import 'cldr/unresolved';
import util from './util';
import likelySubtags from 'cldr-data/supplemental/likelySubtags.json';
import timeData from 'cldr-data/supplemental/timeData.json';
import weekData from 'cldr-data/supplemental/weekData.json';
import plurals from 'cldr-data/supplemental/plurals.json';
import caGregorian from 'cldr-data/main/en/ca-gregorian.json';
import numbers from 'cldr-data/main/en/numbers.json';
import timeZoneNames from 'cldr-data/main/en/timeZoneNames.json';
import messages from '../localization/messages/en.json';

/**
 * Localization module that provides translation and localization services.
 */
'use strict';

// ref: lib/plupload/i18n & cldr-data/main
const supportedLocales = {
  ar: { cldr: 'ar', plupload: 'ar' },
  az: { cldr: 'az', plupload: 'az' },
  bs: { cldr: 'bs', plupload: 'bs' },
  cs: { cldr: 'cs', plupload: 'cs' },
  cy: { cldr: 'cy', plupload: 'cy' },
  da: { cldr: 'da', plupload: 'da' },
  de: { cldr: 'de', plupload: 'de' },
  el: { cldr: 'el', plupload: 'el' },
  en: { cldr: 'en', plupload: 'en' },
  es: { cldr: 'es', plupload: 'es' },
  et: { cldr: 'et', plupload: 'et' },
  fa: { cldr: 'fa', plupload: 'fa' },
  fi: { cldr: 'fi', plupload: 'fi' },
  fr: { cldr: 'fr', plupload: 'fr' },
  he: { cldr: 'he', plupload: 'he' },
  hr: { cldr: 'hr', plupload: 'hr' },
  hu: { cldr: 'hu', plupload: 'hu' },
  hy: { cldr: 'hy', plupload: 'hy' },
  id: { cldr: 'id', plupload: 'id' },
  it: { cldr: 'it', plupload: 'it' },
  ja: { cldr: 'ja', plupload: 'ja' },
  ka: { cldr: 'ka', plupload: 'ka' },
  kk: { cldr: 'kk', plupload: 'kk' },
  km: { cldr: 'km', plupload: 'km' },
  ko: { cldr: 'ko', plupload: 'ko' },
  lt: { cldr: 'lt', plupload: 'lt' },
  lv: { cldr: 'lv', plupload: 'lv' },
  mn: { cldr: 'mn', plupload: 'mn' },
  ms: { cldr: 'ms', plupload: 'ms' },
  nl: { cldr: 'nl', plupload: 'nl' },
  pl: { cldr: 'pl', plupload: 'pl' },
  pt: { cldr: 'pt', plupload: 'pt_BR' },
  ro: { cldr: 'ro', plupload: 'ro' },
  ru: { cldr: 'ru', plupload: 'ru' },
  sk: { cldr: 'sk', plupload: 'sk' },
  sq: { cldr: 'sq', plupload: 'sq' },
  sr: { cldr: 'sr', plupload: 'sr_RS' },
  sv: { cldr: 'sv', plupload: 'sv' },
  th: { cldr: 'th', plupload: 'th_TH' },
  tr: { cldr: 'tr', plupload: 'tr' },
  uk: { cldr: 'uk', plupload: 'uk_UA' },
  zh: { cldr: 'zh', plupload: 'zh_CN' },
};

let dateTimeFmt = '';

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

const isLocaleSupported = locale => !!supportedLocales[locale];
const resolvePluploadFileName = (locale) => {
  return (isLocaleSupported(locale) ?
    `${supportedLocales[locale].plupload}.js` : 'en.js')
};

var locUtil = {

  /**
   * Gets the supported locale that most closely matches the requested
   * locale
   * @param locale The locale desired
   */
  getEffectiveLocale: function (locale) {
    // normalize the locale code
    locale = (locale || DEFAULT_LOCALE).toLowerCase();
    if (locale === 'test') {
      // special case for the test locale.  Use 'en'
      return DEFAULT_LOCALE;
    }
    
    if (!isLocaleSupported(locale)) {
      // no exact match, try the language code
      locale = locale.split('-')[0];
      return isLocaleSupported(locale) ? locale : DEFAULT_LOCALE;
    }

    return locale;
  },


  /**
   * Changes the current locale.  Loads the supplemental data and locale
   * specific data if necessary
   * @param locale New locale ('en-US', 'es-ES', etc...)
   * @param translations The URL/JSON string of the translations
   * @param dateTimeFormat The date/time format for the locale
   * @param [callback] Called when the locale is loaded
   */
  setCurrentLocale: function (
    locale, translations, dateTimeFormat, callback) {
    callback = callback || function () {};
    dateTimeFmt = dateTimeFormat;

    const warningLocaleNotFound = 'There is no corresponding translation' +
     ` for locale [${locale}]! Falling back to the default translation.`;

    const warningFileNotFound = 'Can not fetch the translation file from' +
     ` ${translations}! Falling back to the default translation.`;

    var effectiveLocale = this.getEffectiveLocale(locale);
    isTestLocale(locale === 'TEST');

    // Load the plupload i18n script now.  Don't need to wait on this;
    // plupload will handle it.
    // Append the timestamp on the end to force re-exectuion of the script.
    $.getScript(
      util.getBaseUrl() + '/localization/plupload/i18n/' +
      resolvePluploadFileName(effectiveLocale) + '?timestamp=' + Date.now()
    );

    if (loadedLocales[effectiveLocale]) {
      // this locale has already been loaded
      currentLocale(loadedLocales[effectiveLocale]);
      return callback();
    } else {
      let deferred = null;
      if (typeof translations !== 'string') {
        deferred = $.Deferred();
        deferred.resolve([translations]);
      }

      // load the necessary language files
      var cldrBaseUrl = CLDR_DATA_URL + 'main/' + effectiveLocale + '/';

      var deferreds = [
        $.getJSON(cldrBaseUrl + 'ca-gregorian.json'),
        $.getJSON(cldrBaseUrl + 'numbers.json'),
        $.getJSON(cldrBaseUrl + 'timeZoneNames.json'),
        deferred || $.getJSON(translations ||
          LOCALIZATION_MESSAGES_URL + effectiveLocale + '.json')
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

            const translations = messagesDataStatusXhr[0];

            if (!(locale in translations)) {
              console.warn(warningLocaleNotFound);
              globalize.loadMessages(messages);
            } else {
              globalize.loadMessages({
                // https://github.com/globalizejs/globalize/blob/master/doc/api/message/load-messages.md#messages-inheritance
                root: messages['en'],
                ...translations,
              });
              this.updateCurrentLocaleOfKo(effectiveLocale);
            }

            return callback();
          }.bind(this)
        ).fail(() => console.warn(warningFileNotFound));
    }
  },

  /**
   * Update current locale of knockout
   *
   * @param {Object} effectiveLocale
   */
  updateCurrentLocaleOfKo: function (effectiveLocale) {
    var globalizeLocaleObject = globalize(effectiveLocale);

    loadedLocales[effectiveLocale] = {
      globalize: globalizeLocaleObject,
      locale: effectiveLocale
    };
    currentLocale(loadedLocales[effectiveLocale]);
  },

  /**
   * Load 'en' cldr data.
   * If you want to load different locale data.
   * Modify the loading path in `define` function on the beginning of this file.
   */
  loadDefaultLocaleData: function () {
    globalize.load(likelySubtags, timeData, weekData, caGregorian, numbers,
      timeZoneNames, plurals);
    globalize.loadMessages(messages);

    this.updateCurrentLocaleOfKo(DEFAULT_LOCALE);
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
    if (this.getCurrentLocale()) {
      try {
        return this.getCurrentLocale().globalize.formatMessage(
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
    const format = dateTimeFmt || DEFAULT_DATETIME_FORMAT;
    // https://github.com/globalizejs/globalize#dateformatter-options-

    return this.getCurrentLocale().globalize.dateFormatter(
      {skeleton: format})(date);
  },


  /**
   * Formats the given number for the current locale
   * @param n Number to format
   */
  formatNumber: function (n) {
    if ((typeof n) === 'number')
      return this.getCurrentLocale().globalize.formatNumber(n);
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
      var self = this;
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

    return this.wrapTestLocale(
      this.formatMessage(message, formattedVariables), propertyName);
  },


  /**
   * Formats the given date to the current locale and wraps the text
   * if necessary.
   * @param d The Date to format
   * @param [propertyName] Optional. The HTML property being localized
   * @returns {*|string}
   */
  formatAndWrapDateTime: function (d, propertyName) {
    return this.wrapTestLocale(this.formatDateTime(d), propertyName);
  },


  /**
   * Formats the given number to the current locale and wraps the text
   * if necessary.
   * @param n The number to format
   * @param [propertyName] Optional. The HTML property being localized
   */
  formatAndWrapNumber: function (n, propertyName) {
    return this.wrapTestLocale(this.formatNumber(n), propertyName);
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

export default locUtil;
