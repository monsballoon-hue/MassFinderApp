// scripts/generate-schema.js — Generates parish_data.schema.json from config.js
// Run: node scripts/generate-schema.js

var config = require('../src/config.js');
var fs = require('fs');
var path = require('path');

// Load the template schema (hand-authored structure, enums filled by this script)
var templatePath = path.join(__dirname, '..', 'parish_data.schema.template.json');
var outputPath = path.join(__dirname, '..', 'parish_data.schema.json');

// If template exists, use it. Otherwise generate from scratch.
var schema;
if (fs.existsSync(templatePath)) {
  schema = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  // Replace enum placeholders
  schema.definitions.service_type_enum.enum = config.SERVICE_TYPE_ENUM;
  schema.definitions.day_enum.oneOf[0].enum = config.DAY_ENUM;
} else {
  // Generate minimal schema
  console.warn('No template found — generating minimal schema');
  schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "MassFinder Parish Data",
    "type": "object",
    "required": ["metadata", "parishes"],
    "properties": {
      "metadata": { "type": "object" },
      "parishes": { "type": "array", "items": { "type": "object" } },
      "yc_events": { "type": "array" }
    }
  };
}

fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2) + '\n');
console.log('Generated parish_data.schema.json with ' + config.SERVICE_TYPE_ENUM.length + ' service types, ' + config.DAY_ENUM.length + ' day types');
