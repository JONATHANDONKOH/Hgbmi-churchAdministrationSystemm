
const pool = require('../Config/db');

const GroupDuties = {
  // Create a duty for a department or ministry.
  async createDuty(
    { groupId, dutyName, dutyType, description, createdBy },
    db = pool
  ) {
    const { rows } = await db.query(
      `INSERT INTO group_duties (
         group_id,
         duty_name,
         duty_type,
         description,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [groupId, dutyName, dutyType, description, createdBy]
    );

    return rows[0];
  },

  // Create a duty and assign it to a group member atomically.
  async createAndAssignDuty({
    groupId,
    userId,
    dutyName,
    dutyType,
    description,
    createdBy,
    assignedBy,
  }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Confirm that the selected user belongs to this exact group.
      const membershipResult = await client.query(
        `SELECT 1
         FROM user_groups
         WHERE user_id = $1
           AND group_id = $2
         LIMIT 1`,
        [userId, groupId]
      );

      if (membershipResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // Create the duty.
      const dutyResult = await client.query(
        `INSERT INTO group_duties (
           group_id,
           duty_name,
           duty_type,
           description,
           created_by
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          groupId,
          dutyName,
          dutyType,
          description,
          createdBy,
        ]
      );

      const duty = dutyResult.rows[0];

      // Assign the newly created duty to the selected member.
      const assignmentResult = await client.query(
        `INSERT INTO group_member_duties (
           user_id,
           group_id,
           duty_id,
           assigned_by
         )
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          userId,
          groupId,
          duty.id,
          assignedBy,
        ]
      );

      await client.query('COMMIT');

      return {
        duty,
        assignment: assignmentResult.rows[0],
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Fetch all duties belonging to a group.
  async findDutiesByGroup(groupId, db = pool) {
    const { rows } = await db.query(
      `SELECT *
       FROM group_duties
       WHERE group_id = $1
       ORDER BY
         CASE duty_type
           WHEN 'leadership' THEN 1
           WHEN 'functional' THEN 2
         END,
         duty_name ASC`,
      [groupId]
    );

    return rows;
  },

  // Find one duty within a particular group.
  async findDutyById(dutyId, groupId, db = pool) {
    const { rows } = await db.query(
      `SELECT *
       FROM group_duties
       WHERE id = $1
         AND group_id = $2
       LIMIT 1`,
      [dutyId, groupId]
    );

    return rows[0] || null;
  },

  // Update a duty.
  async updateDuty(
    dutyId,
    groupId,
    { dutyName, dutyType, description },
    db = pool
  ) {
    const { rows } = await db.query(
      `UPDATE group_duties
       SET duty_name = $1,
           duty_type = $2,
           description = $3
       WHERE id = $4
         AND group_id = $5
       RETURNING *`,
      [dutyName, dutyType, description, dutyId, groupId]
    );

    return rows[0] || null;
  },

  // Delete a duty.
  async deleteDuty(dutyId, groupId, db = pool) {
    const { rows } = await db.query(
      `DELETE FROM group_duties
       WHERE id = $1
         AND group_id = $2
       RETURNING *`,
      [dutyId, groupId]
    );

    return rows[0] || null;
  },

  // Assign an existing duty to an existing group member.
  async assignDuty(
    { userId, groupId, dutyId, assignedBy },
    db = pool
  ) {
    const { rows } = await db.query(
      `INSERT INTO group_member_duties (
         user_id,
         group_id,
         duty_id,
         assigned_by
       )
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, duty_id) DO NOTHING
       RETURNING *`,
      [userId, groupId, dutyId, assignedBy]
    );

    return rows[0] || null;
  },

  // Fetch all member duty assignments within a group.
  async findAssignmentsByGroup(groupId, db = pool) {
    const { rows } = await db.query(
      `SELECT
         gmd.id AS assignment_id,
         gmd.user_id,
         u.full_name,
         u.email,
         u.phone_number,
         gmd.group_id,
         gd.id AS duty_id,
         gd.duty_name,
         gd.duty_type,
         gd.description AS duty_description,
         gmd.assigned_by,
         assigner.full_name AS assigned_by_name,
         gmd.assigned_at
       FROM group_member_duties AS gmd
       INNER JOIN users AS u
         ON u.id = gmd.user_id
       INNER JOIN group_duties AS gd
         ON gd.id = gmd.duty_id
        AND gd.group_id = gmd.group_id
       LEFT JOIN users AS assigner
         ON assigner.id = gmd.assigned_by
       WHERE gmd.group_id = $1
       ORDER BY u.full_name ASC, gd.duty_name ASC`,
      [groupId]
    );

    return rows;
  },

  // Fetch duties assigned to one member in a particular group.
  async findAssignmentsByMember(userId, groupId, db = pool) {
    const { rows } = await db.query(
      `SELECT
         gmd.id AS assignment_id,
         gmd.user_id,
         u.full_name,
         u.email,
         gmd.group_id,
         gd.id AS duty_id,
         gd.duty_name,
         gd.duty_type,
         gd.description AS duty_description,
         gmd.assigned_by,
         assigner.full_name AS assigned_by_name,
         gmd.assigned_at
       FROM group_member_duties AS gmd
       INNER JOIN users AS u
         ON u.id = gmd.user_id
       INNER JOIN group_duties AS gd
         ON gd.id = gmd.duty_id
        AND gd.group_id = gmd.group_id
       LEFT JOIN users AS assigner
         ON assigner.id = gmd.assigned_by
       WHERE gmd.user_id = $1
         AND gmd.group_id = $2
       ORDER BY gd.duty_name ASC`,
      [userId, groupId]
    );

    return rows;
  },

  // Remove an assignment from a member.
  async removeAssignment(assignmentId, groupId, db = pool) {
    const { rows } = await db.query(
      `DELETE FROM group_member_duties
       WHERE id = $1
         AND group_id = $2
       RETURNING *`,
      [assignmentId, groupId]
    );

    return rows[0] || null;
  },
};

module.exports = GroupDuties;
