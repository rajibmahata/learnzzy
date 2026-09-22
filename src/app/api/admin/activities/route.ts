import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { LEARNING_ACTIVITY_REGISTRY } from "@/lib/learningActivities";
import { LEARNING_WORLDS } from "@/lib/learningWorlds";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;
  const activities = LEARNING_ACTIVITY_REGISTRY.map((a) => ({
    id: a.id, type: a.type, world: a.world, category: a.category, skill: a.skill, ageBands: a.ageBands, difficulty: a.difficulty, mechanics: a.mechanics, safetyStatus: a.safetyStatus, provenance: a.provenance, title: a.title, icon: a.icon,
  }));
  const worlds = LEARNING_WORLDS.map((w) => ({ id: w.id, name: w.name, icon: w.icon, mechanics: w.mechanics.length, categories: w.categories }));
  return NextResponse.json({ success: true, data: { activities, worlds, total: activities.length, worldsCount: worlds.length } });
}
