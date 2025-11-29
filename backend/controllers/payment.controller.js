import axios from "axios";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

const LIPIA_BASE_URL = process.env.LIPIA_BASE_URL || "https://lipia-api.kreativelabske.com/api/v2";
const LIPIA_API_KEY = process.env.LIPIA_API_KEY;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getAmountKESFromProducts(products, coupon) {
    let total = 0;
    products.forEach(product => {
        const amount = Number(product.price) || 0;
        total += amount * (product.quantity || 1);
    });
    if (coupon) {
        total -= Math.round(total * (coupon.discountPercentage / 100));
    }
    return Math.max(1, Math.round(total));
}

function normalizePhoneNumber(raw) {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, "");

    if (digits.length === 10 && (digits.startsWith("07") || digits.startsWith("01"))) {
        return digits;
    }

    if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
        return "0" + digits;
    }


    if (digits.length === 12 && digits.startsWith("254")) {
        const rest = digits.slice(3);
        return "0" + rest;
    }

    if (digits.length === 13 && digits.startsWith("0254")) {
        const rest = digits.slice(4);
        return "0" + rest;
    }

    return null;
}

export const createCheckoutSession = async (req, res) => {
    try {
        const { products, couponCode, phone_number, pickupLocation, pickupDate, pickupTime} = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Invalid or empty products array" });
        }
        if (!phone_number) {
            return res.status(400).json({ message: "phone_number is required for STK push" });
        }

        const normalizedPhone = normalizePhoneNumber(phone_number);
        if (!normalizedPhone) {
            return res.status(400).json({ message: "Invalid phone_number format. Use 07xxxxxxxx or +2547xxxxxxxx or 2547xxxxxxxx" });
        }

        if (!pickupLocation || !pickupDate || !pickupTime) {
            return res.status(400).json({
                message: "Pickup location, date, and time are required"
            });
        }

        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: "User not authenticated"
            })
        }

        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
        }

        const amountKES = getAmountKESFromProducts(products, coupon);

        const external_reference = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const callbackUrl = process.env.LIPIA_CALLBACK_URL;

        console.log("------------------------------------------");
        console.log("INITIATING STK PUSH");
        console.log("Phone:", normalizedPhone);
        console.log("Pickup:", pickupLocation);
        console.log("------------------------------------------");

        const body = {
            phone_number: normalizedPhone,
            amount: amountKES,
            external_reference,
            callback_url: callbackUrl,
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || "",
                pickupLocation: pickupLocation,
                products: JSON.stringify(products.map(p => ({ id: p.id || p._id, quantity: p.quantity, price: p.price })))
            }
        };

        console.log("Sending STK push to Lipia:", { phone_sent: body.phone_number, amount: body.amount, external_reference });

        const lipiaRes = await axios.post(`${LIPIA_BASE_URL}/payments/stk-push`, body, {
            headers: { Authorization: `Bearer ${LIPIA_API_KEY}`, "Content-Type": "application/json" }
        });

        const result = lipiaRes.data;
        if (!result.success) {
            return res.status(400).json({ message: "Failed to initiate STK push", details: result });
        }

        let order = await Order.findOne({ external_reference });
        if (!order) {
            order = new Order({
                user: req.user._id,
                products: JSON.parse(body.metadata.products).map(p => ({ product: p.id, quantity: p.quantity, price: p.price })),
                totalAmount: amountKES,
                status: "pending",           
                orderId: external_reference,  
                pickupLocation,
                pickupDate,
                pickupTime, 
                external_reference,
                transactionReference: result.data.TransactionReference,
                customerPhone: normalizedPhone

            });
            await order.save();
        } else {
            order.transactionReference = result.data.TransactionReference;
            order.status = "pending";          
            order.orderId = order.orderId || external_reference; 
            await order.save();
        }

        if (amountKES * 100 >= 20000) {
            await createNewCoupon(req.user._id);
        }

        res.status(200).json({
            transactionReference: result.data.TransactionReference,
            external_reference,
            amount: amountKES,
            orderId: order._id
        });
    } catch (error) {
        console.log("Error in createCheckoutSession controller", error.message);
        if (error.response) {
            console.log("Lipia response status:", error.response.status);
            console.log("Lipia response body:", JSON.stringify(error.response.data));
            console.log("Lipia response headers:", JSON.stringify(error.response.headers));
        } else if (error.request) {
            console.log("No response received, request made:", error.request);
        } else {
            console.log("Axios error config:", error.config);
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const checkoutSuccess = async (req, res) => {
    try {
        const { transactionReference } = req.body;

        let order = await Order.findOne({ 
            $or: [
                { transactionReference: transactionReference },
                { external_reference: transactionReference },
                { orderId: transactionReference }
            ]
        });

        if (order && order.status === "paid") {
            return res.status(200).json({ success: true, 
                message: "Payment successful", 
                orderId: order._id });
        }

        if (order && order.status === "failed") {
            return res.status(200).json({   
                success: false, 
                status: "FAILED",
                message: "Payment failed via Callback", 
                orderId: order._id 
            });
        }

    try {
        const statusRes = await axios.get(`${LIPIA_BASE_URL}/payments/status`, {
            headers: { Authorization: `Bearer ${LIPIA_API_KEY}` },
            params: { reference: transactionReference }
        });

        const lipiaData = statusRes.data;

        if (lipiaData.success && lipiaData.data.status === true && order) {
            order.status = "paid";
            order.mpesaTransactionId = lipiaData.data.MpesaReceiptNumber || "";
            order.paymentMeta = lipiaData.data.response;
            order.paidAt = new Date();
            await order.save();

            return res.status(200).json({ 
                success: true, 
                message: "Payment confirmed via API Poll", 
                orderId: order._id
            });
        }

    } catch (apiError) {
        console.log("Lipia Status Check Error (ignoring):", apiError.message);
    }

    return res.status(200).json({
        success: false,
        status: "PENDING",
        message: "Waiting for payment..."
    });
        
    } catch (error) {
        console.log("Error in checkout-success controller", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const lipiaCallback = async (req, res) => {
    try {
        res.set("Content-Type", "text/plain");
        res.status(200).send("ok");

        const payload = req.body;
        const paymentResponse = payload.response || payload.data;

        if (!paymentResponse) {
            console.log("Callback had no valid response object");
            return;
        }

        const uniqueRef = paymentResponse.TransactionReference || paymentResponse.MerchantRequestID;
        const extRef = paymentResponse.ExternalReference;

        let order = null;
        let attempts = 0;
        const maxRetries = 3;

        while (!order && attempts < maxRetries) {
            order = await Order.findOne({
                $or: [
                    { external_reference: extRef },
                    { transactionReference: uniqueRef },
                    { orderId: extRef }
                ]
            });

            if (!order) {
                attempts++;
                await sleep(2000);
            }
        }

        if (!order) {
            console.error(`CALLBACK FAILED: Order never found for ref ${extRef}`);
            return;
        }

        const isSuccess = (payload.status === true) || (paymentResponse.Status === "Success");

        if (isSuccess) {
            console.log(`MARKING ORDER ${order._id} AS PAID`);
            order.status = "paid";
            order.mpesaTransactionId = paymentResponse.MpesaReceiptNumber;
            order.paymentMeta = paymentResponse;
            order.paidAt = new Date();
        } else {
            order.status = "failed";
            order.paymentMeta = paymentResponse;
        }

        await order.save();

    } catch (error) {
        console.error("Error processing callback:", error.message);
    }
}

async function createNewCoupon(userId) {
    await Coupon.findOneAndDelete({ userId });

    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 7 * 24 * 60 * 60 * 1000),
        userId: userId
    });

    await newCoupon.save();

    return newCoupon;
}

