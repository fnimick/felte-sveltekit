# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2023-03-18

### Changed

- Removed `formId` from server `validatedAction` - it now reflects the id sent
  by the client, allowing multiple client-side forms to have different ids yet
  use the same server action.
- Added `FELTE_FORM_ID` as a required hidden input in client forms, to provide
  an id for the server to reflect on action response.
