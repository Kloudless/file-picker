/**
 * A helper to wrap File Picker React binding components with launch options
 * and global options editable.
 */
import React from 'react';
import { action } from '@storybook/addon-actions';
import { EVENTS, LOADER_E2E_SELECTORS } from '../../../src/constants';
import {
  TextInput, Grid, GridCell, TextArea,
} from './components';
import config from '../../config';

const { setGlobalOptions } = window.Kloudless.filePickerReact;

/**
 * A H.O.C to wrap the original File Picker Component.
 * Add some inputs to let users to enter specific options such as Kloudless App
 * ID.
 * @param {*} WrapperComponent - Chooser/Saver/Dropzone component.
 * @param {object=} storyOptions
 * @param {boolean=} storyOptions.isDropzone - true if it's a Dropzone
 *  component. Defaults to false.
 * @param {object=} storyOptions.launchOption - Launch options to launch
 *  File Picker. Defaults to DEFAULT_CHOOSER_OPTIONS or DEFAULT_SAVER_OPTIONS.
 * @param {object=} storyOptions.globalOptions - File Picker global options.
 *  Defaults to DEFAULT_GLOBAL_OPTIONS.
 */
const createStory = (WrappedComponent, storyOptions = {}) => {
  const { isDropzone = false } = storyOptions;
  const isSaver = !isDropzone && WrappedComponent.displayName.toLowerCase()
    .includes('saver');
  const defaultGlobalOptions = {
    ...config.DEFAULT_GLOBAL_OPTIONS,
    ...storyOptions.globalOptions,
  };
  let defaultLaunchOptions = storyOptions.launchOptions;
  if (!defaultLaunchOptions) {
    defaultLaunchOptions = (
      isSaver ? config.DEFAULT_SAVER_OPTIONS : config.DEFAULT_CHOOSER_OPTIONS
    );
  }
  class ToggleableComponent extends React.Component {
    // It's meaningless to render the File Picker component if necessary options
    // are invalid. Just render a button element or a empty dropzone area if
    // disabled is true.
    render() {
      const { disabled, ...restProps } = this.props;
      if (disabled) {
        if (isDropzone) {
          return (
            <div
              className="kloudless-dropzone-container"
              style={{
                width: '400px',
                height: '200px',
                color: 'rgb(158,158,158)',
                cursor: 'no-drop',
              }}>
              Please complete the form below to initialize the dropzone.
            </div>
          );
        }
        return (
          <button
            className="mdl-button mdl-js-button mdl-button--raised" disabled>
              Click to open the File Picker
          </button>
        );
      }
      return (
        <WrappedComponent
          // eslint-disable-next-line max-len
          className={`${LOADER_E2E_SELECTORS.J_LAUNCH_BTN} mdl-button mdl-js-button mdl-button--raised`}
          title="Click to open the File Picker"
          {...restProps}
        />);
    }
  }

  class Wrapper extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        launchOptions: JSON.stringify(
          defaultLaunchOptions,
          // exclude tokens
          (key, value) => (key === 'tokens' ? undefined : value),
          2,
        ),
        // TODO: Allow entering multiple tokens
        // just pick the first token
        token: (defaultLaunchOptions.tokens || [])[0] || '',
        baseUrl: defaultGlobalOptions.baseUrl || '',
        pickerUrl: defaultGlobalOptions.pickerUrl || '',
      };
      this.onChange = this.onChange.bind(this);
      this.onEvent = this.onEvent.bind(this);
      this.validate = this.validate.bind(this);
      this.actionEventHandlers = Object.values(EVENTS).reduce(
        (result, event) => {
          result[event] = action(event);
          return result;
        }, {},
      );
    }

    /**
     * Return an object to represent the error message of each field.
     * If no errors then returns an empty object.
     */
    validate() {
      const { launchOptions } = this.state;
      const errors = {};
      try {
        const jLaunchOptions = JSON.parse(launchOptions);
        if (!jLaunchOptions.app_id) {
          errors.launchOptions = 'Miss app_id.';
        }
        if (isSaver &&
            (!jLaunchOptions.files || jLaunchOptions.files.length === 0)) {
          errors.launchOptions = 'Miss files.';
        }
      } catch (err) {
        errors.launchOptions = 'Not a valid JSON string.';
      }

      ['baseUrl', 'pickerUrl'].forEach((key) => {
        try {
          // eslint-disable-next-line no-new
          new URL(this.state[key]);
        } catch (err) {
          errors[key] = 'Cannot parse this field as a URL.';
        }
      });
      return errors;
    }

    onChange(name, e) {
      const { value } = e.target;
      this.setState({ [name]: value });
    }

    onEvent(event, ...args) {
      this.actionEventHandlers[event](...args);
      if (window.puppeteerEventHandler) {
        window.puppeteerEventHandler(event, ...args);
      }
    }

    render() {
      const {
        baseUrl, pickerUrl, token, launchOptions,
      } = this.state;
      const errors = this.validate();
      const hasError = Object.keys(errors).length > 0;
      let jOptions = {};
      if (!hasError) {
        setGlobalOptions({ baseUrl, pickerUrl });
        jOptions = JSON.parse(launchOptions);
        if (token) {
          jOptions.tokens = [token];
        }
      }

      return (
        <Grid>
          <GridCell>
            <ToggleableComponent
              disabled={hasError}
              options={jOptions}
              onSuccess={this.onEvent.bind(null, 'success')}
              onCancel={this.onEvent.bind(null, 'cancel')}
              onError={this.onEvent.bind(null, 'error')}
              onOpen={this.onEvent.bind(null, 'open')}
              onLoad={this.onEvent.bind(null, 'load')}
              onClose={this.onEvent.bind(null, 'close')}
              onSelected={this.onEvent.bind(null, 'selected')}
              onAddAccount={this.onEvent.bind(null, 'addAccount')}
              onDeleteAccount={this.onEvent.bind(null, 'deleteAccount')}
              onStartFileUpload={this.onEvent.bind(null, 'startFileUpload')}
              onFinishFileUpload={this.onEvent.bind(null, 'finishFileUpload')}
              onLogout={this.onEvent.bind(null, 'logout')}
              // Dropzone specific props
              onDrop={this.onEvent.bind(null, 'drop')}
              width={400}
              height={200}
            />
          </GridCell>
          <GridCell>
            <Grid>
              <GridCell width={6}>
                <h6>Launch Options</h6>
                <TextInput
                  // TODO: allow entering multiple tokens
                  type="password"
                  name="token" title="Kloudless Account Token" value={token}
                  onChange={this.onChange}
                  error={errors.token}/>
                <TextArea
                  name="launchOptions" title="Other Launch Options"
                  value={launchOptions}
                  onChange={this.onChange}
                  error={errors.launchOptions} />
              </GridCell>
              <GridCell width={6}>
                <h6>Global Options</h6>
                <TextInput
                  name="baseUrl" title="Kloudless API Server URL"
                  value={baseUrl} onChange={this.onChange}
                  error={errors.baseUrl}/>
                <TextInput
                  name="pickerUrl" title="Picker iframe URL" value={pickerUrl}
                  onChange={this.onChange}
                  error={errors.pickerUrl}/>
              </GridCell>
            </Grid>
          </GridCell>
        </Grid>
      );
    }
  }

  // Set display name
  Wrapper.displayName = (
    `createStory(${WrappedComponent.displayName})`);
  return Wrapper;
};

const createDropzoneStory = (WrappedComponent, storyOptions = {}) => (
  createStory(WrappedComponent, { ...storyOptions, isDropzone: true })
);

export { createDropzoneStory, createStory };

export default createStory;
