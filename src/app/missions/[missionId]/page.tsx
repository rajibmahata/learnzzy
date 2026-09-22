import { MissionPlayer } from "@/components/child/MissionPlayer";

export default function MissionPage({ params }: { params: { missionId: string } }) {
  return <MissionPlayer missionId={params.missionId} />;
}
