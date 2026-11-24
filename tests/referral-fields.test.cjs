const assert = require("node:assert/strict");
const React = require("react");
global.React = React;
const { renderToStaticMarkup } = require("react-dom/server");
const { ReferralFields } = require("../components/public/referral-fields.tsx");
const { referralSchema, forbiddenDirectIdentifierFields } = require("../lib/validations/referral.ts");
const contact = { name: "Case Manager", email: "manager@example.com", phone: "2025550101", organization: "Example & Team" };
const markup = renderToStaticMarkup(React.createElement(ReferralFields, { contact }));
for (const field of Object.keys(referralSchema.shape).filter(field => field !== "aftercareProfileId")) {
  assert.ok(markup.includes(`name="${field}"`), `Missing referral field: ${field}`);
}
for (const field of forbiddenDirectIdentifierFields) assert.ok(!markup.includes(`name="${field}"`));
for (const value of ["Case Manager", "manager@example.com", "2025550101", "Example &amp; Team"]) assert.ok(markup.includes(`value="${value}"`));
for (const field of ["clientAgeRange", "supportCategory", "insuranceCategory", "preferredStartWindow"]) {
  const options = markup.match(new RegExp(`<select[^>]*name="${field}"[^>]*>([\\s\\S]*?)</select>`))[1];
  for (const value of referralSchema.shape[field].options) assert.ok(options.includes(`value="${value}"`), `Missing ${field} option: ${value}`);
}
assert.match(markup, /minLength="20"/);
assert.match(markup, /maxLength="2000"/);
console.log("Shared referral fields: schema field/option compatibility, prefills, escaping, and exclusion of direct identifiers passed.");
