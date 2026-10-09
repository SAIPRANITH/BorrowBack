import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import itemRoutes from './routes/item.routes.js';
import borrowRoutes from './routes/borrow.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import moneyLoanRoutes from './routes/moneyloan.routes.js';
import adminRoutes from './routes/admin.routes.js';
import metricsMiddleware from './middleware/metricsMiddleware.js';

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many login/register attempts, please try again later',
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/money-loans', moneyLoanRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
