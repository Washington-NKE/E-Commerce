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
        enum: ['pending', 'paid', 'failed', 'cancelled', 'delivered'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['mpesa', 'card'],
        default: 'mpesa'
    },

    pickupLocation: {
        type: String,
        required: true
    },
    pickupDate: {
        type: String,
        required: true
    },
    pickupTime: {
        type: String,
        required: true
    },

    external_reference: { 
        type: String, 
        unique: true, 
        sparse: true 
    },

    transactionReference: { 
        type: String, 
        unique: true, 
        sparse: true 
    },

    mpesaTransactionId: {
        type: String,
        sparse: true
    },

    paymentMeta: {
        type: mongoose.Schema.Types.Mixed
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
    stripeSessionId: {
        type: String,
        sparse: true
    },
    paidAt: {
        type: Date
    }
}, {
    timestamps: true
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ external_reference: 1 });
orderSchema.index({ transactionReference: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;