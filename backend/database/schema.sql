CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO rooms (name, type, price, capacity, description, amenities, images)
SELECT 'Standard Room', 'standard', 50000, 2, 'Comfortable standard room with basic amenities', ARRAY['WiFi', 'TV', 'AC'], ARRAY['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500']
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE type = 'standard');

INSERT INTO rooms (name, type, price, capacity, description, amenities, images)
SELECT 'Deluxe Suite', 'deluxe', 120000, 3, 'Spacious deluxe suite with premium amenities', ARRAY['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony'], ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500']
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE type = 'deluxe');

INSERT INTO rooms (name, type, price, capacity, description, amenities, images)
SELECT 'Executive Room', 'executive', 200000, 4, 'Executive room with workspace and premium facilities', ARRAY['WiFi', 'TV', 'AC', 'Mini Bar', 'Work Desk', 'Coffee Maker'], ARRAY['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500']
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE type = 'executive');

INSERT INTO rooms (name, type, price, capacity, description, amenities, images)
SELECT 'Presidential Suite', 'presidential', 400000, 6, 'Luxurious presidential suite with panoramic views', ARRAY['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi', 'Butler Service', 'Kitchen'], ARRAY['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=500']
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE type = 'presidential');
