import React from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';

import fileExplorer from '../interface';
import { EVENT_HANDLERS, EVENT_HANDLER_MAPPING } from './constants';

const DefaultButton = ({
  onClick, title, fileExplorerType, disabled, className,
}) => (
  <button
    className={className}
    type="button"
    onClick={onClick}
    disabled={disabled}
  >
    {
      title
      || (fileExplorerType === 'chooser' ? 'Choose a file' : 'Save a file')
    }
  </button>
);

DefaultButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
  fileExplorerType: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

DefaultButton.defaultProps = {
  disabled: false,
  className: '',
  title: '',
};

const create = fileExplorerType => (WrappedComponent = DefaultButton) => {
  const isChooser = fileExplorerType === 'chooser';
  const useDefaultButton = WrappedComponent === DefaultButton;

  class Wrapper extends React.Component {
    constructor(props) {
      super(props);
      this.explorer = null;
      this.onWrappedCompClick = this.onWrappedCompClick.bind(this);
      this.initExplorer = this.initExplorer.bind(this);
      this.onRaw = this.onRaw.bind(this);
    }

    componentDidMount() {
      const { options } = this.props;
      this.initExplorer(options);
    }

    componentWillReceiveProps(nextProps) {
      const { options } = this.props;
      if (nextProps.options !== options) {
        this.explorer.destroy();
        this.initExplorer(nextProps.options);
      }
    }

    componentWillUnmount() {
      this.explorer.destroy();
    }

    onWrappedCompClick(...args) {
      const { onClick } = this.props;
      onClick(...args);
      if (isChooser) {
        this.explorer.choose();
      } else {
        this.explorer.save();
      }
    }

    onRaw({ action, data }) {
      const eventHandler = EVENT_HANDLER_MAPPING[action];
      // eslint-disable-next-line react/destructuring-assignment
      this.props[eventHandler](data);
    }

    initExplorer(options) {
      const deepClonedOptions = JSON.parse(JSON.stringify(options));
      const explorer = fileExplorer.explorer(deepClonedOptions);
      explorer.on('raw', this.onRaw);
      this.explorer = explorer;
    }

    render() {
      // do not pass options and event handlers to the wrapped component
      const { options, ...restProps } = this.props;
      EVENT_HANDLERS.forEach(eventHandler => delete restProps[eventHandler]);
      if (useDefaultButton) {
        restProps.fileExplorerType = fileExplorerType;
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
    WrappedComponent.displayName || WrappedComponent.name || fileExplorerType);
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
