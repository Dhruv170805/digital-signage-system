const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  priority: { type: Number, default: 1 },
  
  // Content
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  tickerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticker' },
  
  // Mapping for templates
  mediaMapping: { type: Map, of: String }, // { frameId: mediaId }
  
  // Targets
  screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenGroup' }, // Assuming ScreenGroup model exists or will be added
  isGlobal: { type: Boolean, default: false },

  // Timing
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { 
    type: String, 
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:mm)!`
    }
  }, // HH:mm
  endTime: { 
    type: String, 
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:mm)!`
    }
  },   // HH:mm
  daysOfWeek: [Number],        // [0, 1, 2, 3, 4, 5, 6]
  
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
