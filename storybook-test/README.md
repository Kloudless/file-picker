## Introduction

This project uses Storybook to test out the File Picker's various modes and
options. The Storybook stories help with both development as well as manual and
automated testing.

We use the File Picker React wrapper accessible at
`window.Kloudless.filePickerReact` to write stories. To use the Vue wrapper
instead, use  `window.Kloudless.filePickerVue`. In addition,
`window.Kloudless.filePicker` can be used to access the regular JavaScript File
Picker interface.

## Install

Clone this repository, and then run:

```
npm ci --prefix=storybook-test/
```

## How to Run Storybook

In the project root, run the following commands in separate terminal windows:

- Build the File Picker's "loader" and "picker" resources in watch mode.
  ```
  npm run build:dev -- --watch
  ```

- Start the Storybook server to host the loader and picker resources, as well
  as stories.
  ```
  npm run storybook:test
  ```
  This will watch for any changes to stories and reload the code when the
  stories update.
  
  **Note**: The Storybook server won't reload if the File Picker's loader 
  or picker source code updates. That would require refreshing the page to load
  the latest File Picker build.
  

## How to Write Stories

As the Storybook v5 documentation says:
> A Storybook is a collection of stories. Each story represents a single visual
  state of a component.
>
> Technically, a story is a function that returns something that can be rendered
  to a screen.

1. In `stories/`, create a file named `X.stories.js`, `X` can be any name.

2. Import the File Picker component you want to test from
  `window.Kloudless.filePickerReact`. For example:

```javascript
const { Chooser } = window.Kloudless.filePickerReact;
```

3. Use `createStory()` to wrap the File Picker component. `createStory()`
  helps to handle events and input fields of global options, as well as required
  options such as the Kloudless App ID.

```javascript
import { createStory } from './core';
const WrappedChooser = createStory(Chooser);
```

4. Use the wrapped component the same way you would use the original component.
  Check [our docs](../README.react.md) for more information on our React
  component.

Check [stories/basic.stories.js](./stories/basic.stories.js) for an example.

## How to Specify Global Options and an alternate Kloudless APP ID

Inputs on the stories enable you to use your own Kloudless App ID.

In addition, the Base API Server URL and the File Picker URL may be different
for Kloudless Enterprise servers that are self-hosted. Therefore, these may be
customized as well.

By default, the base URL points to `https://api.kloudless.com` and the picker
URL points to the Storybook server. Customize these values by running the
Storybook commands above in the context of the following environment variables:

- `STORYBOOK_KLOUDLESS_APP_ID`: Set the default Kloudless App ID
- `STORYBOOK_PICKER_URL`: Set the URL the loader loads the File Picker iframe
   from.
- `STORYBOOK_BASE_URL`: Set the default API Server base URL.
