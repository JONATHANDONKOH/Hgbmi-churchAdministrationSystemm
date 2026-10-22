const GroupsModel = require('../models/groupsModel');
const User = require('../models/usersModel');

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

  async getAllAdmins() {
    return await User.findAllAdmins();
  },
};

module.exports = SuperAdminService;