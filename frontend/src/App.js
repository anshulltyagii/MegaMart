import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/common/Header';

// ═══════════════════════════════════════════════════════════
// AUTH PAGES
// ═══════════════════════════════════════════════════════════
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import OtpVerifyPasswordPage from './pages/auth/OtpVerifyPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// ═══════════════════════════════════════════════════════════
// CUSTOMER PAGES
// ═══════════════════════════════════════════════════════════
import HomePage from './pages/customer/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import WishlistPage from './pages/wishlist/WishlistPage';

// ═══════════════════════════════════════════════════════════
// COMMON / SHARED PAGES
// ═══════════════════════════════════════════════════════════
import ProfilePage from './components/common/ProfilePage';
import AddressListPage from './components/address/AddressListPage';
import AddAddressPage from './components/address/AddAddressPage';
import EditAddressPage from './components/address/EditAddressPage';

// ═══════════════════════════════════════════════════════════
// VENDOR / SHOPKEEPER PAGES
// ═══════════════════════════════════════════════════════════
import VendorDashboard from './pages/vendor/VendorDashboard';
import ShopHome from './pages/vendor/ShopHome';
import MyShops from './pages/vendor/MyShops';
import CreateShop from './pages/vendor/CreateShop';
import ShopDetails from './pages/vendor/ShopDetails';
import EditShop from './pages/vendor/EditShop';
import ShopProducts from './pages/vendor/ShopProducts';
import AddProduct from './pages/vendor/AddProduct';
import EditProduct from './pages/vendor/EditProduct';
import ProductImages from './pages/vendor/ProductImages';
import ProductVariants from './pages/vendor/ProductVariants';

// ✅ NEW: Single Page for Coupons (List + Add/Edit Modal)
import CouponsPage from './pages/vendor/coupons/CouponsPage';

// ═══════════════════════════════════════════════════════════
// ADMIN PAGES
// ═══════════════════════════════════════════════════════════
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminShopsPage from './pages/admin/AdminShopsPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import EditProfilePage from './pages/EditProfilePage';

// ═══════════════════════════════════════════════════════════
// PROTECTED ROUTE COMPONENT
// ═══════════════════════════════════════════════════════════
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, role } = useAuth();
    console.log("pr is authenticated: ",isAuthenticated);
    console.log("pr role: ",role);
    console.log("pr allowed: ",allowedRoles);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// ═══════════════════════════════════════════════════════════
// 404 NOT FOUND COMPONENT
// ═══════════════════════════════════════════════════════════
const NotFound = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-6">Page not found</p>
            <a 
                href="/" 
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
            >
                Go to Home
            </a>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN APP ROUTES
// ═══════════════════════════════════════════════════════════
const AppRoutes = () => {
    return (
        <>
            <Header />
            <Routes>
                {/* ══════════════════════════════════════════════════ */}
                {/* PUBLIC ROUTES */}
                {/* ══════════════════════════════════════════════════ */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify-otp-reset" element={<OtpVerifyPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Product Browsing (Public) */}
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:productId" element={<ProductDetailsPage />} />

                {/* ══════════════════════════════════════════════════ */}
                {/* SHARED ROUTES (Any logged-in user) */}
                {/* ══════════════════════════════════════════════════ */}
                <Route path="/profile/edit" element={
                    <ProtectedRoute>
                        <EditProfilePage />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                } />
                <Route path="/addresses" element={
                    <ProtectedRoute>
                        <AddressListPage />
                    </ProtectedRoute>
                } />
                <Route path="/addresses/add" element={
                    <ProtectedRoute>
                        <AddAddressPage />
                    </ProtectedRoute>
                } />
                <Route path="/addresses/edit/:id" element={
                    <ProtectedRoute>
                        <EditAddressPage />
                    </ProtectedRoute>
                } />

                {/* ══════════════════════════════════════════════════ */}
                {/* CUSTOMER ROUTES */}
                {/* ══════════════════════════════════════════════════ */}
                <Route path="/cart" element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <CartPage />
                    </ProtectedRoute>
                } />
                <Route path="/checkout" element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <CheckoutPage />
                    </ProtectedRoute>
                } />
                <Route path="/payment" element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <PaymentPage />
                    </ProtectedRoute>
                } />
                <Route path="/orders" element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <OrderHistoryPage />
                    </ProtectedRoute>
                } />
                <Route path="/wishlist" element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <WishlistPage />
                    </ProtectedRoute>
                } />

                {/* ══════════════════════════════════════════════════ */}
                {/* VENDOR / SHOPKEEPER ROUTES */}
                {/* ══════════════════════════════════════════════════ */}
                <Route path="/vendor/home" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <ShopHome />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/dashboard" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <VendorDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/shops" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <MyShops />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/shops/create" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <CreateShop />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/shops/:shopId" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <ShopDetails />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/shops/:shopId/edit" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <EditShop />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/shops/:shopId/products" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <ShopProducts />
                    </ProtectedRoute>
                } />

                {/* Product Management */}
                <Route path="/vendor/products/add" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <AddProduct />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/products/:id/edit" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <EditProduct />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/products/:productId/images" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <ProductImages />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/products/:productId/variants" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <ProductVariants />
                    </ProtectedRoute>
                } />

                {/* Vendor Coupons (Unified Page) */}
                <Route path="/vendor/coupons" element={
                    <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                        <CouponsPage />
                    </ProtectedRoute>
                } />

                {/* ══════════════════════════════════════════════════ */}
                {/* ADMIN ROUTES */}
                {/* ══════════════════════════════════════════════════ */}
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminUsersPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/shops" element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminShopsPage />
                    </ProtectedRoute>
                } />
                 <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminProductsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminCategoriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminCouponsPage />
            </ProtectedRoute>
          }
        />

                <Route path="/admin/logs" element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminLogsPage />
                    </ProtectedRoute>
                } />

                {/* ══════════════════════════════════════════════════ */}
                {/* 404 CATCH ALL */}
                {/* ══════════════════════════════════════════════════ */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
};

// ═══════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════
function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="App min-h-screen bg-gray-50">
                    <AppRoutes />
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;