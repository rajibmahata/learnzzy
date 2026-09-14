import { tutorConfig, oerConfig, ncertConfig } from "./config";
import { registerLiveTutor } from "./tutor/tutor-provider";
import { registerLiveOer } from "./oer/oer-provider";
import { registerLiveNcert } from "./ncert/ncert-provider";
// Static imports above register the deterministic mocks at module load.
import "./tutor/tutor-provider";
import "./oer/oer-provider";
import "./ncert/ncert-provider";

// Idempotent gateway bootstrap. Mocks are registered by the static imports;
// calling ensureEducationProviders() additionally registers live HTTP
// adapters for whichever providers are enabled + configured. Safe to call
// on every server start and from API routes (lazy singleton).
let done = false;

export function ensureEducationProviders(): void {
  if (done) return;
  done = true;
  const t = tutorConfig();
  if (t.enabled) registerLiveTutor(t);
  const o = oerConfig();
  if (o.enabled) registerLiveOer(o);
  const n = ncertConfig();
  if (n.enabled) registerLiveNcert(n);
}
