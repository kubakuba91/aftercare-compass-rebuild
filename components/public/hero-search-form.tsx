import { MapPin } from "lucide-react";

/** Native form controls styled as tabs; selection is submitted with the search. */
export function HeroSearchForm() {
  return (
    <form action="/search" className="ac-hero-search">
      <fieldset className="ac-search-tabs">
        <legend className="sr-only">Program type</legend>
        <label className="ac-search-tab">
          <input className="sr-only" type="radio" name="type" value="sober_living" defaultChecked />
          Sober Living
        </label>
        <label className="ac-search-tab">
          <input className="sr-only" type="radio" name="type" value="continued_care" />
          Continued Care
        </label>
      </fieldset>
      <div className="ac-hero-search-row">
        <label className="ac-hero-search-field">
          <MapPin aria-hidden="true" size={22} />
          <span className="sr-only">Search by city, state, or program name</span>
          <input className="!min-h-8 !border-0 !bg-transparent !p-0 !text-base !shadow-none" name="q" placeholder="City, state, or program name" />
        </label>
        <button className="focus-ring ac-button ac-button--primary" type="submit">Search</button>
      </div>
    </form>
  );
}
