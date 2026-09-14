import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/play`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/play/addition`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/play/subtraction`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/play/clean-up`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/play/puzzle`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/play/sketch`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
