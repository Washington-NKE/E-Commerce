// backend/models/order.model.js (Updated)
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['mpesa', 'card'],
        default: 'mpesa'
    },
    // M-Pesa specific fields
    mpesaTransactionId: {
        type: String,
        sparse: true
    },
    mpesaTransactionTime: {
        type: Date
    },
    customerPhone: {
        type: String
    },
    customerName: {
        type: String
    },
    // Legacy field for backward compatibility - removed default null
    stripeSessionId: {
        type: String,
        sparse: true
        // Don't set default: null as it causes duplicate key issues
    },
    paidAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Create indexes with proper sparse settings
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1, totalAmount: 1 });
orderSchema.index({ mpesaTransactionId: 1 }, { sparse: true });

// Create sparse unique index for stripeSessionId to allow multiple null values
orderSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

const Order = mongoose.model("Order", orderSchema);

export default Order;