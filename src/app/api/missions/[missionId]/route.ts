import { NextResponse } from "next/server";
import { missionFromId, validateMission } from "@/lib/missionEngine";
import { saveMissionDefinition } from "@/repositories/missions";

export async function GET(_req: Request, { params }: { params: { missionId: string } }) {
  const mission = missionFromId(params.missionId, 1);
  if (!mission) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Mission not found." } }, { status: 404 });
  const errors = validateMission(mission);
  if (errors.length) return NextResponse.json({ success: false, error: { code: "INVALID_MISSION", message: errors.join(", ") } }, { status: 500 });
  await saveMissionDefinition(mission);
  return NextResponse.json({ success: true, data: { mission } });
}
