// models/index.js — ALL tables and relationships for food-bite-mysql
// MongoDB equivalent: all your separate model files combined into one

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// ─── USERS ────────────────────────────────────────────────────────────────────
const User = sequelize.define("User", {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:     { type: DataTypes.STRING(100), allowNull: false },
  email:    { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: true },
  phone:    { type: DataTypes.STRING(20), allowNull: true },
  avatar:   { type: DataTypes.TEXT, allowNull: true },
  role:     { type: DataTypes.ENUM("customer","admin","manager"), defaultValue: "customer" },
  googleId: { type: DataTypes.STRING(100), allowNull: true },
}, { tableName: "users", timestamps: true });

// ─── FOODS ────────────────────────────────────────────────────────────────────
const Food = sequelize.define("Food", {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:           { type: DataTypes.STRING(150), allowNull: false },
  description:    { type: DataTypes.TEXT, allowNull: false },
  price:          { type: DataTypes.DECIMAL(10,2), allowNull: false },
  category:       { type: DataTypes.ENUM("breakfast","lunch","dinner","drinks","desserts","snacks","sides"), allowNull: false },
  imageUrl:       { type: DataTypes.TEXT, allowNull: true },
  imagePublicId:  { type: DataTypes.STRING(255), allowNull: true },
  ingredients:    { type: DataTypes.JSON, defaultValue: [] },
  prepTime:       { type: DataTypes.INTEGER, allowNull: false },
  isAvailable:    { type: DataTypes.BOOLEAN, defaultValue: true },
  averageRating:  { type: DataTypes.FLOAT, defaultValue: 0 },
  totalRatings:   { type: DataTypes.INTEGER, defaultValue: 0 },
  createdBy:      { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "foods", timestamps: true });

// ─── ORDERS ───────────────────────────────────────────────────────────────────
const Order = sequelize.define("Order", {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId:       { type: DataTypes.INTEGER, allowNull: false },
  totalAmount:      { type: DataTypes.DECIMAL(10,2), allowNull: false },
  status:           { type: DataTypes.ENUM("pending","confirmed","preparing","ready","delivered","cancelled"), defaultValue: "pending" },
  paymentStatus:    { type: DataTypes.ENUM("unpaid","paid","refunded"), defaultValue: "unpaid" },
  paymentReference: { type: DataTypes.STRING(100), allowNull: true },
  deliveryAddress:  { type: DataTypes.TEXT, allowNull: false },
  note:             { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "orders", timestamps: true });

// ─── ORDER ITEMS (was embedded array in MongoDB, separate table in MySQL) ──────
const OrderItem = sequelize.define("OrderItem", {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId:  { type: DataTypes.INTEGER, allowNull: false },
  foodId:   { type: DataTypes.INTEGER, allowNull: true },
  name:     { type: DataTypes.STRING(150) },
  price:    { type: DataTypes.DECIMAL(10,2) },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10,2) },
}, { tableName: "order_items", timestamps: false });

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────
const Reservation = sequelize.define("Reservation", {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  date:       { type: DataTypes.DATEONLY, allowNull: false },
  time:       { type: DataTypes.STRING(50), allowNull: false },
  guests:     { type: DataTypes.INTEGER, allowNull: false },
  phone:      { type: DataTypes.STRING(20), allowNull: true },
  status:     { type: DataTypes.ENUM("pending","confirmed","cancelled","completed"), defaultValue: "pending" },
}, { tableName: "reservations", timestamps: true });

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
const Review = sequelize.define("Review", {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId:   { type: DataTypes.INTEGER, allowNull: false },
  type:         { type: DataTypes.ENUM("food","restaurant"), allowNull: false },
  foodId:       { type: DataTypes.INTEGER, allowNull: true },
  rating:       { type: DataTypes.INTEGER, allowNull: false },
  title:        { type: DataTypes.STRING(100), allowNull: true },
  comment:      { type: DataTypes.TEXT, allowNull: false },
  replyMessage: { type: DataTypes.TEXT, allowNull: true },
  repliedAt:    { type: DataTypes.DATE, allowNull: true },
}, { tableName: "reviews", timestamps: true });

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
const Payment = sequelize.define("Payment", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId:     { type: DataTypes.INTEGER, allowNull: false },
  customerId:  { type: DataTypes.INTEGER, allowNull: false },
  email:       { type: DataTypes.STRING(150), allowNull: false },
  amount:      { type: DataTypes.INTEGER, allowNull: false },
  reference:   { type: DataTypes.STRING(100), allowNull: false, unique: true },
  status:      { type: DataTypes.ENUM("pending","success","failed","refunded"), defaultValue: "pending" },
  paystackData:{ type: DataTypes.JSON, allowNull: true },
  refundedAt:  { type: DataTypes.DATE, allowNull: true },
}, { tableName: "payments", timestamps: true });

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
// MongoDB stored readBy as an array inside the document.
// MySQL uses a separate junction table (NotificationRead) for this.
const Notification = sequelize.define("Notification", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type:        { type: DataTypes.ENUM("new_food","order_update","general"), defaultValue: "general" },
  title:       { type: DataTypes.STRING(200), allowNull: false },
  message:     { type: DataTypes.TEXT, allowNull: false },
  foodId:      { type: DataTypes.INTEGER, allowNull: true },
  recipientId: { type: DataTypes.INTEGER, allowNull: true },
  link:        { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: "notifications", timestamps: true });

