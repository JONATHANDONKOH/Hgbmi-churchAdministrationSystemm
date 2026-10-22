const GroupsModel = require('../models/groupsModel');
const Meeting = require('../models/meetingsModel');

const MAX_INT = 2147483647;

// "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm[:ss]", no timezone offset
const DATETIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

// Accepts 5 or "5". Returns a positive integer, or null if invalid.
const toId = (value) => {
  const n =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  return Number.isInteger(n) && n > 0 && n <= MAX_INT ? n : null;
};

const isBlank = (value) =>
  value === undefined || value === null || value === '';

const isNonBlankString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidTitle = (value) =>
  isNonBlankString(value) && value.trim().length <= 200;

const isValidLocation = (value) =>
  typeof value === 'string' && value.trim().length <= 255;

// Blank location becomes null in the database
const cleanLocation = (value) =>
  isBlank(value) ? null : String(value).trim() || null;

// "YYYY-MM-DD"
const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

// Returns a Date (for comparing start and end only), or null if invalid
const parseDateTime = (value) => {
  if (typeof value !== 'string') return null;

  const match = DATETIME_REGEX.exec(value.trim());
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1, 6).map(Number);
  const second = match[6] ? Number(match[6]) : 0;

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second;

  return valid ? date : null;
};

const DATETIME_ERROR = 'must be a valid date and time like 2026-10-18T10:00';

// super_admin sees every group; everyone else must belong to the group
const canAccessGroup = async (req, groupId) => {
  if (req.user.role === 'super_admin') return true;
  return Meeting.isUserInGroup(req.user.id, groupId);
};

// Known database errors that are the client's fault
const dbErrorResponse = (err) => {
  if (err.code === '23503') {
    return { status: 400, error: 'A referenced group or user no longer exists' };
  }

  if (err.code === '23514') {
    return { status: 400, error: 'endDate must be after startDate' };
  }

  if (err.code === '22007' || err.code === '22008') {
    return { status: 400, error: 'Invalid date or time' };
  }

  return null;
};

