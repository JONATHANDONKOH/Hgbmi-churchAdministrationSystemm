
const GroupsModel = require('../models/groupsModel');
const Meeting = require('../models/meetingsModel');

const MAX_INT = 2147483647;

// Accepts "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm[:ss]"
const DATETIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

const isValidId = (value) => {
  const id = Number(value);

  return (
    Number.isInteger(id) &&
    id > 0 &&
    id <= MAX_INT
  );
};

const isValidDateTime = (value) => {
  if (typeof value !== 'string') return false;

  const match = value.match(DATETIME_REGEX);

  if (!match) return false;

  const [, year, month, day, hour, minute, second = '0'] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) &&
    date.getHours() === Number(hour) &&
    date.getMinutes() === Number(minute) &&
    date.getSeconds() === Number(second)
  );
};

const isValidDate = (value) => {
  if (typeof value !== 'string') return false;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return false;

  const [, year, month, day] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  );
};

// Check whether the user can view a group's meetings and reports.
const canAccessGroup = async (req, groupId) => {
  if (!req.user || !req.user.id) {
    return false;
  }

  const role = req.user.role;

  // Admin and super_admin currently have the same viewing access.
  if (role === 'admin' || role === 'super_admin') {
    return true;
  }

  const group = await GroupsModel.findById(groupId);

  if (!group) {
    return false;
  }

  // Group leader can access their own group.
  if (String(group.leader_id) === String(req.user.id)) {
    return true;
  }

  // Ordinary group member can view their group's meetings.
  return await Meeting.isUserInGroup(req.user.id, groupId);
};

// Only admins, super_admins and the actual group leader
// can manage meetings.
const canManageMeetings = async (req, groupId) => {
  if (!req.user || !req.user.id) {
    return false;
  }

  const role = req.user.role;

  if (role === 'admin' || role === 'super_admin') {
    return true;
  }

  const group = await GroupsModel.findById(groupId);

  if (!group) {
    return false;
  }

  return String(group.leader_id) === String(req.user.id);
};

