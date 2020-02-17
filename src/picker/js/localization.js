import $ from 'jquery';
import ko from 'knockout';
import globalize from 'globalize';
import 'cldr/unresolved';
import likelySubtags from 'cldr-data/supplemental/likelySubtags.json';
import numberingSystems from 'cldr-data/supplemental/numberingSystems.json';
import timeData from 'cldr-data/supplemental/timeData.json';
import weekData from 'cldr-data/supplemental/weekData.json';
import plurals from 'cldr-data/supplemental/plurals.json';
import caGregorian from 'cldr-data/main/en/ca-gregorian.json';
import numbers from 'cldr-data/main/en/numbers.json';
import timeZoneNames from 'cldr-data/main/en/timeZoneNames.json';
import messages from '../localization/messages/en.json';
import util from './util';
/**
 * Localization module that provides translation and localization services.
 */

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
  sr: { cldr: 'sr', plupload: 'sr' },
  sv: { cldr: 'sv', plupload: 'sv' },
  th: { cldr: 'th', plupload: 'th_TH' },
  tr: { cldr: 'tr', plupload: 'tr' },
  uk: { cldr: 'uk', plupload: 'uk_UA' },
  zh: { cldr: 'zh', plupload: 'zh_CN' },
  'zh-CN': { cldr: 'zh-Hans', plupload: 'zh_CN' },
  'zh-TW': { cldr: 'zh-Hant', plupload: 'zh_TW' },
};

let dateTimeFmt = '';

// Used to wrap text when in the TEST locale
// e.g. "#This is a localized string#"
const TEST_WRAPPER = '#';

// Used to wrap messages keys that do not have translated text when using
// the TEST locale e.g. "!!!Missing translation!!!"
const WARNING_WRAPPER = '!!!';

// CLDR localization root folder
const CLDR_DATA_URL = `${util.getBaseUrl()}/localization/cldr-data/`;

// folder containing translated strings
const LOCALIZATION_MESSAGES_URL = `${util.getBaseUrl()}/localization/messages/`;

const PLUPLOAD_I18N_URL = `${util.getBaseUrl()}/localization/plupload/i18n/`;

const DEFAULT_LOCALE = 'en';
const DEFAULT_DATETIME_FORMAT = 'MMMdHm';

const currentLocale = ko.observable();
const isTestLocale = ko.observable(false);
const loadedLocales = {};

const isLocaleSupported = locale => !!supportedLocales[locale];
const resolvePluploadFileName = locale => (isLocaleSupported(locale) ?
  `${supportedLocales[locale].plupload}.js` : 'en.js');
const resolveCldrFolderName = locale => (isLocaleSupported(locale) ?
  `${supportedLocales[locale].cldr}` : 'en');

const deepSpread = (target, ...sources) => {
  // it's not for general purposes but for spreading translation files
  const spread = (innerTarget, source, key) => {
    if (util.isObject(source)) {
      Object.keys(source).forEach((prop) => {
        if (util.isObject(innerTarget[prop])) {
          spread(innerTarget[prop], source[prop], prop);
        } else if (source[prop] !== undefined) {
          innerTarget[prop] = source[prop];
        }
      });
    } else if (key && source !== undefined
      && !util.isObject(innerTarget[key])) {
      innerTarget[key] = source;
    }
  };
  sources.forEach(source => spread(target, source));
  return target;
};

const getLowercaseKeyedObj = (obj, result = {}) => {
  Object.entries(obj).forEach(([k, v]) => {
    const key = k.toLowerCase();
    if (util.isObject(v)) {
      result[key] = getLowercaseKeyedObj(v);
    } else {
      result[key] = v;
    }
  });
  return result;
};

