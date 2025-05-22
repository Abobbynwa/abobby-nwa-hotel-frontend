import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Review = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/review')
    }

    const saved = JSON.parse(localStorage.getItem('reviews')) || []
    setReviews(saved)
  }, [user])

  const handleSubmit = (e) => {
    e.preventDefault()
    const newReview = {
      user: user.name,
      rating,
      comment,
      date: new Date().toLocaleDateString(),
    }

    const updatedReviews = [newReview, ...reviews]
    setReviews(updatedReviews)
    localStorage.setItem('reviews', JSON.stringify(updatedReviews))
    setRating(0)
    setComment('')
  }

  return (
    <div className="container">
      <h2>⭐ Leave a Review</h2>

      <form onSubmit={handleSubmit} className="review-form">
        <label>Rating:</label>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((num) => (
            <span
              key={num}
              className={rating >= num ? 'star active' : 'star'}
              onClick={() => setRating(num)}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          rows="4"
          placeholder="Write your review here..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />

        <button type="submit" className="btn btn-glow">Submit Review</button>
      </form>

      <h3 style={{ marginTop: '2rem' }}>📃 Recent Reviews</h3>
      <div className="review-list">
        {reviews.length === 0 && <p>No reviews yet.</p>}
        {reviews.map((rev, i) => (
          <div key={i} className="review-card">
            <div className="review-header">
              <strong>{rev.user}</strong>
              <span className="stars">
                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
              </span>
            </div>
            <p>{rev.comment}</p>
            <small>{rev.date}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Review
