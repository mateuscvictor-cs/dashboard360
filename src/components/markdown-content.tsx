"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const emojiByLevel: Record<number, string> = {
  1: "📋",
  2: "📌",
  3: "•",
  4: "◦",
};

function createHeadingRenderer(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const emoji = emojiByLevel[level] ?? "◦";
  const tagMap = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;
  const Tag = tagMap[level];
  return function Heading({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return React.createElement(
      Tag,
      { ...props, className: cn("font-semibold mt-3 mb-1", className) },
      emoji,
      " ",
      children
    );
  };
}

const components = {
  h1: createHeadingRenderer(1),
  h2: createHeadingRenderer(2),
  h3: createHeadingRenderer(3),
  h4: createHeadingRenderer(4),
  h5: createHeadingRenderer(5),
  h6: createHeadingRenderer(6),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className="mb-2 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="list-disc list-inside mb-2 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="list-decimal list-inside mb-2 space-y-1">
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li {...props} className="[&>p]:inline">
      {children}
    </li>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong {...props} className="font-semibold">
      {children}
    </strong>
  ),
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code {...props} className="bg-muted px-1 py-0.5 rounded text-sm">
      {children}
    </code>
  ),
};

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
