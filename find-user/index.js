// module imports
const asyncHandler = require('express-async-handler');

// file imports
const { UserModel, DealerModel, DealerStaffModel } = require('../../models/models');
const ErrorResponse = require('../../utils/error-response');

// 1st
exports.findUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  let user;
  const models = [UserModel, DealerModel, DealerStaffModel];
  for (const model of models) {
    user = await model.findById(userId).select('-password').lean();
    if (user) break;
  }

  if (!user) return next(new ErrorResponse('User not found', 404));
  res.status(200).json({ success: true, user });
});

//2nd
exports.findUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  let user = (await UserModel.findById(userId).select('-password').lean()) || (await DealerModel.findById(userId).select('-password').lean()) || (await DealerStaffModel.findById(userId).select('-password').lean());
  if (!user) return next(new ErrorResponse('User not found', 404));

  res.status(200).json({ success: true, user });
});

// 3rd
exports.findUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  const { userType } = req.query;
  if (!userType) return next(new ErrorResponse('userType is required', 400));

  const models = {
    user: UserModel,
    dealer: DealerModel,
    'dealer-staff': DealerStaffModel,
  };

  const Model = models[userType];
  if (!Model) return next(new ErrorResponse('Invalid userType', 400));

  const user = await Model.findById(userId).select('-password').lean();
  if (!user) return next(new ErrorResponse('User not found', 404));

  res.status(200).json({ success: true, user });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  let user;
  const models = [UserModel, DealerModel, DealerStaffModel];
  for (const model of models) {
    user = await model.findById(userId).select('-password').lean();
    if (user) break;
  }

  if (!user) return next(new ErrorResponse('User not found', 404));

  await user.constructor.updateOne({ _id: user._id }, { isReported: true }, { timestamps: false });

  res.status(200).json({ success: true, user });
});
