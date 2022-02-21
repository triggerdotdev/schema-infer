import { match } from "ts-pattern";
import { s, Schema, SchemaBuilder, StringFormat } from "@jsonhero/json-schema-fns";
import { InferredSchema } from "../inferredSchema";
import { JSONStringFormat } from "@jsonhero/json-infer-types";

export function toJSONSchema(inferredSchema: InferredSchema): SchemaBuilder<Schema> {
  return match<InferredSchema, SchemaBuilder<Schema>>(inferredSchema)
    .with({ type: "unknown" }, () => s.$false()) // This should never be reached
    .with({ type: "boolean" }, () => s.boolean())
    .with({ type: "nullable" }, ({ schema }) =>
      schema.type == "unknown"
        ? s.nil()
        : schema.type === "nullable"
        ? toJSONSchema(schema)
        : s.nullable(toJSONSchema(schema)),
    )
    .with({ type: "int" }, () => {
      return s.integer();
    })
    .with({ type: "float" }, () => {
      return s.number();
    })
    .with({ type: "string" }, ({ format }) => {
      const formatString = toJSONStringFormat(format);

      return s.string(formatString ? { format: formatString } : {});
    })
    .with({ type: "array" }, (inferredArray) => {
      const items = toJSONSchema(inferredArray.items);

      return s.array({ items });
    })
    .with({ type: "object" }, (inferredObject) => {
      const requiredProperties = Object.entries(inferredObject.properties.required).map(
        ([key, value]) => s.requiredProperty(key, toJSONSchema(value)),
      );

      const optionalProperties = Object.entries(inferredObject.properties.optional).map(
        ([key, value]) => s.property(key, toJSONSchema(value)),
      );

      return s.object({ properties: requiredProperties.concat(optionalProperties) });
    })
    .with({ type: "any" }, ({ schemas }) => {
      return s.anyOf(...Array.from(schemas).map(toJSONSchema));
    })
    .exhaustive();
}

function toJSONStringFormat(format?: JSONStringFormat): StringFormat | undefined {
  if (!format) {
    return undefined;
  }

  switch (format.name) {
    case "hostname":
      return "hostname";
    case "ip":
      return format.variant == "v4" ? "ipv4" : "ipv6";
    case "uri":
      return "uri";
    case "email":
      return "email";
    case "datetime":
      switch (format.parts) {
        case "datetime":
          return "date-time";
        case "date":
          return "date";
        case "time":
          return "time";
        default:
          return undefined;
      }
    case "uuid":
      return "uuid";
  }

  return undefined;
}
