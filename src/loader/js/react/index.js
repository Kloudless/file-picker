import { createChooser, createSaver } from './creators';
import Dropzone from './Dropzone';

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

// default exports
export default {
  createChooser,
  createSaver,
  Saver,
  Chooser,
  Dropzone,
};
