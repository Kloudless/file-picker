import { configure, addParameters, addDecorator } from '@storybook/vue';
import { addReadme } from 'storybook-readme/vue';

addParameters({
  options: {
    name: 'Kloudless File Explorer',
    addonPanelInRight: true,
    showStoriesPanel: false
  }
});

addDecorator(addReadme);

function loadStories() {
  require('../stories/index.js');
}

configure(loadStories, module);
