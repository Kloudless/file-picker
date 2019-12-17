import React from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';

import filePicker from '../interface';
import { EVENT_HANDLERS, EVENT_HANDLER_MAPPING } from './constants';

const DefaultButton = (props) => {
  const {
    onClick, title, filePickerType, disabled, className,
  } = props;
  return (
    <button
      className={className}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {
        title ||
        (filePickerType === 'chooser' ? 'Choose a file' : 'Save a file')
      }
    </button>
  );
};

DefaultButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
  filePickerType: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

DefaultButton.defaultProps = {
  disabled: false,
  className: '',
  title: '',
};

const create = filePickerType => (WrappedComponent = DefaultButton) => {
  const isChooser = filePickerType === 'chooser';
  const useDefaultButton = WrappedComponent === DefaultButton;

  class Wrapper extends React.Component {
    constructor(props) {
      super(props);
      this.picker = null;
      this.onWrappedCompClick = this.onWrappedCompClick.bind(this);
      this.initPicker = this.initPicker.bind(this);
      this.onRaw = this.onRaw.bind(this);
    }

    componentDidMount() {
      const { options } = this.props;
      this.initPicker(options);
    }

    componentWillReceiveProps(nextProps) {
      const { options } = this.props;
      if (nextProps.options !== options) {
        this.picker.destroy();
        this.initPicker(nextProps.options);
      }
    }

    componentWillUnmount() {
      this.picker.destroy();
    }

    onWrappedCompClick(...args) {
      const { onClick } = this.props;
      onClick(...args);
      if (isChooser) {
        this.picker.choose();
      } else {
        this.picker.save();
      }
    }

    onRaw({ action, data }) {
      const eventHandler = EVENT_HANDLER_MAPPING[action];
      // eslint-disable-next-line react/destructuring-assignment
      this.props[eventHandler](data);
    }

    initPicker(options) {
      const deepClonedOptions = JSON.parse(JSON.stringify(options));
      if (options.oauth) {
        deepClonedOptions.oauth = options.oauth;
      }
      const picker = filePicker.picker(deepClonedOptions);
      picker.on('raw', this.onRaw);
      this.picker = picker;
    }

    render() {
      // do not pass options and event handlers to the wrapped component
      const { options, ...restProps } = this.props;
      EVENT_HANDLERS.forEach(eventHandler => delete restProps[eventHandler]);
      if (useDefaultButton) {
        restProps.filePickerType = filePickerType;
      }
      return (
        <WrappedComponent
          {...restProps}
          onClick={this.onWrappedCompClick}
        />
      );
    }
  }

  // Set display name
  const displayName = (
    WrappedComponent.displayName || WrappedComponent.name || filePickerType);
  Wrapper.displayName = (
    `create${isChooser ? 'Chooser' : 'Saver'}(${displayName})`);

  // hoist non-react static methods
  hoistNonReactStatics(Wrapper, WrappedComponent);

  // set prop type
  Wrapper.propTypes = {
    ...EVENT_HANDLERS.reduce((result, key) => {
      result[key] = PropTypes.func;
      return result;
    }, {}),
    options: PropTypes.shape({
      app_id: PropTypes.string.isRequired,
    }).isRequired,
    onSuccess: PropTypes.func.isRequired,
  };

  // set default props
  Wrapper.defaultProps = {
    onClick: () => { },
    ...EVENT_HANDLERS.reduce((result, key) => {
      result[key] = () => { };
      return result;
    }, {}),
  };

  return Wrapper;
};

export const createChooser = create('chooser');
export const createSaver = create('saver');

export default {
  createChooser,
  createSaver,
};
