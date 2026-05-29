// controllers/food.controller.js
// KEY MYSQL DIFFERENCES from MongoDB version:
// MongoDB: Food.find({ category })          → MySQL: Food.findAll({ where: { category } })
// MongoDB: Food.findById(id)                → MySQL: Food.findByPk(id)
// MongoDB: food.save()                      → MySQL: food.save() (same!)
// MongoDB: Food.countDocuments(query)       → MySQL: Food.count({ where: query })
// MongoDB: .populate("createdBy","name")    → MySQL: include: [{ model: User, as: "creator" }]
// MongoDB: $text search                     → MySQL: Op.like with % wildcards

const { Op } = require("sequelize");
const { Food, User, Review } = require("../models");

// ─── ADMIN: Add food ──────────────────────────────────────────────────────────
exports.addFood = async (req, res) => {
  try {
    const { name, description, price, category, ingredients, prepTime } = req.body;

    if (!name || !description || !price || !category || !prepTime) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    let parsedIngredients = [];
    if (ingredients) {
      parsedIngredients = Array.isArray(ingredients)
        ? ingredients
        : ingredients.split(",").map(i => i.trim());
    }

    const food = await Food.create({
      name,
      description,
      price: Number(price),
      category: category.toLowerCase(),
      ingredients: parsedIngredients,
      prepTime: Number(prepTime),
      imageUrl: req.file ? req.uploadedImageUrl : null,
      imagePublicId: req.file ? req.uploadedImagePublicId : null,
      createdBy: req.user.id, // MySQL uses .id not ._id
    });

    res.status(201).json({ success: true, food });
  } catch (error) {
    console.error("Add food error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CUSTOMER: Get all foods with search and filter ───────────────────────────
exports.getAllFoods = async (req, res) => {
  try {
    const { category, available, search, page = 1, limit = 10, minPrice, maxPrice } = req.query;

    // Build WHERE clause — MySQL equivalent of MongoDB query object
    const where = {};

    if (category) where.category = category.toLowerCase();
    if (available !== undefined) where.isAvailable = available === "true";

    // Price range — MySQL uses Op.gte and Op.lte (same as MongoDB $gte $lte)
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice); // >= minPrice
      if (maxPrice) where.price[Op.lte] = Number(maxPrice); // <= maxPrice
    }

    // Text search — MySQL uses LIKE '%searchterm%'
    // MongoDB used $text index — MySQL uses Op.like
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    // count + findAll = MongoDB's countDocuments + find
    const { count, rows: foods } = await Food.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
      foods: foods.map(f => ({
        ...f.toJSON(),
        status: f.isAvailable ? "available" : "out of stock",
      })),
    });
  } catch (error) {
    console.error("Get foods error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CUSTOMER: Get single food ────────────────────────────────────────────────
exports.getSingleFood = async (req, res) => {
  try {
    // findByPk = findById in MongoDB
    // include = populate in MongoDB
    const food = await Food.findByPk(req.params.id, {
      include: [
        {
          model: Review,
          as: "reviews",
          include: [{ model: User, as: "customer", attributes: ["name", "avatar"] }],
        },
      ],
    });

    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found." });
    }

    res.status(200).json({
      success: true,
      food: { ...food.toJSON(), status: food.isAvailable ? "available" : "out of stock" },
    });
  } catch (error) {
    console.error("Get food error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Toggle availability ───────────────────────────────────────────────
exports.toggleAvailability = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: "Food not found." });

    food.isAvailable = !food.isAvailable;
    await food.save(); // save() works same as MongoDB

    res.status(200).json({
      success: true,
      message: `${food.name} is now ${food.isAvailable ? "available" : "out of stock"}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: Delete food ───────────────────────────────────────────────────────
exports.deleteFood = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: "Food not found." });

    await food.destroy(); // destroy() = deleteOne() in MongoDB

    res.status(200).json({ success: true, message: `${food.name} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};