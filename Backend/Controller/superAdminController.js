
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
};

module.exports = SuperAdminController;