// Junction table: tracks which users have read which notifications
const NotificationRead = sequelize.define("NotificationRead", {
  notificationId: { type: DataTypes.INTEGER, allowNull: false },
  userId:         { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "notification_reads", timestamps: false });

// ─── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────────
const PushSubscription = sequelize.define("PushSubscription", {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:   { type: DataTypes.INTEGER, allowNull: false, unique: true },
  endpoint: { type: DataTypes.TEXT, allowNull: false },
  p256dh:   { type: DataTypes.TEXT, allowNull: false },
  auth:     { type: DataTypes.STRING(255), allowNull: false },
}, { tableName: "push_subscriptions", timestamps: true });

// ─── CONTACT MESSAGES ─────────────────────────────────────────────────────────
const ContactMessage = sequelize.define("ContactMessage", {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:    { type: DataTypes.STRING(100), allowNull: false },
  phone:   { type: DataTypes.STRING(20), allowNull: true },
  email:   { type: DataTypes.STRING(150), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  isRead:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: "contact_messages", timestamps: true });

// ─── RELATIONSHIPS ────────────────────────────────────────────────────────────
User.hasMany(Order,             { foreignKey: "customerId",  as: "orders" });
Order.belongsTo(User,           { foreignKey: "customerId",  as: "customer" });

Order.hasMany(OrderItem,        { foreignKey: "orderId",     as: "items" });
OrderItem.belongsTo(Order,      { foreignKey: "orderId" });

Food.hasMany(OrderItem,         { foreignKey: "foodId" });
OrderItem.belongsTo(Food,       { foreignKey: "foodId",      as: "food" });

User.hasMany(Reservation,       { foreignKey: "customerId",  as: "reservations" });
Reservation.belongsTo(User,     { foreignKey: "customerId",  as: "customer" });

User.hasMany(Review,            { foreignKey: "customerId",  as: "reviews" });
Review.belongsTo(User,          { foreignKey: "customerId",  as: "customer" });

Food.hasMany(Review,            { foreignKey: "foodId",      as: "reviews" });
Review.belongsTo(Food,          { foreignKey: "foodId",      as: "food" });

Order.hasOne(Payment,           { foreignKey: "orderId",     as: "payment" });
Payment.belongsTo(Order,        { foreignKey: "orderId",     as: "order" });

User.hasMany(Food,              { foreignKey: "createdBy",   as: "foods" });
Food.belongsTo(User,            { foreignKey: "createdBy",   as: "creator" });

User.hasOne(PushSubscription,   { foreignKey: "userId" });
PushSubscription.belongsTo(User,{ foreignKey: "userId" });

Notification.belongsTo(Food,    { foreignKey: "foodId",      as: "food" });
Notification.belongsToMany(User,{ through: NotificationRead, foreignKey: "notificationId", as: "readers" });
User.belongsToMany(Notification,{ through: NotificationRead, foreignKey: "userId",         as: "notifications" });

module.exports = {
  sequelize,
  User, Food, Order, OrderItem, Reservation, Review,
  Payment, Notification, NotificationRead, PushSubscription, ContactMessage,
};