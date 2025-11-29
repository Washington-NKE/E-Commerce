// frontend/src/pages/OrdersPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../lib/axios.js';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('/orders/user-orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="text-yellow-400" size={20} />;
            case 'paid':
                return <CheckCircle className="text-green-400" size={20} />;
            case 'failed':
                return <XCircle className="text-red-400" size={20} />;
            case 'cancelled':
                return <XCircle className="text-gray-400" size={20} />;
            default:
                return <Package className="text-gray-400" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'text-yellow-400 bg-yellow-400/10';
            case 'paid':
                return 'text-green-400 bg-green-400/10';
            case 'failed':
                return 'text-red-400 bg-red-400/10';
            case 'cancelled':
                return 'text-gray-400 bg-gray-400/10';
            default:
                return 'text-gray-400 bg-gray-400/10';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Error Loading Orders</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={fetchOrders}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-8">
                    <Link to="/" className="flex items-center text-emerald-400 hover:text-emerald-300 mb-4">
                        <ArrowLeft className="mr-2" size={20} />
                        Back to Shop
                    </Link>
                    <h1 className="text-3xl font-bold text-white">My Orders</h1>
                    <p className="text-gray-400 mt-2">Track your orders and payment status</p>
                </div>

                {orders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800 rounded-lg p-8 text-center"
                    >
                        <Package className="mx-auto mb-4 text-gray-400" size={64} />
                        <h2 className="text-xl font-semibold text-white mb-2">No Orders Yet</h2>
                        <p className="text-gray-400 mb-6">You haven't placed any orders yet.</p>
                        <Link
                            to="/"
                            className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            Start Shopping
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                                    <div className="flex items-center space-x-3 mb-4 lg:mb-0">
                                        {getStatusIcon(order.status)}
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">
                                                Order #{order.orderId}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                Placed on: {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-400">Total</p>
                                            <p className="text-lg font-semibold text-emerald-400">
                                                KSh {order.totalAmount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* PICKUP DETAILS SECTION */}
                                {order.pickupLocation && (
                                    <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                        <h4 className="text-emerald-400 font-semibold mb-3 flex items-center">
                                            <Package size={18} className="mr-2" />
                                            Pickup Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-start">
                                                <MapPin className="text-gray-400 mt-1 mr-2" size={16} />
                                                <div>
                                                    <p className="text-sm text-gray-400">Location</p>
                                                    <p className="text-white font-medium">{order.pickupLocation}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <Calendar className="text-gray-400 mt-1 mr-2" size={16} />
                                                <div>
                                                    <p className="text-sm text-gray-400">Date & Time</p>
                                                    <p className="text-white font-medium">
                                                        {order.pickupDate} at {order.pickupTime}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {order.mpesaTransactionId && (
                                    <div className="mb-4 p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
                                        <p className="text-green-400 text-sm">
                                            <strong>M-Pesa Transaction ID:</strong> {order.mpesaTransactionId}
                                        </p>
                                        {order.customerPhone && (
                                            <p className="text-green-400 text-sm">
                                                <strong>Paid by:</strong> {order.customerName} ({order.customerPhone})
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-300">Items Ordered:</h4>
                                    {order.products.map((item, itemIndex) => (
                                        <div key={itemIndex} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                                            <div className="flex items-center space-x-3">
                                                {item.product && item.product.image ? (
                                                    <img
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        className="w-12 h-12 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                     <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                                                        <Package size={20} className="text-gray-500"/>
                                                     </div>
                                                )}
                                                <div>
                                                    <h5 className="text-white font-medium">{item.product ? item.product.name : 'Unknown Product'}</h5>
                                                    <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="text-emerald-400 font-medium">
                                                KSh {(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {order.status === 'pending' && (
                                    <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                                        <p className="text-yellow-400 text-sm">
                                            <strong>Payment Pending:</strong> Please complete your M-Pesa payment.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;