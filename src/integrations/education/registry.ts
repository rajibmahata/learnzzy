import type { ProviderName } from "./types";
import type { AnyEducationProvider } from "./provider";
import { tutorConfig, oerConfig, ncertConfig, type ProviderConfig } from "./config";
import { markDisabled } from "./health";

// Allowlisted provider registry — server-side only. No caller can register
// an arbitrary URL; only these three providers exist. Each entry resolves to
// a live HTTP adapter when enabled+configured, otherwise a deterministic
// mock implementing the same interface.
const live = new Map<ProviderName, AnyEducationProvider>();
const mocks = new Map<ProviderName, AnyEducationProvider>();

export function registerLiveProvider(name: ProviderName, provider: AnyEducationProvider): void {
  if (provider.name !== name) throw new Error("Provider name mismatch.");
  live.set(name, provider);
}

export function registerMockProvider(name: ProviderName, provider: AnyEducationProvider): void {
  if (provider.name !== name) throw new Error("Provider name mismatch.");
  mocks.set(name, provider);
}

export function providerConfig(name: ProviderName): ProviderConfig {
  if (name === "tutor-mcp") return tutorConfig();
  if (name === "oer-mcp") return oerConfig();
  return ncertConfig();
}

export function resolveProvider(name: ProviderName): { provider: AnyEducationProvider; mocked: boolean; enabled: boolean } {
  const cfg = providerConfig(name);
  if (!cfg.enabled) {
    markDisabled(name);
    const mock = mocks.get(name);
    if (!mock) throw new Error(`No mock registered for disabled provider ${name}.`);
    return { provider: mock, mocked: true, enabled: false };
  }
  const adapter = live.get(name);
  if (!adapter) {
    const mock = mocks.get(name);
    if (!mock) throw new Error(`No provider registered for ${name}.`);
    return { provider: mock, mocked: true, enabled: true };
  }
  return { provider: adapter, mocked: false, enabled: true };
}

export function registeredProviders(): ProviderName[] {
  return ["tutor-mcp", "oer-mcp", "ncert-mcp"];
}
