import { CURRICULUM_FRAMEWORKS } from "@/lib/curriculum/registry";
import { calculateCoverage } from "@/lib/curriculum/coverage";
import Link from "next/link";

export const metadata = { title: "Curriculum Command Center", robots: { index: false, follow: false } };

export default function CurriculumAdminPage() {
  const cov = calculateCoverage();
  return (
    <main className="admin-shell p-6">
      <h1 className="text-2xl font-black">Curriculum Command Center</h1>
      <p className="text-sm text-on-surface-variant">Frameworks: {cov.frameworks} • Outcomes: {cov.outcomes} • Coverage: {cov.coveragePct}%</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {CURRICULUM_FRAMEWORKS.map((f) => (
          <div key={f.id} className="rounded-xl border-2 border-white bg-white p-4 shadow">
            <h2 className="font-black">{f.name} <span className="text-xs font-bold text-on-surface-variant">{f.code}</span></h2>
            <p className="text-xs">{f.country} • {f.organization} • {f.educationStage}</p>
            <a href={f.sourceUrl} target="_blank" className="text-xs text-primary underline">{f.sourceUrl}</a>
            <p className="text-xs mt-1">Version {f.version} • {f.status}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h2 className="font-black">Coverage Matrix (Framework × Subject)</h2>
        <table className="mt-2 w-full text-xs border">
          <thead><tr><th className="border p-2">Framework</th><th className="border p-2">Math</th><th className="border p-2">Literacy</th><th className="border p-2">Science</th></tr></thead>
          <tbody>
            {CURRICULUM_FRAMEWORKS.slice(0, 4).map((f) => (
              <tr key={f.id}><td className="border p-2">{f.code}</td><td className="border p-2">{cov.coveragePct >= 50 ? "✓ Covered" : "○ Missing"}</td><td className="border p-2">{cov.coveragePct >= 50 ? "✓" : "○"}</td><td className="border p-2">○ Planned</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <Link href="/admin" className="rounded-full bg-primary px-4 py-2 text-white text-sm font-bold">Back to Command Center</Link>
        <a href="/api/admin/activities" className="rounded-full bg-surface-container px-4 py-2 text-sm font-bold">API: Activities</a>
      </div>
    </main>
  );
}
