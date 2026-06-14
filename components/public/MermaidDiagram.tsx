"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

let mermaidInitialized = false;

function initializeMermaid() {
  if (mermaidInitialized || typeof window === "undefined") {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    fontFamily: "Arial, sans-serif",
  });
  mermaidInitialized = true;
}

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      if (!containerRef.current) {
        return;
      }

      initializeMermaid();
      setError(null);

      try {
        const { svg } = await mermaid.render(`mermaid-${renderId}`, chart.trim());
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mermaid 渲染失败");
        }
      }
    }

    void renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, renderId]);

  if (error) {
    return (
      <pre className="win95-inset bg-white p-4 mb-4 overflow-x-auto text-sm font-mono text-win95-red">
        {error}
        {"\n"}
        {chart}
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="win95-inset bg-white p-4 mb-4 overflow-x-auto flex justify-center"
      aria-label="Mermaid diagram"
    />
  );
}
