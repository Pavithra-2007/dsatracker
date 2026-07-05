const Contest = require('../models/Contest');
const { successResponse, errorResponse } = require('../utils/responseUtils');

const createContest = async (req, res, next) => {
  try {
    const contest = await Contest.create({ ...req.body, user: req.user._id });
    return successResponse(res, contest, 'Contest added', 201);
  } catch (error) {
    next(error);
  }
};

const getContests = async (req, res, next) => {
  try {
    const contests = await Contest.find({ user: req.user._id }).sort({ date: -1 });
    return successResponse(res, contests, 'Contests fetched');
  } catch (error) {
    next(error);
  }
};

const updateContest = async (req, res, next) => {
  try {
    const contest = await Contest.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!contest) return errorResponse(res, 'Contest not found', 404);
    return successResponse(res, contest, 'Contest updated');
  } catch (error) {
    next(error);
  }
};

const deleteContest = async (req, res, next) => {
  try {
    const contest = await Contest.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!contest) return errorResponse(res, 'Contest not found', 404);
    return successResponse(res, null, 'Contest deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { createContest, getContests, updateContest, deleteContest };