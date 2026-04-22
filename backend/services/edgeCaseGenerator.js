// Mutates ONE field to create a realistic negative case.
// Keeps it minimal so we don’t break everything at once.
function generateEdgeCases(payload, schema) {
    if (!payload || typeof payload !== "object") return payload;

    const mutated = { ...payload };
    const props = schema?.properties || {};

    for (const key of Object.keys(mutated)) {
        const s = props[key];
        if (!s) continue;

        // 1) ENUM violation (highest signal)
        if (Array.isArray(s.enum) && s.enum.length) {
            mutated[key] = "invalid_enum";
            return mutated;
        }

        // 2) Wrong type
        if (s.type === "string") {
            mutated[key] = 12345;
            return mutated;
        }
        if (s.type === "integer" || s.type === "number") {
            mutated[key] = "not_a_number";
            return mutated;
        }
        if (s.type === "boolean") {
            mutated[key] = "not_a_boolean";
            return mutated;
        }

        // 3) Empty value (valid type, invalid content)
        if (s.type === "string") {
            mutated[key] = "";
            return mutated;
        }

        // 4) Boundary (numbers)
        if (s.type === "integer" || s.type === "number") {
            mutated[key] = -999999;
            return mutated;
        }
    }

    // Fallback: if schema didn’t help, flip a common field
    const anyKey = Object.keys(mutated)[0];
    if (anyKey) mutated[anyKey] = null;

    return mutated;
}

module.exports = { generateEdgeCases };