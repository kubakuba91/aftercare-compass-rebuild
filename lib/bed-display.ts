type PopulationBedProfile = {
  populationServedOptions: string[];
  bedsMen: number | null;
  bedsMenAvailable: number | null;
  bedsWomen: number | null;
  bedsWomenAvailable: number | null;
  bedsLgbtq: number | null;
  bedsLgbtqAvailable: number | null;
};

function shouldShowPopulationBed(
  servedPopulations: string[],
  population: string,
  total: number | null,
  available: number | null
) {
  const isServed = servedPopulations.length ? servedPopulations.includes(population) : true;
  const hasConfiguredBeds = (total ?? 0) > 0 || (available ?? 0) > 0;

  return isServed && hasConfiguredBeds;
}

export function getVisiblePopulationBeds(profile: PopulationBedProfile) {
  return [
    {
      label: "Men",
      total: profile.bedsMen ?? 0,
      available: profile.bedsMenAvailable ?? 0,
      visible: shouldShowPopulationBed(
        profile.populationServedOptions,
        "Men",
        profile.bedsMen,
        profile.bedsMenAvailable
      )
    },
    {
      label: "Women",
      total: profile.bedsWomen ?? 0,
      available: profile.bedsWomenAvailable ?? 0,
      visible: shouldShowPopulationBed(
        profile.populationServedOptions,
        "Women",
        profile.bedsWomen,
        profile.bedsWomenAvailable
      )
    },
    {
      label: "LGBTQ+",
      total: profile.bedsLgbtq ?? 0,
      available: profile.bedsLgbtqAvailable ?? 0,
      visible: shouldShowPopulationBed(
        profile.populationServedOptions,
        "LGBTQ+",
        profile.bedsLgbtq,
        profile.bedsLgbtqAvailable
      )
    }
  ].filter((item) => item.visible);
}
