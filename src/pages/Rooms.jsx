import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useLocation, Link } from 'react-router-dom';
import roomService from '../services/roomService';
import '../styles/global.css';
import '../styles/rooms.css';

const Rooms = () => {
  const location = useLocation();
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(500000);
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
    `₦${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

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
            min="50000"
            max="500000"
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
          {filteredRooms.map(room => (
            <div key={room.id} className="room-card" data-aos="fade-up">
              <img src={room.images?.[0]} alt={room.name} />
              <h3>{room.name}</h3>
              <p><strong>{formatPrice(room.price)}</strong> / night</p>

              <div className="badge-wrap">
                {room.amenities?.map((a, i) => (
                  <span key={i} className="badge">{a}</span>
                ))}
              </div>

              <Link to={`/rooms/${room.id}`} className="btn btn-outline">View Details</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rooms;