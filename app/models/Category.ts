import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Add indexes
CategorySchema.index({ name: 'text' });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

export default Category; 