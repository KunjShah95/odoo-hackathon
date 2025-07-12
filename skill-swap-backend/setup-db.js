require('dotenv').config();
const { sequelize } = require('./config/database');
const { User } = require('./models');

async function setupDatabase() {
    console.log('🚀 Setting up Skill Swap Database...\n');

    try {
        // Sync database (create tables)
        console.log('📋 Creating database tables...');
        await sequelize.sync({ force: false }); // Set to true to drop and recreate
        console.log('✅ Database tables created successfully\n');

        // Create admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@skillswap.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        console.log('👤 Creating admin user...');
        const [adminUser, created] = await User.findOrCreate({
            where: { email: adminEmail },
            defaults: {
                name: 'Admin',
                email: adminEmail,
                hashedPassword: adminPassword,
                isAdmin: true,
                isPublic: false,
                skillsOffered: ['Platform Management'],
                skillsWanted: []
            }
        });

        if (created) {
            console.log('✅ Admin user created successfully');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        } else {
            console.log('✅ Admin user already exists');
        }

        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📋 What to do next:');
        console.log('1. Start the server: npm run dev');
        console.log('2. Test the API: http://localhost:5000/health');
        console.log('3. Login as admin to access admin features');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        console.log('\n🔧 Common solutions:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Check database credentials in .env file');
        console.log('3. Ensure database exists: CREATE DATABASE skill_swap_db;');
        console.log('4. See MYSQL-SETUP.md for installation guide');
    } finally {
        await sequelize.close();
    }
}

setupDatabase();
