// Deprecated: Role controller removed.
module.exports = {
  getAllRoles: (req, res) => res.json({ success: true, count: 0, data: [] }),
  getRoleById: (req, res) => res.status(404).json({ success: false, message: 'Roles removed' }),
  createRole: (req, res) => res.status(400).json({ success: false, message: 'Roles removed' }),
  updateRole: (req, res) => res.status(400).json({ success: false, message: 'Roles removed' }),
  deleteRole: (req, res) => res.status(400).json({ success: false, message: 'Roles removed' }),
};
