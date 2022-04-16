# JSON Schema Infer

> Infers JSON Schemas and Type Definitions from example JSON

![Coverage lines](./badges/badge-lines.svg)
![Tests](https://github.com/jsonhero-io/schema-infer/actions/workflows/test.yml/badge.svg?branch=main)
[![Downloads](https://img.shields.io/npm/dm/%40jsonhero%2Fschema-infer.svg)](https://npmjs.com/@jsonhero/schema-infer)
[![Install size](https://packagephobia.com/badge?p=%40jsonhero%2Fschema-infer)](https://packagephobia.com/result?p=@jsonhero/schema-infer)

## Features

- Written in typescript
- Inspired by [jtd-infer](https://jsontypedef.com/docs/jtd-infer/)
- Generate JSON schema documents from example data
- Supports most string formats through [json-infer-types](https://github.com/jsonhero-io/json-infer-types)
  - Date and times
  - URIs
  - Email Addresses
  - Hostnames
  - IP Addresses
  - uuids
- Available as a CLI and a library
- Supports snapshotting and restoring inference sessions

## Usage

```ts
import { inferSchema } from "@jsonhero/schema-infer";

inferSchema({
  id: "abeb8b52-e960-44dc-9e09-57bb00d6b441",
  name: "Eric",
  emailAddress: "eric@example.com",
  website: "https://github.com/ericallam",
  joined: "2022-01-01",
})toJSONSchema();
```

Infers the following JSON schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "emailAddress": { "type": "string", "format": "email" },
    "website": { "type": "string", "format": "uri" },
    "joined": { "type": "string", "format": "date" }
  },
  "required": ["id", "name", "emailAddress", "website", "joined"]
}
```

## Examples

## Roadmap

- Add support for hints for discriminators (tagged unions), value-only schemas, and enums
- Add support for [JSON Typedefs](https://jsontypedef.com)
- Add "verbose" mode to include `$id`, `examples`, etc.
