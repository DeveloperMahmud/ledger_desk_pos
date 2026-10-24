import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ledgerly Business Operations",
    short_name: "Ledgerly",
    description: "Inventory, invoicing, agency operations and accounting in one workspace.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#17263f",
  };
}
