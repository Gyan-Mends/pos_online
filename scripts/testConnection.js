const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');

mongoose.connect('mongodb://localhost:27017/pos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully!');
  process.exit(0);
})
.catch(err => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
}); 