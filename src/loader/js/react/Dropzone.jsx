import React from 'react';
import PropTypes from 'prop-types';
import filePicker from '../interface';
import {
  DROPZONE_EVENT_HANDLER_MAPPING,
  DROPZONE_EVENT_HANDLERS,
} from './constants';

class Dropzone extends React.Component {
  constructor(props) {
    super(props);
    this.onRaw = this.onRaw.bind(this);
    this.dropzone = null;
    this.elementId = `dz-${Math.floor(Math.random() * (10 ** 12))}`;
    this.initDropzone = this.initDropzone.bind(this);
  }

  componentDidMount() {
    const { options } = this.props;
    this.initDropzone(options);
  }

  componentWillReceiveProps(nextProps) {
    const { options } = this.props;
    if (options !== nextProps.options) {
      this.dropzone.destroy();
      this.initDropzone(nextProps.options);
    }
  }

  componentWillUnmount() {
    this.dropzone.destroy();
  }

  onRaw({ action, data }) {
    const eventHandler = DROPZONE_EVENT_HANDLER_MAPPING[action];
    this.props[eventHandler](data); // eslint-disable-line
  }

  initDropzone(options) {
    this.dropzone = filePicker.dropzone({
      ...options,
      elementId: this.elementId,
    });
    this.dropzone.on('raw', this.onRaw);
  }

  render() {
    const { height, width } = this.props;
    return (
      <div
        id={this.elementId}
        style={{ height: `${height}px`, width: `${width}px` }}
      />
    );
  }
}

// set prop type
Dropzone.propTypes = {
  ...DROPZONE_EVENT_HANDLERS.reduce((result, key) => {
    result[key] = PropTypes.func;
    return result;
  }, {}),
  options: PropTypes.shape({
    app_id: PropTypes.string.isRequired,
  }).isRequired,
  onSuccess: PropTypes.func.isRequired, // eslint-disable-line
  height: PropTypes.number,
  width: PropTypes.number,
};

// set default props
Dropzone.defaultProps = {
  ...DROPZONE_EVENT_HANDLERS.reduce((result, key) => {
    result[key] = () => { };
    return result;
  }, {}),
  height: 100,
  width: 600,
};

export default Dropzone;
