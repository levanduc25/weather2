const mongoose = require('mongoose');

async function checkRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/weather_app');
    
    const User = require('./server/models/User');
    
    // Get all users and their roles
    const users = await User.find({}, 'username email role createdAt');
    
    console.log('\n✅ Users in database:');
    console.log(JSON.stringify(users, null, 2));
    
    if (users.length > 0) {
      console.log('\n✅ Roles found in database!');
      users.forEach(u => {
        console.log(`  - ${u.username}: role = "${u.role}"`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkRole();
