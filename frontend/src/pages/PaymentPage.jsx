import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    CreditCard, Smartphone, Building2, Wallet, Check, X, Lock, 
    ArrowLeft, RefreshCw, CheckCircle2, Store, ShieldCheck, 
    Loader2, AlertTriangle, ChevronRight, Banknote, Package 
} from 'lucide-react';
import { paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { refreshCartCount } = useAuth();
    const { orders = [], shippingAddress } = location.state || {};
    
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [paymentStatus, setPaymentStatus] = useState('idle');
    const [completedOrders, setCompletedOrders] = useState([]);
    
    // Inputs
    const [upiId, setUpiId] = useState('');
    const [selectedUpiApp, setSelectedUpiApp] = useState(null);
    const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [selectedBank, setSelectedBank] = useState(null);
    
    // Simulation State
    const [processingStep, setProcessingStep] = useState("");
    
    const currentOrder = orders[currentOrderIndex];
    const totalOrders = orders.length;

    useEffect(() => {
        if (!orders || orders.length === 0) navigate('/orders');
    }, [orders, navigate]);

    // Validation Helpers
    const formatCardNumber = (value) => {
        const cleaned = value.replace(/\D/g, '');
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ').substr(0, 19) : '';
    };

    const formatExpiry = (value) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2);
        return cleaned;
    };

    const validatePayment = () => {
        if (paymentMethod === 'COD') return true; // COD needs no validation
        
        if (paymentMethod === 'UPI' && !selectedUpiApp && !upiId.includes('@')) {
            alert('Please select a UPI app or enter a valid UPI ID'); 
            return false;
        }
        if (paymentMethod === 'CARD') {
            if (cardDetails.number.replace(/\s/g, '').length !== 16) { alert('Enter valid 16-digit card number'); return false; }
            if (!cardDetails.name.trim()) { alert('Enter cardholder name'); return false; }
            if (cardDetails.cvv.length < 3) { alert('Enter valid CVV'); return false; }
        }
        if (paymentMethod === 'NET_BANKING' && !selectedBank) {
            alert('Please select a bank'); return false;
        }
        return true;
    };

    // ════════════════════════════════════════════════════════════════════════
    // REALISTIC SIMULATION LOGIC
    // ════════════════════════════════════════════════════════════════════════

    const simulateProcessing = async () => {
        const steps = paymentMethod === 'COD' 
            ? [
                { msg: "Confirming Order Details...", delay: 800 },
                { msg: "Checking Inventory...", delay: 800 },
                { msg: "Placing Order...", delay: 800 }
              ]
            : [
                { msg: "Contacting Bank Server...", delay: 1500 },
                { msg: "Verifying Payment Details...", delay: 1500 },
                { msg: "Requesting Authorization...", delay: 2000 },
                { msg: "Processing Transaction...", delay: 1000 },
              ];

        for (const step of steps) {
            setProcessingStep(step.msg);
            await new Promise(r => setTimeout(r, step.delay));
        }
    };

    const processPayment = async () => {
        if (!validatePayment()) return;
        
        setPaymentStatus('processing');
        
        // 1. Run Visual Simulation
        await simulateProcessing();

        try {
            setProcessingStep("Finalizing Order...");
            
            const paymentRequest = {
                orderId: currentOrder.orderId || currentOrder.id,
                amount: currentOrder.totalAmount,
                method: paymentMethod,
                txnReference: paymentMethod === 'COD' 
                    ? `COD-${Date.now()}` 
                    : `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`
            };

            const response = await paymentAPI.process(paymentRequest);

            if (response.data?.status === 'SUCCESS' || response.data?.paymentStatus === 'PAID' || response.data?.status === 'PENDING') {
                setPaymentStatus('success');
                setCompletedOrders(prev => [...prev, currentOrder]);
                
                await refreshCartCount();

                setTimeout(() => {
                    if (currentOrderIndex < totalOrders - 1) {
                        setCurrentOrderIndex(prev => prev + 1);
                        setPaymentStatus('idle');
                        setUpiId('');
                        setSelectedUpiApp(null);
                        setCardDetails({ number: '', name: '', expiry: '', cvv: '' });
                    }
                }, 2500);
            } else {
                throw new Error('Payment/Order processing failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setPaymentStatus('failed');
        }
    };

    const retryPayment = () => {
        setPaymentStatus('idle');
    };

    // ════════════════════════════════════════════════════════════════════════
    // MODAL: PROCESSING
    // ════════════════════════════════════════════════════════════════════════
    if (paymentStatus === 'processing') {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse"></div>
                    <div className="mb-8 relative inline-block">
                        <div className="w-24 h-24 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {paymentMethod === 'COD' ? <Package size={24} className="text-indigo-600"/> : <Lock size={24} className="text-indigo-600" />}
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {paymentMethod === 'COD' ? 'Placing Order' : 'Processing Payment'}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">Please do not close this window.</p>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-center gap-3">
                        <Loader2 size={18} className="text-indigo-600 animate-spin" />
                        <span className="font-medium text-gray-700">{processingStep}</span>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODAL: FAILED
    // ════════════════════════════════════════════════════════════════════════
    if (paymentStatus === 'failed') {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <X size={40} className="text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Transaction Failed</h3>
                    <p className="text-gray-500 mb-8">
                        Something went wrong while processing your request. Please try again.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/orders')} className="flex-1 py-3 border rounded-xl font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button onClick={retryPayment} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200">Try Again</button>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // SUCCESS VIEW
    // ════════════════════════════════════════════════════════════════════════
    if (completedOrders.length === totalOrders) {
        // ✅ Check if COD was used
        const isCOD = paymentMethod === 'COD';

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center animate-fade-in">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} className="text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
                    <p className="text-gray-500 mb-8">
                        {isCOD 
                            ? "Your order is confirmed. Please pay at the time of delivery."
                            : "Your order has been placed successfully. You will receive a confirmation email shortly."
                        }
                    </p>
                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                        {/* ✅ DYNAMIC LABEL */}
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                            {isCOD ? "Total Payable on Delivery" : "Total Paid"}
                        </p>
                        <p className="text-4xl font-bold text-gray-900 mt-2">
                            ₹{completedOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/orders')} 
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        View My Orders
                    </button>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // MAIN PAYMENT FORM
    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-4 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black transition">
                        <ArrowLeft size={20} /> <span className="font-medium">Cancel</span>
                    </button>
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                        <Lock size={14} className="text-green-700" />
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Secure Checkout</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Left: Payment Methods */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Multi-Order Progress */}
                        {totalOrders > 1 && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="font-bold text-gray-900">Payment {currentOrderIndex + 1} of {totalOrders}</p>
                                    <p className="text-xs text-gray-500">Processing individual shop orders</p>
                                </div>
                                <div className="flex gap-1.5">
                                    {orders.map((_, idx) => (
                                        <div key={idx} className={`w-2.5 h-2.5 rounded-full transition-all ${
                                            completedOrders.some(o => o.id === orders[idx].id) ? 'bg-green-500' :
                                            idx === currentOrderIndex ? 'bg-indigo-600 w-6' : 'bg-gray-200'
                                        }`} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <h2 className="text-lg font-bold p-6 border-b border-gray-100 bg-gray-50/50 text-gray-800">Payment Method</h2>
                            
                            <div className="flex flex-col md:flex-row">
                                {/* Sidebar Tabs */}
                                <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
                                    {[
                                        { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                                        { id: 'CARD', label: 'Cards', icon: CreditCard },
                                        { id: 'NET_BANKING', label: 'Net Banking', icon: Building2 },
                                        { id: 'WALLET', label: 'Wallets', icon: Wallet },
                                        { id: 'COD', label: 'Cash on Delivery', icon: Banknote },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setPaymentMethod(m.id)}
                                            className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all relative ${
                                                paymentMethod === m.id 
                                                    ? 'bg-white text-indigo-600 font-bold shadow-[inset_3px_0_0_0_#4f46e5]' 
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <m.icon size={20} className={paymentMethod === m.id ? "text-indigo-600" : "text-gray-400"} />
                                            {m.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Content Area */}
                                <div className="md:w-2/3 p-8 min-h-[400px]">
                                    {paymentMethod === 'UPI' && (
                                        <div className="space-y-6 animate-fade-in">
                                            <p className="text-sm font-medium text-gray-700">Select UPI App</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                                                    <button 
                                                        key={app}
                                                        onClick={() => { setSelectedUpiApp(app); setUpiId(`${app.toLowerCase()}@upi`); }}
                                                        className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all hover:shadow-md ${
                                                            selectedUpiApp === app 
                                                                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-600' 
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <Smartphone size={24} className={selectedUpiApp === app ? "text-indigo-600" : "text-gray-400"} />
                                                        <span className="text-sm font-medium">{app}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                                                <div className="relative flex justify-center text-xs uppercase font-bold text-gray-400 tracking-wider"><span className="px-2 bg-white">Or pay via ID</span></div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">UPI ID</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="username@bank" 
                                                    value={upiId}
                                                    onChange={(e) => { setUpiId(e.target.value); setSelectedUpiApp(null); }}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                                />
                                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                                    <ShieldCheck size={12} /> Verified Merchant
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'CARD' && (
                                        <div className="space-y-5 animate-fade-in">
                                            {/* Virtual Card Preview */}
                                            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white shadow-xl mb-6 relative overflow-hidden group">
                                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                                                
                                                <div className="flex justify-between items-start mb-8 relative z-10">
                                                    <CreditCard size={32} className="text-white/80" />
                                                    <span className="text-xs font-bold tracking-widest text-white/40">PREMIUM</span>
                                                </div>
                                                <p className="font-mono text-xl tracking-widest mb-6 relative z-10">
                                                    {cardDetails.number || '0000 0000 0000 0000'}
                                                </p>
                                                <div className="flex justify-between items-end relative z-10">
                                                    <div>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Card Holder</p>
                                                        <p className="text-sm font-medium tracking-wide uppercase">{cardDetails.name || 'YOUR NAME'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Expires</p>
                                                        <p className="text-sm font-medium tracking-wide">{cardDetails.expiry || 'MM/YY'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <input 
                                                    type="text" placeholder="Card Number" maxLength={19}
                                                    value={cardDetails.number}
                                                    onChange={(e) => setCardDetails({...cardDetails, number: formatCardNumber(e.target.value)})}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono transition-all"
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input 
                                                        type="text" placeholder="MM / YY" maxLength={5}
                                                        value={cardDetails.expiry}
                                                        onChange={(e) => setCardDetails({...cardDetails, expiry: formatExpiry(e.target.value)})}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-center"
                                                    />
                                                    <div className="relative">
                                                        <input 
                                                            type="password" placeholder="CVV" maxLength={3}
                                                            value={cardDetails.cvv}
                                                            onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g,'')})}
                                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-center"
                                                        />
                                                        <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    </div>
                                                </div>
                                                <input 
                                                    type="text" placeholder="Cardholder Name" 
                                                    value={cardDetails.name}
                                                    onChange={(e) => setCardDetails({...cardDetails, name: e.target.value.toUpperCase()})}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all uppercase"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'NET_BANKING' && (
                                        <div className="space-y-4 animate-fade-in">
                                            <p className="text-sm font-medium text-gray-700">Popular Banks</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'].map(bank => (
                                                    <button 
                                                        key={bank}
                                                        onClick={() => setSelectedBank(bank)}
                                                        className={`p-4 border rounded-xl text-left transition-all ${
                                                            selectedBank === bank 
                                                                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-600' 
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <Building2 size={20} className="mb-2 text-gray-400" />
                                                        <span className="text-sm font-bold block">{bank}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'WALLET' && (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-10 animate-fade-in">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Wallet size={32} className="text-gray-400" />
                                            </div>
                                            <h3 className="font-bold text-gray-900">No Wallets Linked</h3>
                                            <p className="text-sm text-gray-500 mt-1">Please add a wallet to continue</p>
                                        </div>
                                    )}

                                    {/* ✅ NEW COD SECTION */}
                                    {paymentMethod === 'COD' && (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-6 animate-fade-in">
                                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                                <Banknote size={40} className="text-green-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">Cash on Delivery</h3>
                                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                                                Pay securely with cash or UPI when your order is delivered to your doorstep.
                                            </p>
                                            <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm border border-yellow-200 max-w-sm">
                                                <p className="font-bold">⚠️ Important</p>
                                                You cannot use coupons or wallet balance with COD orders.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg shadow-indigo-100 border border-indigo-50 p-6 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Store size={18} className="text-indigo-600" />
                                Order Summary
                            </h3>
                            
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                                <span className="text-gray-500 text-sm">Order ID</span>
                                <span className="font-mono font-medium text-gray-900 text-sm">#{currentOrder.orderNumber}</span>
                            </div>

                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Total Amount</span>
                                <span className="font-bold text-2xl text-gray-900">₹{currentOrder.totalAmount?.toLocaleString()}</span>
                            </div>

                            <div className="bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg mt-2 mb-6 flex items-center gap-2">
                                <CheckCircle2 size={14} />
                                No hidden charges. Taxes included.
                            </div>

                            <button 
                                onClick={processPayment}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 active:translate-y-0 flex items-center justify-center gap-2 group"
                            >
                                {/* ✅ BUTTON TEXT CHANGES FOR COD */}
                                {paymentMethod === 'COD' ? 'Place Order' : 'Pay Now'}
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <div className="mt-6 flex justify-center gap-4 opacity-40 grayscale">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-5" alt="Visa" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5" alt="Mastercard" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-5" alt="PayPal" />
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                                    <ShieldCheck size={12} />
                                    Payments are 100% secure and encrypted
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;