const MeetingsController = {
  // Create a meeting.
  async create(req, res) {
    try {
      const {
        groupId,
        title,
        description,
        startDate,
        endDate,
        location,
      } = req.body;

      if (!isValidId(groupId)) {
        return res.status(400).json({
          message: 'A valid group ID is required.',
        });
      }

      if (
        typeof title !== 'string' ||
        !title.trim()
      ) {
        return res.status(400).json({
          message: 'Meeting title is required.',
        });
      }

      if (
        typeof description !== 'string' ||
        !description.trim()
      ) {
        return res.status(400).json({
          message: 'Meeting description is required.',
        });
      }

      if (
        !isValidDateTime(startDate) ||
        !isValidDateTime(endDate)
      ) {
        return res.status(400).json({
          message: 'Valid meeting start and end dates are required.',
        });
      }

      if (
        new Date(endDate.replace(' ', 'T')) <=
        new Date(startDate.replace(' ', 'T'))
      ) {
        return res.status(400).json({
          message: 'Meeting end date must be after the start date.',
        });
      }

      const group = await GroupsModel.findById(Number(groupId));

      if (!group) {
        return res.status(404).json({
          message: 'Group not found.',
        });
      }

      const allowed = await canManageMeetings(req, Number(groupId));

      if (!allowed) {
        return res.status(403).json({
          message: 'You do not have permission to create meetings for this group.',
        });
      }

      const meeting = await Meeting.create({
        groupId: Number(groupId),
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
        location: location || null,
        createdBy: req.user.id,
      });

      return res.status(201).json({
        message: 'Meeting created successfully.',
        meeting,
      });
    } catch (error) {
      console.error('Create meeting error:', error);

      return res.status(500).json({
        message: 'Failed to create meeting.',
      });
    }
  },

  // Get meetings belonging to a group.
  async findByGroup(req, res) {
    try {
      const { groupId, from, to } = req.query;

      if (!isValidId(groupId)) {
        return res.status(400).json({
          message: 'A valid group ID is required.',
        });
      }

      if (from && !isValidDate(from)) {
        return res.status(400).json({
          message: 'Invalid start date filter.',
        });
      }

      if (to && !isValidDate(to)) {
        return res.status(400).json({
          message: 'Invalid end date filter.',
        });
      }

      if (from && to && from > to) {
        return res.status(400).json({
          message: 'The start date cannot be after the end date.',
        });
      }

      const group = await GroupsModel.findById(Number(groupId));

      if (!group) {
        return res.status(404).json({
          message: 'Group not found.',
        });
      }

      const allowed = await canAccessGroup(req, Number(groupId));

      if (!allowed) {
        return res.status(403).json({
          message: 'You do not have access to this group.',
        });
      }

      const meetings = await Meeting.findByGroup(Number(groupId), {
        from,
        to,
      });

      return res.status(200).json({
        meetings,
      });
    } catch (error) {
      console.error('Find meetings by group error:', error);

      return res.status(500).json({
        message: 'Failed to retrieve meetings.',
      });
    }
  },

  // Get one meeting.
  async findById(req, res) {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'Invalid meeting ID.',
        });
      }

      const meeting = await Meeting.findById(Number(id));

      if (!meeting) {
        return res.status(404).json({
          message: 'Meeting not found.',
        });
      }

      const allowed = await canAccessGroup(req, meeting.group_id);

      if (!allowed) {
        return res.status(403).json({
          message: 'You do not have access to this meeting.',
        });
      }

      return res.status(200).json({
        meeting,
      });
    } catch (error) {
      console.error('Find meeting error:', error);

      return res.status(500).json({
        message: 'Failed to retrieve meeting.',
      });
    }
  },

  // Update a meeting.
  async update(req, res) {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'Invalid meeting ID.',
        });
      }

      const meeting = await Meeting.findById(Number(id));

      if (!meeting) {
        return res.status(404).json({
          message: 'Meeting not found.',
        });
      }

      const allowed = await canManageMeetings(req, meeting.group_id);

      if (!allowed) {
        return res.status(403).json({
          message: 'You do not have permission to update this meeting.',
        });
      }

      const {
        title,
        description,
        startDate,
        endDate,
        location,
      } = req.body;

      if (
        title !== undefined &&
        (typeof title !== 'string' || !title.trim())
      ) {
        return res.status(400).json({
          message: 'Meeting title cannot be empty.',
        });
      }

      if (
        description !== undefined &&
        (typeof description !== 'string' || !description.trim())
      ) {
        return res.status(400).json({
          message: 'Meeting description cannot be empty.',
        });
      }

      if (
        startDate !== undefined &&
        !isValidDateTime(startDate)
      ) {
        return res.status(400).json({
          message: 'Invalid meeting start date.',
        });
      }

      if (
        endDate !== undefined &&
        !isValidDateTime(endDate)
      ) {
        return res.status(400).json({
          message: 'Invalid meeting end date.',
        });
      }

      const finalStartDate = startDate || meeting.start_date;
      const finalEndDate = endDate || meeting.end_date;

      if (
        new Date(String(finalEndDate).replace(' ', 'T')) <=
        new Date(String(finalStartDate).replace(' ', 'T'))
      ) {
        return res.status(400).json({
          message: 'Meeting end date must be after the start date.',
        });
      }

      const updatedMeeting = await Meeting.update(Number(id), {
        title: title !== undefined ? title.trim() : undefined,
        description:
          description !== undefined ? description.trim() : undefined,
        startDate,
        endDate,
        location,
      });

      return res.status(200).json({
        message: 'Meeting updated successfully.',
        meeting: updatedMeeting,
      });
    } catch (error) {
      console.error('Update meeting error:', error);

      return res.status(500).json({
        message: 'Failed to update meeting.',
      });
    }
  },

  // Delete a meeting.
  async remove(req, res) {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'Invalid meeting ID.',
        });
      }

      const meeting = await Meeting.findById(Number(id));

      if (!meeting) {
        return res.status(404).json({
          message: 'Meeting not found.',
        });
      }

      const allowed = await canManageMeetings(req, meeting.group_id);

      if (!allowed) {
        return res.status(403).json({
          message: 'You do not have permission to delete this meeting.',
        });
      }

      await Meeting.remove(Number(id));

      return res.status(200).json({
        message: 'Meeting deleted successfully.',
      });
    } catch (error) {
      console.error('Delete meeting error:', error);

      return res.status(500).json({
        message: 'Failed to delete meeting.',
      });
    }
  },
};

module.exports = MeetingsController;
