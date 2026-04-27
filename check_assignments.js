const mongoose = require('mongoose');
const Assignment = require('./server/src/models/Assignment');
const Media = require('./server/src/models/Media');
const Template = require('./server/src/models/Template');
require('dotenv').config({ path: './server/.env' });

async function check() {
  await mongoose.connect(process.env.DATABASE_URL || process.env.MONGO_URI);
  const now = new Date();
  console.log('Current Server Time:', now.toISOString());
  console.log('Current Day:', now.getDay());
  
  const assignments = await Assignment.find().populate('mediaId').populate('templateId');
  console.log('Total Assignments found:', assignments.length);
  
  assignments.forEach(a => {
    console.log('---');
    console.log('ID:', a._id);
    console.log('Name:', a.name);
    console.log('Status:', a.status);
    console.log('Active:', a.isActive);
    console.log('Priority:', a.priority);
    console.log('Global:', a.isGlobal);
    console.log('Dates:', a.startDate.toISOString(), 'to', a.endDate.toISOString());
    console.log('Time:', a.startTime, 'to', a.endTime);
    console.log('Days:', a.daysOfWeek);
    if (a.mediaId) console.log('Media:', a.mediaId.originalName);
    if (a.templateId) console.log('Template:', a.templateId.name);
  });

  process.exit(0);
}
check();
