import React, { useState } from 'react';
import { Tag, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartSummary = ({ cart, onApplyCoupon }) => {
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState('');
    const navigate = useNavigate();

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponMessage('Please enter a coupon code');
            return;
        }

        const result = await onApplyCoupon(couponCode);
        if (result.success) {
            setCouponMessage('✓ Coupon applied successfully!');
            setCouponCode('');
        } else {
            setCouponMessage(result.message || 'Invalid coupon code');
        }

        setTimeout(() => setCouponMessage(''), 3000);
    };

    const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const subtotal = cart?.total || 0;
    const discount = cart?.discount || 0;
    const deliveryFee = subtotal > 500 ? 0 : 40; // Free delivery above ₹500
    const finalTotal = subtotal - discount + deliveryFee;

    return (
        <div className="bg-white rounded-lg shadow-card p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b">
                PRICE DETAILS ({totalItems} {totalItems === 1 ? 'Item' : 'Items'})
            </h2>

            {/* Coupon Section */}
            <div className="mb-4 p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <Tag size={18} className="text-green-600" />
                    <span className="font-semibold text-gray-700">Apply Coupon</span>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                    />
                    <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-gray-100 text-primary font-semibold rounded hover:bg-gray-200 transition-base"
                    >
                        Apply
                    </button>
                </div>
                {couponMessage && (
                    <p className={`mt-2 text-sm ${couponMessage.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>
                        {couponMessage}
                    </p>
                )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-700">
                    <span>Total MRP</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                        <span>Coupon Discount</span>
                        <span>-₹{discount.toFixed(2)}</span>
                    </div>
                )}

                <div className="flex justify-between text-gray-700">
                    <span>Delivery Fee</span>
                    {deliveryFee === 0 ? (
                        <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                        <span>₹{deliveryFee}</span>
                    )}
                </div>

                {subtotal > 0 && subtotal < 500 && (
                    <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                        Add items worth ₹{(500 - subtotal).toFixed(2)} more to get FREE delivery
                    </p>
                )}
            </div>

            {/* Total Amount */}
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200 mb-6">
                <span className="text-lg font-bold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">₹{finalTotal.toFixed(2)}</span>
            </div>

            {/* Checkout Button */}
            <button
                onClick={() => navigate('/checkout')}
                disabled={!cart?.items || cart.items.length === 0}
                className="w-full bg-primary text-white font-bold py-4 rounded-lg hover:bg-pink-600 transition-base disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                PROCEED TO CHECKOUT
                <ChevronRight size={20} />
            </button>

            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>100% Secure Payments</span>
            </div>
        </div>
    );
};

export default CartSummary;