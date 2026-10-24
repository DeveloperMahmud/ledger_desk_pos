import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LedgerDesk Business Operations",
    short_name: "LedgerDesk",
    description: "Inventory, invoicing, agency operations and accounting in one workspace.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#17263f",
  };
}
