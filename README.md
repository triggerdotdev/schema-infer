# JSON Schema Infer

> Infers JSON Schemas and Type Definitions from example JSON

<!-- ![Coverage lines](./badges/badge-lines.svg) -->
<!-- ![Tests](https://github.com/jsonhero-io/schema-infer/actions/workflows/test.yml/badge.svg?branch=main) -->
<!-- [![Downloads](https://img.shields.io/npm/dm/%40jsonhero%2Fschema-infer.svg)](https://npmjs.com/@jsonhero/schema-infer) -->
<!-- [![Install size](https://packagephobia.com/badge?p=%40jsonhero%2Fschema-infer)](https://packagephobia.com/result?p=@jsonhero/schema-infer) -->

## Features

- Written in typescript
- Infers JSON Schema
- Supports most string formats through [json-infer-types](https://github.com/jsonhero-io/json-infer-types)
  - Date and times
  - URIs
  - Email Addresses
  - Hostnames
  - IP Addresses
  - uuids
- Infers JSON Type definitions
- Supports hints for discriminators (tagged unions), value-only schemas, and enums
- Provide with multiple JSON documents to improve inference

## Usage

## Roadmap

- Add "verbose" mode to include `$id`, `examples`, etc.
