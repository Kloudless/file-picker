/* eslint-disable react/prop-types */
import React from 'react';
import {
  object, text, boolean, number,
} from '@storybook/addon-knobs';
import {
  DROPZONE_EVENT_HANDLER_MAPPING,
  EVENT_HANDLER_MAPPING,
} from '../../src/loader/js/react/constants';

const APP_ID = (process.env.STORYBOOK_KLOUDLESS_APP_ID
  || 'J2hLI4uR9Oj9_UiJ2Nnvhj9k1SxlZDG3xMtAQjvARvgrr3ie');

function genOptions(name) {
  const options = { app_id: APP_ID };
  if (name === 'Saver' || name === 'createSaver') {
    options.files = [
      {
        url: 'https://s3-us-west-2.amazonaws.com/static-assets.kloudless.com/logo_mark.png',
        name: 'kloudless-logo.png',
      },
    ];
  }
  return object(`(${name}) options`, options, name);
}

function genEventHandlers(name) {
  const eventHandlerMapping = name === 'Dropzone'
    ? DROPZONE_EVENT_HANDLER_MAPPING : {
      ...EVENT_HANDLER_MAPPING,
      click: 'onClick',
    };
  return Object.keys(eventHandlerMapping).reduce((result, event) => {
    const eventHandler = eventHandlerMapping[event];
    result[eventHandler] = (...args) => {
      console.log(`(${name}) ${eventHandler} called:`);
      console.dir(args);
    };
    return result;
  }, {});
}

export function GreenButton({ onClick }) {
  return (
    <button
      className="btn btn-success"
      type="button"
      onClick={onClick}
    >
      Green Button
    </button>
  );
}

export function genProps(name) {
  const props = {
    options: genOptions(name),
    ...genEventHandlers(name),
  };
  if (name === 'Saver' || name === 'Chooser') {
    props.className = text(
      `(${name}) className`, 'btn btn-outline-dark', name,
    );
    props.disabled = boolean(`(${name}) disabled`, false, name);
    props.title = text(
      `(${name}) title`,
      name === 'Saver' ? 'test saver' : 'test chooser',
      name,
    );
  } else if (name === 'Dropzone') {
    props.height = number(`(${name}) height`, 100, {}, name);
    props.width = number(`(${name}) width`, 600, {}, name);
  }
  return props;
}
