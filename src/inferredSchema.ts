import { JSONStringFormat } from "@jsonhero/json-infer-types";

type NumberRange = {
  min: number;
  max: number;
};

type InferredUnknown = {
  type: "unknown";
};

type InferredAny = {
  type: "any";
  schemas: Set<InferredSchema>;
};

type InferredBoolean = {
  type: "boolean";
};

type InferredInt = {
  type: "int";
  range: NumberRange;
};

type InferredFloat = {
  type: "float";
  range: NumberRange;
};

type InferredString = {
  type: "string";
  format?: JSONStringFormat;
};

type InferredArray = {
  type: "array";
  items: InferredSchema;
};

type InferredObject = {
  type: "object";
  properties: {
    required: Record<string, InferredSchema>;
    optional: Record<string, InferredSchema>;
  };
};

type InferredNullable = {
  type: "nullable";
  schema: InferredSchema;
};

export type InferredSchema =
  | InferredUnknown
  | InferredAny
  | InferredBoolean
  | InferredInt
  | InferredFloat
  | InferredString
  | InferredArray
  | InferredObject
  | InferredNullable;

export function inferRange(
  value: number,
  range: NumberRange = { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER },
): NumberRange {
  return {
    min: Math.min(range.min, value),
    max: Math.max(range.max, value),
  };
}
