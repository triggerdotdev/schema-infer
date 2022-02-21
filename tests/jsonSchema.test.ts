import { Schema } from "@jsonhero/json-schema-fns";
import { readFileSync } from "fs";
import { inferSchema, restoreSnapshot, SchemaInferrer } from "../src";

const toSchema = (s: SchemaInferrer): Schema => s.toJSONSchema({ includeSchema: false });
const readFixture = (s: string): unknown =>
  JSON.parse(readFileSync(`./tests/json/${s}.json`, "utf8").toString());
const fixtureToSchema = (s: string): Schema =>
  inferSchema(readFixture(s)).toJSONSchema({
    includeSchema: false,
  });

describe("toJSONSchema()", () => {
  it("should work with the given options", () => {
    expect(inferSchema(1).toJSONSchema({ includeSchema: true })).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "integer",
    });

    expect(inferSchema(1).toJSONSchema({ includeSchema: false })).toEqual({
      type: "integer",
    });
  });
});

describe("toSnapshot()/restoreSnapshot()", () => {
  it("Should allow resuming an inferring session", () => {
    let schema = inferSchema({
      foo: "bar",
    });

    const snapshot = schema.toSnapshot();

    schema = inferSchema(
      {
        bar: "baz",
      },
      restoreSnapshot(snapshot),
    );

    expect(toSchema(schema)).toStrictEqual({
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
      },
    });
  });
});

describe("simple types", () => {
  it("should infer nulls", () => {
    expect(toSchema(inferSchema(null))).toEqual({ type: "null" });
  });

  it("should infer boolean", () => {
    const inference = inferSchema(true);

    expect(toSchema(inference)).toStrictEqual({
      type: "boolean",
    });
  });

  it("should infer boolean over multiple iterations", () => {
    let inference = inferSchema(true);
    inference = inferSchema(false, inference);

    expect(toSchema(inference)).toStrictEqual({
      type: "boolean",
    });

    inference = inferSchema(1, inference);

    expect(toSchema(inference)).toStrictEqual({
      anyOf: [{ type: "boolean" }, { type: "integer" }],
    });
  });

  it("should infer int", () => {
    expect(toSchema(inferSchema(1))).toStrictEqual({
      type: "integer",
    });
  });

  it("should infer int over multiple iterations", () => {
    let inference = inferSchema(1);
    inference = inferSchema(2, inference);
    inference = inferSchema(10, inference);

    expect(toSchema(inference)).toStrictEqual({
      type: "integer",
    });
  });

  it("should infer floats as numbers", () => {
    expect(toSchema(inferSchema(1.1))).toStrictEqual({
      type: "number",
    });
  });

  it("should infer floats as numbers even over multiple iterations", () => {
    let inference = inferSchema(1.1);
    inference = inferSchema(2.5, inference);
    inference = inferSchema(10.8, inference);

    expect(toSchema(inference)).toStrictEqual({
      type: "number",
    });

    inference = inferSchema("hello world", inference);

    expect(toSchema(inference)).toStrictEqual({
      anyOf: [{ type: "number" }, { type: "string" }],
    });
  });

  it("should infer floats and ints as numbers", () => {
    let inference = inferSchema(1.1);
    inference = inferSchema(2, inference);

    expect(toSchema(inference)).toStrictEqual({
      type: "number",
    });

    let inferenceIntFirst = inferSchema(1);
    inferenceIntFirst = inferSchema(2.5, inferenceIntFirst);

    expect(toSchema(inferenceIntFirst)).toStrictEqual({
      type: "number",
    });
  });

  it("should infer strings", () => {
    expect(toSchema(inferSchema("hello world"))).toStrictEqual({
      type: "string",
    });

    expect(toSchema(inferSchema("https://google.com/#"))).toStrictEqual({
      type: "string",
      format: "uri",
    });

    expect(toSchema(inferSchema("eric@stackhero.dev"))).toStrictEqual({
      type: "string",
      format: "email",
    });

    expect(toSchema(inferSchema("AEA9CF21-965A-46C0-A4DD-3652B0BDC56D"))).toStrictEqual({
      type: "string",
      format: "uuid",
    });

    expect(toSchema(inferSchema("google.com"))).toStrictEqual({
      type: "string",
      format: "hostname",
    });

    expect(toSchema(inferSchema("192.168.1.0"))).toStrictEqual({
      type: "string",
      format: "ipv4",
    });

    expect(toSchema(inferSchema("2001:db8:1234::1"))).toStrictEqual({
      type: "string",
      format: "ipv6",
    });

    expect(toSchema(inferSchema("2019-01-01 00:00:00.000Z"))).toStrictEqual({
      type: "string",
      format: "date-time",
    });

    expect(toSchema(inferSchema("2016-05-25"))).toStrictEqual({
      type: "string",
      format: "date",
    });

    expect(toSchema(inferSchema("09:24:15"))).toStrictEqual({
      type: "string",
      format: "time",
    });

    expect(toSchema(inferSchema("192.168.1.0", inferSchema("2019-01-01")))).toStrictEqual({
      type: "string",
    });

    expect(toSchema(inferSchema("2020-12-01", inferSchema("2019-01-01")))).toStrictEqual({
      type: "string",
      format: "date",
    });
  });

  it("should not infer string formats when all strings don't have the same format", () => {
    expect(toSchema(inferSchema("2020-12-01", inferSchema("this is not formatted")))).toStrictEqual(
      { type: "string" },
    );

    expect(toSchema(inferSchema("this is not formatted", inferSchema("2020-12-01")))).toStrictEqual(
      { type: "string" },
    );

    expect(toSchema(inferSchema("US", inferSchema("2020-12-01")))).toStrictEqual({
      type: "string",
    });

    expect(toSchema(inferSchema("google.com", inferSchema("2020-12-01")))).toStrictEqual({
      type: "string",
    });

    expect(
      toSchema(inferSchema("ee487ff7-374d-4e50-9b72-ac51e4459c5f", inferSchema("2020-12-01"))),
    ).toStrictEqual({
      type: "string",
    });

    expect(toSchema(inferSchema("http://google.com", inferSchema("2020-12-01")))).toStrictEqual({
      type: "string",
    });

    expect(toSchema(inferSchema("+447456001234", inferSchema("2020-12-01")))).toStrictEqual({
      type: "string",
    });

    expect(toSchema(inferSchema("ES", inferSchema("2020-12-01")))).toStrictEqual({
      type: "string",
    });
  });

  it("Should infer anyOf when a string is followed by something else", () => {
    expect(toSchema(inferSchema(1, inferSchema("hello world")))).toStrictEqual({
      anyOf: [{ type: "string" }, { type: "integer" }],
    });
  });
});

