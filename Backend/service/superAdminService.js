
const GroupsModel = require('../models/groupsModel');
const User = require('../models/usersModel');
const Requests = require('../models/requestModel');

const SuperAdminService = {
  async getCells() {
    const groups = await GroupsModel.findAll();

    return groups.filter(
      (group) => String(group.type || '').toLowerCase() === 'cell'
    );
  },

  async getFellowships() {
    const groups = await GroupsModel.findAll();

    return groups.filter(
      (group) => String(group.type || '').toLowerCase() === 'fellowship'
    );
  },

  async getDepartments() {
    const groups = await GroupsModel.findAll();

    return groups.filter(
      (group) => String(group.type || '').toLowerCase() === 'department'
    );
  },

  async getMinistries() {
    const groups = await GroupsModel.findAll();

    return groups.filter(
      (group) => String(group.type || '').toLowerCase() === 'ministry'
    );
  },

  // Get all administrators with their request statistics.
  async getAllAdmins() {
    return User.findAllAdmins();
  },

  // Get overall request statistics.
  async getRequestOverview() {
    return Requests.getOverview();
  },

  // Get request statistics grouped by administrator.
  async getAdminRequestStats() {
    return Requests.getAdminRequestStats();
  },

  // Get requests reviewed by one administrator.
  async getAdminRequests(adminId, filters = {}) {
    const admin = await User.findById(adminId);

    if (!admin || admin.role !== 'admin') {
      const error = new Error('Administrator not found');
      error.status = 404;
      throw error;
    }

    return Requests.findReviewedByAdmin(adminId, filters);
  },
};

module.exports = SuperAdminService;
