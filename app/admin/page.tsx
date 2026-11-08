import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLogin } from "@/components/admin/admin-login";
import { isSignedIn } from "@/lib/admin-auth";
import { listFeedbackRequests } from "@/lib/feedback-requests";
import { fetchSiteContent, sanityWritable } from "@/lib/sanity";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Site content",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isSignedIn())) {
    return <AdminLogin />;
  }

  const content = await fetchSiteContent().catch(() => ({
    feedback: [],
    videos: [],
    gallery: [],
  }));
  const requests = await listFeedbackRequests().catch(() => []);

  return (
    <AdminDashboard
      content={content}
      requests={requests}
      siteUrl={siteUrl}
      sanityReady={sanityWritable}
    />
  );
}