const MeetingsController = {
  // POST /meetings
  // Body: { groupId, title, description, startDate, endDate, location? }
  async create(req, res) {
    try {
      const { groupId, title, description, startDate, endDate, location } =
        req.body;

      const normalizedGroupId = toId(groupId);

      if (!normalizedGroupId) {
        return res.status(400).json({ error: 'A valid groupId is required' });
      }

      if (!isValidTitle(title)) {
        return res.status(400).json({
          error: 'title is required (max 200 characters)',
        });
      }

      if (!isNonBlankString(description)) {
        return res.status(400).json({ error: 'description is required' });
      }

      if (!isBlank(location) && !isValidLocation(location)) {
        return res.status(400).json({
          error: 'location must be text of at most 255 characters',
        });
      }

      const start = parseDateTime(startDate);
      const end = parseDateTime(endDate);

      if (!start) {
        return res.status(400).json({ error: `startDate ${DATETIME_ERROR}` });
      }

      if (!end) {
        return res.status(400).json({ error: `endDate ${DATETIME_ERROR}` });
      }

      if (end <= start) {
        return res.status(400).json({ error: 'endDate must be after startDate' });
      }

      if (!(await canAccessGroup(req, normalizedGroupId))) {
        return res.status(403).json({
          error: 'You do not have access to this group',
        });
      }

      if (!(await GroupsModel.findById(normalizedGroupId))) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const meeting = await Meeting.create({
        groupId: normalizedGroupId,
        title: title.trim(),
        description: description.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        location: cleanLocation(location),
        createdBy: req.user.id,
      });

      return res.status(201).json(meeting);
    } catch (err) {
      const known = dbErrorResponse(err);
      if (known) return res.status(known.status).json({ error: known.error });

      console.error('create meeting error:', err);
      return res.status(500).json({ error: 'Failed to create meeting' });
    }
  },

  // GET /meetings?groupId=5&from=YYYY-MM-DD&to=YYYY-MM-DD
  async findByGroup(req, res) {
    try {
      const groupId = toId(req.query.groupId);
      const { from, to } = req.query;

      if (!groupId) {
        return res.status(400).json({ error: 'A valid groupId is required' });
      }

      if (!isBlank(from) && !isValidDate(from)) {
        return res.status(400).json({ error: 'from must be YYYY-MM-DD' });
      }

      if (!isBlank(to) && !isValidDate(to)) {
        return res.status(400).json({ error: 'to must be YYYY-MM-DD' });
      }

      if (!(await canAccessGroup(req, groupId))) {
        return res.status(403).json({
          error: 'You do not have access to this group',
        });
      }

      const meetings = await Meeting.findByGroup(groupId, {
        from: isBlank(from) ? undefined : from,
        to: isBlank(to) ? undefined : to,
      });

      return res.json(meetings);
    } catch (err) {
      console.error('findByGroup meetings error:', err);
      return res.status(500).json({ error: 'Failed to fetch meetings' });
    }
  },

  // GET /meetings/:id
  async findById(req, res) {
    try {
      const id = toId(req.params.id);
      if (!id) return res.status(400).json({ error: 'Invalid meeting id' });

      const meeting = await Meeting.findById(id);
      if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

      if (!(await canAccessGroup(req, meeting.group_id))) {
        return res.status(403).json({
          error: 'You do not have access to this meeting',
        });
      }

      return res.json(meeting);
    } catch (err) {
      console.error('findById meeting error:', err);
      return res.status(500).json({ error: 'Failed to fetch meeting' });
    }
  },

  // PUT /meetings/:id
  // Body: any of { title, description, startDate, endDate, location }
  // location: null (or "") clears it
  async update(req, res) {
    try {
      const id = toId(req.params.id);
      if (!id) return res.status(400).json({ error: 'Invalid meeting id' });

      const { title, description, startDate, endDate, location } = req.body;

      if (
        [title, description, startDate, endDate, location].every(
          (v) => v === undefined
        )
      ) {
        return res.status(400).json({
          error:
            'Provide at least one of title, description, startDate, endDate or location',
        });
      }

      if (title !== undefined && !isValidTitle(title)) {
        return res.status(400).json({
          error: 'title must be 1-200 characters',
        });
      }

      if (description !== undefined && !isNonBlankString(description)) {
        return res.status(400).json({ error: 'description cannot be empty' });
      }

      if (
        location !== undefined &&
        location !== null &&
        !isValidLocation(location)
      ) {
        return res.status(400).json({
          error: 'location must be text of at most 255 characters',
        });
      }

      let start = null;
      let end = null;

      if (startDate !== undefined) {
        start = parseDateTime(startDate);

        if (!start) {
          return res.status(400).json({ error: `startDate ${DATETIME_ERROR}` });
        }
      }

      if (endDate !== undefined) {
        end = parseDateTime(endDate);

        if (!end) {
          return res.status(400).json({ error: `endDate ${DATETIME_ERROR}` });
        }
      }

      if (start && end && end <= start) {
        return res.status(400).json({ error: 'endDate must be after startDate' });
      }

      const existing = await Meeting.findById(id);
      if (!existing) return res.status(404).json({ error: 'Meeting not found' });

      if (!(await canAccessGroup(req, existing.group_id))) {
        return res.status(403).json({
          error: 'You do not have access to this meeting',
        });
      }

      const updated = await Meeting.update(id, {
        title: title?.trim(),
        description: description?.trim(),
        startDate: startDate?.trim(),
        endDate: endDate?.trim(),
        location: location === undefined ? undefined : cleanLocation(location),
      });

      if (!updated) return res.status(404).json({ error: 'Meeting not found' });

      return res.json(updated);
    } catch (err) {
      const known = dbErrorResponse(err);
      if (known) return res.status(known.status).json({ error: known.error });

      console.error('update meeting error:', err);
      return res.status(500).json({ error: 'Failed to update meeting' });
    }
  },

  // DELETE /meetings/:id
  async remove(req, res) {
    try {
      const id = toId(req.params.id);
      if (!id) return res.status(400).json({ error: 'Invalid meeting id' });

      const existing = await Meeting.findById(id);
      if (!existing) return res.status(404).json({ error: 'Meeting not found' });

      if (!(await canAccessGroup(req, existing.group_id))) {
        return res.status(403).json({
          error: 'You do not have access to this meeting',
        });
      }

      await Meeting.remove(id);

      return res.json({ message: 'Meeting deleted' });
    } catch (err) {
      console.error('remove meeting error:', err);
      return res.status(500).json({ error: 'Failed to delete meeting' });
    }
  },
};

module.exports = MeetingsController;