const EventModel = require('../models/eventModel');

const isValidId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0;
};

const isValidEventDetails = ({ title, description }) =>
  typeof title === 'string' &&
  title.trim().length > 0 &&
  typeof description === 'string' &&
  description.trim().length > 0;

const isValidDateRange = (startDate, endDate) => {
  if (
    typeof startDate !== 'string' ||
    typeof endDate !== 'string' ||
    !startDate.trim() ||
    !endDate.trim()
  ) {
    return false;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  return (
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    end > start
  );
};

const EventController = {
  // ==========================================
  // SUPERADMIN EVENT HANDLERS
  // ==========================================

  // Retrieve all events across all groups
  async findAllSuperAdmin(req, res) {
    try {
      const events = await EventModel.findAll();

      return res.status(200).json(events);
    } catch (error) {
      console.error('Superadmin fetch events error:', error);

      return res.status(500).json({
        message: 'Failed to fetch events',
      });
    }
  },

  // Retrieve one event
  async findByIdSuperAdmin(req, res) {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'A valid event ID is required',
        });
      }

      const event = await EventModel.findById(Number(id));

      if (!event) {
        return res.status(404).json({
          message: 'Event not found',
        });
      }

      return res.status(200).json(event);
    } catch (error) {
      console.error('Superadmin fetch event error:', error);

      return res.status(500).json({
        message: 'Failed to fetch event',
      });
    }
  },

  // ==========================================
  // ADMIN EVENT HANDLERS
  // ==========================================

  // Retrieve all events across all groups
  async findAllAdmin(req, res) {
    try {
      const events = await EventModel.findAll();

      return res.status(200).json(events);
    } catch (error) {
      console.error('Admin fetch events error:', error);

      return res.status(500).json({
        message: 'Failed to fetch events',
      });
    }
  },

  // Retrieve one event
  async findByIdAdmin(req, res) {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'A valid event ID is required',
        });
      }

      const event = await EventModel.findById(Number(id));

      if (!event) {
        return res.status(404).json({
          message: 'Event not found',
        });
      }

      return res.status(200).json(event);
    } catch (error) {
      console.error('Admin fetch event error:', error);

      return res.status(500).json({
        message: 'Failed to fetch event',
      });
    }
  },

  // ==========================================
  // GROUP EVENT HANDLERS
  // ==========================================

  // Retrieve events belonging to a particular group
  async findAllGroup(req, res) {
    try {
      const { groupId } = req.params;

      if (!isValidId(groupId)) {
        return res.status(400).json({
          message: 'A valid group ID is required',
        });
      }

      const events = await EventModel.findAllByGroup(Number(groupId));

      return res.status(200).json(events);
    } catch (error) {
      console.error('Group fetch events error:', error);

      return res.status(500).json({
        message: 'Failed to fetch group events',
      });
    }
  },

  // Retrieve one event belonging to a particular group
  async findByIdGroup(req, res) {
    try {
      const { groupId, id } = req.params;

      if (!isValidId(groupId) || !isValidId(id)) {
        return res.status(400).json({
          message: 'Valid group ID and event ID are required',
        });
      }

      const event = await EventModel.findByIdAndGroup(
        Number(id),
        Number(groupId)
      );

      if (!event) {
        return res.status(404).json({
          message: 'Event not found in this group',
        });
      }

      return res.status(200).json(event);
    } catch (error) {
      console.error('Group fetch event error:', error);

      return res.status(500).json({
        message: 'Failed to fetch group event',
      });
    }
  },

  // ==========================================
  // GENERAL EVENT HANDLERS
  // ==========================================

  // Retained for existing frontend connections
  async findAll(req, res) {
    try {
      const { group_id } = req.query;

      if (!isValidId(group_id)) {
        return res.status(400).json({
          message: 'A valid group_id is required',
        });
      }

      const events = await EventModel.findAllByGroup(Number(group_id));

      return res.status(200).json(events);
    } catch (error) {
      console.error('Fetch events error:', error);

      return res.status(500).json({
        message: 'Failed to fetch events',
      });
    }
  },

  // Retained for existing frontend connections
  async findById(req, res) {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'A valid event ID is required',
        });
      }

      const event = await EventModel.findById(Number(id));

      if (!event) {
        return res.status(404).json({
          message: 'Event not found',
        });
      }

      return res.status(200).json(event);
    } catch (error) {
      console.error('Fetch event error:', error);

      return res.status(500).json({
        message: 'Failed to fetch event',
      });
    }
  },

  // ==========================================
  // CREATE EVENT
  // ==========================================

  async create(req, res) {
    try {
      const {
        group_id,
        title,
        description,
        start_date,
        end_date,
        event_location,
      } = req.body;

      if (!isValidId(group_id)) {
        return res.status(400).json({
          message: 'A valid group_id is required',
        });
      }

      if (!isValidEventDetails({ title, description })) {
        return res.status(400).json({
          message: 'Title and description are required',
        });
      }

      if (!isValidDateRange(start_date, end_date)) {
        return res.status(400).json({
          message: 'Valid start and end dates are required, and the end date must be after the start date',
        });
      }

      const event = await EventModel.create({
        group_id: Number(group_id),
        title: title.trim(),
        description: description.trim(),
        start_date,
        end_date,
        event_location: event_location?.trim() || null,
        created_by: req.user?.id,
      });

      return res.status(201).json({
        message: 'Event created successfully',
        event,
      });
    } catch (error) {
      console.error('Create event error:', error);

      return res.status(500).json({
        message: 'Failed to create event',
      });
    }
  },

  // ==========================================
  // UPDATE EVENT
  // ==========================================

  async update(req, res) {
    try {
      const { id } = req.params;

      const {
        title,
        description,
        start_date,
        end_date,
        event_location,
      } = req.body;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'A valid event ID is required',
        });
      }

      if (!isValidEventDetails({ title, description })) {
        return res.status(400).json({
          message: 'Title and description are required',
        });
      }

      if (!isValidDateRange(start_date, end_date)) {
        return res.status(400).json({
          message: 'Valid start and end dates are required, and the end date must be after the start date',
        });
      }

      if (
        event_location !== undefined &&
        event_location !== null &&
        typeof event_location !== 'string'
      ) {
        return res.status(400).json({
          message: 'Event location must be text',
        });
      }

      const event = await EventModel.update(Number(id), {
        title: title.trim(),
        description: description.trim(),
        start_date,
        end_date,
        event_location: event_location?.trim() || null,
      });

      if (!event) {
        return res.status(404).json({
          message: 'Event not found',
        });
      }

      return res.status(200).json({
        message: 'Event updated successfully',
        event,
      });
    } catch (error) {
      console.error('Update event error:', error);

      return res.status(500).json({
        message: 'Failed to update event',
      });
    }
  },

  // ==========================================
  // DELETE EVENT
  // ==========================================

  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'A valid event ID is required',
        });
      }

      const event = await EventModel.delete(Number(id));

      if (!event) {
        return res.status(404).json({
          message: 'Event not found',
        });
      }

      return res.status(200).json({
        message: 'Event deleted successfully',
      });
    } catch (error) {
      console.error('Delete event error:', error);

      return res.status(500).json({
        message: 'Failed to delete event',
      });
    }
  },
};

module.exports = EventController;