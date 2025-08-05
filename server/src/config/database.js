const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

class Database {
  constructor() {
    this.db = null;
    this.dbPath =
      process.env.DB_PATH ||
      path.join(__dirname, "../../database/database.sqlite");
  }

  async init() {
    try {
      const dbDir = path.dirname(this.dbPath);

      // Ensure database directory exists
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      await this.connect();

      await this.createTables();

      return this.db;
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Could not connect to db", err);
          reject(err);
        }
        console.log("Connected to database");
        this.db.run(`PRAGMA foreign_keys = ON;`);
        resolve(this.db);
      });
    });
  }

  createTables() {
    const schema = `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          console.error("Could not create tables", err);
          reject(err);
        } else {
          console.log("Tables created or already exist");
          resolve();
        }
      });
    });
  }

  async ensureConnection() {
    if (!this.isConnected()) {
      await this.init();
    }
    return;
  }

  async run(sql, params = []) {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.error("Error running sql", sql, err);
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  async get(sql, params = []) {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error("Error running sql", sql, err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error("Error running sql", sql, err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("Error closing database", err);
            reject(err);
          } else {
            console.log("Database connection closed");
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  isConnected() {
    return this.db !== null;
  }
}

const db = new Database();

module.exports = db;
