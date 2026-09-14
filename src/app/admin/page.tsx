import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "Learnzzy Admin Command Center",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
