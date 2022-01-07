import { inferSchema } from "../src";

describe("simple types", () => {
  it("should convert boolean", () => {
    const inference = inferSchema(true);

    expect(inference.toJSONSchema()).toMatchObject({
      type: "boolean",
    });
  });

  it("should convert int", () => {
    const inference = inferSchema(1);

    const jsonSchema = inference.toJSONSchema();

    expect(jsonSchema).toMatchObject({
      type: "integer",
    });
  });

  it("should convert adjust the int range if called multiple times", () => {
    let inference = inferSchema(1);
    inference = inferSchema(2, inference);
    inference = inferSchema(10, inference);

    expect(inference.toJSONSchema()).toMatchObject({
      type: "integer",
      maximum: 10,
      minimum: 1,
    });
  });

  it("should convert floats", () => {
    const inference = inferSchema(1.1);

    const jsonSchema = inference.toJSONSchema();

    expect(jsonSchema).toMatchObject({
      type: "number",
    });
  });

  it("should adjust the number range if called multiple times", () => {
    let inference = inferSchema(1.1);
    inference = inferSchema(2.5, inference);
    inference = inferSchema(10.8, inference);

    expect(inference.toJSONSchema()).toMatchObject({
      type: "number",
      maximum: 10.8,
      minimum: 1.1,
    });
  });

  it("should convert strings", () => {
    expect(inferSchema("hello world").toJSONSchema()).toMatchObject({
      type: "string",
    });

    expect(inferSchema("https://google.com/#").toJSONSchema()).toMatchObject({
      type: "string",
      format: "uri",
    });

    expect(inferSchema("eric@stackhero.dev").toJSONSchema()).toMatchObject({
      type: "string",
      format: "email",
    });

    expect(inferSchema("AEA9CF21-965A-46C0-A4DD-3652B0BDC56D").toJSONSchema()).toMatchObject({
      type: "string",
      format: "uuid",
    });

    expect(inferSchema("google.com").toJSONSchema()).toMatchObject({
      type: "string",
      format: "hostname",
    });

    expect(inferSchema("192.168.1.0").toJSONSchema()).toMatchObject({
      type: "string",
      format: "ipv4",
    });

    expect(inferSchema("2001:db8:1234::1").toJSONSchema()).toMatchObject({
      type: "string",
      format: "ipv6",
    });

    expect(inferSchema("2019-01-01 00:00:00.000Z").toJSONSchema()).toMatchObject({
      type: "string",
      format: "date-time",
    });

    expect(inferSchema("2016-05-25").toJSONSchema()).toMatchObject({
      type: "string",
      format: "date",
    });

    expect(inferSchema("09:24:15").toJSONSchema()).toMatchObject({
      type: "string",
      format: "time",
    });
  });
});

describe("arrays", () => {
  test("converting a homogeneous array", () => {
    expect(inferSchema([1, 2, 3]).toJSONSchema()).toMatchObject({
      type: "array",
      items: { type: "integer" },
    });
  });
});

describe("objects", () => {
  test("converting an object", () => {
    expect(inferSchema({ foo: "bar" }).toJSONSchema()).toMatchObject({
      type: "object",
      properties: {
        foo: { type: "string" },
      },
      required: ["foo"],
    });
  });
});
