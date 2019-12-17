import { createChooser, createSaver } from './creators';
import Dropzone from './Dropzone';
import fileExplorer from '../interface';

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

export const { setGlobalOptions, getGlobalOptions } = fileExplorer;

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
