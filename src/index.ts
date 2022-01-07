import SchemaInferrer from "./SchemaInference";

export function inferSchema(value: unknown, inference?: SchemaInferrer): SchemaInferrer {
  return new SchemaInferrer(value, inference);
}
