import mongoose from 'mongoose';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Borrow from '../models/Borrow.js';
import MoneyLoan from '../models/MoneyLoan.js';

export const getDashboard = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalItems,
      availableItems,
      activeBorrows,
      pendingRequests,
      overdueItems,
      totalLoans,
      activeLoans,
      revenueAgg,
      recentBorrows,
      recentLoans,
      itemsByCategory,
      borrowsByMonth,
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ status: 'available' }),
      Borrow.countDocuments({ status: 'active' }),
      Borrow.countDocuments({ status: 'pending' }),
      Borrow.countDocuments({ status: 'overdue' }),
      MoneyLoan.countDocuments(),
      MoneyLoan.countDocuments({ status: 'active' }),
      Borrow.aggregate([
        {
          $group: {
            _id: null,
            totalDepositsPaid: {
              $sum: { $cond: [{ $eq: ['$depositPaid', true] }, '$depositAmount', 0] },
            },
            totalFinesPaid: {
              $sum: { $cond: [{ $eq: ['$finePaid', true] }, '$fineAmount', 0] },
            },
          },
        },
      ]),
      Borrow.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('item', 'name imageUrl category depositAmount status')
        .populate('borrower', 'name email profilePhoto'),
      MoneyLoan.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('lender', 'name email profilePhoto')
        .populate('borrower', 'name email profilePhoto'),
      Item.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: '$_id',
            category: '$_id',
            count: 1,
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
      Borrow.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: '$_id',
            month: '$_id',
            count: 1,
          },
        },
      ]),
    ]);

    const totalDepositsPaid = revenueAgg.length > 0 ? (revenueAgg[0].totalDepositsPaid || 0) : 0;
    const totalFinesPaid = revenueAgg.length > 0 ? (revenueAgg[0].totalFinesPaid || 0) : 0;
    const totalRevenue = totalDepositsPaid + totalFinesPaid;

    const dashboard = {
      totalUsers,
      totalItems,
      availableItems,
      activeBorrows,
      pendingRequests,
      overdueItems,
      totalLoans,
      activeLoans,
      revenue: {
        totalDepositsPaid,
        totalFinesPaid,
        totalRevenue,
      },
      totalDepositsPaid,
      totalFinesPaid,
      totalRevenue,
      recentBorrows,
      recentLoans,
      itemsByCategory,
      borrowsByMonth,
    };

    return res.status(200).json({
      success: true,
      dashboard,
    });
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const [overdueBorrowsCount, unpaidFinesAgg, unavailableItemsCount, unavailableItems] = await Promise.all([
      Borrow.countDocuments({ status: 'overdue' }),
      Borrow.aggregate([
        {
          $match: {
            fineAmount: { $gt: 0 },
            finePaid: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$fineAmount' },
          },
        },
      ]),
      Item.countDocuments({ status: 'unavailable' }),
      Item.find({ status: 'unavailable' }).select('name category owner').lean(),
    ]);

    const unpaidFinesCount = unpaidFinesAgg.length > 0 ? (unpaidFinesAgg[0].count || 0) : 0;
    const unpaidFinesAmount = unpaidFinesAgg.length > 0 ? (unpaidFinesAgg[0].totalAmount || 0) : 0;

    const alerts = [
      {
        type: 'overdue_borrows',
        title: 'Overdue Borrows',
        message: `${overdueBorrowsCount} item(s) are currently overdue`,
        severity: overdueBorrowsCount > 0 ? 'warning' : 'info',
        count: overdueBorrowsCount,
      },
      {
        type: 'unpaid_fines',
        title: 'Unpaid Fines',
        message: `${unpaidFinesCount} unpaid fine(s) totaling \u20B9${unpaidFinesAmount}`,
        severity: unpaidFinesCount > 0 ? 'warning' : 'info',
        count: unpaidFinesCount,
        totalAmount: unpaidFinesAmount,
      },
      {
        type: 'unavailable_items',
        title: 'Unavailable Items',
        message: `${unavailableItemsCount} item(s) are currently marked as unavailable`,
        severity: unavailableItemsCount > 0 ? 'warning' : 'info',
        count: unavailableItemsCount,
        items: unavailableItems,
      },
    ];

    return res.status(200).json({
      success: true,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

export const getHealth = async (req, res, next) => {
  try {
    const awsConfigured = Boolean(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    );

    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      mongoStatus: mongoose.connection.readyState,
      awsConfigured,
    };

    return res.status(200).json({
      success: true,
      health,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAccounts = async (req, res, next) => {
  try {
    // Get all users
    const users = await User.find().select('-password').lean();
    
    // For each user, count their items, borrows, and loans
    const accounts = await Promise.all(users.map(async (user) => {
      const [items, borrows, loansLent, loansBorrowed] = await Promise.all([
        Item.countDocuments({ owner: user._id }),
        Borrow.countDocuments({ borrower: user._id }),
        MoneyLoan.countDocuments({ lender: user._id }),
        MoneyLoan.countDocuments({ borrower: user._id })
      ]);
      
      return {
        ...user,
        stats: {
          items,
          borrows,
          loansLent,
          loansBorrowed
        }
      };
    }));
    
    return res.status(200).json({
      success: true,
      accounts
    });
  } catch (error) {
    next(error);
  }
};
