import type { DownlineMember } from "@/infra/db/queries/downline";

export type TreeNode = DownlineMember & { children: TreeNode[] };

export function buildTree(members: DownlineMember[], rootId: string): TreeNode[] {
  return members
    .filter((m) => m.sponsorId === rootId)
    .map((m) => ({ ...m, children: buildTree(members, m.memberId) }));
}
