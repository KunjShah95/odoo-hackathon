require('dotenv').config();
const { sequelize, testConnection } = require('./config/database');
const { User, Swap, Feedback, Notification } = require('./models');

async function testSetup() {
    console.log('🔍 Testing Skill Swap Backend Setup...\n');

    try {
        // Test database connection
        console.log('1️⃣ Testing database connection...');
        await testConnection();
        console.log('✅ Database connection successful\n');

        // Test models
        console.log('2️⃣ Testing models...');
        await sequelize.sync({ force: false });
        console.log('✅ Models synchronized successfully\n');

        // Test creating a sample user
        console.log('3️⃣ Testing user creation...');
        const [testUser, created] = await User.findOrCreate({
            where: { email: 'test@example.com' },
            defaults: {
                name: 'Test User',
                email: 'test@example.com',
                hashedPassword: 'password123',
                skillsOffered: ['JavaScript', 'Node.js'],
                skillsWanted: ['Python', 'React'],
                isPublic: true
            }
        });

        if (created) {
            console.log('✅ Test user created successfully');
        } else {
            console.log('✅ Test user already exists');
        }
        console.log(`   User ID: ${testUser.id}`);
        console.log(`   User Name: ${testUser.name}\n`);

        // Clean up test user
        await testUser.destroy();
        console.log('🧹 Test user cleaned up\n');

        console.log('🎉 All tests passed! Your Skill Swap backend is ready to use.');
        console.log('\n📋 Next steps:');
        console.log('1. Update your .env file with your database credentials');
        console.log('2. Run: npm run dev');
        console.log('3. Visit: http://localhost:5000/health');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure PostgreSQL is running');
        console.log('2. Check your database credentials in .env');
        console.log('3. Ensure the database exists');
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

testSetup();
