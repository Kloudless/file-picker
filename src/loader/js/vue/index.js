import { createChooser, createSaver } from './creators';
import Dropzone from './Dropzone';
import fileExplorer from '../interface';

const Chooser = createChooser();
const Saver = createSaver();

// named export
export {
  createChooser, createSaver, Chooser, Saver, Dropzone,
};

export const { getGlobalOptions, setGlobalOptions } = fileExplorer;

// default export
export default {
  createChooser,
  createSaver,
  Chooser,
  Saver,
  Dropzone,
  getGlobalOptions,
  setGlobalOptions,
};
