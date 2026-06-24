






## [0.2.4] - 2026-06-24

### Fixed

- instance url consistency with webhook ui

## [0.2.3] - 2026-06-18

Maintenance release.

## [0.2.2] - 2026-06-07

### Fixed

- **ui**: schedule text and update readme.md

## [0.2.1] - 2026-06-01

### Fixed

- **listeners**: additional checks to ensure attached listeners are isolated to ntfy

## [0.2.0] - 2026-06-01

### Added

- add configuration window and related components

### Fixed

- update Ubuntu version in build workflow to 24.04
- update Ubuntu dependencies in build workflows for improved compatibility
- **schedule**: default consistency with backend tauri
- **schedule**: expose time_to_minute to listeners

## [0.1.3] - 2026-05-31

### Added

- add import/export functionality for automation rules in modal component
- enhance automation rule matching with new message processing and add multiple application templates

### Fixed

- correct typo in matchValue for Netflix automation rule
- add missing libpipewire dependency for Ubuntu build

## [0.1.2] - 2026-05-30

### Added

- implement sound module with volume control and cleanup logs functionality
- refactor execution logging and add token replacement functionality
- implement cross-platform volume control functionality with Linux and macOS support
- add system module with power control functionalities including hibernate, logout, reboot, shutdown, and sleep
- add screen module for taking screenshots

### Fixed

- remove unnecessary cleanup_logs call in test_run function
- remove unnecessary whitespace in baseSchema definition

## [0.1.1] - 2026-05-29

### Fixed

- enhance automation rule handling and logging, improve argument parsing

## [0.1.0] - 2026-05-29

### Added

- add automation feature with UI and backend integration
- implement automation rule management with CRUD operations
- enhance automation UI with improved layout and scrollbar styling
- add hidden span for accessibility in automation UI
- implement logs management with UI and backend integration
- enhance automation module with new action types and configuration options
- restructure automation module and update schemas
- implement notification handling and improve payload structure
- update automation components with alert dialog and refactor test rule handling
- **automation**: in development automation rules.

### Fixed

- update tray menu item labels for clarity and consistency
- handle undefined rule properties in modal inputs
- update search placeholder and button label for clarity in automation UI
- adjust button class order for consistent styling in automation and logs components
- unify scrollbar styling for consistent appearance across components
- ensure safe string conversion for search filter in automation rules
- update dependencies in Cargo.lock and improve validation logic in automation modules
- update message display for empty search results in automation rules
- update log loading logic to use a ref for current page and improve scrollbar styles
- improve scrollbar styles for better visibility and consistency

### Changed

- extract webhook URL builder utility
- move readUrl and saveUrl utilities to lib/tauri for better organization
- rename volume module IDs for clarity and update related logic
- remove 'runScript' action type and related logic from automation components
- remove custom EventSource handling and improve WebSocket message validation

## [0.0.15] - 2026-05-26

### Added

- enhance webhook page layout and improve input handling

### Fixed

- update tray menu items for consistency and clarity

## [0.0.14] - 2026-05-25

### Fixed

- update asset name pattern key in build workflow
- rename clear_instance_url to clear_instance for consistency
- update ntfy app instance screenshot
- update window label check in setup_window_events function

## [0.0.13] - 2026-05-25

### Fixed

- correct capitalization of "ntfy" in tray menu item
- add asset name patterns for macOS, Linux, and Windows builds
- update pnpm package manager version to 11.3.0

## [0.0.12] - 2026-05-24

### Fixed

- update menu item ID from "show" to "open" for consistency

## [0.0.11] - 2026-05-23

### Fixed

- ensure webhook window is unminimized before showing

## [0.0.10] - 2026-05-23

### Added

- add webhook functionality with UI components and window management

### Fixed

- update windows screenshot
- adjust formatting and import statements in Webhook and Textarea components

## [0.0.9] - 2026-05-22

### Fixed

- update publisher name in tauri configuration
- update version reference in security policy and remove best practices section

## [0.0.8] - 2026-05-20

### Changed

- Event listeners are no longer tied to intercepted console log output.
- Notification handling now hooks directly into native browser WebSocket and EventSource APIs for improved reliability and compatibility.
- Removed domain restrictions that previously limited listeners to websites containing ntfy in the hostname.
- Notification interception now works across all supported webviews and services.
- Improved runtime stability by removing console monkey patching logic.
- Reduced dependency on frontend implementation details from third-party services.

## [0.0.7] - 2026-05-20

Maintenance release.

## [0.0.7] - 2026-05-20

Maintenance release.

## [0.0.6] - 2026-05-17

### Added

- open external url to default browser.
- add tauri-plugin-opener for external URL handling

### Fixed

- update notification text and hide documentation link
- trim whitespace from instance URL input
- update package dependencies and tauri configuration
- update winnow dependency to version 1.0.3

### Changed

- reorganize URL configuration commands into settings module
- remove unused dark theme variables and clean up CSS

## [0.0.5] - 2026-05-13

### Fixed

- update autostart menu item label to "Auto Start"
- reorder dependencies in Cargo.toml for clarity
- remove duplicate description in Cargo.toml
- update default app URL in tray setup for proper navigation
- update style ID in page load handler and simplify browsing data cleanup
- add tauri-plugin-process dependency

## [0.0.4] - 2026-05-13

### Added

- add updater plugin and implement update check in tray menu

### Fixed

- update changelog link in release body to point to the main branch
- update autostart menu item label to "Boot On Startup"

## [0.0.3] - 2026-05-12

### Fixed

- update security policy and correct contact information
- update app identifier and add publisher information
- version to 0.0.2 in package.json, Cargo.toml, and tauri.conf.json

## [0.0.3] - 2026-05-12

### Fixed

- update security policy and correct contact information

## [0.0.2] - 2026-05-12

### Fixed

- **windows**: remove terminal window from app launch
