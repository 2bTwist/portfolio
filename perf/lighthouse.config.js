/* Lighthouse config file (`lighthouse --config-path`) for the network profile
   budgets.json declares; used by the perf-check engine. */
const { lighthouseSettings, declaredNetwork } = require("./lighthouse-settings.js");

module.exports = { extends: "lighthouse:default", settings: lighthouseSettings(declaredNetwork) };
