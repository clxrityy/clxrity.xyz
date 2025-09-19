import type { MetadataRoute } from "next";


export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: "https://clxrity.xyz",
            lastModified: new Date(),
            priority: 1.0,
            images: [
                "https://clxrity.xyz/android-chrome-192x192.png"
            ]
        },
        {
            url: "https://clxrity.xyz/wav",
            lastModified: new Date(),
            priority: 0.5,
            images: [
                "https://wav.clxrity.xyz/android-chrome-192x192.png"
            ]
        },
        {
            url: "https://clxrity.xyz/mc",
            lastModified: new Date(),
            priority: 0.5,
        },
        {
            url: "https://clxrity.xyz/os",
            lastModified: new Date(),
            priority: 0.5,
            images: [
                "https://os.clxrity.xyz/android-chrome-192x192.png"
            ]
        },
        {
            url: "https://clxrity.xyz/hbd",
            lastModified: new Date(),
            priority: 0.5,
            images: [
                "https://hbd.clxrity.xyz/android-chrome-192x192.png"
            ]
        }
    ]
}