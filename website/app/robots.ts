import type { MetadataRoute } from "next";
import { isIndexable, publicOrigin } from "../lib/site-data";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isIndexable
      ? [
          { userAgent: "*", allow: "/" },
          { userAgent: "GPTBot", allow: "/" },
          { userAgent: "OAI-SearchBot", allow: "/" },
          { userAgent: "ChatGPT-User", allow: "/" },
          { userAgent: "PerplexityBot", allow: "/" },
          { userAgent: "ClaudeBot", allow: "/" },
        ]
      : { userAgent: "*", disallow: "/" },
    ...(isIndexable ? { sitemap: `${publicOrigin}/sitemap.xml` } : {}),
  };
}
