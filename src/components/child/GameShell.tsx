import * as React from "react";
import { GameHeader } from "./GameHeader";

export function GameShell({
  title,
  stars,
  children,
}: {
  title: string;
  stars: number;
  children: React.ReactNode;
}) {
  const [soundOn, setSoundOn] = React.useState(true);
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-game flex-col px-4 pb-6">
      <GameHeader title={title} stars={stars} soundOn={soundOn} onToggleSound={() => setSoundOn((s) => !s)} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
