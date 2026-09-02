"use client";

import { StreamdownTextPrimitive } from "@assistant-ui/react-streamdown";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { cjk } from "@streamdown/cjk";
import { Streamdown } from "streamdown";
import "katex/dist/katex.min.css";
import "streamdown/styles.css";
import { memo } from "react";

const balanceFences = (text: string) => {
  const fences = text.match(/```/g);
  if (!fences || fences.length % 2 === 0) return text;
  return `${text}\n\`\`\``;
};

export const MarkdownText = memo(() => (
  <StreamdownTextPrimitive
    plugins={{ code, math, mermaid, cjk }}
    shikiTheme={["github-light", "github-dark"]}
    caret="block"
    controls={true}
    preprocess={balanceFences}
    mermaid={{
      config: { theme: "neutral" },
      errorComponent: ({ error, chart, retry }) => (
        <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-3 text-sm">
          <p className="font-medium">Mermaid render failed: {String(error)}</p>
          <pre className="mt-2 max-h-32 overflow-auto text-xs opacity-70">{chart.slice(0, 500)}</pre>
          <button
            type="button"
            onClick={retry}
            className="bg-primary text-primary-foreground mt-2 rounded-md px-3 py-1 text-xs"
          >
            Retry
          </button>
        </div>
      ),
    }}
    remend={{
      links: true,
      images: true,
      linkMode: "protocol",
      bold: true,
      italic: true,
      boldItalic: true,
      inlineCode: true,
      strikethrough: true,
      katex: true,
      setextHeadings: true,
    }}
  />
));
MarkdownText.displayName = "MarkdownText";

export const StaticMarkdown = memo(({ text }: { text: string }) => (
  <Streamdown
    mode="static"
    plugins={{ code, math, mermaid, cjk }}
    shikiTheme={["github-light", "github-dark"]}
    controls={true}
  >
    {balanceFences(text)}
  </Streamdown>
));
StaticMarkdown.displayName = "StaticMarkdown";
