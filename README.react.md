# React components for the Kloudless File Picker

This project is a thin React wrapper around the
[Kloudless File Picker](https://github.com/kloudless/file-picker). We
provide the following components to add the File Picker to any React app:
- `Chooser`:
  A button component that will launch the Chooser when clicked.
- `createChooser`:
  A higher-order component that accepts your custom component and wraps it in a
  new one that launches the Chooser.
- `Saver`:
  A button component that will launch the Saver when clicked.
- `createSaver`:
  A higher-order component that accepts your custom component and wraps it in a
  new one that launches the Saver.
- `Dropzone`:
  A Dropzone component that will launch the Chooser when clicked or launch the
  Saver when files are dropped into it.

Supports React v15 and v16.

<!-- STORY -->

<!-- STORY HIDE START -->

[DEMO](https://kloudless.github.io/file-picker/react)

<!-- STORY HIDE END -->

## Table of contents

* [Installation](#installation)
* [How It Works](#how-it-works)
  * [Chooser](#chooser)
    * [Example](#example)
  * [createChooser](#createchooser)
    * [Example](#example-1)
  * [Saver](#saver)
    * [Example](#example-2)
  * [createSaver](#createsaver)
    * [Example](#example-3)
  * [Dropzone](#dropzone)
    * [Example](#example-4)
* [Props](#props)
* [Event Handlers](#event-handlers)
* [Set/Get Global Options](#setget-global-options)
* [Testing](#testing)

## Installation

```shell
npm install @kloudless/file-picker
```

## How It Works

### Chooser

A button component that wraps the
[Chooser](https://github.com/kloudless/file-picker#chooser) view of the File
Picker and will launch the Chooser when clicked.

#### Example

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { Chooser } from '@kloudless/file-picker/react';

ReactDOM.render(
  <Chooser
    className="CSS_CLASS_NAME"
    disabled={false}
    title="Choose a file"
    options={{ app_id: 'YOUR_KLOUDLESS_APP_ID' }}
    onSuccess={(result) => console.log('success', result)} />,
  document.getElementById('root'),
);
```

### createChooser

A higher-order component
([HOC](https://facebook.github.io/react/docs/higher-order-components.html))
that transforms your custom component into a new one that launches the Chooser.
It will add a transparent component layer that will hack the `onClick` event
handler. The hacked one will be passed to the wrapped component and launch the
Chooser when being called.

All the properties except `options` and the [event handlers](#event-handlers)
passed to the new component will be passed to the wrapped component.

#### Example

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { createChooser } from '@kloudless/file-picker/react';
import CustomButton from 'path/to/CustomButton';

// First, wrap you custom component
// Your custom component should accept onClick and call it to launch the Chooser.
const CustomChooser = createChooser(CustomButton);

ReactDOM.render(
  <CustomChooser
    options={{ app_id: 'YOUR_KLOUDLESS_APP_ID' }}
    onSuccess={(result) => console.log('success', result)}
  />,
  document.getElementById('root'),
);
```

### Saver

A button component that wraps the
[Saver](https://github.com/kloudless/file-picker#saver) view of the File
Picker and will launch the Saver when clicked.

#### Example

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { Saver } from '@kloudless/file-picker/react';

ReactDOM.render(
  <Saver
    className="CSS_CLASS_NAME"
    disabled={false}
    title="Save a file"
    options={{
      app_id: 'YOUR_KLOUDLESS_APP_ID',
      files: [{ url: 'http://file.url', name: 'filename.jpg' }]
    }}
    onSuccess={(result) => console.log('success', result)} />,
  document.getElementById('root'),
);
```

### createSaver

A higher-order component (HOC) that accepts your custom component and wraps it
in a new one that launches the Saver.
It will add a transparent component layer that will hack the `onClick` event
handler. The hacked one will be passed to the wrapped component and launch the
Saver when being called.

All the properties except `options` and the [event handlers](#event-handlers)
passed to the new component will be passed to the wrapped component.

#### Example

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { createSaver } from '@kloudless/file-picker/react';
import CustomButton from 'path/to/CustomButton';

// First, wrap your custom component.
// Your custom component should accept onClick and call it to launch the Saver.
const CustomSaver = createSaver(CustomButton);

ReactDOM.render(
  <CustomSaver
    options={{
      app_id: 'YOUR_KLOUDLESS_APP_ID',
      files: [{ url: 'http://file.url', name: 'filename.jpg' }]
    }}
    onSuccess={(result) => console.log('success', result)}
  />,
  document.getElementById('root'),
);
```

### Dropzone

A [Dropzone](https://github.com/kloudless/file-picker#dropzone) component that
will launch the Chooser when clicked or launch the Saver when files are dropped
into it.

#### Example

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { Dropzone } from '@kloudless/file-picker/react';

ReactDOM.render(
  <Dropzone
    options={{ app_id: 'YOUR_KLOUDLESS_APP_ID' }}
    onSuccess={(result) => console.log('success', result)}
    height={100}
    width={600}
  />,
  document.getElementById('root'),
);
```

## Props

- `options` _(Required)_
  An object used to configure the File Picker. Requires the Kloudless App ID
  at minimum. Refer to the full [File Picker Configuration](https://github.com/kloudless/file-picker#configuration)
  for more details on all possible configuration parameters.
- `className` _(Optional)_
  CSS class that apply to `Saver` or `Chooser`.
  Defaults to an empty string.
- `title`  _(Optional)_
  The text shown on the button for `Chooser` or `Saver`.
  Default value: `Save a file` for `Saver`; `Choose a file` for `Chooser`.
- `disabled` _(Optional)_
  Set `true` to disable `Saver` or `Chooser`.
  Defaults to `false`.
- `height` _(Optional)_
  Dropzone height. Defaults to 100px.
- `width` _(Optional)_
  Dropzone width. Defaults to 600px.

## Event Handlers

Supports all the events that are listed in
[Events](https://github.com/kloudless/file-picker#events).
The event handler's name is in following format: `on{EventName}`.
For example, `onSuccess` is the event handler for the success event.
`onError` is the event handler for the error event, etc.

In addition, we support the `onClick` event handler:

- `onClick`
  Called when either the Saver, Chooser, or Dropzone is clicked.

## Set/Get Global Options

```javascript
import { setGlobalOptions, getGlobalOptions } from '@kloudless/file-picker/react';

setGlobalOptions({...});
getGlobalOptions();
```

The returned data and parameters are the same as for
`filePicker.setGlobalOptions()` and `filePicker.getGlobalOptions()`.
Please refer to the
[File Picker Methods](https://github.com/kloudless/file-picker#methods)
for more details.

## Testing

First, install dependencies as shown below. This only needs to be
done once:
```shell
$ npm install --prefix storybook-react/
```

Then, start up the testing server:
```shell
$ npm run storybook:react
```

The testing server uses a default
[Kloudless App ID](https://developers.kloudless.com/applications/*/details).
To connect accounts to your own Kloudless app, you can change the ID either via
the interactive storybook UI or via an environment variable as shown below:

```shell
# ABC123 is the App ID
$ STORYBOOK_KLOUDLESS_APP_ID=ABC123 npm run storybook:react
```