describe("arrays", () => {
  test("inferring a homogeneous array", () => {
    expect(toSchema(inferSchema([1, 2, 3]))).toStrictEqual({
      type: "array",
      items: { type: "integer" },
    });
  });

  test("inferring a heterogeneous array", () => {
    expect(toSchema(inferSchema([1, "hello world", false]))).toStrictEqual({
      type: "array",
      items: { anyOf: [{ type: "integer" }, { type: "string" }, { type: "boolean" }] },
    });
  });

  test("inferring an array multiple times", () => {
    expect(toSchema(inferSchema([4, 5, 6], inferSchema([1, 2, 3])))).toStrictEqual({
      type: "array",
      items: { type: "integer" },
    });
  });

  test("following an array inferring with something other than an array", () => {
    expect(toSchema(inferSchema("hello world", inferSchema([1, 2, 3])))).toStrictEqual({
      anyOf: [
        {
          type: "array",
          items: { type: "integer" },
        },
        { type: "string" },
      ],
    });
  });
});

describe("objects", () => {
  test("inferring an object", () => {
    expect(toSchema(inferSchema({ foo: "bar" }))).toStrictEqual({
      type: "object",
      properties: {
        foo: { type: "string" },
      },
      required: ["foo"],
    });
  });

  test("inferring optional properties", () => {
    let schema = inferSchema({ foo: "bar", baz: "qux" });
    schema = inferSchema({ foo: "bar", banana: 1 }, schema);

    expect(toSchema(schema)).toStrictEqual({
      type: "object",
      properties: {
        foo: { type: "string" },
        baz: { type: "string" },
        banana: { type: "integer" },
      },
      required: ["foo"],
    });

    schema = inferSchema({ baz: "qux" }, schema);

    expect(toSchema(schema)).toStrictEqual({
      type: "object",
      properties: {
        foo: { type: "string" },
        baz: { type: "string" },
        banana: { type: "integer" },
      },
    });
  });

  test("following an object inferring with something other than an object", () => {
    expect(toSchema(inferSchema("hello world", inferSchema({})))).toStrictEqual({
      anyOf: [{ type: "object" }, { type: "string" }],
    });
  });
});

describe("array of objects", () => {
  test("infers the items of the array as an object", () => {
    expect(toSchema(inferSchema([{ foo: "bar", baz: "qux" }, { foo: "bar" }]))).toStrictEqual({
      type: "array",
      items: {
        type: "object",
        properties: {
          foo: { type: "string" },
          baz: { type: "string" },
        },
        required: ["foo"],
      },
    });
  });
});

describe("nullables", () => {
  test("infers the schema as allowing null as well as another type", () => {
    const schema = inferSchema([1, 2, null, 3]);

    expect(toSchema(schema)).toStrictEqual({
      type: "array",
      items: {
        type: ["integer", "null"],
      },
    });
  });

  test("infers just a single null type if multiple nulls are found", () => {
    const schema = inferSchema([1, 2, null, 3, null, 4]);

    expect(toSchema(schema)).toStrictEqual({
      type: "array",
      items: {
        type: ["integer", "null"],
      },
    });
  });
});

describe("real world tests", () => {
  test("infers the airtable schema correctly", () => {
    expect(fixtureToSchema("airtable")).toMatchSnapshot();
  });

  test("infers the mux-list-delivery-usage schema correctly", () => {
    expect(fixtureToSchema("mux-list-delivery-usage")).toMatchSnapshot();
  });

  test("infers the tweets schema correctly", () => {
    expect(fixtureToSchema("tweets")).toMatchSnapshot();
  });
});

import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
const ajv = new Ajv2020();
addFormats(ajv);

describe("validation", () => {
  it("should pass validation if given the same json the schema was inferred from", () => {
    const schema = fixtureToSchema("tweets");
    const validate = ajv.compile(schema);
    const tweetsJson = readFixture("tweets");

    expect(validate(tweetsJson)).toBe(true);
  });
});
