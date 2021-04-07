# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

---

## [2.6.5] - 2021-04-07
### Fixed
- Upgrade @kloudless/file-picker-plupload-module to 1.0.2 to fix the multipart
upload problem.

## [2.6.4] - 2021-03-30
### Changed
- Upgrade @kloudless/file-picker-plupload-module to 1.0.1.
### Fixed
- `accountId` was not correctly passed to the `deleteAccount` event handler.


## [2.6.3] - 2021-02-22

### Fixed
- Display the loading view instead of the Manage Accounts view before File
  Picker completes initialization.
- Upper case file extensions are not correctly detected.
- Ordering doesn't work on search results.

### Changed
- Keep sorting rule individually for each connected account.

## [2.6.0][2.6.1][2.6.2] - 2020-12-14

### Added

- Chooser: Introduced the new option, `max_size`, to limit the size of the
  selected file.
- The new option, `close_on_success`, controls whether to close the File Picker
  when all the selections in the Chooser, or files in the Computer and Saver,
  are processed successfully.

### Changed

- Include folder selections in the `selected` event.
- Improved handling of the `persist` option. Please refer to the `persist`
  option in the [Chooser Options](README.md#chooser-and-saver) for details.
- The File Picker's Computer View won't fire a `success` event on cancellation
  or if no items succeed, which was previously the case.
- Options to close the File Picker are now hidden if the File Picker is launched
  with the `element` option that attaches it to a DOM element.
- Failed local uploads can now be removed from the list of uploads to be retried.
- Improved state management for uploads from the local machine.
- The sorting rule will be kept and applied after new items are loaded.

## [2.5.4] - 2020-10-21

### Fixed

- Some IE11 issues.
- VueJS Dropzone component: fix `TypeError: Cannot read property 'postMessage' of null`
  error on destroy.

## [2.5.2][2.5.3] - 2020-10-12

### Changed

- File Picker won't be closed when there is any error during selecting,
  uploading, saving, or copying files and folders.

### Fixed

- `delete_accounts_on_logout` isn't respected when removing only one account.
- Dropzone is not clickable or not able to process dropped files on some
  browsers.
- File Picker closes unexpectedly when double clicking on table header or new
  folder row.

## [2.5.1] - 2020-09-16

### Fixed

- Script error when calling destroy()

## [2.5.0] - 2020-09-15

### Added

- `custom_style_vars`: Added a new LESS styling variable,
  `loading_overlay_color`, that controls the shade of the overlay present when
  loading responses to API requests.
- The new option, `element`, enables appending the File Picker to a DOM element
  on the page rather than displaying it as a modal.

### Changed

- Preload icon URLs.
- `custom_style_vars`: The `input_border_color` and `input_color` LESS
  variables are now applied to input elements.
- `elementId` in Dropzone options is deprecated. Please use `element` instead.

### Fixed

- Minor bugfixes to the CSS styling.

## [2.4.2] - 2020-09-07

### Changed

- Only display services that support listing folders and files.

## [2.4.0] - 2020-08-25

### Changed

- Refresh the current folder view after the Saver uploads a file to it.
- Add copy button to error dialog.
- Make the texts in error dialog selectable.

### Fixed

- Fire an error event if an upload via the Saver fails.

## [2.3.3] - 2020-07-17

### Fixed

- A regression in 2.3.2 causes the file picker to sometimes return async-type
  Task objects even if `copy_to_upload_location: sync` is specified.

## [2.3.2] - 2020-07-16

### Fixed

- Chooser: Partially successful selections should still fire the `success` event
  for those files/folders, and the `error` event for the remainder.
- The `copy_to_upload_location: "async"` configuration now includes the bearer
  token, and Account ID in responses to enable checking the Task API easily.

## [2.3.1] - 2020-06-22

### Added
- Double-clicking on a file selects it

## [2.3.0] - 2020-05-26

### Added

- Support MIME type filtering.
- Support dynamically updating root_folder_id.
- Add warning when disconnecting an account.

### Fixed

- Refresh the filesystem state when switching between the Chooser and Saver.

## [2.2.5] - 2020-04-29

### Fixed

- The modal closes unexpectedly when there are less than 6 files uploaded in the
  Computer view and the upload fails, even though `uploads_pause_on_fail` is set
  to `true`.
- Emit the `success` event for successfully uploaded files if users cancel the
  upload mid-way through uploading a set of files in the Computer view.
- Improve UI when the `multiselect` option is configured to `false`.

## [2.2.4] - 2020-04-20

### Fixed

- Improve UI when loading the next page of files.

## [2.2.3] - 2020-04-15

### Fixed

- Forbid non-downloadable files from being selected if `copy_to_upload_location`
  is configured or `link_options.direct` is `true`.

## [2.2.2] - 2020-04-09

### Fixed

- Ensure that consecutive duplicate error messages appear if necessary.
- Ensure to get the next page when scrolling to the near bottom.

## [2.2.1] - 2020-02-24

### Fixed

- Grayed out non-matching file types instead of filtering them out.

## [2.2.0] - 2020-02-17

### Changed

- Improve folder selection.
- Fix sammy router 404 errors.

## [2.1.1] - 2020-02-03

### Fixed

- keep showing loading spinner until confirm process is done

## [2.1.0] - 2020-01-15

### Added

- new configuration option `root_folder_id`

### Fixed

- The action button in the file view was missing for the dropzone.
- Removed `@breaking_point` and `@modal_width` from variables.less.

## [2.0.1] - 2019-12-24

### Fixed

- Checking if services exist before accessing them.

## [2.0.0] - 2019-12-20

### Changed

- A completely new theme for the UI with following improvements:
  - improved responsiveness
  - clearer HTML and CSS structure and consistent naming conventions.
  The new `custom_style_vars` option allows customizing specific documented
  aspects of the UI such as colors and fonts without forking the entire project.
  The `custom_css` option is now deprecated. Please refer to the
  [migration guide](README.md#incompatible-configuration-options) for details.
- The project has been renamed to the "File Picker". Please see the
  [migration guide](README.md#file-explorer-renamed-to-file-picker) for details
  on updated method, variable, and configuration names.
- The import paths for `setGlobalOptions` and `getGlobalOptions` for the React
  and Vue wrapper modules have changed. Please see the
  [migration guide](README.md#react-and-vue-wrapper-options-configuration)
  for details.

## [1.9.1] - 2019-12-06

### Fixed

- Fix babel.config.js JSON.parse() error.

## [1.9.0] - 2019-12-06

### Added

- Add TS definition file.
