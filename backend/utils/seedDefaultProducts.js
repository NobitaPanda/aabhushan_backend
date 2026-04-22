const Product = require('../models/Product');

const defaults = [
  {
    productCode: 'AJ-R-101',
    productName: 'Surya Filigree Ring',
    category: 'Ring',
    purity: '22K',
    grossWeight: 8.4,
    netWeight: 8.4,
    stoneWeight: 0,
    wastage: 0,
    makingCharge: 3200,
    goldRate: 0,
    price: 68400,
    stockStatus: 'Available',
    image: 'https://images.pexels.com/photos/17069421/pexels-photo-17069421.jpeg?auto=compress&cs=tinysrgb&w=1200',
    remarks: 'A handcrafted floral ring with delicate lattice work and mirror-polished shoulders.'
  },
  {
    productCode: 'AJ-R-114',
    productName: 'Noor Solitaire Ring',
    category: 'Ring',
    purity: '18K',
    grossWeight: 5.2,
    netWeight: 5.2,
    stoneWeight: 0,
    wastage: 0,
    makingCharge: 2800,
    goldRate: 0,
    price: 52100,
    stockStatus: 'Available',
    image: 'https://images.pexels.com/photos/18344078/pexels-photo-18344078.jpeg?auto=compress&cs=tinysrgb&w=1200',
    remarks: 'A sleek solitaire-inspired design for gifting, engagement, and understated celebration.'
  },
  {
    productCode: 'AJ-N-201',
    productName: 'Rajwadi Necklace Set',
    category: 'Necklace',
    purity: '22K',
    grossWeight: 42,
    netWeight: 42,
    stoneWeight: 0,
    wastage: 0,
    makingCharge: 14000,
    goldRate: 0,
    price: 314500,
    stockStatus: 'Available',
    image: 'https://images.pexels.com/photos/28347074/pexels-photo-28347074.jpeg?cs=srgb&dl=pexels-dream_-makkerzz-1603229-28347074.jpg&fm=jpg',
    remarks: 'Layered necklace with matching drops, ideal for bridal and festive styling.'
  },
  {
    productCode: 'AJ-N-228',
    productName: 'Saanjh Pendant Chain',
    category: 'Necklace',
    purity: '18K',
    grossWeight: 11.3,
    netWeight: 11.3,
    stoneWeight: 0,
    wastage: 0,
    makingCharge: 3600,
    goldRate: 0,
    price: 90200,
    stockStatus: 'Available',
    image: 'https://images.pexels.com/photos/7615245/pexels-photo-7615245.jpeg?auto=compress&cs=tinysrgb&w=1200',
    remarks: 'A refined pendant chain with a sculpted medallion centerpiece.'
  },
  {
    productCode: 'AJ-E-307',
    productName: 'Meher Drop Earrings',
    category: 'Earrings',
    purity: '22K',
    grossWeight: 12.1,
    netWeight: 12.1,
    stoneWeight: 0,
    wastage: 0,
    makingCharge: 4200,
    goldRate: 0,
    price: 96500,
    stockStatus: 'Available',
    image: 'https://images.pexels.com/photos/29625126/pexels-photo-29625126.jpeg?auto=compress&cs=tinysrgb&w=1200',
    remarks: 'Textured drop earrings with soft movement and artisanal brilliance.'
  },
  {
    productCode: 'AJ-B-401',
    productName: 'Aangan Bracelet',
    category: 'Bracelet',
    purity: '22K',
    grossWeight: 15.8,
    netWeight: 15.8,
    stoneWeight: 0,
    wastage: 0,
    makingCharge: 5600,
    goldRate: 0,
    price: 126400,
    stockStatus: 'Available',
    image: 'https://images.pexels.com/photos/12194298/pexels-photo-12194298.jpeg?auto=compress&cs=tinysrgb&w=1200',
    remarks: 'A flexible bracelet with a modern clasp, balanced between polish and comfort.'
  }
];

module.exports = async function seedDefaultProducts() {
  const shouldSeed = String(process.env.SEED_DEFAULT_PRODUCTS || 'true').trim().toLowerCase();
  if (['false', '0', 'no'].includes(shouldSeed)) {
    return;
  }

  const existingCount = await Product.countDocuments();
  if (existingCount > 0) {
    return;
  }

  await Product.insertMany(defaults);
  console.log(`Seeded ${defaults.length} default products`);
};
