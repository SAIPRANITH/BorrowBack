import Borrow from '../models/Borrow.js';
import Item from '../models/Item.js';

export const reconcileLentItems = async (items) => {
  const lentItems = items.filter((item) => item?.status === 'lent');
  if (!lentItems.length) return items;

  const itemIds = lentItems.map((item) => item._id);
  const borrowedItemIds = await Borrow.distinct('item', {
    item: { $in: itemIds },
    status: { $in: ['active', 'overdue'] },
  });
  const borrowedItemIdSet = new Set(borrowedItemIds.map((id) => id.toString()));
  const staleItems = lentItems.filter((item) => !borrowedItemIdSet.has(item._id.toString()));

  if (staleItems.length) {
    const staleItemIds = staleItems.map((item) => item._id);
    await Item.updateMany(
      { _id: { $in: staleItemIds }, status: 'lent' },
      { $set: { status: 'available' } }
    );
    staleItems.forEach((item) => {
      item.status = 'available';
    });
  }

  return items;
};
