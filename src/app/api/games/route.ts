import { NextResponse } from "next/server";

// GET /api/games — active games only (BR-010). The five-game MVP registry is
// the authoritative catalogue until gameConfigs are managed by admin.
export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      { id: "addition", name: "Number Adventure", icon: "🔢", description: "Learn addition through pictures.", active: true },
      { id: "subtraction", name: "Fly Away", icon: "🐦", description: "Learn subtraction by counting what remains.", active: true },
      { id: "clean-up", name: "Clean Up", icon: "🧹", description: "Spot and clean.", active: true },
      { id: "puzzle", name: "Picture Puzzle", icon: "🧩", description: "Complete the picture.", active: true },
      { id: "sketch", name: "Shadow Sketch", icon: "✏️", description: "Trace the shape.", active: true },
    ],
  });
}
