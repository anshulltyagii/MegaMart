import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    MapPin, CreditCard, CheckCircle, AlertCircle, Plus, Check,
    ChevronLeft, Home, Briefcase, Store, Truck, ShieldCheck,
    Package, X, Loader2, AlertTriangle
} from 'lucide-react';
import { cartAPI, addressAPI, orderAPI } from '../services/api';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { couponCode, couponDiscount = 0 } = location.state || {};

    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    
    // ✅ NEW: Error State for UI Message
    const [orderError, setOrderError] = useState(null);

    // New Address Form
    const [newAddress, setNewAddress] = useState({
        fullName: '', phone: '', pincode: '', addressLine1: '',
        addressLine2: '', city: '', state: '', landmark: '', 
        addressType: 'HOME', isDefault: false
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                navigate('/login');
                return;
            }

            const [addressRes, cartRes] = await Promise.all([
                addressAPI.getAll(userId),
                cartAPI.get()
            ]);

            setAddresses(addressRes.data || []);
            
            const cartData = cartRes.data?.data || cartRes.data;
            setCart({
                items: cartData?.items || [],
                total: cartData?.total || 0
            });

            const defaultAddr = addressRes.data?.find(addr => addr.isDefault);
            if (defaultAddr) {
                setSelectedAddress(defaultAddr.id);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            if (error.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const itemsByShop = cart.items.reduce((acc, item) => {
        const shopId = item.shopId || 'unknown';
        if (!acc[shopId]) {
            acc[shopId] = {
                shopName: item.shopName || 'Shop',
                shopId: shopId,
                items: [],
                subtotal: 0
            };
        }
        acc[shopId].items.push(item);
        acc[shopId].subtotal += (item.currentPrice || item.priceAtAdd) * item.quantity;
        return acc;
    }, {});

    const shopCount = Object.keys(itemsByShop).length;
    const subtotal = cart.items.reduce((sum, item) => sum + ((item.currentPrice || item.priceAtAdd) * item.quantity), 0);
    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const total = subtotal - couponDiscount + deliveryFee;

    const validateAddressForm = () => {
        const errors = {};
        if (!newAddress.fullName.trim()) errors.fullName = 'Name is required';
        if (!newAddress.phone.match(/^\d{10}$/)) errors.phone = 'Enter valid 10-digit phone';
        if (!newAddress.pincode.match(/^\d{6}$/)) errors.pincode = 'Enter valid 6-digit pincode';
        if (!newAddress.addressLine1.trim()) errors.addressLine1 = 'Address is required';
        if (!newAddress.city.trim()) errors.city = 'City is required';
        if (!newAddress.state.trim()) errors.state = 'State is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddAddress = async () => {
        if (!validateAddressForm()) return;
        setSavingAddress(true);
        try {
            const userId = localStorage.getItem('userId');
            await addressAPI.create(userId, newAddress);
            await loadData();
            setShowAddressForm(false);
            setNewAddress({
                fullName: '', phone: '', pincode: '', addressLine1: '',
                addressLine2: '', city: '', state: '', landmark: '', 
                addressType: 'HOME', isDefault: false
            });
            setFormErrors({});
        } catch (error) {
            alert('Failed to add address. Please try again.');
        } finally {
            setSavingAddress(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            alert('Please select a delivery address');
            return;
        }

        setPlacingOrder(true);
        setOrderError(null); // Clear previous errors

        try {
            const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
            
            const shippingAddress = [
                selectedAddr.fullName,
                selectedAddr.addressLine1,
                selectedAddr.addressLine2,
                selectedAddr.landmark ? `Landmark: ${selectedAddr.landmark}` : '',
                `${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}`,
                `Phone: ${selectedAddr.phone}`
            ].filter(Boolean).join(', ');

            const orderData = {
                shippingAddress,
                couponCode: couponCode || null
            };

            const response = await orderAPI.checkout(orderData);
            const orders = Array.isArray(response.data) ? response.data : [response.data];

            navigate('/payment', { state: { orders, shippingAddress: selectedAddr } });

        } catch (error) {
            console.error('Error placing order:', error);
            // ✅ FIX: Set error state instead of alerting
            const message = error.response?.data?.message || 'Failed to place order. Please try again.';
            setOrderError(message);
        } finally {
            setPlacingOrder(false);
        }
    };

    const steps = [
        { number: 1, title: 'Delivery Address', icon: MapPin },
        { number: 2, title: 'Review Order', icon: Package },
        { number: 3, title: 'Place Order', icon: CheckCircle }
    ];

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (cart.items.length === 0) return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <Package size={64} className="text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Continue Shopping</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header Steps */}
            <div className="bg-white border-b border-gray-100 py-8">
                <div className="max-w-5xl mx-auto px-4">
                    <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                        <ChevronLeft size={20} /> Back to Cart
                    </button>
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Checkout</h1>
                    <div className="flex items-center justify-between max-w-2xl">
                        {steps.map((step, idx) => (
                            <React.Fragment key={step.number}>
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => step.number < currentStep && setCurrentStep(step.number)}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${currentStep >= step.number ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}>
                                        {currentStep > step.number ? <Check size={20} /> : <step.icon size={20} />}
                                    </div>
                                    <div className="hidden sm:block"><p className={`font-bold ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</p></div>
                                </div>
                                {idx < steps.length - 1 && <div className={`flex-1 h-1 mx-4 rounded ${currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-12">
                
                {/* STEP 1: ADDRESS */}
                {currentStep === 1 && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between mb-8">
                            <h2 className="text-2xl font-bold">Select Delivery Address</h2>
                            <button onClick={() => setShowAddressForm(true)} className="flex items-center gap-2 px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50">
                                <Plus size={18} /> Add New Address
                            </button>
                        </div>

                        {/* Add Address Modal */}
                        {showAddressForm && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                                    <h3 className="text-xl font-bold mb-4">Add New Address</h3>
                                    <div className="space-y-4">
                                        <input placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} className="w-full p-3 border rounded-lg" />
                                        <input placeholder="Phone" maxLength={10} value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="w-full p-3 border rounded-lg" />
                                        <input placeholder="Pincode" maxLength={6} value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} className="w-full p-3 border rounded-lg" />
                                        <input placeholder="Address Line 1" value={newAddress.addressLine1} onChange={e => setNewAddress({...newAddress, addressLine1: e.target.value})} className="w-full p-3 border rounded-lg" />
                                        <input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full p-3 border rounded-lg" />
                                        <input placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full p-3 border rounded-lg" />
                                        <div className="flex gap-4">
                                            <button onClick={() => setNewAddress({...newAddress, addressType: 'HOME'})} className={`flex-1 p-2 border rounded ${newAddress.addressType === 'HOME' ? 'bg-indigo-50 border-indigo-600' : ''}`}>Home</button>
                                            <button onClick={() => setNewAddress({...newAddress, addressType: 'WORK'})} className={`flex-1 p-2 border rounded ${newAddress.addressType === 'WORK' ? 'bg-indigo-50 border-indigo-600' : ''}`}>Work</button>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        <button onClick={() => setShowAddressForm(false)} className="flex-1 p-3 border rounded-lg">Cancel</button>
                                        <button onClick={handleAddAddress} disabled={savingAddress} className="flex-1 p-3 bg-indigo-600 text-white rounded-lg">{savingAddress ? 'Saving...' : 'Save Address'}</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* List Addresses */}
                        <div className="space-y-4">
                            {addresses.map(addr => (
                                <label key={addr.id} className={`block p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddress === addr.id ? 'border-indigo-600 bg-indigo-50' : 'border-transparent bg-white shadow-sm'}`}>
                                    <div className="flex items-start gap-4">
                                        <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-lg">{addr.fullName}</span>
                                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">{addr.addressType}</span>
                                            </div>
                                            <p className="text-gray-600">{addr.addressLine1}, {addr.city} - {addr.pincode}</p>
                                            <p className="text-gray-600">Phone: {addr.phone}</p>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <button onClick={() => setCurrentStep(2)} disabled={!selectedAddress} className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">Continue to Review</button>
                    </div>
                )}

                {/* STEP 2: REVIEW */}
                {currentStep === 2 && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold mb-6">Review Order</h2>
                        <div className="space-y-6 mb-8">
                            {Object.values(itemsByShop).map((shop, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Store size={18} /> {shop.shopName}</h3>
                                    {shop.items.map(item => (
                                        <div key={item.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                                            <div>
                                                <p className="font-medium">{item.productName}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-bold">₹{((item.currentPrice || item.priceAtAdd) * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                            <div className="flex justify-between mb-2"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                            <div className="flex justify-between mb-2 text-green-600"><span>Discount</span><span>-₹{couponDiscount.toLocaleString()}</span></div>
                            <div className="flex justify-between pt-4 border-t font-bold text-xl"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setCurrentStep(1)} className="px-8 py-4 border rounded-xl font-bold">Back</button>
                            <button onClick={() => setCurrentStep(3)} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold">Proceed to Payment</button>
                        </div>
                    </div>
                )}

                {/* STEP 3: PLACE ORDER */}
                {currentStep === 3 && (
                    <div className="animate-fade-in max-w-2xl mx-auto">
                        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={40} className="text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Ready to Place Order</h2>
                            <p className="text-gray-600 mb-8">Total Amount: <span className="font-bold text-gray-900">₹{total.toLocaleString()}</span></p>

                            {/* ✅ ERROR MESSAGE DISPLAY */}
                            {orderError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3 text-left animate-shake">
                                    <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="font-bold">Order Failed</p>
                                        <p className="text-sm">{orderError}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button onClick={() => setCurrentStep(2)} className="px-8 py-4 border rounded-xl font-bold">Back</button>
                                <button onClick={handlePlaceOrder} disabled={placingOrder} className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50">
                                    {placingOrder ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Place Order & Pay</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckoutPage;