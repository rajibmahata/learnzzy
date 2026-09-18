import { ActivityPlayer } from "@/components/child/ActivityPlayer";
import { activityFor } from "@/lib/activityRegistry";
import { redirect } from "next/navigation";

export default function ActivityPage({ params }: { params: { category: string; activity: string } }) {
  const def = activityFor(params.activity);
  if (!def) redirect("/play");
  // Shipped engines keep their own routes (math, sorting, puzzle, …).
  if (def.href) redirect(def.href);
  if (def.category !== params.category) redirect(`/learn/${def.category}/${def.id}`);
  return <ActivityPlayer activityId={def.id} />;
}
