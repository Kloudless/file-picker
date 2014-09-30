# Kloudless File Explorer

The [Kloudless](https://kloudless.com) File Explorer is a JavaScript library
that allows your users to browse and select files and folders from their
storage services. It comes in two modes: a chooser and a saver.

[Visit our JSFiddle example of the File Explorer!](http://jsfiddle.net/pseudonumos/PB565/embedded/)

![fe.gif](http://i.imgur.com/xO2QcyD.gif)

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

The File Explorer can be configured to be either a chooser or a saver.
An `iframe` will be created by the JS library to view the explorer.

### Chooser

The Chooser allows your application to prompt a user to select files or a folder,
and retrieves metadata about the files or folder selected.
It supports choosing files from the local machine as well as cloud storage.

### Saver (Coming soon!)

The Saver allows your application to prompt a user to select a folder to save
files to.

### Configuration

The File Explorer has the following configuration options:

* `app_id` : string.

  Chooser: _Required_

  Saver: _Required_

  The application ID is specific to the developer's application and is located
  in the developer portal on the App Details page.

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

* `direct_link` : boolean

  Chooser: _Optional (default: false)_

  This option is specific to links generated through the file explorer. If
  `false`, the link redirects to the cloud storage service to view the file. If
  `true`, the link will download the file instead. See the `direct`
  [attribute](#links) for more details.

* `computer` : boolean

  Chooser: _Optional (default: false)_

  Saver: _Optional (default: false)_

  This option allows users to upload/download files directly from/to their computer.

  __Configuring the Chooser's Upload Location__

  The Chooser will upload files to the developer's Upload Location.
  The Upload Location can be set in the [developer portal](https://developers.kloudless.com)
  under 'App Details', by selecting a folder in a storage service such as Amazon S3.
  All local files from a user will be uploaded there.

* `copy_to_upload_location` : boolean

  Chooser: _Optional (default: false)_

  If `true`, this option will copy any file selected by the user from cloud storage
  to the location files uploaded from the user's computer are placed in.
  An Upload Location must be configured via the developer portal to make use of
  this option.

  The copying happens in the background asynchronously and will eventually complete.
  The metadata provided in the callback to the `success` event is that of the
  copied file(s) and not that of the original file(s).

* `create_folder` : boolean

  Chooser: _Optional (default: true)_

  Saver: _Optional (default: true)_

  If `true`, the user will be able to create folders in their cloud storage
  accounts.

* `services` : array

  Chooser: _Optional (default: ['file_store'])_

  Saver: _Optional (default: ['file_store'])_

  This option specifies which services to allow a user to explore. You can enumerate
  the specific [services](#accounts) or [service groups](#accounts).
  The default is the file store service group.  If you specify an empty array,
  no services will show up.

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


* `account_key` : boolean

  Chooser: _Optional (default: false)_

  This option will include [Account Keys](#account-keys) in addition to the other
  response data, to allow you to make further requests to the API or save the
  Account Keys easily.

  ```javascript
    // Example response with an Account Key in the metadata.
    [{
        ...
        account_key: {
          key: "the_account_key",
        },
        ...
     }]
  ```

  Only File Explorers launched from Trusted Domains can make use of this option.
  You can add a Trusted Domain on the App Details page.

  In addition, care should
  be taken to ensure no malicious JavaScript or XSS vulnerabilities are present
  on the page, as the Account Key provides complete access to that user's account.
  To guard against this, you can make requests from a backend server using
  the API Key instead.

* `keys` : array

  Chooser: _Optional (default: [])_

  This option should list [Account Keys](#account-keys) for accounts the File
  Explorer should be initialized with. The File Explorer will make API
  requests for additional information on the accounts and display them
  in the list of accounts the user has connected.

  ```javascript
    // Example initialization with Account Keys to import.
    explorer({
      ...
      keys: ["abcdefghijklmn", "opqrstuvwxyz"]
      ...
    });
  ```

### Events

* `success(files)`

  The success event handler will fire when the user's operation succeeds.
  `files` is an array of file/folder metadata.

* `error(error)`

  Fired in the event of an unrecoverable error.

* `cancel()`

  Fired if the user decides to cancel an operation.

* `addAccount(data)`

  Fired when a user successfully adds an account.
  `data` is an array containing the account id, name, and service.

* `deleteAccount(data)`

  Fired when a user successfully removes an account.
  `data` is an array containing the account id of the deleted
  account.

### Methods

* `Kloudless.explorer(options)`

  You can initialize a Kloudless Explorer using the options mentioned above.

* `explorer.choose(options)`

  This method allows you to launch a chooser dynamically with the specified
  options.

* `explorer.choosify(element)`

  This method binds the explorer to an HTML element to launch the explorer.

### Example

To start using the File Explorer, simply include the JavaScript file in your
HTML file. You can then create an element on the page to launch the explorer.

```html
<body>
  <button id="file-explorer">Explore!</button>
  <script type="text/javascript" src="https://static-cdn.kloudless.com/p/platform/sdk/kloudless.explorer.js"></script>
  <script type="text/javscript">
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
// When a user successfully selects a file
explorer.on('success', function(files) {
  // files is an array of JS objects that contain file metadata.
  console.log('Successfully selected files: ', files);
});

// When a user cancels the explorer
explorer.on('cancel', function() {
  console.log('File selection cancelled.');
});

// Launching the explorer when a user clicks the Explore! button
explorer.choosify(document.getElementById('file-explorer'));

// In addition, you can launch the explorer programmatically with choose()
explorer.choose();
```

[Visit our JS Fiddle example of the File Explorer!](http://jsfiddle.net/pseudonumos/PB565/embedded/)

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

### Misc. Development Notes

* Need to implement automated testing!!!
* In order to switch folders, we change the current() pointer and then
  refresh(). refresh() will abort any currently active requests to prevent race
  conditions
* Put buttons that can be clicked repeatedly into data-bind clicks instead of
  the router, because the hash will prevent the route from being fired twice
  consecutively. Use the hash to switch between pages of the application.

### Security Vulnerabilities

If you have discovered a security vulnerability with this library or any other
part of Kloudless, we appreciate your help in disclosing it to us privately by
emailing security@kloudless.com.

## Support

Feel free to contact us at support@kloudless.com with any feedback or
questions. Other methods to contact us are listed
[here](https://developers.kloudless.com/docs#getting-help).
