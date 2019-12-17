import { storiesOf } from '@storybook/vue';
import { withKnobs } from '@storybook/addon-knobs';
import { configureReadme } from 'storybook-readme';
import vueReadme from '../../README.vue.md';
import footerReadme from '../../storybook-common/README.footer.md';

import {
  createChooser, createSaver, Chooser, Saver, Dropzone,
} from '../../src/loader/js/vue';
import {
  CustomButton,
  HintComponent,
  createExampleElement,
  genProps,
} from './helper';

/**
 * constants
 */
const APP_ID = (
  process.env.STORYBOOK_KLOUDLESS_APP_ID
  || 'Ydwe2dlIONXa66YL7Hm0yZwdykjvwQRihlTDdwuvUQ_Il_Sx');

const OPTIONS = {
  app_id: APP_ID,
};

const FILES = [{
  url: 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/logo_mark.png',
  name: 'kloudless-logo.png',
}];

const COMPONENTS = [
  {
    name: 'Chooser',
    component: Chooser,
    props: {
      options: { ...OPTIONS },
      title: 'test chooser',
    },
    attrs: {
      class: 'btn btn-outline-dark',
      disabled: false,
    },
  },
  {
    name: 'createChooser',
    component: createChooser(CustomButton),
    props: {
      options: { ...OPTIONS },
    },
    attrs: {
      class: 'btn btn-success',
      disabled: false,
    },
  },
  {
    name: 'Saver',
    component: Saver,
    props: {
      options: { ...OPTIONS, files: FILES },
      title: 'test saver',
    },
    attrs: {
      class: 'btn btn-outline-dark',
      disabled: false,
    },
  },
  {
    name: 'createSaver',
    component: createSaver(CustomButton),
    props: {
      options: { ...OPTIONS, files: FILES },
    },
    attrs: {
      class: 'btn btn-success',
      disabled: false,
    },
  },
];

const stories = storiesOf('Kloudless File Picker with Vue', module);

/**
 * Configure storybook
 */
configureReadme({ footer: footerReadme });
stories.addDecorator(withKnobs);
stories.addParameters({
  readme: {
    content: vueReadme,
    DocPreview: {
      template: '<div class="p-3"><slot></slot></div>',
    },
    StoryPreview: {
      template: '<div class="jumbotron m-3"><slot></slot></div>',
    },
    FooterPreview: {
      template: '<div class="mt-3"><slot></slot></div>',
    },
  },
});

stories.add('Chooser/Saver/createSaver/createChooser', () => ({
  props: genProps(COMPONENTS),
  render(createElement) {
    return createElement(
      'div',
      [
        createElement(HintComponent),
        ...COMPONENTS.map(createExampleElement.bind(this, createElement)),
      ],
    );
  },
}));

const COMPONENTS2 = [{
  name: 'Dropzone',
  component: Dropzone,
  props: {
    options: { ...OPTIONS },
  },
  attrs: {},
}];

stories.add('Dropzone', () => ({
  props: genProps(COMPONENTS2),
  render(createElement) {
    return createElement(
      'div',
      [
        createElement(HintComponent),
        ...COMPONENTS2.map(createExampleElement.bind(this, createElement)),
      ],
    );
  },
}));
