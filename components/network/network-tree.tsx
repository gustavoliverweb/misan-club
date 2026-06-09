"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { TreeNode } from "@/lib/network-tree";

const fmtDate = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

const LEVEL_BADGE: Record<number, string> = {
  1: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  2: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  3: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  4: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  5: "border-slate-500/25 bg-slate-500/8 text-slate-500 dark:text-slate-400",
};

const LEVEL_DOT: Record<number, string> = {
  1: "bg-cyan-500",
  2: "bg-blue-500",
  3: "bg-indigo-500",
  4: "bg-violet-500",
  5: "bg-slate-400",
};

function levelBadgeClass(level: number): string {
  return (
    LEVEL_BADGE[level] ??
    "border-slate-500/15 bg-slate-500/5 text-slate-400 dark:text-slate-500"
  );
}

function levelDotClass(level: number): string {
  return LEVEL_DOT[level] ?? "bg-slate-500/40";
}

function levelLabel(level: number): string {
  return level <= 5 ? `N${level}` : `N${level}`;
}

function TreeNodeRow({
  node,
  depth,
  defaultOpen,
}: {
  node: TreeNode;
  depth: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-border/30"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-transform ${
            hasChildren ? "text-muted hover:text-fg" : "invisible"
          }`}
          aria-label={open ? "Colapsar" : "Expandir"}
        >
          <ChevronRight
            size={14}
            className={`transition-transform duration-150 ${open ? "rotate-90" : ""}`}
          />
        </button>

        {/* Member info */}
        <span className="min-w-0 flex-1 text-sm font-medium text-fg truncate">
          {node.fullName}
        </span>

        {/* Level badge */}
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${levelBadgeClass(node.level)}`}
        >
          <span className={`h-1 w-1 rounded-full ${levelDotClass(node.level)}`} />
          {levelLabel(node.level)}
        </span>

        {/* Join date */}
        <span className="hidden shrink-0 text-xs text-faint sm:block">
          {fmtDate.format(new Date(node.joinDate))}
        </span>
      </div>

      {/* Children */}
      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.memberId}
              node={child}
              depth={depth + 1}
              defaultOpen={false}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function NetworkTree({ nodes }: { nodes: TreeNode[] }) {
  if (nodes.length === 0) return null;

  return (
    <ul className="py-2">
      {nodes.map((node) => (
        <TreeNodeRow
          key={node.memberId}
          node={node}
          depth={0}
          defaultOpen={true}
        />
      ))}
    </ul>
  );
}
