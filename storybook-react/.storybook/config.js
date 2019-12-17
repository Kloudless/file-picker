import { configure, addParameters, addDecorator } from '@storybook/react';
import '@storybook/addon-console';
import { addReadme } from 'storybook-readme';

addParameters({
  options: {
    name: 'Kloudless File Picker',
    addonPanelInRight: false,
    showStoriesPanel: true
  }
});
addDecorator(addReadme);

function loadStories() {
  require('../stories/index.jsx');
}

configure(loadStories, module);