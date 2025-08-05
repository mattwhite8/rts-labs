// Test script to verify database setup
// Run with: node test-database.js

require("dotenv").config();
const database = require("./database");
const bcrypt = require("bcryptjs");

async function testDatabaseSetup() {
  console.log("🧪 Testing database setup...\n");

  try {
    // Step 1: Initialize database
    console.log("1️⃣ Initializing database...");
    await database.init();

    // Step 2: Test basic connection
    console.log("\n2️⃣ Testing connection...");
    const isConnected = database.isConnected();
    console.log(
      `   Connection status: ${
        isConnected ? "✅ Connected" : "❌ Disconnected"
      }`
    );

    // Step 3: Test table creation by querying schema
    console.log("\n3️⃣ Verifying table structure...");
    const tableInfo = await database.all(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table' AND name='users'
    `);

    if (tableInfo.length > 0) {
      console.log("   ✅ Users table exists");
      console.log("   📋 Table schema:", tableInfo[0].sql);
    } else {
      throw new Error("Users table not found");
    }

    // Step 4: Test indexes
    console.log("\n4️⃣ Checking indexes...");
    const indexes = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='users'
    `);
    console.log(
      `   📊 Found ${indexes.length} indexes:`,
      indexes.map((idx) => idx.name)
    );

    // Step 5: Test insert operation
    console.log("\n5️⃣ Testing user insertion...");
    const testPassword = "test123";
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    const result = await database.run(
      `
      INSERT INTO users (email, username, password_hash) 
      VALUES (?, ?, ?)
    `,
      ["test@example.com", "testuser", hashedPassword]
    );

    console.log(`   ✅ User inserted with ID: ${result.id}`);

    // Step 6: Test retrieval
    console.log("\n6️⃣ Testing user retrieval...");
    const user = await database.get(
      `
      SELECT id, email, username, created_at, is_active 
      FROM users WHERE email = ?
    `,
      ["test@example.com"]
    );

    if (user) {
      console.log("   ✅ User retrieved successfully:");
      console.log("   📄 User data:", {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        is_active: Boolean(user.is_active),
      });
    } else {
      throw new Error("Failed to retrieve inserted user");
    }

    // Step 7: Test password verification
    console.log("\n7️⃣ Testing password verification...");
    const userWithPassword = await database.get(
      `
      SELECT password_hash FROM users WHERE email = ?
    `,
      ["test@example.com"]
    );

    const passwordMatch = await bcrypt.compare(
      testPassword,
      userWithPassword.password_hash
    );
    console.log(
      `   🔒 Password verification: ${
        passwordMatch ? "✅ Success" : "❌ Failed"
      }`
    );

    // Step 8: Clean up test data
    console.log("\n8️⃣ Cleaning up test data...");
    await database.run("DELETE FROM users WHERE email = ?", [
      "test@example.com",
    ]);
    console.log("   🧹 Test user removed");

    // Step 9: Final verification
    console.log("\n9️⃣ Final verification...");
    const userCount = await database.get("SELECT COUNT(*) as count FROM users");
    console.log(`   📊 Total users in database: ${userCount.count}`);

    console.log(
      "\n🎉 All database tests passed! Your setup is working correctly.\n"
    );
  } catch (error) {
    console.error("\n❌ Database test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  } finally {
    // Always close the database connection
    await database.close();
  }
}

// Run the test
if (require.main === module) {
  testDatabaseSetup();
}

module.exports = testDatabaseSetup;
