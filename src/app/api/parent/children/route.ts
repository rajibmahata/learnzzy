import { NextResponse } from "next/server";
import { listLinksForParent } from "@/repositories/parents";
import { getLearner } from "@/repositories/learners";
import { requireParent } from "@/server/parent-auth";
import { buildChildSummary } from "@/services/parentInsights";

export async function GET() {
  const auth = requireParent();
  if (!auth.ok) return auth.response;
  const links = await listLinksForParent(auth.parent.id);
  const active = links.filter((l) => l.status === "active");
  const children = [];
  for (const link of active) {
    const learner = await getLearner(link.learnerId);
    if (!learner) continue;
    children.push(await buildChildSummary(learner));
  }
  const pending = links.filter((l) => l.status === "pending").map((l) => l.learnerId);
  return NextResponse.json({ success: true, data: { children, pending } });
}
