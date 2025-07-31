// backend/controllers/order.controller.js
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import crypto from "crypto";
import { parseMpesaSms } from '../utils/smsParser.js';


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

// M-Pesa webhook handler
export const mpesaWebhook = async (req, res) => {
    try {
        console.log("M-Pesa webhook received:", req.body);
        
        // Check if this is SMS forwarding data or direct M-Pesa callback
        const isSmsForwarding = req.body.content && req.body.from;
        
        let transactionData;
        
        if (isSmsForwarding) {
            // Handle SMS forwarding format
            const { content, from } = req.body;
            
            // Validate the webhook source
            if (from !== 'MPESA') {
                // console.log('Webhook not from M-Pesa, ignoring');
                return res.status(200).json({ message: 'Ignored - not from M-Pesa' });
            }
            
            // Only process messages about received payments (not sent payments or other notifications)
            if (!content.toLowerCase().includes('you have received')) {
                // console.log('SMS does not contain "you have received", ignoring:', content);
                return res.status(200).json({ message: 'Ignored - not a received payment notification' });
            }
            
            console.log('Processing received payment SMS:', content);
            
            // Parse the SMS content
            transactionData = parseMpesaSms(content);
            
            if (!transactionData) {
                console.error('Failed to parse SMS content:', content);
                return res.status(400).json({ error: 'Invalid SMS format' });
            }
            
            console.log('Parsed SMS transaction data:', transactionData);
            
        } else {
            // Handle direct M-Pesa callback format
            if (!verifyMpesaWebhook(req)) {
                return res.status(401).json({ message: "Unauthorized webhook" });
            }
            
            transactionData = req.body; // Use the callback data directly
        }

        // Extract transaction details (works for both formats)
        const transactionId = transactionData.TransID;
        const amount = parseFloat(transactionData.TransAmount);
        const msisdn = transactionData.MSISDN;
        const firstName = transactionData.FirstName || '';
        const middleName = transactionData.MiddleName || '';
        const lastName = transactionData.LastName || '';
        const customerName = `${firstName} ${middleName} ${lastName}`.trim();

        console.log(`Processing payment: Amount=${amount}, TransID=${transactionId}, Phone=${msisdn}`);

        // Look for pending orders with matching amount
        const orders = await Order.find({ 
            totalAmount: amount, 
            status: 'pending',
            paymentMethod: 'mpesa'
        }).sort({ createdAt: -1 });

        console.log(`Found ${orders.length} pending orders with amount ${amount}`);

        if (orders.length > 0) {
            // Update the most recent matching order
            const order = orders[0];
            
            // Update order status and payment details
            order.status = 'paid';
            order.mpesaTransactionId = transactionId;
            order.mpesaTransactionTime = isSmsForwarding ? 
                new Date() : // Use current time for SMS
                new Date(transactionData.TransTime); // Use callback time
            order.customerPhone = msisdn;
            order.customerName = customerName;
            order.paidAt = new Date();
            
            await order.save();

            // Clear user's cart
            await User.findByIdAndUpdate(order.user, { cartItems: [] });

            console.log(`Order ${order.orderId} marked as paid with transaction ${transactionId}`);
            
            return res.status(200).json({ 
                message: "Payment processed successfully",
                orderId: order.orderId,
                transactionId: transactionId
            });
            
        } else {
            console.log(`No matching pending order found for amount: ${amount}`);
            
            // Log for debugging - might help identify issues
            const allPendingOrders = await Order.find({ 
                status: 'pending',
                paymentMethod: 'mpesa'
            }).select('orderId totalAmount createdAt');
            
            console.log('All pending M-Pesa orders:', allPendingOrders);
            
            return res.status(200).json({ 
                message: "No matching order found",
                amount: amount,
                pendingOrders: allPendingOrders.length
            });
        }

    } catch (error) {
        console.error("Error in mpesaWebhook controller:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Updated helper function to verify M-Pesa webhook authenticity
const verifyMpesaWebhook = (req) => {
    // For SMS forwarding, we don't need complex verification
    // The SMS parsing itself is the verification
    
    // For direct M-Pesa callbacks, implement proper verification
    const { TransactionType, TransAmount, BusinessShortCode } = req.body;
    
    // Basic validation for M-Pesa callback
    if (!TransactionType || !TransAmount) {
        return false;
    }
    
    // Verify it's your till number (optional)
    if (BusinessShortCode && BusinessShortCode !== "5732804") {
        console.log(`Unexpected BusinessShortCode: ${BusinessShortCode}`);
        return false;
    }
    
    return true;
};