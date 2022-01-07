import { match, not, __ } from "ts-pattern";
import { inferType, JSONValueType } from "@jsonhero/json-infer-types";
import { FloatInference, InferredSchema, IntInference } from "./inferredSchema";
import { Schema } from "@jsonhero/json-schema-fns";
import { toJSONSchema } from "./jsonSchema";

function convertToAnySchema(schema: InferredSchema, value: unknown) {
  const schemas = new Set<InferredSchema>([schema]);

  schemas.add(infer({ type: "unknown" }, value));

  return {
    type: <const>"any",
    schemas,
  };
}

function infer(inferredSchema: InferredSchema, value: unknown): InferredSchema {
  const inferredValueType = inferType(value);

  const result = match<[InferredSchema, JSONValueType], InferredSchema>([
    inferredSchema,
    inferredValueType,
  ])
    .with([__, { name: "null" }], ([subSchema]) => ({
      type: <const>"nullable",
      schema: subSchema,
    }))
    .with([{ type: "nullable" }, __], ([nullable]) => infer(nullable.schema, value))
    .with([{ type: "unknown" }, { name: "bool" }], () => ({ type: <const>"boolean" }))
    .with([{ type: "unknown" }, { name: "int" }], ([, inferredInt]) => ({
      type: <const>"int",
      inference: new IntInference().infer(inferredInt.value),
    }))
    .with([{ type: "unknown" }, { name: "float" }], ([, inferredFloat]) => ({
      type: <const>"float",
      inference: new FloatInference().infer(inferredFloat.value),
    }))
    .with([{ type: "unknown" }, { name: "string" }], ([, { format }]) => ({
      type: <const>"string",
      format: format,
    }))
    .with([{ type: "unknown" }, { name: "array" }], ([, inferredArray]) => {
      let itemInferredSchema = {
        type: <const>"unknown",
      } as InferredSchema;

      for (const item of inferredArray.value) {
        itemInferredSchema = infer(itemInferredSchema, item);
      }

      return {
        type: <const>"array",
        items: itemInferredSchema,
      };
    })
    .with([{ type: "unknown" }, { name: "object" }], ([, inferredType]) => {
      const required = Object.entries(inferredType.value).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: infer({ type: <const>"unknown" }, value),
        }),
        {} as Record<string, InferredSchema>,
      );

      return {
        type: <const>"object",
        properties: {
          required,
          optional: {},
        },
      };
    })
    .with([{ type: "any" }, __], ([anySchema]) => {
      const schemas = new Set<InferredSchema>(anySchema.schemas);

      schemas.add(infer({ type: "unknown" }, value));

      return {
        type: <const>"any",
        schemas,
      };
    })
    .with([{ type: "boolean" }, { name: "bool" }], () => ({ type: <const>"boolean" }))
    .with([{ type: "boolean" }, __], ([inferredBool]) => convertToAnySchema(inferredBool, value))
    .with([{ type: "int" }, { name: "int" }], ([inferredInt, intType]) => ({
      type: <const>"int",
      inference: inferredInt.inference.infer(intType.value),
    }))
    .with([{ type: "int" }, __], ([inferredInt]) => convertToAnySchema(inferredInt, value))
    .with([{ type: "float" }, { name: "float" }], ([inferredFloat, floatType]) => ({
      type: <const>"float",
      inference: inferredFloat.inference.infer(floatType.value),
    }))
    .with([{ type: "float" }, __], ([inferredFloat]) => convertToAnySchema(inferredFloat, value))
    .with(
      [
        { type: "string", format: __.nullish },
        { name: "string", format: __.nullish },
      ],
      () => ({ type: <const>"string" }),
    )
    .with(
      [
        { type: "string", format: __.nullish },
        { name: "string", format: { name: __.string } },
      ],
      ([inferredString]) => convertToAnySchema(inferredString, value),
    )
    .with(
      [
        { type: "string", format: { name: __.string } },
        { name: "string", format: __.nullish },
      ],
      ([inferredString]) => convertToAnySchema(inferredString, value),
    )
    .with(
      [
        { type: "string", format: { name: "country" } },
        { name: "string", format: { name: not("country") } },
      ],
      ([inferredString]) => convertToAnySchema(inferredString, value),
    )
    .with(
      [
        { type: "string", format: { name: "currency" } },
        { name: "string", format: { name: not("currency") } },
      ],
      ([inferredString]) => convertToAnySchema(inferredString, value),
    )
    .run();

  return result;
}

export default class SchemaInferrer {
  inferredSchema: InferredSchema = { type: "unknown" };

  constructor(value: unknown, inference?: SchemaInferrer) {
    this.inferredSchema = infer(inference ? inference.inferredSchema : this.inferredSchema, value);
  }

  toJSONSchema(): Schema {
    return toJSONSchema(this.inferredSchema).toSchemaDocument();
  }
}
