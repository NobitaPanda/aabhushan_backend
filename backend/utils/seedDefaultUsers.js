const User = require('../models/User');

const defaults = [
  { name: 'Aabhushan Admin', email: 'owner@aabhushan.com', phone: '+91 9876543210', role: 'admin' },
  { name: 'Aabhushan Manager', email: 'manager@aabhushan.com', phone: '+91 9876543211', role: 'manager' },
  { name: 'Inventory Manager', email: 'inventory@aabhushan.com', phone: '+91 9000000001', role: 'inventory' },
  { name: 'Manufacturing Manager', email: 'manufacturing@aabhushan.com', phone: '+91 9000000002', role: 'manufactoring' },
  { name: 'Sales Executive', email: 'sales@aabhushan.com', phone: '+91 9000000003', role: 'sales' },
  { name: 'Karigar', email: 'karigar@aabhushan.com', phone: '+91 9000000004', role: 'karigar' }
];

module.exports = async function seedDefaultUsers() {
  const defaultPassword = process.env.DEFAULT_STAFF_PASSWORD || 'Demo@123';
  
  for (const entry of defaults) {
    const exists = await User.findOne({ email: entry.email });
    if (exists) continue;

    await User.create({
      ...entry,
      password: defaultPassword,
      status: 'active'
    });
  }
};
