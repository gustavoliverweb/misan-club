import { sql } from "drizzle-orm";
import type { DB } from "../index";

export type UplineMember = {
  memberId: string;
  sponsorId: string | null;
  level: number;
  membershipStatus: string | null;
};

// Resolves the upline chain for a given member up to MAX_LEVELS.
// Uses a Recursive CTE as required by architecture.md.
// Only the direct sponsor relationship is traversed — depth is recalculated per query.
const MAX_LEVELS = 5;

export async function getUpline(
  db: DB,
  memberId: string
): Promise<UplineMember[]> {
  const result = await db.execute(sql`
    WITH RECURSIVE upline AS (
      -- Base case: start from the direct sponsor
      SELECT
        nh.member_id,
        nh.sponsor_id,
        1 AS level
      FROM network_hierarchy nh
      WHERE nh.member_id = ${memberId}

      UNION ALL

      -- Recursive case: walk up the sponsor chain
      SELECT
        nh.member_id,
        nh.sponsor_id,
        u.level + 1
      FROM network_hierarchy nh
      INNER JOIN upline u ON nh.member_id = u.sponsor_id
      WHERE u.level < ${MAX_LEVELS}
    )
    SELECT
      u.sponsor_id        AS "memberId",
      nh2.sponsor_id      AS "sponsorId",
      u.level,
      m.status            AS "membershipStatus"
    FROM upline u
    LEFT JOIN network_hierarchy nh2 ON nh2.member_id = u.sponsor_id
    LEFT JOIN LATERAL (
      SELECT status
      FROM memberships
      WHERE user_id = u.sponsor_id
        AND status = 'active'
      LIMIT 1
    ) m ON true
    WHERE u.sponsor_id IS NOT NULL
    ORDER BY u.level ASC
  `);

  return result as unknown as UplineMember[];
}

// Returns only upline members who have an active membership (eligible for commissions).
export async function getActiveUpline(
  db: DB,
  memberId: string
): Promise<UplineMember[]> {
  const upline = await getUpline(db, memberId);
  return upline.filter((u) => u.membershipStatus === "active");
}
