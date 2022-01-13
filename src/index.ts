import { InferredSchema } from "./inferredSchema";
import SchemaInferrer from "./SchemaInference";

export function inferSchema(value: unknown, inference?: SchemaInferrer): SchemaInferrer {
  const schemaInferrer = new SchemaInferrer();
  schemaInferrer.infer(value, inference);
  return schemaInferrer;
}

export function restoreSnapshot(snapshot: InferredSchema): SchemaInferrer {
  return new SchemaInferrer(snapshot);
}

export type { SchemaInferrer };
