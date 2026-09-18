import Link from "next/link";
import { GameShell } from "@/components/child/GameShell";
import { categoryFor } from "@/lib/categories";
import { activitiesForCategory } from "@/lib/activityRegistry";
import { notFound } from "next/navigation";

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = categoryFor(params.category);
  if (!category) notFound();
  const activities = activitiesForCategory(category.id);
  return (
    <GameShell title={category.name} stars={0}>
      <div className="mx-auto flex w-full max-w-game flex-col gap-3 px-4 pb-24 pt-4">
        <div className={`rounded-3xl bg-gradient-to-br p-5 text-center shadow-card ${category.gradient}`}>
          <p aria-hidden className="text-5xl">{category.icon}</p>
          <h1 className="mt-1 text-headline-lg">{category.name}</h1>
          <p className="font-bold opacity-80">{category.tagline}</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {activities.map((a) => (
            <Link
              key={a.id}
              href={a.href ?? `/learn/${category.id}/${a.id}`}
              className="safe-panel tactile flex items-center gap-3 p-4 text-left"
            >
              <span aria-hidden className="text-3xl">{a.icon}</span>
              <span className="min-w-0">
                <span className="block font-extrabold">{a.title}</span>
                <span className="block truncate text-sm text-on-surface-variant">{a.blurb}</span>
              </span>
              <span aria-hidden className="ml-auto text-xl">→</span>
            </Link>
          ))}
        </div>
        <Link href="/play" className="text-center text-sm font-bold text-primary underline">← Back to Learning World</Link>
      </div>
    </GameShell>
  );
}
