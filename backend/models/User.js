const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
  },
  plan_type: {
    type: String,
    enum: ['FREE', 'PREMIUM'],
    default: 'FREE',
  },
  first_name: String,
  last_name: String,
  phone: String,
  address: String,
  alert_time: String,
  holdings: [{
    ticker: String,
    quantity: Number,
    buyPrice: Number,
    totalInvestment: Number,
    currency: String,
  }]
}, { timestamps: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model('User', UserSchema);
