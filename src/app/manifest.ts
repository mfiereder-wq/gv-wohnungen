import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GV Wohnungen – Bezahlbare Mietwohnungen in der Schweiz",
    short_name: "GV Wohnungen",
    description: "Finde günstige Wohnungen in der Schweiz. Echte Inserate von Flatfox, Homegate und Comparis.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a7a4c",
    icons: [
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  }
}