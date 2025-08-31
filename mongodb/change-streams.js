// module imports
const { UserModel, AdModel } = require('../models');

exports.watchUserStatusChanges = () => {
  const changeStream = UserModel.watch([{ $match: { operationType: 'update' } }], { fullDocument: 'updateLookup' });
  changeStream.on('change', async (change) => {
    try {
      const userId = change.documentKey._id;
      const updatedFields = change.updateDescription.updatedFields || {};

      const isBlocked = updatedFields.status === 'blocked' || updatedFields.isBlocked === true;

      if (isBlocked) {
        // Emit socket event or send email to that user
        console.log(`User ${userId} was blocked.`);
      }
    } catch (err) {
      console.error('Error processing user change stream:', err);
    }
  });

  changeStream.on('error', (err) => {
    console.error('User Change Stream Error:', err);
  });
};

exports.watchNewAdPost = () => {
  const changeStream = AdModel.watch([{ $match: { operationType: { $in: ['insert', 'update'] } } }], { fullDocument: 'updateLookup' });
  changeStream.on('change', async (change) => {
    try {
      const { operationType, fullDocument } = change;

      if (operationType === 'insert') {
        // New ad created, Notify admins / emit socket event
        console.log('New Ad Created:', fullDocument);
      } else if (operationType === 'update') {
        // Ad updated,  Notify admins / emit socket event
        console.log('Ad Updated:', fullDocument);
      }
    } catch (err) {
      console.error('Error processing ad change stream:', err);
    }
  });

  changeStream.on('error', (err) => {
    console.error('Ad Change Stream Error:', err);
  });
};
