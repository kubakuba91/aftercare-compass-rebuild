const assert = require('node:assert/strict');
const React = require('react');
global.React = React;
const { renderToStaticMarkup } = require('react-dom/server');
const { ProfileDetailSections } = require('../components/public/profile-detail-sections.tsx');
const empty = {
  specialtyPopulations: [], supportServices: [], amenities: [], programmingSchedule: [],
  clientAcceptanceMethods: [], languagesServed: [], insuranceAccepted: [], insuranceNotes: null,
  matAccepted: [], medicationServicesOffered: [], recoveryResidenceLevel: null, intakeTurnaroundTime: null,
  certificationsHeld: [], accreditations: [], recoverySupportServices: [], clinicalFocus: []
};
const render = (type, values = {}) => renderToStaticMarkup(React.createElement(ProfileDetailSections, { profile: { ...empty, type, ...values } }));
for (const type of ['sober_living', 'continued_care']) {
  assert.equal(render(type), '');
  assert.equal(render(type, { supportServices: [' ', ''], insuranceNotes: '  ', intakeTurnaroundTime: ' ' }), '');
  const sparse = render(type, { specialtyPopulations: ['Adults (18+)'] });
  assert.match(sparse, /Adults \(18\+\)/);
  assert.doesNotMatch(sparse, /Not listed|Support services|clinical fit|support and fit|md:grid-cols-2/);
  const both = render(type, { specialtyPopulations: ['Adults'], certificationsHeld: ['Certification A'] });
  assert.match(both, /md:grid-cols-2/); assert.match(both, /Certification A/);
}
const program = render('continued_care', { insuranceNotes: 'Call for coverage <details>', clinicalFocus: ['Substance Use Disorder'] });
assert.match(program, /Insurance\/payment/); assert.match(program, /Call for coverage &lt;details&gt;/);
assert.match(program, /Substance Use Disorder/); assert.doesNotMatch(program, /Not listed|Medication services|Accreditations/);
const home = render('sober_living', { insuranceAccepted: ['Private'], insuranceNotes: 'Insurance note', accreditations: ['Accreditation'], clinicalFocus: ['Clinical'], amenities: ['Laundry'], recoveryResidenceLevel: 'Level II', matAccepted: ['Buprenorphine'] });
assert.match(home, /Laundry/); assert.match(home, /Level II/); assert.match(home, /Buprenorphine/);
assert.doesNotMatch(home, /Insurance\/payment|Insurance note|Accreditations|Clinical focus/);
assert.doesNotMatch(render('continued_care', { matAccepted: ['Buprenorphine'] }), /Buprenorphine/);
assert.match(render('continued_care', { medicationServicesOffered: ['MAT \/ Addiction medication management'], matAccepted: ['Buprenorphine'] }), /MAT medications offered/);
assert.doesNotMatch(render('continued_care', { medicationServicesOffered: ['MAT \/ Addiction medication management'] }), /MAT medications offered/);
console.log('Home and program rendering: empty rows/cards, whitespace, populated fields, insurance notes, type-specific fields and MAT dependencies passed.');
