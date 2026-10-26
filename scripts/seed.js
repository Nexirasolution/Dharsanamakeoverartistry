/**
 * Run with: npm run seed
 * Creates the first admin account, default categories,
 * and default store settings. Safe to re-run - it skips items that already exist.
 */
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env. Add your MongoDB Atlas connection string first.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const AdminSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, passwordHash: String, role: String }, { timestamps: true });
  const CategorySchema = new mongoose.Schema({ name: String, slug: { type: String, unique: true }, image: String, description: String, sizes: [String], sortOrder: Number, isActive: Boolean }, { timestamps: true });
  const SettingsSchema = new mongoose.Schema({ key: { type: String, unique: true } }, { strict: false, timestamps: true });

  const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
  const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
  const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

  // 1. Admin account
  const email = (process.env.ADMIN_EMAIL || 'dhivyanagu1991@gmail.com').toLowerCase();
  const existingAdmin = await Admin.findOne({ email });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10);
    await Admin.create({ name: 'Admin', email, passwordHash, role: 'owner' });
    console.log(`Created admin account: ${email}`);
  } else {
    console.log('Admin account already exists, skipping.');
  }

  // 2. Categories (placeholder categories - edit to match your catalogue)
  const bangleSizes = ['2.2', '2.4', '2.6', '2.8'];
  const categories = [
    { name: 'Silk Thread Bangles', sizes: bangleSizes },
    { name: 'Bridal Bangles', sizes: bangleSizes },
    { name: 'Kundan Bangles', sizes: bangleSizes },
    { name: 'Metal Bangles', sizes: bangleSizes },
    { name: 'Bangle Sets', sizes: bangleSizes }
  ];

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const slug = slugify(c.name, { lower: true });
    const exists = await Category.findOne({ slug });
    if (!exists) {
      await Category.create({ ...c, slug, sortOrder: i, isActive: true });
      console.log(`Created category: ${c.name}`);
    }
  }

  // 3. Default settings
  const existingSettings = await Settings.findOne({ key: 'global' });
  if (!existingSettings) {
    await Settings.create({
      key: 'global',
      storeName: 'Dharsana Makeover Boutique',
      whatsapp: '919842410186',
      phone: '919842410186',
      phone2: '919543821420',
      email: 'dhivyanagu1991@gmail.com',
      instagram: 'dharsana_makeover_boutique',
      address: 'Thiru Vik Ka Street, Surampatti Road, Erode, Tamil Nadu - 638009',
      shippingFee: 49,
      freeShippingAbove: 999,
      seoTitle: 'Dharsana Makeover Boutique | Erode',
      seoDescription: 'Dharsana Makeover Boutique, Surampatti Road, Erode, Tamil Nadu.'
    });
    console.log('Created default store settings.');
  }

  console.log('\nSeed complete! Admin login:');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'ChangeMe123!'}`);
  console.log('  URL: /admin/login\n');

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });