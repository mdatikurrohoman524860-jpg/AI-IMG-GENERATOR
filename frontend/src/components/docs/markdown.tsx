"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy, Terminal, FileCode, Download, Play, AlertTriangle, Info, Lightbulb, XCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] text-neutral-500 hover:text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 transition-all opacity-0 group-hover:opacity-100"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ className, children, ...props }: { className?: string; children?: ReactNode; [key: string]: any }) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");
  return (
    <div className="group relative my-4 rounded-xl border border-neutral-800/30 bg-neutral-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800/30 bg-neutral-900/80">
        <div className="flex items-center gap-2">
          <FileCode className="w-3 h-3 text-neutral-600" />
          <span className="text-[9px] text-neutral-600 font-mono uppercase">{language || "code"}</span>
        </div>
        <div className="flex items-center gap-1">
          {language === "bash" && (
            <button className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors">
              <Terminal className="w-3 h-3" />
            </button>
          )}
          <CopyButton text={code} />
        </div>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className={cn("text-neutral-200 font-mono", className)} {...props}>{children}</code>
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children?: ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-neutral-800/60 text-[11px] text-neutral-200 font-mono border border-neutral-700/30">
      {children}
    </code>
  );
}

function Callout({ type, children }: { type: "tip" | "warning" | "danger" | "info" | "success"; children?: ReactNode }) {
  const styles = {
    tip: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", icon: Lightbulb, text: "text-emerald-300" },
    warning: { border: "border-amber-500/20", bg: "bg-amber-500/5", icon: AlertTriangle, text: "text-amber-300" },
    danger: { border: "border-red-500/20", bg: "bg-red-500/5", icon: XCircle, text: "text-red-300" },
    info: { border: "border-blue-500/20", bg: "bg-blue-500/5", icon: Info, text: "text-blue-300" },
    success: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", icon: CheckCircle, text: "text-emerald-300" },
  };
  const s = styles[type];
  const Icon = s.icon;
  return (
    <div className={`my-3 p-3 rounded-xl border ${s.border} ${s.bg}`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${s.text}`} />
        <div className="text-xs text-neutral-400 leading-relaxed space-y-1 [&_strong]:text-neutral-300 [&_code]:text-neutral-200 [&_a]:text-neutral-300 [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </div>
    </div>
  );
}

function Table({ children }: { children?: ReactNode }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-neutral-800/30">
      <table className="w-full text-left text-xs">
        {children}
      </table>
    </div>
  );
}

function ApiEndpoint({ method, path, description }: { method: string; path: string; description?: string }) {
  const colors: Record<string, string> = {
    GET: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    POST: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    PUT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    PATCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/40 border border-neutral-700/30 my-3">
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colors[method] || colors.GET}`}>
        {method}
      </span>
      <code className="text-xs text-neutral-200 font-mono">{path}</code>
      {description && <span className="text-[10px] text-neutral-500 ml-auto hidden sm:inline">{description}</span>}
    </div>
  );
}

function HeadingLink({ level, children, ...props }: { level: 1 | 2 | 3; children?: ReactNode; [key: string]: any }) {
  const text = String(children).replace(/\s+/g, " ").trim();
  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizes = { 1: "text-2xl font-bold mt-8 mb-3", 2: "text-lg font-semibold mt-7 mb-2.5", 3: "text-base font-semibold mt-6 mb-2" };
  return (
    <Tag id={id} className={`${sizes[level]} text-neutral-100 group scroll-mt-20`} {...props}>
      <a href={`#${id}`} className="hover:text-neutral-300 transition-colors no-underline">
        {children}
      </a>
    </Tag>
  );
}

const components = {
  code({ className, children, ...props }: any) {
    const inline = !className;
    return inline ? <InlineCode>{children}</InlineCode> : <CodeBlock className={className} {...props}>{children}</CodeBlock>;
  },
  pre({ children }: any) { return <>{children}</>; },
  table({ children }: any) { return <Table>{children}</Table>; },
  thead({ children }: any) { return <thead className="bg-neutral-800/40 border-b border-neutral-800/50">{children}</thead>; },
  th({ children }: any) { return <th className="px-3 py-2.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{children}</th>; },
  td({ children }: any) { return <td className="px-3 py-2.5 text-neutral-300 border-t border-neutral-800/30">{children}</td>; },
  tr({ children }: any) { return <tr className="hover:bg-neutral-800/20 transition-colors">{children}</tr>; },
  h1({ children, ...props }: any) { return <HeadingLink level={1} {...props}>{children}</HeadingLink>; },
  h2({ children, ...props }: any) { return <HeadingLink level={2} {...props}>{children}</HeadingLink>; },
  h3({ children, ...props }: any) { return <HeadingLink level={3} {...props}>{children}</HeadingLink>; },
  p({ children }: any) { return <p className="text-sm text-neutral-400 leading-relaxed mb-3">{children}</p>; },
  ul({ children }: any) { return <ul className="space-y-1 mb-3">{children}</ul>; },
  ol({ children }: any) { return <ol className="space-y-1 mb-3 list-decimal pl-5">{children}</ol>; },
  li({ children }: any) { return <li className="text-xs text-neutral-400 leading-relaxed pl-1 marker:text-neutral-600">{children}</li>; },
  strong({ children }: any) { return <strong className="font-semibold text-neutral-200">{children}</strong>; },
  em({ children }: any) { return <em className="text-neutral-300">{children}</em>; },
  a({ href, children }: any) {
    const isExternal = href?.startsWith("http");
    return (
      <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-neutral-300 underline underline-offset-2 decoration-neutral-700 hover:text-neutral-100 hover:decoration-neutral-500 transition-colors">
        {children}
      </a>
    );
  },
  hr() { return <hr className="my-8 border-neutral-800/40" />; },
  blockquote({ children }: any) {
    return (
      <blockquote className="my-3 pl-4 border-l-2 border-neutral-700 text-xs text-neutral-400 italic">
        {children}
      </blockquote>
    );
  },
};

export function MarkdownRenderer({ content }: { content: string }) {
  const processed = content
    .replace(/^> \*\*(Tip|💡):\*\*/gm, '<div data-callout="tip">')
    .replace(/^> \*\*(Warning|⚠️):\*\*/gm, '<div data-callout="warning">')
    .replace(/^> \*\*(Danger|🚫):\*\*/gm, '<div data-callout="danger">')
    .replace(/^> \*\*(Info|ℹ️):\*\*/gm, '<div data-callout="info">')
    .replace(/^> (\*\*(.+?):\*\*)?(.+)$/gm, (match, bold, label, text) => {
      if (label) {
        const typeMap: Record<string, "tip" | "warning" | "danger" | "info" | "success"> = {
          "Tip": "tip", "💡": "tip", "Warning": "warning", "⚠️": "warning",
          "Danger": "danger", "🚫": "danger", "Info": "info", "ℹ️": "info",
          "Success": "success", "✅": "success",
        };
        const type = typeMap[label] || "info";
        return `<Callout type="${type}">${text}</Callout>`;
      }
      return `<blockquote>${match.replace(/^>\s?/, "")}</blockquote>`;
    });

  return (
    <div className="space-y-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components as any}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export { Callout, ApiEndpoint, CopyButton, CodeBlock };
