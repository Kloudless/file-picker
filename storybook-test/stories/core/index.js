import React from 'react';
import { action } from '@storybook/addon-actions';
import { TextInput, Grid, GridCell } from './components';

const { setGlobalOptions } = window.Kloudless.filePickerReact;

const DEFAULT_OPTIONS = {
  // Global Options
  BASE_URL: 'https://api.kloudless.com',
  PICKER_URL: `${window.location.origin}/picker/index.html`,
  // Options
  KLOUDLESS_APP_ID: '',
};

// Override default options if they are defined in environment variables.
Object.keys(DEFAULT_OPTIONS).forEach((option) => {
  const value = process.env[`STORYBOOK_${option}`];
  if (value) {
    DEFAULT_OPTIONS[option] = value;
  }
});

const SAVER_FILES_OPTION = [
  {
    url: 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/'
          + 'static/kloudless-logo-white.png',
    name: 'kloudless-logo.png',
  },
];

/**
 * A H.O.C to wrap the original File Picker Component.
 * Add some inputs to let users to enter specific options such as Kloudless App
 * ID.
 * @param {*} WrapperComponent - Chooser/Saver/Dropzone component.
 * @param {boolean} isDropzone - true if it's a Dropzone component.
 */
const createStory = (WrappedComponent, isDropzone = false) => {
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
          className="mdl-button mdl-js-button mdl-button--raised"
          title="Click to open the File Picker"
          {...restProps}
        />);
    }
  }

  class Wrapper extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        appId: DEFAULT_OPTIONS.KLOUDLESS_APP_ID,
        baseUrl: DEFAULT_OPTIONS.BASE_URL,
        pickerUrl: DEFAULT_OPTIONS.PICKER_URL,
      };
      this.handleChange = this.handleChange.bind(this);
      this.validate = this.validate.bind(this);
    }

    /**
     * Return an object to represent the error message of each field.
     * If no errors then returns an empty object.
     */
    validate() {
      const { appId } = this.state;
      const errors = {};
      if (!appId) {
        errors.appId = 'This field is required.';
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

    handleChange(name, e) {
      const { value } = e.target;
      this.setState({ [name]: value });
    }

    render() {
      const {
        appId, baseUrl, pickerUrl,
      } = this.state;
      const errors = this.validate();
      const hasError = Object.keys(errors).length > 0;
      if (!hasError) {
        setGlobalOptions({ baseUrl, pickerUrl });
      }
      const { options } = this.props;
      return (
        <Grid>
          <GridCell>
            <ToggleableComponent
              disabled={hasError}
              options={{
                app_id: appId,
                // files is specific to Saver.
                files: SAVER_FILES_OPTION,
                ...options,
              }}
              onSuccess={action('success')}
              onCancel={action('cancel')}
              onError={action('error')}
              onOpen={action('open')}
              onLoad={action('load')}
              onClose={action('close')}
              onSelected={action('selected')}
              onAddAccount={action('addAccount')}
              onDeleteAccount={action('deleteAccount')}
              onStartFileUpload={action('startFileUpload')}
              onFinishFileUpload={action('finishFileUpload')}
              onLogout={action('logout')}
              // Dropzone specific props
              onDrop={action('onDrop')}
              width={400}
              height={200}
            />
          </GridCell>
          <GridCell>
            <Grid>
              <GridCell width={6}>
                <h6>Options</h6>
                <TextInput
                  name="appId" title="Kloudless App ID" value={appId}
                  onChange={this.handleChange}
                  error={errors.appId}/>
              </GridCell>
              <GridCell width={6}>
                <h6>Global Options</h6>
                <TextInput
                  name="baseUrl" title="Kloudless API Server URL"
                  value={baseUrl} onChange={this.handleChange}
                  error={errors.baseUrl}/>
                <TextInput
                  name="pickerUrl" title="Picker iframe URL" value={pickerUrl}
                  onChange={this.handleChange}
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

const createDropzoneStory = WrappedComponent => (
  createStory(WrappedComponent, true)
);

export { createDropzoneStory, createStory };

export default createStory;
