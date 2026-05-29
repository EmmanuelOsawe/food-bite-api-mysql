// controllers/order.controller.js
// MySQL version — notice how ORDER ITEMS are a separate table
// In MongoDB they were embedded in the Order document
// In MySQL we INSERT into order_items table separately

const { Order, OrderItem, Food, User } = require("../models");
const { sequelize } = require("../config/database");

// ─── CUSTOMER: Place order ────────────────────────────────────────────────────
exports.placeOrder = async (req, res) => {
  // sequelize.transaction() = ensures all inserts succeed or all rollback
  // This is called a DATABASE TRANSACTION — very important in SQL
  const t = await sequelize.transaction();

  try {
    const { items, deliveryAddress, note } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Order must have at least one item." });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const food = await Food.findByPk(item.foodId);
      if (!food) {
        await t.rollback();
        return res.status(404).json({ success: false, message: `Food ${item.foodId} not found.` });
      }
      if (!food.isAvailable) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `${food.name} is out of stock.` });
      }
      const subtotal = food.price * item.quantity;
      totalAmount += subtotal;
      orderItems.push({ foodId: food.id, name: food.name, price: food.price, quantity: item.quantity, subtotal });
    }

    // Step 1: Create the order row
    const order = await Order.create({
      customerId: req.user.id,
      totalAmount,
      deliveryAddress,
      note: note || null,
    }, { transaction: t });

    // Step 2: Create order item rows (separate table — this is the SQL way)
    await OrderItem.bulkCreate(
      orderItems.map(i => ({ ...i, orderId: order.id })),
      { transaction: t }
    );

    // Commit — save everything to database
    await t.commit();

    // Fetch the full order with items
    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: "items" }],
    });

    res.status(201).json({ success: true, order: fullOrder });
  } catch (error) {
    await t.rollback(); // undo everything if error occurs
    console.error("Place order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CUSTOMER: Get my orders ──────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    // include = JOIN in SQL / populate in MongoDB
    const orders = await Order.findAll({
      where: { customerId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Food, as: "food", attributes: ["name", "imageUrl", "category"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, total: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Get all orders ────────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = status ? { status } : {};
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: "customer", attributes: ["name", "email", "phone"] },
        { model: OrderItem, as: "items" },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
      distinct: true, // needed when using include with count
    });

    res.status(200).json({
      success: true,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Update order status ───────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending","confirmed","preparing","ready","delivered","cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    // update() = findByIdAndUpdate in MongoDB
    await Order.update({ status }, { where: { id: req.params.id } });

    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: "customer", attributes: ["name", "email", "phone"] }],
    });

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    res.status(200).json({ success: true, message: `Order updated to ${status}.`, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};