import { sql } from "drizzle-orm";
import type { DB } from "../index";

export type DownlineMember = {
  memberId: string;
  sponsorId: string;
  level: number;
  fullName: string;
  joinDate: Date;
};

const MAX_LEVELS = 5;

// Returns all descendants of a member up to MAX_LEVELS deep.
// Architecture rule: only non-sensitive fields (fullName, joinDate) are exposed.
export async function getDownline(
  db: DB,
  memberId: string
): Promise<DownlineMember[]> {
  const result = await db.execute(sql`
    WITH RECURSIVE downline AS (
      SELECT
        nh.member_id,
        nh.sponsor_id,
        1 AS level
      FROM network_hierarchy nh
      WHERE nh.sponsor_id = ${memberId}

      UNION ALL

      SELECT
        nh.member_id,
        nh.sponsor_id,
        d.level + 1
      FROM network_hierarchy nh
      INNER JOIN downline d ON nh.sponsor_id = d.member_id
      WHERE d.level < ${MAX_LEVELS}
    )
    SELECT
      d.member_id   AS "memberId",
      d.sponsor_id  AS "sponsorId",
      d.level,
      u.full_name   AS "fullName",
      u.created_at  AS "joinDate"
    FROM downline d
    JOIN users u ON u.id = d.member_id
    ORDER BY d.level ASC, u.full_name ASC
  `);

  return result as unknown as DownlineMember[];
}
