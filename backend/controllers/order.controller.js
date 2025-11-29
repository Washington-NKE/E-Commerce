// backend/controllers/order.controller.js
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";


export const createOrder = async (req, res) => {
    try {
        const { products, totalAmount } = req.body;
        const userId = req.user._id;

        // Validate products exist and calculate total
        let calculatedTotal = 0;
        const validatedProducts = [];

        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ message: `Product ${item.product} not found` });
            }
            
            const itemTotal = product.price * item.quantity;
            calculatedTotal += itemTotal;
            
            validatedProducts.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price
            });
        }

        // Verify total amount matches
        if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
            return res.status(400).json({ message: "Total amount mismatch" });
        }

        // Generate unique order ID
        const orderId = crypto.randomBytes(16).toString('hex');

        // Create order
        const order = new Order({
            orderId,
            user: userId,
            products: validatedProducts,
            totalAmount: calculatedTotal,
            status: 'pending',
            paymentMethod: 'mpesa'
        });

        await order.save();

        // Payment instructions
        const paymentInstructions = {
            tillNumber: "5732804",
            amount: calculatedTotal,
            instructions: [
                "Go to M-Pesa on your phone",
                "Select 'Lipa na M-Pesa'",
                "Select 'Buy Goods and Services'",
                "Enter Till Number: 5732804",
                `Enter Amount: KSh ${calculatedTotal.toFixed(2)}`,
                "Enter your M-Pesa PIN",
                "Confirm the payment"
            ]
        };

        res.status(201).json({
            orderId: order.orderId,
            paymentInstructions,
            message: "Order created successfully"
        });

    } catch (error) {
        console.log("Error in createOrder controller:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ orderId, user: userId });
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({
            orderId: order.orderId,
            status: order.status,
            totalAmount: order.totalAmount,
            transactionId: order.mpesaTransactionId || null,
            customerPhone: order.customerPhone || null,
            paidAt: order.paidAt || null,
            createdAt: order.createdAt
        });

    } catch (error) {
        console.log("Error in getOrderStatus controller:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const orders = await Order.find({ user: userId })
            .populate('products.product')
            .sort({ createdAt: -1 });

        res.json(orders);

    } catch (error) {
        console.log("Error in getUserOrders controller:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
        .populate({ path: "user", select: "name email", model: User })
        .populate({ path: "products.product", select: "name image price", model: Product })
        .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error("Error getting all orders:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const {status} = req.body;

        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found"});
        }

        order.status = status;
        await order.save();

        res.json(order);
    } catch (error) {
        console.error("Error updating order status:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
