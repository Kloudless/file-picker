import React from 'react';
import { createStory, createDropzoneStory } from './core';

const { filePickerReact } = window.Kloudless;

export default {
  title: 'Basic',
};

const ChooserStory = createStory(filePickerReact.Chooser);
const SaverStory = createStory(filePickerReact.Saver);
const DropzoneStory = createDropzoneStory(filePickerReact.Dropzone);

export const Chooser = () => <ChooserStory></ChooserStory>;
export const Saver = () => <SaverStory></SaverStory>;
export const Dropzone = () => <DropzoneStory></DropzoneStory>;
