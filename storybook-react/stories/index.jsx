
/* eslint-disable react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { configureReadme } from 'storybook-readme';
import reactReadme from '../../README.react.md';
import footerReadme from '../../storybook-common/README.footer.md';

import {
  Dropzone, Chooser, Saver, createChooser, createSaver,
} from '../../src/loader/js/react';
import { genProps, GreenButton } from './helpers';

const stories = storiesOf('File Picker with React', module);

const GreenSaver = createSaver(GreenButton);
const GreenChooser = createChooser(GreenButton);

configureReadme({
  DocPreview: ({ children }) => (
    <div className="p-3">{children}</div>
  ),
  StoryPreview: ({ children }) => (
    <div className="jumbotron ml-3 mr-3">{children}</div>
  ),
  FooterPreview: ({ children }) => (
    <div className="p-3">{children}</div>
  ),
  footer: footerReadme,
});

stories.addDecorator(withKnobs);
stories.addParameters({ readme: { content: reactReadme } });

stories.add('Chooser/Saver/createSaver/createChooser', () => (
  <div>
    <div>
      <ul className="list-unstyled">
        You can play with the buttons below and see how it works in the
        right panel:
        <li>
          <strong>Knobs </strong>
          edit props (ex: config.scope, config.client_id)
        </li>
        <li>
          <strong>Actions </strong>
          print logs and arguments of callback functions
        </li>
        <li>
          <strong>* </strong>
          We use bootstrap CSS here for demonstration
        </li>
      </ul>
    </div>
    <div className="mb-3">
      <h4>Chooser Example</h4>
      <div>
        <Chooser {...genProps('Chooser')} />
      </div>
    </div>
    <div className="mb-3">
      <h4>createChooser Example</h4>
      <div>
        <GreenChooser {...genProps('createChooser')} />
      </div>
    </div>
    <div className="mb-3">
      <h4>Saver Example</h4>
      <div>
        <Saver {...genProps('Saver')} />
      </div>
    </div>
    <div className="mb-3">
      <h4>createSaver Example</h4>
      <div>
        <GreenSaver {...genProps('createSaver')} />
      </div>
    </div>
  </div>
));

stories.add('Dropzone', () => (
  <div>
    <div>
      <ul className="list-unstyled">
      You can play with the buttons below and see how it works in right panel:
        <li>
          <strong>Knobs </strong>
          edit props (ex: config.scope, config.client_id)
        </li>
        <li>
          <strong>Actions </strong>
          print logs and arguments of callback functions
        </li>
        <li>
          <strong>* </strong>
          We use bootstrap CSS here for demonstration
        </li>
      </ul>
    </div>
    <div>
      <h4>Dropzone Example</h4>
      <div>
        <Dropzone {...genProps('Dropzone')} />
      </div>
    </div>
  </div>
));
