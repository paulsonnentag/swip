# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Fixed
- Fix transform calculation when merging a cluster with multiple clients into another cluster

## [0.1.0] - 2016-09-30
### Added

Initial release
- support multiple clients
- each device has initially it's own cluster
- if two devices are connected with each other their clusters will be merged
- custom server logic to handle events: init, merge or custom client action
