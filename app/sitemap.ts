import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "os.clxrity.xyz",
      lastModified: new Date(),
      priority: 1,
    },
  ];
}
