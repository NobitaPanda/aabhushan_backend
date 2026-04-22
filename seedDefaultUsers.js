const User = require('../models/User');

const defaults = [
  {
    name: 'Aabhushan Admin',
    email: 'owner@aabhushan.com',
    phone: '+91 9876543210',
    role: 'admin',
    password: process.env.OWNER_PASSWORD || 'owner@123'
  },
  {
    name: 'Aabhushan Manager',
    email: 'manager@aabhushan.com',
    phone: '+91 9876543211',
    role: 'manager',
    password: process.env.MANAGER_PASSWORD || 'manager@123'
  },
  {
    name: 'Inventory Manager',
    email: 'inventory@aabhushan.com',
    phone: '+91 9000000001',
    role: 'inventory',
    password: process.env.INVENTORY_PASSWORD || 'inventory@123'
  },
  {
    name: 'Manufacturing Manager',
    email: 'manufacturing@aabhushan.com',
    phone: '+91 9000000002',
    role: 'manufactoring',
    password: process.env.MANUFACTURING_PASSWORD || 'manufacturing@123'
  },
  {
    name: 'Sales Executive',
    email: 'sales@aabhushan.com',
    phone: '+91 9000000003',
    role: 'sales',
    password: process.env.SALES_PASSWORD || 'sales@123'
  },
  {
    name: 'Karigar',
    email: 'karigar@aabhushan.com',
    phone: '+91 9000000004',
    role: 'karigar',
    password: process.env.KARIGAR_PASSWORD || 'karigar@123'
  }
];

module.exports = async function seedDefaultUsers() {
  for (const entry of defaults) {
    const exists = await User.findOne({ email: entry.email });
    if (!exists) {
      await User.create({
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        role: entry.role,
        password: entry.password,
        status: 'active'
      });
      continue;
    }

    exists.name = entry.name;
    exists.phone = entry.phone;
    exists.role = entry.role;
    exists.status = 'active';
    exists.password = entry.password;
    await exists.save();
  }
};
