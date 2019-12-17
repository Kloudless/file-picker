import { createChooser, createSaver } from './creators';
import Dropzone from './Dropzone';
import filePicker from '../interface';

const Saver = createSaver();
const Chooser = createChooser();

// named exports
export {
  createChooser,
  createSaver,
  Saver,
  Chooser,
  Dropzone,
};

export const { setGlobalOptions, getGlobalOptions } = filePicker;

// default exports
export default {
  createChooser,
  createSaver,
  Saver,
  Chooser,
  Dropzone,
  setGlobalOptions,
  getGlobalOptions,
};
