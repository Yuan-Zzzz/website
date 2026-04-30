"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-display font-black mt-6 mb-4 text-win95-title">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-display font-black mt-5 mb-3 text-win95-title">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-display font-black mt-4 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed">{children}</p>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-win95-blue underline hover:text-win95-red">
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-win95-panel px-1 py-0.5 text-sm font-mono border border-win95-gray">
                {children}
              </code>
            ) : (
              <pre className="win95-inset bg-white p-4 mb-4 overflow-x-auto">
                <code className={`${className} text-sm font-mono`}>{children}</code>
              </pre>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="win95-inset bg-win95-panel pl-4 py-2 mb-4 border-l-4 border-win95-gray">
              {children}
            </blockquote>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="win95-outset bg-white p-1 max-w-full h-auto my-4 block mx-auto"
            />
          ),
          table: ({ children }) => (
            <table className="w-full border-collapse mb-4 win95-outset bg-white">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border-2 border-win95-gray bg-win95-bg p-2 text-left font-bold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-2 border-win95-gray p-2">{children}</td>
          ),
          hr: () => <hr className="hr-groove my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
