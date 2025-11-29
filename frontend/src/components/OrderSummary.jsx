// frontend/src/components/OrderSummary.jsx (Updated)
import { motion } from "framer-motion"
import { MoveRight } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";

const OrderSummary = () => {
    let { total, subtotal, coupon, isCouponApplied } = useCartStore();
    console.log("Results of useCartStore", useCartStore());
    console.log("Total is:", total);
    console.log("Subtotal is:", subtotal);
    subtotal = Number(subtotal) || 0;
    total = Number(total) || 0;
    const savings = subtotal - total;
    const formattedSubTotal = subtotal.toFixed(2);
    const formattedTotal = total.toFixed(2);
    const formattedSavings = savings.toFixed(2);

    return (
        <motion.div
            className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <p className="text-xl font-semibold text-emerald-400">Order Summary</p>

            <div className="space-y-4">
                <div className="space-y-2">
                    <dl className="flex items-center justify-between gap-4">
                        <dt className="text-gray-400">Original Price</dt>
                        <dd className="text-emerald-400">KSh {formattedSubTotal}</dd>
                    </dl>

                    {savings > 0 && (
                        <dl className="flex items-center justify-between gap-4">
                            <dt className="text-gray-400">Savings</dt>
                            <dd className="text-emerald-400">-KSh {formattedSavings}</dd>
                        </dl>
                    )}

                    {coupon && isCouponApplied && (
                        <dl className="flex items-center justify-between gap-4">
                            <dt className="text-base font-normal text-gray-300">Coupon ({coupon.code})</dt>
                            <dd className="text-base font-medium text-emerald-400">{coupon.discountPercentage}%</dd>
                        </dl>
                    )}

                    <div className="border-t border-gray-600 pt-2">
                        <dl className="flex items-center justify-between gap-4">
                            <dt className="text-base font-semibold text-white">Total</dt>
                            <dd className="text-base font-semibold text-emerald-400">KSh {formattedTotal}</dd>
                        </dl>
                    </div>
                </div>

                <Link to={'/checkout'} className="block">
                    <motion.button
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Proceed to Checkout
                    </motion.button>
                </Link>

                <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-normal text-gray-400">or</span>
                    <Link to={'/'} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 underline hover:no-underline">
                        Continue Shopping
                        <MoveRight size={16} />
                    </Link>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">M-Pesa Payment</h3>
                            <div className="mt-1 text-sm text-blue-700">
                                <p>Pay securely using M-Pesa Lipa na M-Pesa</p>
                                <p className="font-semibold">Pochi la Biashara: 0713440774</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default OrderSummary;