// frontend/src/pages/CheckoutPage.jsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores/useCartStore';
import { useSettingsStore } from '../stores/useSettingsStore'
import { ArrowLeft, CheckCircle, Clock, MapPin, Calendar, AlertTriangle, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../lib/axios.js';

const NYERI_LOCATIONS = [
    "Naivas - Nyeri Town (CBD)",
    "Mathai Supermarket - Nyeri Town",
    "Dedan Kimathi Uni (DeKUT) - Gate B",
    "Nyeri National Polytechnic",
    "Skuta - Near 7-Eleven",
    "King'ong'o - Prison Checkpoint",
    "Klassique Court - Classic",
    "Family Bank area", 
    "Kamakwa - Carrymore Supermarket",
    "Kamuyu - Factory",
    "Tetu - Tetu Girls outside the gate",
    "Pestige Plaza",
    "Outspan Plaza",
    "KMTC Nyeri Campus"
];

const CheckoutPage = () => {
    const { cart, total, clearCart } = useCartStore();
    const { settings, fetchSettings, loading: settingsLoading } = useSettingsStore();
    const [orderStatus, setOrderStatus] = useState('form');
    const [orderId, setOrderId] = useState(null);
    const [paymentInstructions, setPaymentInstructions] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const navigate = useNavigate();
    const [pickupLocation, setPickupLocation] = useState('');
    const [pickupDate, setPickupDate] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [dateError, setDateError] = useState('');

    const pollingRef = useRef(false);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const getMaxDate = () => {
        if (!settings) return '';
        const date = new Date();
        date.setDate(date.getDate() + (settings.maxBookingDays || 14));
        return date.toISOString().split('T')[0];
    };

    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setPickupDate(selectedDate);
        setDateError('');

        if (settings?.blockedDates?.includes(selectedDate)) {
            setDateError('Sorry, we are not making deliveries on this specific date. Please choose another.');
        }
    };

    const handlePlaceOrder = async () => {
        try {
            if (!settings.isOpen) return;

            if (!phoneNumber || phoneNumber.trim().length === 0) {
                alert('Please enter your phone number to receive the STK push.');
                return;
            }
            if (!pickupLocation) {
                alert('Please select a pickup location.');
                return;
            }
            if (!pickupDate || !pickupTime) {
                alert('Please select a pickup date and time.');
                return;
            }
            if (dateError || settings?.blockedDates?.includes(pickupDate)) {
                alert('Selected date is unavailable.');
                return;
            }

            setOrderStatus('waiting');

            let normalized = phoneNumber.replace(/\s+/g, '');


            const paymentPayload = {
                products: cart.map(item => ({
                    id: item._id,
                    quantity: item.quantity,
                    price: item.price
                })),
                phone_number: normalized,
                pickupLocation,
                pickupDate,
                pickupTime
            };
               
            const res = await axios.post('/payments/create-checkout-session', paymentPayload);

            const { transactionReference, external_reference, amount, orderId: newOrderId } = res.data;

            if (!newOrderId && !transactionReference) {
                console.error("No order ID or Reference returned from backend");
                setOrderStatus('failed');
                return;
            }

            setOrderId(newOrderId || external_reference);
            setPaymentInstructions({
                phone: normalized,
                amount,
                tillFallback: '6880232'
            });

            if (transactionReference) {
                pollPaymentStatusByTransaction(transactionReference);
            }

        } catch (error) {
            console.error('Error initiating payment:', error);
            setOrderStatus('failed');
        }
    };

  const pollPaymentStatusByTransaction = async ( transactionReference) => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    const maxAttempts = 60;
    let attempts = 0;

    const check = async () => {
        try {
            if(!pollingRef.current) return;

            const res = await axios.post('/payments/checkout-success', {
              transactionReference  
            });

            if(res.data && res.data.success){
                setOrderStatus('success');
                clearCart();
                pollingRef.current = false;
                return;
            }

            if (res.data && res.data.status === "FAILED") {
                setOrderStatus('failed');
                pollingRef.current = false;
                return;
            }

            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(check, 5000);
            } else {
                setOrderStatus('failed');
                pollingRef.current = false;
            }
        } catch (error) {
            console.log("Polling error (retrying):", error.message);
            attempts++;
            if(attempts < maxAttempts) {
                setTimeout(check, 5000);
            } else {
                setOrderStatus('failed');
                pollingRef.current = false;
            }
        }
    };

    check();
  }

  useEffect(() => {
    return () => {
        pollingRef.current = false;
    };
  }, []);

  const isCartEmpty = cart.length === 0;

  if (settingsLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div></div>;
  }

  if (settings && !settings.isOpen) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-lg max-w-md text-center border-gray-700">
                <Lock className="mx-auto mb-4 text-gray-400" size={64} />
                <h2 className="text-2xl font-bold text-white mb-2">Store Temporarily Closed</h2>
                <p className="text-gray-400 mb-6">{settings.closedmessage}</p>
                <Link to="/" className="text-emerald-400 hover:text-emerald-300">Browse Catalog</Link>
            </div>
        </div>
    );
  }

  if (isCartEmpty && orderStatus === 'form') {
    return(
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
                <Link to="/" className="text-emerald-400 hover:text-emerald-300">
                    Continue Shopping
                </Link>
            </div>
        </div>
    )
  }

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    {!['success', 'waiting'].includes(orderStatus) && (
                        <Link to="/cart" className="flex items-center text-emerald-400 hover:text-emerald-300 mb-4">
                            <ArrowLeft className="mr-2" size={20} />
                            Back to Cart
                        </Link>
                    )}
                    <h1 className="text-3xl font-bold text-white">Checkout</h1>
                </div>

                {orderStatus === 'form' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800 rounded-lg p-6 h-fit">
                            <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>
                            <div className="space-y-4 mb-6">
                                {cart.map((item) => (
                                    <div key={item._id} className="flex justify-between items-center py-2 border-b border-gray-700">
                                        <div><h3 className="text-white">{item.name}</h3><p className="text-gray-400 text-sm">Qty: {item.quantity}</p></div>
                                        <p className="text-emerald-400 font-semibold">KSh {(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-700 pt-4">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span className="text-white">Total:</span><span className="text-emerald-400">KSh {total.toFixed(2)}</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-white mb-6">Pickup & Payment</h2>
                            <div className="mb-4">
                                <label className="block text-sm text-gray-300 mb-2 flex items-center"><MapPin size={16} className="mr-2 text-emerald-400" />Select Pickup Location (Nyeri)</label>
                                <select value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-emerald-500">
                                    <option value="">-- Choose a location --</option>
                                    {NYERI_LOCATIONS.map((loc, idx) => <option key={idx} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2 flex items-center"><Calendar size={16} className="mr-2 text-emerald-400" />Date</label>
                                    <input type="date" min={new Date().toISOString().split('T')[0]} max={getMaxDate()} value={pickupDate} onChange={handleDateChange} className={`w-full p-3 rounded bg-gray-900 border text-white focus:outline-none focus:border-emerald-500 ${dateError ? 'border-red-500' : 'border-gray-700'}`} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2 flex items-center"><Clock size={16} className="mr-2 text-emerald-400" />Time</label>
                                    <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-emerald-500">
                                        <option value="">-- Time --</option>
                                        {settings?.pickupTimes?.map((time, idx) => <option key={idx} value={time}>{time}</option>)}
                                    </select>
                                </div>
                            </div>
                            {dateError && <div className="mb-4 flex items-start text-red-400 text-sm"><AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" /><span>{dateError}</span></div>}
                            <div className="border-t border-gray-700 my-6"></div>
                            <div className="mb-6">
                                <label className="block text-sm text-gray-300 mb-2">M-Pesa Phone Number</label>
                                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="07XXXXXXXX" className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-emerald-500" />
                                <p className="text-xs text-gray-400 mt-2">You will receive an STK push on this number.</p>
                            </div>
                            <motion.button onClick={handlePlaceOrder} disabled={!!dateError} className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${dateError ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`} whileHover={!dateError ? { scale: 1.02 } : {}} whileTap={!dateError ? { scale: 0.98 } : {}}>Confirm Pickup & Pay</motion.button>
                        </motion.div>
                    </div>
                )}

                {orderStatus === 'waiting' && <PaymentWaiting paymentInstructions={paymentInstructions} orderId={orderId} total={total} />}
                {orderStatus === 'success' && <PaymentSuccess orderId={orderId} pickupLocation={pickupLocation} pickupDate={pickupDate} pickupTime={pickupTime} />}
                {orderStatus === 'failed' && <PaymentFailed onRetry={() => setOrderStatus('form')} />}
            </div>
        </div>
    );
};

// const CheckoutForm = ({ cart, total, onPlaceOrder, phoneNumber, setPhoneNumber, pickupLocation, setPickupLocation, pickupDate, setPickupDate, pickupTime, setPickupTime }) => {
//     return (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {/* Left Column: Order Details */}
//             <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 className="bg-gray-800 rounded-lg p-6 h-fit"
//             >
//                 <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>
//                 <div className="space-y-4 mb-6">
//                     {cart.map((item) => (
//                         <div key={item._id} className="flex justify-between items-center py-2 border-b border-gray-700">
//                             <div>
//                                 <h3 className="text-white">{item.name}</h3>
//                                 <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
//                             </div>
//                             <p className="text-emerald-400 font-semibold">
//                                 KSh {(item.price * item.quantity).toFixed(2)}
//                             </p>
//                         </div>
//                     ))}
//                 </div>
//                 <div className="border-t border-gray-700 pt-4">
//                     <div className="flex justify-between items-center text-lg font-bold">
//                         <span className="text-white">Total:</span>
//                         <span className="text-emerald-400">KSh {total.toFixed(2)}</span>
//                     </div>
//                 </div>
//             </motion.div>

//             {/* Right Column: Pickup & Payment Details */}
//             <motion.div
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 className="bg-gray-800 rounded-lg p-6"
//             >
//                 <h2 className="text-xl font-semibold text-white mb-6">Pickup & Payment</h2>

//                 {/* Pickup Location */}
//                 <div className="mb-4">
//                     <label className="block text-sm text-gray-300 mb-2 flex items-center">
//                         <MapPin size={16} className="mr-2 text-emerald-400" />
//                         Select Pickup Location (Nyeri)
//                     </label>
//                     <select
//                         value={pickupLocation}
//                         onChange={(e) => setPickupLocation(e.target.value)}
//                         className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-emerald-500"
//                     >
//                         <option value="">-- Choose a location --</option>
//                         {NYERI_LOCATIONS.map((loc, idx) => (
//                             <option key={idx} value={loc}>{loc}</option>
//                         ))}
//                     </select>
//                 </div>

//                 {/* Date & Time Row */}
//                 <div className="grid grid-cols-2 gap-4 mb-6">
//                     <div>
//                         <label className="block text-sm text-gray-300 mb-2 flex items-center">
//                             <Calendar size={16} className="mr-2 text-emerald-400" />
//                             Date
//                         </label>
//                         <input
//                             type="date"
//                             min={new Date().toISOString().split('T')[0]}
//                             value={pickupDate}
//                             onChange={(e) => setPickupDate(e.target.value)}
//                             className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-emerald-500"
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-sm text-gray-300 mb-2 flex items-center">
//                             <Clock size={16} className="mr-2 text-emerald-400" />
//                             Time
//                         </label>
//                         <select
//                             value={pickupTime}
//                             onChange={(e) => setPickupTime(e.target.value)}
//                             className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-emerald-500"
//                         >
//                             <option value="">-- Time --</option>
//                             {AVAILABLE_PICKUP_TIMES.map((time, idx) => (
//                                 <option key={idx} value={time}>{time}</option>
//                             ))}
//                         </select>
//                         <p className="text-xs text-gray-500 mt-1">Available slots only</p>
//                     </div>
//                 </div>

//                 <div className="border-t border-gray-700 my-6"></div>

//                 {/* Phone Number */}
//                 <div className="mb-6">
//                     <label className="block text-sm text-gray-300 mb-2">M-Pesa Phone Number</label>
//                     <input
//                         type="tel"
//                         value={phoneNumber}
//                         onChange={(e) => setPhoneNumber(e.target.value)}
//                         placeholder="07XXXXXXXX"
//                         className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-emerald-500"
//                     />
//                     <p className="text-xs text-gray-400 mt-2">
//                         You will receive an STK push on this number.
//                     </p>
//                 </div>

//                 <motion.button
//                     onClick={onPlaceOrder}
//                     className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                 >
//                     Confirm Pickup & Pay
//                 </motion.button>
//             </motion.div>
//         </div>
//     );
// }

const PaymentWaiting = ({ paymentInstructions, orderId, total }) => {
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

    useEffect(() => {
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

    const till = paymentInstructions?.tillFallback || '6880232';
    const phone = paymentInstructions?.phone || '—';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 text-center"
        >
            <Clock className="mx-auto mb-4 text-yellow-400" size={48} />
            <h2 className="text-2xl font-bold text-white mb-4">Waiting for Payment</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-yellow-800 mb-2">Payment Instructions (automatic STK push)</h3>
                <div className="text-yellow-700 space-y-2">
                    <p>A push will be sent to: <strong>{phone}</strong></p>
                    <p>Enter your M-Pesa PIN to complete payment of <strong>KSh {total.toFixed(2)}</strong></p>
                    <p>If you don't receive the STK push, you may pay to our Till Number:</p>
                    <p className="text-yellow-900 font-bold text-lg">Till: {till}</p>
                    <div className="text-left ml-8">
                        <p>1. Open M-Pesa on your phone</p>
                        <p>2. Select "Lipa na M-Pesa"</p>
                        <p>3. Select "Enter Till Number"</p>
                        <p>4. Enter Till: <strong>{till}</strong></p>
                        <p>5. Enter Amount: <strong>KSh {total.toFixed(2)}</strong></p>
                        <p>6. Enter your M-Pesa PIN and confirm</p>
                    </div>
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