const locUtil = {

  /**
   * Gets the supported locale that most closely matches the requested
   * locale
   * @param locale The locale desired
   */
  getEffectiveLocale(locale) {
    if (isLocaleSupported(locale)) {
      return locale;
    }
    // normalize the locale code
    let effectiveLocale = (locale || DEFAULT_LOCALE).toLowerCase();
    if (effectiveLocale === 'test') {
      // special case for the test locale.  Use 'en'
      return DEFAULT_LOCALE;
    }

    if (!isLocaleSupported(effectiveLocale)) {
      // no exact match, try the language code
      [effectiveLocale] = effectiveLocale.split('-');
      return isLocaleSupported(effectiveLocale) ?
        effectiveLocale : DEFAULT_LOCALE;
    }

    return effectiveLocale;
  },


  /**
   * Changes the current locale.  Loads the supplemental data and locale
   * specific data if necessary
   * @param locale New locale ('en-US', 'es-ES', etc...)
   * @param translations The URL/JSON string of the translations
   * @param dateTimeFormat The date/time format for the locale
   */
  setCurrentLocale(locale, translations, dateTimeFormat) {
    dateTimeFmt = dateTimeFormat;

    const warningLocaleNotFound = 'There is no corresponding translation' +
     ` for locale "${locale}"!` +
     ` Falling back to the default locale "${DEFAULT_LOCALE}".`;

    const warningCLDRNotFound = 'Failed to load CLDR data for locale' +
     ` "${locale}"! Falling back to the default translation.`;

    const effectiveLocale = this.getEffectiveLocale(locale);
    isTestLocale(locale === 'TEST');

    // Load the plupload i18n script now.  Don't need to wait on this;
    // plupload will handle it.
    // Append the timestamp on the end to force re-execution of the script.
    const name = resolvePluploadFileName(effectiveLocale);
    const now = Date.now();
    $.getScript(`${PLUPLOAD_I18N_URL}${name}?timestamp=${now}`);

    if (loadedLocales[effectiveLocale]) {
      // this locale has already been loaded
      currentLocale(loadedLocales[effectiveLocale]);
    } else {
      let deferred = $.Deferred();
      if (translations && util.isObject(translations)) {
        deferred.resolve([translations]);
      } else if (translations && typeof translations === 'string') {
        deferred = $.getJSON(translations).then(
          data => $.Deferred().resolve([data]),
          () => $.Deferred().resolve([null]),
        );
      } else {
        deferred.resolve([undefined]);
      }

      // load the necessary language files
      const folderName = resolveCldrFolderName(effectiveLocale);
      const cldrBaseUrl = `${CLDR_DATA_URL}main/${folderName}/`;

      const deferreds = [
        deferred,
        $.getJSON(`${LOCALIZATION_MESSAGES_URL}${effectiveLocale}.json`).then(
          data => $.Deferred().resolve([data]),
          () => $.Deferred().resolve([null]),
        ),
        $.getJSON(`${cldrBaseUrl}ca-gregorian.json`),
        $.getJSON(`${cldrBaseUrl}numbers.json`),
        $.getJSON(`${cldrBaseUrl}timeZoneNames.json`),
      ];

      $.when(...deferreds)
        .done((translationSuiteXhr, builtinTranslationXhr, ...cldrXhrs) => {
          globalize.load(...cldrXhrs.map(cldrXhr => cldrXhr[0]));
          const translationSuite = translationSuiteXhr[0] || {};
          const builtinTranslation = builtinTranslationXhr[0] || {};

          const translation = deepSpread(
            {}, builtinTranslation, translationSuite,
          );

          if (!(locale in translation)) {
            // eslint-disable-next-line no-console
            console.warn(warningLocaleNotFound);
            return;
          }

          /*
            if the original translationSuite is
            { "zh-TW": { ...translations-for-zh-TW } }
            after the process below, it'll become
            { "zh-Hant": { ...translations-for-zh-TW } }
          */
          Object.keys(translation).forEach((key) => {
            // if the user set `locale=fr-CA`, it'll fallback to use `locale=fr`
            const el = this.getEffectiveLocale(key);
            const keyCldr = supportedLocales[el].cldr;
            translation[keyCldr] = getLowercaseKeyedObj(translation[key]);
            // we need to delete the unused key, otherwise, it will cause
            // some issues when calling globalize.loadMessages()
            if (keyCldr !== key) delete translation[key];
          });

          globalize.loadMessages({
            // eslint-disable-next-line max-len
            // https://github.com/globalizejs/globalize/blob/master/doc/api/message/load-messages.md#messages-inheritance
            root: getLowercaseKeyedObj(messages.en),
            ...translation,
          });
          this.updateCurrentLocaleOfKo(effectiveLocale);
        // eslint-disable-next-line no-console
        }).fail(() => console.warn(warningCLDRNotFound));
    }
  },

  /**
   * Update current locale of knockout
   *
   * @param {Object} effectiveLocale
   */
  updateCurrentLocaleOfKo(effectiveLocale, isDefalutLocale = false) {
    const cldrLocale = supportedLocales[effectiveLocale].cldr;
    const globalizeLocaleObject = globalize(cldrLocale);
    const localeSettings = {
      globalize: globalizeLocaleObject,
      locale: effectiveLocale,
    };
    if (!isDefalutLocale) {
      loadedLocales[effectiveLocale] = localeSettings;
    }
    currentLocale(localeSettings);
  },

  /**
   * Load 'en' cldr data.
   * If you want to load different locale data.
   * Modify the loading path in `define` function on the beginning of this file.
   */
  loadDefaultLocaleData() {
    globalize.load(likelySubtags, numberingSystems, timeData, weekData,
      caGregorian, numbers, timeZoneNames, plurals);
    globalize.loadMessages(getLowercaseKeyedObj(messages));

    this.updateCurrentLocaleOfKo(DEFAULT_LOCALE, true);
  },

  /**
   * Returns the currently selected locale
   */
  getCurrentLocale() {
    return currentLocale();
  },


  /**
   * Translates the given message into the current locale
   * @param message Message key defined in /localization/*.json
   * @param [variables] Optional. Extra variables for the localization
   * tokens
   * @returns {string} Translated text
   */
  formatMessage(message, variables) {
    if (this.getCurrentLocale()) {
      try {
        return this.getCurrentLocale().globalize.formatMessage(
          message, variables,
        );
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
  formatDateTime(date) {
    const format = dateTimeFmt || DEFAULT_DATETIME_FORMAT;
    // https://github.com/globalizejs/globalize#dateformatter-options-

    return this.getCurrentLocale().globalize.dateFormatter(
      { skeleton: format },
    )(date);
  },


  /**
   * Formats the given number for the current locale
   * @param n Number to format
   */
  formatNumber(n) {
    return typeof n === 'number' ?
      this.getCurrentLocale().globalize.formatNumber(n) :
      n;
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
  wrapTestLocale(translatedText, propertyName) {
    let textWrapper = '';

    // some properties, such as urls, won't work with the text wrapper.
    const safeProps = ['title', 'placeholder', 'html', 'value'];

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
  formatAndWrapMessage(message, variables, propertyName) {
    // format the variables if necessary
    const formattedVariables = {};

    if (variables) {
      Object.keys(variables).forEach((key) => {
        const value = variables[key];
        if ((typeof value) === 'number') {
          formattedVariables[key] = this.formatAndWrapNumber(
            value, propertyName,
          );
        } else if (value instanceof Date) {
          formattedVariables[key] = this.formatAndWrapDateTime(
            value, propertyName,
          );
        } else {
          formattedVariables[key] = value;
        }
      });
    }

    return this.wrapTestLocale(
      this.formatMessage(message.toLowerCase(), formattedVariables),
      propertyName,
    );
  },


  /**
   * Formats the given date to the current locale and wraps the text
   * if necessary.
   * @param d The Date to format
   * @param [propertyName] Optional. The HTML property being localized
   * @returns {*|string}
   */
  formatAndWrapDateTime(d, propertyName) {
    return this.wrapTestLocale(this.formatDateTime(d), propertyName);
  },


  /**
   * Formats the given number to the current locale and wraps the text
   * if necessary.
   * @param n The number to format
   * @param [propertyName] Optional. The HTML property being localized
   */
  formatAndWrapNumber(n, propertyName) {
    return this.wrapTestLocale(this.formatNumber(n), propertyName);
  },
};


/**
 * Knockout.js Binding handler to translate HTML elements.
 *
 * Examples:
 *
 * simple example:
 *   - translates the accounts/chooseAccount key
 *   <span data-bind='translate: "accounts/chooseAccount"'>
 *
 * more complex example:
 *   - translates the somekey key, specifying a variable used during the
 *     translation.
 *   - specifies that the translated text should go into the 'value'
 *     property.
 *   <input (data-bind='translate: {value: {
 *      message: "somekey", variables: { var1: somevariable }}}'>
 */
ko.bindingHandlers.translate = {
  update(element, valueAccessor) {
    const values = ko.utils.unwrapObservable(valueAccessor());

    if (values === null || values === undefined || values === '') {
      $(element).text('');
    } else if (values && typeof values === 'object') {
      Object.keys(values).forEach((property) => {
        const token = values[property] || {};
        const translatedText = locUtil.formatAndWrapMessage(
          token.message, token.variables, property,
        );

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
  },
};


/**
 * Knockout.js binding handler to translate dates in HTML elements.
 *
 * Example:
 * <span data-bind='formatDate: created'>
 */
ko.bindingHandlers.formatDate = {
  update(element, valueAccessor) {
    const dateString = ko.utils.unwrapObservable(valueAccessor());
    if (dateString) {
      const localizedDateString = locUtil.formatAndWrapDateTime(
        new Date(dateString.substring(0, 19)),
      );
      $(element).html(localizedDateString);
    } else {
      $(element).html('-');
    }
  },
};

export default locUtil;
