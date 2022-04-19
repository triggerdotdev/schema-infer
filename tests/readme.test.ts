import { inferSchema } from "../src";

test("example 1", () => {
  expect(
    inferSchema([
      { rank: 1, name: "Eric", winner: true },
      { rank: 2, name: "Matt" },
    ]).toJSONSchema(),
  ).toMatchInlineSnapshot(`
    Object {
      "items": Object {
        "properties": Object {
          "name": Object {
            "type": "string",
          },
          "rank": Object {
            "type": "integer",
          },
          "winner": Object {
            "type": "boolean",
          },
        },
        "required": Array [
          "rank",
          "name",
        ],
        "type": "object",
      },
      "type": "array",
    }
  `);
});
