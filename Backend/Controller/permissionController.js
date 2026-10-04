const Permission = require('../models/permissionModel');

// GET /api/permissions
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();

    return res.status(200).json({ permissions });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};

// GET /api/permissions/:id
exports.getPermissionById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: 'Invalid permission id',
      });
    }

    const permission = await Permission.findById(id);

    if (!permission) {
      return res.status(404).json({
        message: 'Permission not found',
      });
    }

    return res.status(200).json({ permission });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
};