import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLogin } from "@/components/admin/admin-login";
import { isSignedIn } from "@/lib/admin-auth";
import { fetchSiteContent, sanityWritable } from "@/lib/sanity";

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
  }));

  return <AdminDashboard content={content} sanityReady={sanityWritable} />;
}
