import { match, __ } from "ts-pattern";
import { s, Schema, SchemaBuilder, StringFormat } from "@jsonhero/json-schema-fns";
import { InferredSchema } from "../inferredSchema";
import { JSONStringFormat } from "@jsonhero/json-infer-types";

export function toJSONSchema(inferredSchema: InferredSchema): SchemaBuilder<Schema> {
  return match<InferredSchema, SchemaBuilder<Schema>>(inferredSchema)
    .with({ type: "unknown" }, () => s.$false())
    .with({ type: "boolean" }, () => s.boolean())
    .with({ type: "int" }, ({ inference }) => {
      if (inference.minValue === inference.maxValue) {
        return s.integer();
      } else {
        return s.integer({ minimum: inference.minValue, maximum: inference.maxValue });
      }
    })
    .with({ type: "float" }, ({ inference }) => {
      if (inference.minValue === inference.maxValue) {
        return s.number();
      } else {
        return s.number({ minimum: inference.minValue, maximum: inference.maxValue });
      }
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
    .run();
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
