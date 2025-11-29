import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Eye, CheckCircle, XCircle, Clock, Truck, Calendar } from "lucide-react";
import { useOrderStore } from "../stores/useOrderStore";

const OrdersTab = () => {
    const { orders, fetchAllOrders, updateOrderStatus, loading } = useOrderStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        fetchAllOrders();
    }, [fetchAllOrders]);

    const handleStatusChange = async (orderId, newStatus) => {
        await updateOrderStatus(orderId, newStatus);
    };

    const filteredOrders = orders.filter((order) => {
        const matchesSearch = 
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="text-white text-center py-10">Loading orders...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-6xl mx-auto border border-gray-700"
        >
            {/* Header / Filters */}
            <div className="p-6 border-b border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-white">Order Management</h2>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="w-5 h-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search Order ID or Customer..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-700 text-gray-100 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Order Info</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Pickup / Delivery</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredOrders.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-white">#{order.orderId.substring(0, 8)}...</div>
                                    <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                    <div className="text-xs text-emerald-400 mt-1">
                                        {order.products.length} items
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4">
                                    <div className="text-sm text-white">{order.user?.name || "Unknown"}</div>
                                    <div className="text-xs text-gray-500">{order.user?.email}</div>
                                    {order.customerPhone && <div className="text-xs text-gray-400">{order.customerPhone}</div>}
                                </td>

                                <td className="px-6 py-4">
                                    {order.pickupLocation ? (
                                        <div className="text-sm">
                                            <div className="flex items-center text-white mb-1">
                                                <Truck size={14} className="mr-1 text-emerald-400"/> {order.pickupLocation}
                                            </div>
                                            <div className="flex items-center text-gray-400 text-xs">
                                                <Calendar size={12} className="mr-1"/> 
                                                {order.pickupDate} @ {order.pickupTime}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-500">Standard Shipping</span>
                                    )}
                                </td>

                                <td className="px-6 py-4 font-medium text-white">
                                    KSh {order.totalAmount.toLocaleString()}
                                </td>

                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          order.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                                          'bg-red-100 text-red-800'}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                    {order.mpesaTransactionId && (
                                        <div className="text-[10px] text-gray-500 mt-1">{order.mpesaTransactionId}</div>
                                    )}
                                </td>

                                <td className="px-6 py-4">
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                        className="bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded p-1 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredOrders.length === 0 && (
                    <div className="text-center py-10 text-gray-500">No orders found matching your filters.</div>
                )}
            </div>
        </motion.div>
    );
};

export default OrdersTab;