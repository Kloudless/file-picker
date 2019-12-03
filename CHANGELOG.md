# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- A completely new theme for the UI with following improvements:
  - improved responsiveness
  - clearer HTML and CSS structure and consistent naming conventions
- File Explorer is renamed to File Picker. Please see
[migration guide](README.md#from-v1-to-v2) for details.
- The import path of `setGlobalOptions` and `getGlobalOptions` of React and Vue
Wrapper are changed. Please see [migration guide](README.md#from-v1-to-v2) for
details.

### Added

- New option: custom_style_vars, which allows to customize UI styling such as
colors and fonts without forking the entire project.
- New methods and variables with the new name.

### Deprecated

- custom_css option.
- Methods and variables with the old name are deprecated.

## [1.9.1] - 2019-12-06

### Fixed

- Fix babel.config.js JSON.parse() error.

## [1.9.0] - 2019-12-06

### Added

- Add TS definition file.