# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed

- Preload icon URLs.

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
