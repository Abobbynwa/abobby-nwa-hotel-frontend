export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    console.log('New contact message:', {
      name,
      email,
      message,
      receivedAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Message received successfully'
    });
  } catch (error) {
    console.error('Contact message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process contact message'
    });
  }
};
