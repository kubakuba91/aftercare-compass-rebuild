export const resourcesPlaylistId = "PLb9ZWqN6f9YU";
export const resourcesPlaylistUrl = `https://www.youtube.com/playlist?list=${resourcesPlaylistId}`;

export type ResourceVideo = {
  id: string;
  title: string;
  summary: string;
};

// Videos from the Aftercare Compass YouTube playlist (titles verified via YouTube oEmbed).
export const resourceVideos: ResourceVideo[] = [
  {
    id: "tWqf9_3f4XU",
    title: "What is a recovery house, really?",
    summary: "A plain look at what a recovery house is, who lives there, and what a normal day looks like."
  },
  {
    id: "nqBZ6ckx1Gc",
    title: "A short history of recovery houses in the U.S.",
    summary: "Where sober living came from and how it grew into what it is today."
  },
  {
    id: "Ewj_uTa2KvY",
    title: "Oxford House and the peer-run model",
    summary: "How houses run by the residents themselves work, and why the model has lasted."
  },
  {
    id: "VbIAyEMB6T0",
    title: "Landmark / historic houses",
    summary: "A few of the houses that shaped recovery housing."
  },
  {
    id: "nVJaYconmr8",
    title: "Myths vs reality",
    summary: "Common ideas about recovery houses, and what is actually true."
  },
  {
    id: "63RMKuqgmBA",
    title: "How people get from treatment to a house — the handoff",
    summary: "What happens between leaving treatment and moving in, and where people get stuck."
  },
  {
    id: "1OGbweOx-R8",
    title: "What case managers look for when they place someone",
    summary: "The questions case managers ask before they recommend a house."
  }
];

export function youtubeWatchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}&list=${resourcesPlaylistId}`;
}
