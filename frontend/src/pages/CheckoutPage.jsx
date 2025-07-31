// frontend/src/pages/CheckoutPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/useCartStore';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../lib/axios.js';

const CheckoutPage = () => {
    const { cart, total, clearCart } = useCartStore();
    const [orderStatus, setOrderStatus] = useState('form'); // form, waiting, success, failed
    const [orderId, setOrderId] = useState(null);
    const [paymentInstructions, setPaymentInstructions] = useState(null);
    const navigate = useNavigate();

    const handlePlaceOrder = async () => {
        try {
            setOrderStatus('waiting');
            
            const orderData = {
                products: cart.map(item => ({
                    product: item._id,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: total
            };

            const response = await axios.post('/orders/create', orderData);
            const { orderId: newOrderId, paymentInstructions: instructions } = response.data;
            
            setOrderId(newOrderId);
            setPaymentInstructions(instructions);
            
            // Start polling for payment verification
            pollPaymentStatus(newOrderId);
            
        } catch (error) {
            console.error('Error creating order:', error);
            setOrderStatus('failed');
        }
    };

    const pollPaymentStatus = async (orderIdToCheck) => {
        const maxAttempts = 60; // 5 minutes (5 seconds * 60)
        let attempts = 0;

        const checkPayment = async () => {
            try {
                const response = await axios.get(`/orders/status/${orderIdToCheck}`);
                const { status } = response.data;

                if (status === 'paid') {
                    setOrderStatus('success');
                    clearCart();
                    return;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkPayment, 5000); // Check every 5 seconds
                } else {
                    setOrderStatus('failed');
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkPayment, 5000);
                } else {
                    setOrderStatus('failed');
                }
            }
        };

        checkPayment();
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
                    <Link to="/" className="text-emerald-400 hover:text-emerald-300">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <Link to="/cart" className="flex items-center text-emerald-400 hover:text-emerald-300 mb-4">
                        <ArrowLeft className="mr-2" size={20} />
                        Back to Cart
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Checkout</h1>
                </div>

                {orderStatus === 'form' && (
                    <CheckoutForm 
                        cart={cart} 
                        total={total} 
                        onPlaceOrder={handlePlaceOrder}
                    />
                )}

                {orderStatus === 'waiting' && (
                    <PaymentWaiting 
                        paymentInstructions={paymentInstructions}
                        orderId={orderId}
                        total={total}
                    />
                )}

                {orderStatus === 'success' && (
                    <PaymentSuccess orderId={orderId} />
                )}

                {orderStatus === 'failed' && (
                    <PaymentFailed onRetry={() => setOrderStatus('form')} />
                )}
            </div>
        </div>
    );
};

const CheckoutForm = ({ cart, total, onPlaceOrder }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6"
        >
            <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
                {cart.map((item) => (
                    <div key={item._id} className="flex justify-between items-center py-2 border-b border-gray-700">
                        <div>
                            <h3 className="text-white">{item.name}</h3>
                            <p className="text-gray-400">Quantity: {item.quantity}</p>
                        </div>
                        <p className="text-emerald-400 font-semibold">
                            KSh {(item.price * item.quantity).toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-700 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-white">Total:</span>
                    <span className="text-emerald-400">KSh {total.toFixed(2)}</span>
                </div>
            </div>

            <motion.button
                onClick={onPlaceOrder}
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                Place Order & Pay via M-Pesa
            </motion.button>
        </motion.div>
    );
};

const PaymentWaiting = ({ paymentInstructions, orderId, total }) => {
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

    useState(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 text-center"
        >
            <Clock className="mx-auto mb-4 text-yellow-400" size={48} />
            <h2 className="text-2xl font-bold text-white mb-4">Waiting for Payment</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-yellow-800 mb-2">Payment Instructions:</h3>
                <div className="text-yellow-700 space-y-2">
                    <p>1. Go to M-Pesa on your phone</p>
                    <p>2. Select "Lipa na M-Pesa"</p>
                    <p>3. Select "Pochi la Biashara"</p>
                    <p>4. Enter Phone Number: <strong>0713440774</strong></p>
                    <p>5. Enter Amount: <strong>KSh {total.toFixed(2)}</strong></p>
                    <p>6. Enter your M-Pesa PIN</p>
                    <p>7. Confirm the payment</p>
                </div>
            </div>
            
            <div className="mb-4">
                <p className="text-gray-300">Order ID: <span className="text-emerald-400">{orderId}</span></p>
                <p className="text-gray-300">Time remaining: <span className="text-yellow-400">{formatTime(timeLeft)}</span></p>
            </div>
            
            <div className="animate-pulse">
                <p className="text-gray-400">We're automatically verifying your payment...</p>
            </div>
        </motion.div>
    );
};

const PaymentSuccess = ({ orderId }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 text-center"
        >
            <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />
            <h2 className="text-2xl font-bold text-white mb-4">Payment Successful!</h2>
            <p className="text-gray-300 mb-4">
                Your order has been confirmed and will be processed shortly.
            </p>
            <p className="text-gray-400 mb-6">Order ID: {orderId}</p>
            <Link
                to="/orders"
                className="inline-block bg-emerald-600 text-white py-2 px-6 rounded-lg hover:bg-emerald-700 transition-colors mr-4"
            >
                View Orders
            </Link>
            <Link
                to="/"
                className="inline-block bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
            >
                Continue Shopping
            </Link>
        </motion.div>
    );
};

const PaymentFailed = ({ onRetry }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 text-center"
        >
            <div className="text-red-400 mb-4">
                <svg className="mx-auto" width="64" height="64" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Payment Failed</h2>
            <p className="text-gray-300 mb-6">
                We couldn't verify your payment. Please try again or contact support if the issue persists.
            </p>
            <button
                onClick={onRetry}
                className="bg-emerald-600 text-white py-2 px-6 rounded-lg hover:bg-emerald-700 transition-colors mr-4"
            >
                Try Again
            </button>
            <Link
                to="/cart"
                className="inline-block bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
            >
                Back to Cart
            </Link>
        </motion.div>
    );
};

export default CheckoutPage;