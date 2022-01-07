import { JSONStringFormat } from "@jsonhero/json-infer-types";

export class IntInference {
  minValue: number;
  maxValue: number;

  // This may seem counter-intuitive, but we have to start the minValue at the highest integer and the maxValue at the lowest integer
  constructor(minValue = Number.MAX_SAFE_INTEGER, maxValue = Number.MIN_SAFE_INTEGER) {
    this.minValue = minValue;
    this.maxValue = maxValue;
  }

  infer(value: number): IntInference {
    return new IntInference(Math.min(this.minValue, value), Math.max(this.maxValue, value));
  }
}

export class FloatInference {
  minValue: number;
  maxValue: number;

  constructor(minValue = Number.MAX_SAFE_INTEGER, maxValue = Number.MIN_SAFE_INTEGER) {
    this.minValue = minValue;
    this.maxValue = maxValue;
  }

  infer(value: number): IntInference {
    return new IntInference(Math.min(this.minValue, value), Math.max(this.maxValue, value));
  }
}

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
  inference: IntInference;
};

type InferredFloat = {
  type: "float";
  inference: FloatInference;
};

type InferredString = {
  type: "string";
  format?: JSONStringFormat;
};

type InferredEnum = {
  type: "enum";
  values: Set<string>;
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

type InferredValues = {
  type: "values";
  schema: InferredSchema;
};

type InferredDiscrimator = {
  type: "discrimator";
  discrimator: string;
  mapping: Record<string, InferredSchema>;
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
  | InferredEnum
  | InferredArray
  | InferredObject
  | InferredValues
  | InferredDiscrimator
  | InferredNullable;
