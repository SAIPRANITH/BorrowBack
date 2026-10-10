import Item from '../models/Item.js';
import Borrow from '../models/Borrow.js';
import { reconcileLentItems } from '../utils/itemAvailability.js';

export const createItem = async (req, res, next) => {
  try {
    const {
      name,
      category,
      description,
      depositAmount,
      finePerDay,
    } = req.body;

    const imageUrl = req.file?.s3Url || req.body.imageUrl || '';

    const item = await Item.create({
      owner: req.user._id,
      name,
      category,
      description,
      imageUrl,
      depositAmount,
      finePerDay,
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

export const getItems = async (req, res, next) => {
  try {
    const { search, category, sort } = req.query;

    const lentItems = await Item.find({ status: 'lent' }).select('_id status');
    await reconcileLentItems(lentItems);

    let query = { status: 'available' };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    let itemsQuery = Item.find(query).populate('owner', 'name email averageRating');

    if (sort) {
      itemsQuery = itemsQuery.sort(sort);
    } else {
      itemsQuery = itemsQuery.sort('-createdAt');
    }

    const items = await itemsQuery;

    res.json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
};

export const getMyItems = async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort('-createdAt');
    await reconcileLentItems(items);
    res.json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email averageRating');

    if (item) {
      await reconcileLentItems([item]);
      res.json({ success: true, item });
    } else {
      res.status(404);
      throw new Error('Item not found');
    }
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this item');
    }

    const updateData = { ...req.body };
    if (req.file?.s3Url) {
      updateData.imageUrl = req.file.s3Url;
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, item: updatedItem });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this item');
    }

    const activeBorrows = await Borrow.findOne({
      item: item._id,
      status: { $in: ['pending', 'active'] },
    });

    if (activeBorrows) {
      res.status(400);
      throw new Error('Cannot delete item with active or pending borrows');
    }

    await item.deleteOne();

    res.json({ success: true, message: 'Item removed' });
  } catch (error) {
    next(error);
  }
};

export const toggleVisibility = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this item');
    }
    const wasLent = item.status === 'lent';
    await reconcileLentItems([item]);

    if (item.status === 'lent') {
      res.status(400);
      throw new Error('Cannot toggle visibility of a lent item');
    }

    if (wasLent) {
      return res.json({ success: true, item });
    }

    item.status = item.status === 'available' ? 'unavailable' : 'available';
    await item.save();

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};
