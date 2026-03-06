import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
    const handleQuantityChange = (delta) => {
        const newQty = item.quantity + delta;
        if (newQty >= 1 && newQty <= 10) {
            onUpdateQuantity(item.id, newQty);
        }
    };

    return (
        <div className="flex gap-4 p-4 bg-white border-b border-gray-200 hover:shadow-md transition-shadow">
            {/* Product Image */}
            <div className="flex-shrink-0 w-28 h-36 bg-gray-100 rounded overflow-hidden">
                <img 
                    src={item.imagePath || 'https://via.placeholder.com/150'} 
                    alt={item.productName}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Product Details */}
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-800 text-base">
                            {item.productName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Sold by: <span className="font-medium">{item.shopName}</span>
                        </p>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                        onClick={() => onRemove(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Remove item"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">
                        ₹{item.currentPrice}
                    </span>
                    {item.priceAtAdd > item.currentPrice && (
                        <>
                            <span className="text-sm text-gray-400 line-through">
                                ₹{item.priceAtAdd}
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                                ({Math.round(((item.priceAtAdd - item.currentPrice) / item.priceAtAdd) * 100)}% OFF)
                            </span>
                        </>
                    )}
                </div>

                {/* Quantity Controls */}
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded">
                        <button
                            onClick={() => handleQuantityChange(-1)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Minus size={16} />
                        </button>
                        <span className="px-4 font-semibold text-gray-800">
                            {item.quantity}
                        </span>
                        <button
                            onClick={() => handleQuantityChange(1)}
                            disabled={item.quantity >= 10}
                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <span className="text-sm text-gray-600">
                        Subtotal: <span className="font-semibold text-gray-800">₹{item.currentPrice * item.quantity}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CartItem;