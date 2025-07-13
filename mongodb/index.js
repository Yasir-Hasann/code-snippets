// module imports
const mongoose = require('mongoose');

// AutoIncrement Id
const AutoIncrement = require('mongoose-sequence')(mongoose);
yourSchema.plugin(AutoIncrement, { inc_field: 'id' });

// Projection Fields
db.student.find({}, 'name roll -_id');
// OR
db.student.find({}).select('name roll -_id');
// OR
db.student.find({}, { name: 1, roll: 1, _id: 0 });
// OR
db.student.find({}).project({ name: 1, roll: 1, _id: 0 });

// Multiple Populate
OrderModel.find().populate('user').populate('meal');
// OR
OrderModel.find().populate('user meal');
// OR
OrderModel.find().populate([
  { path: 'user', model: 'User' },
  { path: 'meal', model: 'Meal' },
]);
//OR
OrderModel.find().populate(['user', 'meal']);

await Model.createIndexes(); // syncIndexes()
