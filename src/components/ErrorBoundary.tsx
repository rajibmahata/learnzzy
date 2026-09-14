"use client";
import { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown) { console.error("[learnzzy] ErrorBoundary", error); }
  render() {
    if (this.state.hasError) return this.props.fallback ?? <div className="p-6 text-center"><p className="font-bold">Something went wrong.</p><p className="text-sm text-on-surface-variant">Please refresh and try again.</p></div>;
    return this.props.children;
  }
}
