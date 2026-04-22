module.exports = {
  type: "none", // "none" | "apiKey" | "bearer"

  apiKey: {
    key: "x-api-key",
    value: "123456",
    in: "header" // or "query"
  },

  bearer: {
    token: ""
  }
};
