import { motion } from "framer-motion"
import { MoveRight } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios.js";
import {Link} from "react-router-dom";

const OrderSummary = () => {
    const {total, subtotal, coupon, isCouponApplied} = useCartStore();
    const savings = subtotal - total;
    const formattedSubTotal = subtotal.toFixed(2);
    const formattedTotal = total.toFixed(2);
    const formattedSavings = savings.toFixed(2);

    const handlePayment = async () => {
        const stripe = await stripePromise;
        const res = await axios.post('/payment/create-checkout-session', {products: cart,
        CouponCode: coupon ? coupon.code: null
        });
        
        const session = res.data;
        const result = await stripe.redirectToCheckout({sessionId: session.id});

        if(result.error){
            console.log(result.error.message);
        }
    }

  return <motion.div 
  className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'
  initial={{opacity: 0, y: 20}}
  animate={{opacity: 1, y: 0}}
  transition={{duration: 0.5}}
  >
    <p className="text-xl font-semibold text-emerald-400">Order Summary</p>

    <div className="space-y-4">
        <div className="space-y-2">
            <dl className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Original Price</dt>,
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
                <dd className="text-base font-medium text-emerald-400">{coupon.discountPercentage}</dd>
            </dl>
            )}   
        </div>

        <motion.button 
        className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white  hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 "
        whileHover={{scale: 1.05}}
        whileTap={{scale: 0.95}}
        >
          Proceed to  Checkout
        </motion.button>

        <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-normal text-gray-400">or</span>
            <Link to={'/'} className="inline-flex items-center gap-2 text-sm  font-medium text-emerald-400 hover:text-emerald-300 underline hover:no-underline">
                Continue Shopping
                <MoveRight size={16} />
            </Link>
        </div>
    </div>
  </motion.div>
}

export default OrderSummary
