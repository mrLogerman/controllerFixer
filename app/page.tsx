import { LandingPage } from "@/components/landing-page";
import { fetchSiteContent, type SiteContent } from "@/lib/sanity";

export const revalidate = 60;

const empty: SiteContent = { feedback: [], videos: [], gallery: [] };

export default async function Home() {
  // A Sanity hiccup should never take the marketing page down.
  const content = await fetchSiteContent().catch(() => empty);

  return <LandingPage content={content} />;
}
