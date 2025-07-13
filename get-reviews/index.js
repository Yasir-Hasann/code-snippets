// module imports
const asyncHandler = require('express-async-handler');

// module imports
const mongoose = require('mongoose');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const userReviewSchema = new mongoose.Schema(
  {
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType', required: true }, // reviewer
    userType: { type: String, enum: ['user', 'dealer'], required: true },
    description: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    images: [String],
    reason: String,
    isAnonymous: { type: Boolean, default: false },
    actionBy: String,
    approvedAt: Date,
    rejectedAt: Date,
    removedAt: Date,
    reason: String,
  },
  { timestamps: true }
);

userReviewSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('dealer-review', userReviewSchema);


// file imports
const { UserReviewModel } = require('../../models');
const ErrorResponse = require('../../utils/error-response');

// @desc   Get All User Reviews
// @route  GET /api/v1/admin/get-all-user-reviews
// @access Private
exports.getAllUserReviews = asyncHandler(async (req, res, next) => {
  const { limit: l, page: p, sort: s, sortKey, createdAgo: ca, search: q, searchKey, status, name, rating, targetId } = req.query;
  const limit = l ? parseInt(l) : 10;
  const page = p ? parseInt(p) : 1;
  const sort = s ? parseInt(s) : -1;
  const search = q || null;
  const createdAgo = ca || null;

  const query = [{ $match: {} }];

  if (createdAgo) query.push({ $match: { createdAt: { $gte: dayjs().subtract(createdAgo, 'days').startOf('day').toDate() } } });
  if (search) query.push({ $match: { [searchKey || 'description']: { $regex: `.*${search}.*`, $options: 'i' } } });
  if (status) query.push({ $match: { status } });
  if (targetId) query.push({ $match: { target: new mongoose.Types.ObjectId(targetId) } });
  if (rating) {
    const ratings = Array.isArray(rating) ? rating : rating.split(',');
    const [minRating, maxRating] = ratings.map(Number);
    query.push({ $match: { rating: { $gte: minRating, $lte: maxRating } } });
  }

  const aggregate = UserReviewModel.aggregate(query);
  const data = await UserReviewModel.aggregatePaginate(aggregate, {
    page,
    limit,
    sort: { [sortKey || 'createdAt']: sort },
  });

  if (!data) return next(new ErrorResponse('No data found', 404));

  if (targetId) {
    const [summary] = await UserReviewModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(targetId), isDeleted: false } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingsCount: { $push: '$rating' },
          pendingReviews: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        },
      },
    ]);

    if (summary) {
      const { totalReviews, averageRating, ratingsCount: ratings, pendingReviews } = summary;
      const ratingsBreakdown = ratings.reduce(
        (acc, rating) => {
          const roundedRating = Math.floor(rating);
          if (roundedRating >= 1 && roundedRating <= 5) {
            acc[roundedRating] = (acc[roundedRating] || 0) + 1;
          }
          return acc;
        },
        { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      );

      const ratingsPercentage = Object.entries(ratingsBreakdown).reduce((acc, [rating, count]) => {
        acc[rating] = Number(((count / totalReviews) * 100).toFixed(1));
        return acc;
      }, {});

      const reviewSummary = {
        totalReviews,
        averageRating: averageRating.toFixed(1),
        ratingsPercentage,
        pendingReviews,
      };

      data.reviewSummary = reviewSummary;
    }
  }

  res.status(200).json(data);
});
