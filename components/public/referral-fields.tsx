export type ReferralContact = { name: string; email: string; phone: string; organization: string };

/** Shared fields for profile and popup referral forms. */
export function ReferralFields({ contact }: { contact?: ReferralContact }) {
  return <>
        <label className="grid gap-2 text-sm font-medium">
          Case manager name
          <input className="min-h-10 rounded-md border border-border px-3" defaultValue={contact?.name} name="caseManagerName" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Case manager email
          <input className="min-h-10 rounded-md border border-border px-3" defaultValue={contact?.email} name="caseManagerEmail" required type="email" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Case manager phone
          <input className="min-h-10 rounded-md border border-border px-3" name="caseManagerPhone" defaultValue={contact?.phone} type="tel" minLength={7} required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Organization name
          <input className="min-h-10 rounded-md border border-border px-3" defaultValue={contact?.organization} name="caseManagerOrganization" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Client age range
          <select className="min-h-10 rounded-md border border-border px-3" name="clientAgeRange" required>
            <option value="">Select one</option>
            <option value="18_25">18-25</option>
            <option value="26_35">26-35</option>
            <option value="36_45">36-45</option>
            <option value="46_55">46-55</option>
            <option value="55_plus">55+</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Support category
          <select className="min-h-10 rounded-md border border-border px-3" name="supportCategory" required>
            <option value="">Select one</option>
            <option value="substance_use">Substance use recovery</option>
            <option value="mental_health">Mental health support</option>
            <option value="co_occurring">Co-occurring support</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Insurance category
          <select className="min-h-10 rounded-md border border-border px-3" name="insuranceCategory" required>
            <option value="">Select one</option>
            <option value="medicaid">Medicaid</option>
            <option value="medicare">Medicare</option>
            <option value="commercial">Commercial</option>
            <option value="self_pay">Self-pay</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Preferred start window
          <select className="min-h-10 rounded-md border border-border px-3" name="preferredStartWindow" required>
            <option value="">Select one</option>
            <option value="within_1_week">Within 1 week</option>
            <option value="1_2_weeks">1-2 weeks</option>
            <option value="2_4_weeks">2-4 weeks</option>
            <option value="flexible">Flexible</option>
          </select>
        </label>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Special needs/preferences</legend>
          {["MAT-friendly", "Gender-specific housing", "12-Step oriented", "Pet friendly"].map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm">
              <input name="specialNeeds" type="checkbox" value={item} />
              {item}
            </label>
          ))}
        </fieldset>
        <label className="grid gap-2 text-sm font-medium">
          Reason for referral
          <textarea className="min-h-28 rounded-md border border-border p-3" name="reasonForReferral" minLength={20} maxLength={2000} required />
        </label>
  </>;
}
