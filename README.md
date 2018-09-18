# Kloudless File Explorer

The [Kloudless](https://kloudless.com) File Explorer is a JavaScript library
that allows your users to browse and select files and folders from their
storage services. It comes in two modes: a chooser and a saver.

[Visit our JSBin example of the File Explorer!](https://output.jsbin.com/wilowep/)

![fe.gif](http://i.imgur.com/xO2QcyD.gif)

## Table of Contents
* [Usage](#usage)
    * [Chooser](#chooser)
      * [Dropzone](#dropzone)
    * [Saver](#saver)
    * [Configuration](#configuration)
      * [Script Tag](#script-tag)
      * [Chooser and Saver](#chooser-and-saver)
      * [Chooser options](#chooser-options)
      * [Saver options](#saver-options)
    * [Events](#events)
    * [Methods](#methods)
    * [Example](#example)
    * [Dropzone](#dropzone-1)
      * [Configuration](#configuration-1)
      * [Methods](#methods-1)
      * [Example](#example-1)
* [Browser Support](#browser-support)
* [Contributing](#contributing)
    * [Building](#building)
    * [Testing](#testing)
* [Self-hosting](#self-hosting)
* [Misc. Development Notes](#misc-development-notes)
* [Security Vulnerabilities](#security-vulnerabilities)
* [Support](#support)

## Usage

Embedding the Kloudless javascript library will expose a global
`Kloudless` object. The JS file is currently hosted on S3 and can be embedded
in your page using this tag:

```html
<script type="text/javascript"
 src="https://static-cdn.kloudless.com/p/platform/sdk/kloudless.explorer.js"></script>
```

You can then create an element on the page to launch the explorer.

```html
<script type="text/javascript">
  var explorer = window.Kloudless.explorer({
    // Explorer Initialization options here.
    app_id: "Your App ID",
  });
</script>
```

Be sure to serve the page via a web server, as pages opened via the
file URI scheme (`file://`) cannot receive messages sent via postMessage
due to security concerns.

The File Explorer can be configured to be either a chooser or a saver.
An `iframe` will be created by the JS library to view the explorer.

### Chooser

The Chooser allows your application to prompt a user to select files or a folder,
and retrieves metadata about the files or folder selected.
It supports choosing files from the local machine as well as cloud storage.

##### Dropzone

The Dropzone is a variety of the Chooser that opens when files are dragged and
dropped into it rather than only when clicked. See the [Dropzone](#dropzone-1)
section for more information.

### Saver

The Saver allows your application to prompt a user to select a folder to save
files to. Metadata on the newly uploaded files will be returned to the developer.
URLs to the files to upload must be provided.

### Configuration

The File Explorer has the following configuration options:

#### Script Tag

The following attributes can be set on the `<script>` tag used to include the
File Explorer JavaScript on the page.

* `data-kloudless-object` : string

  _Optional_. Default: `Kloudless`

  Specifies a different name for the `Kloudless` object bound to `window`.
  e.g. `data-kloudless-object="Kloudless2"` would make the Kloudless object
  accessible via `window.Kloudless2`. Do not use the `async` attribute on the
  script tag if this is used.

#### Chooser and Saver

* `custom_css` : string

  Chooser: _Optional (default: null)_

  Saver: _Optional (default: null)_

  An optional stylesheet URL to load to override existing styles.
  Supports `(http|https)://domain.com/path/to.css`, `//domain.com/path/to.css`, 
  and `/path/to.css` formats.

  The domain the File Explorer is launched from must be added to the application's list
  of [Trusted Domains](https://developers.kloudless.com/applications/*/details) for the
  `custom_css` property to be used.

* `app_id` : string

  Chooser: _Required_

  Saver: _Required_

  The application ID is specific to the developer's application and is located
  in the developer portal on the App Details page.

* `computer` : boolean

  Chooser: _Optional (default: false)_

  Saver: _Optional (default: false)_ Coming Soon

  This option allows users to upload/download files directly from/to their computer.

  __Configuring the Chooser's Upload Location__

  The Chooser will upload files to the developer's Upload Location.
  The Upload Location can be set in the [developer portal](https://developers.kloudless.com)
  under 'App Details', by selecting a folder in a storage service such as Amazon S3.
  All local files from a user will be uploaded there.

  __Note on the Saver__

  The Computer can only be saved to if the Saver is provided a single file to save.
  Saving to the Computer is currently unavailable and will be coming soon.

* `persist` : string

  Chooser: "none", "local", "session" (default: "local")

  Saver: "none", "local", "session" (default: "local")

  This option specifies account persistence for the explorer in either localStorage,
  sessionStorage, or no storage. The explorer will always fall back to localStorage
  if an invalid option is given.

* `services` : array

  Chooser: _Optional (default: ['file_store'])_

  Saver: _Optional (default: ['file_store'])_

  This option specifies which services to allow a user to explore. You can enumerate
  the specific [services](https://developers.kloudless.com/docs/latest/core#introduction-supported-services) or
  use a service group listed below as a shortcut.
  The default is the `file_store` service group.  If you specify an empty array,
  no services will show up.
  
  Service groups:
  
  * `file_store`: All File Storage services.
  * `object_store`: All Object Storage services.
  * `all`: All storage services.

* `account_management` : boolean

  Chooser: _Optional (default: true)_

  Saver: _Optional (default: true)_

  If `false`, hides the Account menu entry in the dropdown. This can be
  combined with the `tokens` option to ensure a user only browses a pre-defined
  list of accounts and also does not disconnect any of the accounts. If account
  disconnection is permitted, set `services` to `[]` rather than disabling the
  `account_management` option.

* `display_backdrop` : boolean

  Chooser: _Optional (default: false)_

  Saver: _Optional (default: false)_

  If `true`, displays a shadow backdrop behind the File Explorer, and prevents the
  page body from scrolling.

* `create_folder` : boolean

  Chooser: _Optional (default: true)_

  Saver: _Optional (default: true)_

  If `true`, the user will be able to create folders in their cloud storage
  accounts.

* `account_key` : boolean

  This option is deprecated as OAuth 2.0 Tokens are used to authenticated accounts
  now instead of Account Keys. Please use the `retrieve_token` option below instead.
  Existing Account Keys can be converted to OAuth Tokens using
  [this endpoint](https://developers.kloudless.com/docs/v0/storage#account-keys-account-key-oauth-token).

* `retrieve_token` : boolean

  Chooser: _Optional (default: false)_

  Saver: _Optional (default: false)_

  This option will include [Bearer Tokens](https://developers.kloudless.com/docs/latest/authentication)
  in addition to the other response data, to allow you to make further requests to the API
  or save the OAuth Tokens for future use.

  ```javascript
    // Example response with an OAuth Token in the metadata.
    [{
        ...
        bearer_token: {
          key: "the_token",
        },
        ...
     }]
  ```

  Only File Explorers launched from Trusted Domains can make use of this option.
  You can add a Trusted Domain on the App Details page.

  In addition, care should
  be taken to ensure no malicious JavaScript or XSS vulnerabilities are present
  on the page, as the Bearer Token provides complete access to that user's account.

* `keys` : array

  This option is deprecated as OAuth 2.0 Tokens are used to authenticated accounts
  now instead of Account Keys. Please use the `tokens` option below instead.
  Existing Account Keys can be converted to OAuth Tokens using
  [this endpoint](https://developers.kloudless.com/docs/v0/storage#account-keys-account-key-oauth-token).

* `tokens` : array

  Chooser: _Optional (default: [])_

  Saver: _Optional (default: [])_

  This option should list [OAuth 2.0 Tokens](https://developers.kloudless.com/docs/latest/authentication)
  for accounts the File Explorer should be initialized with. The File Explorer will make API
  requests for additional information on the accounts and display them
  in the list of accounts the user has connected.

  ```javascript
    // Example initialization with OAuth Tokens to import.
    explorer({
      ...
      tokens: ["abcdefghijklmn", "opqrstuvwxyz"]
      ...
    });
  ```

#### Chooser options

* `multiselect` : boolean

  Chooser: _Optional (default: false)_

  This option allows a user to select multiple files using the Chooser.  The Chooser
  will return a list of one or more entries.

* `link` : boolean

  Chooser: _Optional (default: true)_

  This option adds an additional parameter to the Chooser's response with a
  link to the file chosen in the file explorer.

  ```javascript
    // Response
    // [{
    //    ...
    //    "link":
    //    ...
    // }]
  ```

* `link_options` : Object

  Chooser: _Optional (default: {})_

  The `link_options` object provides parameters to use when the File Explorer
  creates links. See the
  [documentation for creating links](https://developers.kloudless.com/docs/latest/storage#links-create-a-link)
  for a full list of the possible options available.
  Note that links to selected files are only created if the `link`
  configuration option is set to `true`.

  For example:

  ```javascript
      ...,
      link_options: {
        direct: true,
        expiration: "2020-10-12T00:00:00"
      },
      ...
  ```

* `copy_to_upload_location` : boolean

  Chooser: _Optional (default: false)_

  If `true`, this option will copy any file selected by the user from cloud storage
  to the location files uploaded from the user's computer are placed in.
  An Upload Location must be configured via the developer portal to make use of
  this option.

  The copying happens in the background asynchronously and will eventually complete.
  The metadata provided in the callback to the `success` event is that of the
  copied file(s) and not that of the original file(s).

* `upload_location_account` : string

  Chooser: _Optional (default: null)_

  If multiple Upload Locations are configured via the developer portal, this
  specifies the Account ID of the Upload Location to use. This option is not
  required if only one Upload Location is configured. The Account ID is a number
  that can be found in the File Explorer Upload Locations section of the
  [App Details](http://developers.kloudless.com/applications/*/details) page.
  `upload_location_folder` must also be provided.

* `upload_location_folder` : string

  Chooser: _Optional (default: null)_

  If multiple Upload Locations are configured via the developer portal, this
  specifies the Folder ID of the Upload Location to use. This option is not required
  if only one Upload Location is configured. The Folder ID is an encoded string that
  can be found on the File Explorer Upload Locations section of the
  [App Details](http://developers.kloudless.com/applications/*/details) page.
  `upload_location_account` must also be provided.

* `upload_location_uri` : string

  Chooser: _Optional (default: null)_
  
  If you would prefer the Computer uploads completely bypass Kloudless-managed Upload
  Locations and be received by your server directly instead, use this
  option to provide a custom HTTP URI to perform the chunked Plupload upload to. Each
  chunk sent to the URI contains identifying information for the upload in the
  query parameters and the binary content of the chunk in the body. The File Explorer
  expects a successful response to each chunk, as well as file metadata in the Kloudless
  API format after the final chunk. Please check the network requests of a successful
  Computer upload in the demo File Explore via your browser's debugger for more information
  on this advanced capability, or contact our support team for assistance.

* `uploads_pause_on_error` : boolean

  Chooser: _Optional (default: true)_

  If `true`, uploads using the Computer option will pause if errors are encountered,
  giving the user the option to retry the upload by clicking 'Resume'. The user could
  also remove the file that is failing to upload from the queue.
  If `false`, the file that encounters errors will be skipped and excluded from the
  list of files returned in the `success` callback.

* `types` : array

  Chooser: _Default: ['all']_

  This option specifies which types of elements the explorer will show to the user.
  You can filter based on file extension or by the following categories:

  * `all` This configures the explorer to show all file types and folders. The
  user can select either files or folders. Do not combine with other options.

  * `folders` This configures the explorer to gray out files and show folders. The
  user can only select folders.

  * `files` This configures the explorer to show all file types. The user can only
  select files.

  * `text`

  * `documents`

  * `images`

  * `videos`

  * `audio`
  
To filter by file extension, include the extension in the array without the period (`.`) prefix.
For example, `['pdf', 'jpg', 'jpeg', 'png']`.

#### Saver options

* `files` : array

  Saver: _Optional (default: [])_

  This option should list files for the File Explorer to save. The format
  should be an array of Javascript Objects containing a file url and name.
  You can specify up to 100 files. Each file will be uploaded via the Kloudless
  API's [upload endpoint](https://developers.kloudless.com/docs/latest/storage#files-upload-a-file),
  using the `url` attribute.

  ```javascript
    // Example initialization with files to save.
    explorer({
      ...
      files: [{
        "url": "http://<your image url>",
        "name": "filename.extension"
      }, {
        "url": "http://<your image url>",
        "name": "filename.extension"
      }]
      ...
    });
  ```

### Events

* `success(files)`

  The success event handler will fire when the user's operation succeeds.
  `files` is an array of file/folder metadata. The File Explorer will be
  closed on success.

* `cancel()`

  Fired if the user decides to cancel an operation. The File Explorer will
  be closed on cancellation.

* `error(error)`

  Fired in the event of an unrecoverable error.

* `open()`

  Fired when the File Explorer is displayed to the user. This occurs when
  the Chooser or Saver are opened.

* `close()`

  Fired when the File Explorer is hidden from the user. This occurs when
  the File Explorer is closed. This could be due to either a user action,
  such as choosing files or cancelling, or due to the `close()` method
  being called (not to be confused with this `close` event handler).
  The `success()` or `cancel()` events will also trigger if appropriate.

* `selected(files)`

  The selected event handler is fired when the user selects files from the
  explorer, but before sending the list to the Kloudless API for additional
  processing. It fires before the `success` handler, and can allow you to
  perform an action while waiting to get the final list.

  If `copy_to_upload_location` and `link` are both false, then this event is
  equivalent to the `success` event (since nothing needs to happen on the
  server after the selections are made), so this event probably isn't useful
  for you.

  `files` is an array of files, formatted the same way as the array passed to
  `success`.

  This event is not fired when the user uses the Chooser's Computer option or
  the Saver. See `startFileUpload` and `finishFileUpload` for those.

* `addAccount(account)`

  Fired when a user successfully adds an account.
  `account` is an object containing the account id, name, and service.

* `deleteAccount(account)`

  Fired when a user successfully removes an account.
  `account` is an object containing the account id of the deleted account.

* `startFileUpload(file)`

  Fired when a file upload starts, or is requested to be retried by a user
  after encountering errors (see the `uploads_pause_on_error` option).
  This event is only fired when the user uploads a file via the Chooser's
  Computer option or the Saver. For the Chooser, `file` is an object containing
  keys `id`, `name`, `size` and `mime_type`. For the Saver, it contains `url`
  and `name`.
  This event is fired per file and not per chunk.

* `finishFileUpload(file)`

  Fired when a file upload completes successfully (once per file being
  uploaded). `file` contains the same information as in `startFileUpload`
  above, with an additional field `metadata` that contains the full metadata
  of the file provided by the Kloudless API in response to the upload. The
  `metadata` is the same as the file metadata provided via the `success`
  event for each file.

  This event is only fired when the user uploads a file via the
  Chooser's Computer option or the Saver.

* `logout()`

  Fired when the user clicks the logout link in the File Explorer, which
  clears the local state of accounts connected to the File Explorer.

### Methods

* `Kloudless.explorer(options)`

  You can initialize a Kloudless Explorer using the options mentioned above.

* `explorer.choose()`

  This method allows you to launch a Chooser.

* `explorer.choosify(element)`

  This method binds a click handler that launches the Chooser to the DOM element.

* `explorer.save(files)`

  This method allows you to launch a Saver. See *Saver Options* for more information
  on the format for `files`.

* `explorer.savify(element, files)`

  This method binds a click handler that launches the Saver for `files` to the
  DOM element.

* `explorer.on(event, callback)`

  Invokes a callback method on a particular event. See the `Events` section above
  for a list of event names, as well as the arguments the corresponding callback
  methods will be invoked with.

* `explorer.close()`

  This method closes the explorer window.


* `explorer.update(options)`

  Updates the configuration options the explorer was initialized with. The
  explorer will immediately begin using the new configuration.
  `options` is an Object with the new configuration. Not all options can be
  updated in this manner. The following are supported:

  * `link_options`
  * `upload_location_account`
  * `upload_location_folder`

### Example

To start using the File Explorer, simply include the JavaScript file in your
HTML file. You can then create an element on the page to launch the explorer.

```html
<body>
  <button id="file-explorer">Explore!</button>
  <script type="text/javascript" src="https://static-cdn.kloudless.com/p/platform/sdk/kloudless.explorer.js"></script>
  <script type="text/javascript">
      // Explorer initialization JS here.
  </script>
</body>
```

The next step is to customize the file explorer according to the developer's needs.
In this example, we've decided to disable multiselect, return links, and allow for
a few types of files.  All of this is contained within the initialization.

```javascript
// Explorer initialization JS
var explorer = window.Kloudless.explorer({
  app_id: 'YOUR_APP_ID',
  multiselect: false,
  link: true,
  types: ['images', 'documents', 'text']
});
```

The final step is to launch the explorer and handle the events returned from the
explorer based on a user's actions.

```javascript
// When a user successfully selects or saves a file
explorer.on('success', function(files) {
  // files is an array of JS objects that contain file metadata.
  console.log('Successfully selected files: ', files);
});

// When a user cancels the explorer
explorer.on('cancel', function() {
  console.log('File selection cancelled.');
});

// Launching the explorer to choose when a user clicks the Explore! button
explorer.choosify(document.getElementById('file-explorer-chooser'));

// In addition, you can launch the explorer programmatically with choose()
explorer.choose();

// Launching the explorer to save when a user clicks the Explore! button
// Note: you can pass in an array of files instead of using the configuration option
var files = [{
  "url": "http://<your image url>",
  "name": "filename.extension"
}, {
  "url": "http://<your image url>",
  "name": "filename.extension"
}];

explorer.savify(document.getElementById('file-explorer-saver'), files);

// In addition, you can launch the explorer programmatically with save()
var files = [{
  "url": "http://<your image url>",
  "name": "filename.extension"
}, {
  "url": "http://<your image url>",
  "name": "filename.extension"
}];

explorer.save(files);
```

[Visit our JSBin example of the File Explorer!](https://output.jsbin.com/wilowep/)

### Dropzone

The Dropzone is a variety of the Chooser that allows users to drop files into
it from their Computer rather than only click on it to launch the File
Explorer. It opens in place when files are dropped into it.

#### Configuration

The configuration is similar to the Chooser's, but with an extra option `elementId`
as described below. The `computer` option is always set to `true`, and an
Upload Location must be configured as described for the Chooser.

* `elementId` : string

  Chooser: _Required_

  The ID of the DOM element to bind the drop zone to. The drop zone will occupy
  the entire height and width of the element and provide an area for the user to
  drag and drop files in.

#### Methods

* `Kloudless.dropzone(options)`

  Initialize a Dropzone using the options mentioned above.

* `dropzone.on(event, callback)`

  See `explorer.on(event, callback)` for more information.

* `dropzone.close()`

  See `explorer.close()` for more information.

#### Example

[Visit our JSBin example of the Dropzone!](https://output.jsbin.com/vakura/)

HTML

```html
<div id="dropzone" style="width:600px; height:100px"></div>
```

JavaScript

```javascript
var dropzone = window.Kloudless.dropzone({
    app_id: "Your App ID",
    elementId: 'dropzone',
    multiselect: true, // To upload more than 1 file.

    // Chooser options below:
    computer: true,
    link: true,
    services: ['all'],
    types: ['all'],
});

// All of the Chooser's events are supported.
// For example:
dropzone.on('success', function(files) {
    console.log('Successfully selected files: ', files);
});

// See the File Explorer's Example section for other events.
```

## Browser Support

* Chrome 17+
* Firefox 21+
* IE 11+
* Safari 6+
* Opera 15+

## Contributing

Contributions are welcome and appreciated. We'd love to discuss any ideas you
have to improve or extend the File Explorer. It is strongly recommended to
discuss ideas with Kloudless first for major modifications that you would like
merged in so we can offer feedback on its implementation.

### Building

Install Node.js (`sudo apt-get install nodejs` or equivalent)
Make sure you have npm >= 1.4, otherwise `sudo npm install -g npm`.
Run the following commands:

    npm install
    bower install
    grunt dev

If you don't have `bower` or `grunt` installed, run:

    sudo npm install -g bower grunt-cli

Here are a few of the more useful [Grunt](http://gruntjs.com/) tasks available:

* `grunt`
  This can be used instead of `grunt dev` if only non-library files have
  been changed. Especially useful during development.

* `grunt dev`
  During development, this will build all non-minified versions of files for
  easier debugging purposes.

* `grunt deploy`
  For deployment purposes, use `grunt deploy` to build minified versions of
  the files needed.

* `grunt deploy --url=https://mysite.com/file-explorer`
  Useful for self-hosting the File Explorer. The Grunt tasks accept a `url`
  option that will be set as the `src` attribute for the iframe that loads the
  File Explorer.

All output files are placed in the `dist` directory. Included in that directory
are:

* JS and CSS responsible for launching and styling the iframe.
* JS, CSS and HTML files that compose the File Explorer.

### Testing

Automated testing is not present. For now, you can manually confirm that the
library works by running the test server.

    $ grunt # or `grunt dev` if this is the first build
    $ cd test
    $ npm install # only needed the first time to install dependencies
    $ KLOUDLESS_APP_ID=app_id npm start

where 'app_id' above is a Kloudless App ID specifying which app to connect the
accounts to. You can create an application in the Developer Portal for testing
purposes.

Since the webserver is running at `localhost:3000`, add `localhost:3000` to your
App's list of Trusted Domains to allow it to receive Account Keys to make API
requests with. Be careful to only do this with an app you are using for
development purposes so that there is no security risk.

Then navigate to `localhost:3000` and click the buttons to test.

## Self-hosting

* Modify the JS and CSS links at `example/explorer.html` to point to where you will
  be hosting the compiled JS and CSS files for the explorer.
* See notes on how to build the File Explorer for deployment purposes with the
  `--url` option. Perform the `grunt deploy --url=$URL` build, where $URL is
  the URL that will serve the File Explorer.
* Place `dist/explorer/js/explorer.js` and `dist/explorer/css/explorer.css`
  at the locations you specified in `example/explorer.html`.
* Make `dist/explorer/explorer.html` available at $URL.
  Feel free to customize the way assets are loaded/delivered.
  The important part is that the JS, HTML and CSS must all be included on that
  page.
* Ensure the domain of $URL is added to your Kloudless App's list of
  Trusted Domains. This can be done on the App Details page in the [Developer
  Portal](https://kloudless.com). This is necessary because Account Keys will
  be sent via postMessage from the Kloudless API server's authentication popup
  to the File Explorer hosted on your domain and the API server should first
  confirm that it can trust your domain for your app.
* Include the loader JS file from `dist/loader/js/loader.js`
  in any page you would like the File Explorer functionality to be made
  available at, and follow the Usage notes above.
* Navigate to the page you included the loader at and use the File Explorer!

## Misc. Development Notes

* Need to implement automated testing!!!
* In order to switch folders, we change the current() pointer and then
  refresh(). refresh() will abort any currently active requests to prevent race
  conditions
* Put buttons that can be clicked repeatedly into data-bind clicks instead of
  the router, because the hash will prevent the route from being fired twice
  consecutively. Use the hash to switch between pages of the application.

## Security Vulnerabilities

If you have discovered a security vulnerability with this library or any other
part of Kloudless, we appreciate your help in disclosing it to us privately by
emailing security@kloudless.com.

## Support

Feel free to contact us at support@kloudless.com with any feedback or
questions. Other methods to contact us are listed
[here](https://developers.kloudless.com/docs/v1/core#getting-help).
