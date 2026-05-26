import pool from './db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const initDatabase = async () => {
  try {
    console.log('🔨 Creating database tables...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        phone VARCHAR(50),
        salary INTEGER DEFAULT 0,
        department VARCHAR(100),
        job_title VARCHAR(150),
        address TEXT,
        emergency_contact VARCHAR(150),
        employment_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS salary INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(150);`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(150);`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_date DATE;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_performance (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(100) NOT NULL,
        action_note TEXT,
        score INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount INTEGER NOT NULL,
        expense_date DATE DEFAULT CURRENT_DATE,
        note TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL,
        capacity INTEGER DEFAULT 2,
        description TEXT,
        amenities TEXT[],
        images TEXT[],
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        room_id INTEGER REFERENCES rooms(id),
        room_type VARCHAR(100),
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        guests INTEGER NOT NULL,
        total INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        payment_reference VARCHAR(255),
        payment_method VARCHAR(50),
        transfer_bank VARCHAR(100),
        transfer_account_name VARCHAR(255),
        transfer_account_number VARCHAR(50),
        payment_proof TEXT,
        payment_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transfer_bank VARCHAR(100);`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transfer_account_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transfer_account_number VARCHAR(50);`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_proof TEXT;`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_note TEXT;`);

    console.log('✅ Tables created successfully!');

    const adminExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [process.env.ADMIN_EMAIL]
    );

    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role, department, job_title, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['Admin', process.env.ADMIN_EMAIL, hashedPassword, 'admin', 'Administration', 'System Administrator', 'active']
      );
      console.log('✅ Admin user created!');
    }

    const roomsExist = await pool.query('SELECT COUNT(*) FROM rooms');
    if (parseInt(roomsExist.rows[0].count) === 0) {
      const sampleRooms = [
        {
          name: 'Standard Room',
          type: 'standard',
          price: 50000,
          capacity: 2,
          description: 'Comfortable standard room with basic amenities',
          amenities: ['WiFi', 'TV', 'AC'],
          images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500']
        },
        {
          name: 'Deluxe Suite',
          type: 'deluxe',
          price: 120000,
          capacity: 3,
          description: 'Spacious deluxe suite with premium amenities',
          amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony'],
          images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500']
        },
        {
          name: 'Executive Room',
          type: 'executive',
          price: 200000,
          capacity: 4,
          description: 'Executive room with workspace and premium facilities',
          amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Work Desk', 'Coffee Maker'],
          images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500']
        },
        {
          name: 'Presidential Suite',
          type: 'presidential',
          price: 400000,
          capacity: 6,
          description: 'Luxurious presidential suite with panoramic views',
          amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi', 'Butler Service', 'Kitchen'],
          images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=500']
        }
      ];

      for (const room of sampleRooms) {
        await pool.query(
          `INSERT INTO rooms (name, type, price, capacity, description, amenities, images) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [room.name, room.type, room.price, room.capacity, room.description, room.amenities, room.images]
        );
      }
      console.log('✅ Sample rooms created!');
    }

    console.log('🎉 Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();