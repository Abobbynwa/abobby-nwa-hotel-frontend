import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useLocation, Link } from 'react-router-dom';
import roomService from '../services/roomService';
import '../styles/global.css';
import '../styles/rooms.css';

const fallbackRoomImage =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900';

const normalizeImages = (images) => {
  if (!images) return [];

  if (Array.isArray(images)) {
    return images.filter(Boolean);
  }

  if (typeof images === 'string') {
    const trimmed = images.trim();

    if (!trimmed) return [];

    // Data URL uploaded from admin panel.
    if (trimmed.startsWith('data:image')) {
      return [trimmed];
    }

    // JSON array stored as text in PostgreSQL.
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (error) {
        return [];
      }
    }

    // Single URL or comma-separated URLs.
    return trimmed
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);
  }

  return [];
};

const getRoomImage = (room) => {
  const images = normalizeImages(room.images);
  return images[0] || fallbackRoomImage;
};

const normalizeAmenities = (amenities) => {
  if (!amenities) return [];

  if (Array.isArray(amenities)) {
    return amenities.filter(Boolean);
  }

  if (typeof amenities === 'string') {
    const trimmed = amenities.trim();

    if (!trimmed) return [];

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (error) {
        return [];
      }
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const Rooms = () => {
  const location = useLocation();
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(800000);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ duration: 700 });
    const params = new URLSearchParams(location.search);
    const cat = params.get('category') || 'all';
    setCategory(cat);
  }, [location.search]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const data = await roomService.getRooms(category, maxPrice);
        setFilteredRooms(data.rooms || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setFilteredRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [category, maxPrice]);

  const handleFilter = (cat) => {
    setCategory(cat);
    const newUrl = cat === 'all' ? '/rooms' : `/rooms?category=${cat}`;
    window.history.pushState({}, '', newUrl);
  };

  const formatPrice = (price) =>
    `₦${Number(price || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  return (
    <div className="container">
      <h2 className="section-title">🛏️ Explore Our Rooms</h2>

      <div className="room-filters">
        {['all', 'standard', 'deluxe', 'executive', 'presidential'].map(cat => (
          <button
            key={cat}
            className={`filter-btn ${category === cat ? 'active' : ''}`}
            onClick={() => handleFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}

        <div className="price-range">
          <label>Max Price: {formatPrice(maxPrice)}</label>
          <input
            type="range"
            min="30000"
            max="800000"
            step="10000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
          />
        </div>
      </div>

      {loading ? (
        <p>Loading rooms...</p>
      ) : filteredRooms.length === 0 ? (
        <p>No rooms found matching your criteria.</p>
      ) : (
        <div className="room-grid">
          {filteredRooms.map(room => {
            const imageUrl = getRoomImage(room);
            const amenities = normalizeAmenities(room.amenities);

            return (
              <div key={room.id} className="room-card" data-aos="fade-up">
                <img
                  src={imageUrl}
                  alt={room.name}
                  onError={(e) => {
                    e.currentTarget.src = fallbackRoomImage;
                  }}
                />
                <h3>{room.name}</h3>
                <p><strong>{formatPrice(room.price)}</strong> / night</p>

                <div className="badge-wrap">
                  {amenities.map((a, i) => (
                    <span key={i} className="badge">{a}</span>
                  ))}
                </div>

                <Link to={`/rooms/${room.id}`} className="btn btn-outline">View Details</Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Rooms;
