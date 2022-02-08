import { match, __ } from "ts-pattern";
import { inferType, JSONValueType } from "@jsonhero/json-infer-types";
import { InferredSchema, inferRange } from "./inferredSchema";
import { Schema } from "@jsonhero/json-schema-fns";
import { toJSONSchema } from "./jsonSchema";
import omit from "lodash.omit";

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
    .with([{ type: "nullable" }, __], ([nullable, { value }]) => {
      const subSchema = infer(nullable.schema, value);

      return {
        type: <const>"nullable",
        schema: subSchema,
      };
    })
    .with([{ type: "unknown" }, { name: "bool" }], () => ({ type: <const>"boolean" }))
    .with([{ type: "unknown" }, { name: "int" }], ([, inferredInt]) => ({
      type: <const>"int",
      range: inferRange(inferredInt.value),
    }))
    .with([{ type: "unknown" }, { name: "float" }], ([, inferredFloat]) => ({
      type: <const>"float",
      range: inferRange(inferredFloat.value),
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
    .with([{ type: "array" }, { name: "array" }], ([arraySchema, inferredArray]) => {
      let itemInferredSchema = arraySchema.items;

      for (const item of inferredArray.value) {
        itemInferredSchema = infer(itemInferredSchema, item);
      }

      return {
        type: <const>"array",
        items: itemInferredSchema,
      };
    })
    .with([{ type: "array" }, __], ([inferredArray]) => convertToAnySchema(inferredArray, value))
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
    .with([{ type: "object" }, { name: "object" }], ([{ properties }, { value }]) => {
      const { required, optional } = properties;

      const missingRequiredKeys = Object.keys(required).filter(
        (key) => !Object.prototype.hasOwnProperty.call(value, key),
      );

      for (const missingRequiredKey of missingRequiredKeys) {
        optional[missingRequiredKey] = required[missingRequiredKey];
      }

      const nextRequired = omit(required, missingRequiredKeys) as Record<string, InferredSchema>;

      for (const [k, v] of Object.entries(value)) {
        if (Object.prototype.hasOwnProperty.call(nextRequired, k)) {
          nextRequired[k] = infer(required[k], v);
        } else if (Object.prototype.hasOwnProperty.call(optional, k)) {
          optional[k] = infer(optional[k], v);
        } else {
          optional[k] = infer({ type: <const>"unknown" }, v);
        }
      }

      return {
        type: <const>"object",
        properties: {
          required: nextRequired,
          optional,
        },
      };
    })
    .with([{ type: "object" }, __], ([inferredObject]) => convertToAnySchema(inferredObject, value))
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
    .with([{ type: "int" }, { name: "int" }], ([intSchema, inferredInt]) => ({
      type: <const>"int",
      range: inferRange(inferredInt.value, intSchema.range),
    }))
    .with([{ type: "int" }, { name: "float" }], ([intSchema, inferredFloat]) => ({
      type: <const>"float",
      range: inferRange(inferredFloat.value, intSchema.range),
    }))
    .with([{ type: "int" }, __], ([inferredInt]) => convertToAnySchema(inferredInt, value))
    .with([{ type: "float" }, { name: "float" }], ([floatSchema, inferredFloat]) => ({
      type: <const>"float",
      range: inferRange(inferredFloat.value, floatSchema.range),
    }))
    .with([{ type: "float" }, { name: "int" }], ([floatSchema, inferredInt]) => ({
      type: <const>"float",
      range: inferRange(inferredInt.value, floatSchema.range),
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
      () => ({ type: <const>"string" }),
    )
    .with(
      [
        { type: "string", format: { name: __.string } },
        { name: "string", format: __.nullish },
      ],
      () => ({ type: <const>"string" }),
    )
    .with(
      [
        { type: "string", format: { name: __.string } },
        { name: "string", format: { name: __.string } },
      ],
      ([{ format: schemaFormat }, { format }]) => {
        if (schemaFormat.name !== format.name) {
          return {
            type: <const>"string",
          };
        }

        return { type: <const>"string", format };
      },
    )
    .with([{ type: "string" }, { name: "string" }], () => ({
      type: <const>"string",
    }))
    .with([{ type: "string" }, __], ([inferredString]) => convertToAnySchema(inferredString, value))
    .exhaustive();

  return result;
}

export default class SchemaInferrer {
  inferredSchema: InferredSchema = { type: "unknown" };

  constructor(snapshot?: InferredSchema) {
    if (snapshot) {
      this.inferredSchema = snapshot;
    }
  }

  infer(value: unknown, inference?: SchemaInferrer) {
    this.inferredSchema = infer(inference ? inference.inferredSchema : this.inferredSchema, value);
  }

  toJSONSchema(options?: { includeSchema?: boolean }): Schema {
    if (options?.includeSchema) {
      return toJSONSchema(this.inferredSchema).toSchemaDocument();
    } else {
      return toJSONSchema(this.inferredSchema).toSchema();
    }
  }

  toSnapshot(): InferredSchema {
    return this.inferredSchema;
  }
}
