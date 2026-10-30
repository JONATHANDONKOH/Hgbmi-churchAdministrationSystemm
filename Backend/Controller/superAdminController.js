
const SuperAdminService = require('../service/superAdminService');

const SuperAdminController = {
  async getCells(req, res) {
    try {
      const cells = await SuperAdminService.getCells();
      return res.status(200).json({ data: cells });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Failed to fetch cells',
      });
    }
  },

  async getFellowships(req, res) {
    try {
      const fellowships = await SuperAdminService.getFellowships();
      return res.status(200).json({ data: fellowships });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Failed to fetch fellowships',
      });
    }
  },

  async getDepartments(req, res) {
    try {
      const departments = await SuperAdminService.getDepartments();
      return res.status(200).json({ data: departments });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Failed to fetch departments',
      });
    }
  },

  async getMinistries(req, res) {
    try {
      const ministries = await SuperAdminService.getMinistries();
      return res.status(200).json({ data: ministries });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Failed to fetch ministries',
      });
    }
  },

  async getAllAdmins(req, res) {
    try {
      const admins = await SuperAdminService.getAllAdmins();
      return res.status(200).json({ data: admins });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Failed to fetch administrators',
      });
    }
  },

  // Get overall request statistics
  async getRequestOverview(req, res) {
    try {
      const overview = await SuperAdminService.getRequestOverview();

      return res.status(200).json({
        data: overview,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Failed to fetch request overview',
      });
    }
  },

  // Get request statistics for all administrators
  async getAdminRequestStats(req, res) {
    try {
      const stats = await SuperAdminService.getAdminRequestStats();

      return res.status(200).json({
        data: stats,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Failed to fetch administrator request statistics',
      });
    }
  },

  // Get requests reviewed by one administrator
  async getAdminRequests(req, res) {
    try {
      const adminId = Number(req.params.id);

      if (!Number.isSafeInteger(adminId) || adminId <= 0) {
        return res.status(400).json({
          message: 'A valid administrator ID is required',
        });
      }

      const { status, request_type: requestType } = req.query;

      const allowedStatuses = ['approved', 'rejected'];

      const allowedRequestTypes = [
        'user',
        'leader_assignment',
        'group_creation',
        'event',
        'meeting',
      ];

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Status must be approved or rejected',
        });
      }

      if (requestType && !allowedRequestTypes.includes(requestType)) {
        return res.status(400).json({
          message: 'Invalid request type',
        });
      }

      const requests = await SuperAdminService.getAdminRequests(adminId, {
        status,
        requestType,
      });

      return res.status(200).json({
        data: requests,
      });
    } catch (error) {
      console.error(error);

      return res.status(error.status || 500).json({
        message: error.message || 'Failed to fetch administrator requests',
      });
    }
  },
};

module.exports = SuperAdminController;
