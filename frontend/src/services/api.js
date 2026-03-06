
import axios from "axios";

const API_URL = "http://localhost:9192/api";

export const API_HOST = API_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) return Promise.reject(error);

    const status = error.response.status;

    if (status === 401) {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        return Promise.reject(error);
      }

      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      const currentPath = window.location.pathname || "";
      if (!currentPath.startsWith("/login")) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  checkUsername: (u) => api.get("/auth/check-username", { params: { username: u } }),
  checkEmail: (e) => api.get("/auth/check-email", { params: { email: e } }),
  checkPhone: (p) => api.get("/auth/check-phone", { params: { phone: p } }),
};

export const categoryAPI = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const productAPI = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  getImages: (id) => api.get(`/products/${id}/images`),
  search: (q, cat, page = 0, size = 20) =>
    api.get("/products/search", {
      params: { q, categoryId: cat, page, size },
    }),
  searchSuggestions: (q) =>
    api.get("/products/search/suggest", { params: { q } }),
  getByShop: (shopId) => api.get(`/products/shop/${shopId}`),
};

export const productImageAPI = {
  upload: (id, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/products/${id}/images/upload`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  addManual: (id, data) => api.post(`/products/${id}/images`, data),
  getImages: (id) => api.get(`/products/${id}/images`),
  update: (imgId, data) => api.put(`/product-images/${imgId}`, data),
  delete: (imgId) => api.delete(`/product-images/${imgId}`),
  setPrimary: (imgId, productId) =>
    api.patch(`/product-images/${imgId}/primary`, null, {
      params: { productId },
    }),
};

export const variantAPI = {
  getGroups: (id) => api.get(`/products/${id}/variants/groups`),
  createGroup: (id, data) => api.post(`/products/${id}/variants/groups`, data),
  updateGroup: (id, gid, data) =>
    api.put(`/products/${id}/variants/groups/${gid}`, data),
  deleteGroup: (id, gid) =>
    api.delete(`/products/${id}/variants/groups/${gid}`),
  getValues: (id, gid) =>
    api.get(`/products/${id}/variants/groups/${gid}/values`),
  createValue: (id, gid, data) =>
    api.post(`/products/${id}/variants/groups/${gid}/values`, data),
  updateValue: (id, vid, data) =>
    api.put(`/products/${id}/variants/values/${vid}`, data),
  deleteValue: (id, vid) =>
    api.delete(`/products/${id}/variants/values/${vid}`),
  upsertStock: (id, vid, data) =>
    api.post(`/products/${id}/variants/values/${vid}/stock`, data),
  getStock: (id) => api.get(`/products/${id}/variants/stock`),
};

export const cartAPI = {
  get: () => api.get("/cart"),
  addItem: (pid, qty) => api.post("/cart/items", { productId: pid, quantity: qty }),
  updateItem: (iid, qty) => api.put(`/cart/items/${iid}`, { quantity: qty }),
  removeItem: (iid) => api.delete(`/cart/items/${iid}`),
  clear: () => api.delete("/cart"),
  validate: () => api.get("/cart/validate"),
};

export const orderAPI = {
  checkout: (data) => api.post("/orders/checkout", data),
  getAll: () => api.get("/orders"),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
};

export const paymentAPI = {
  process: (data) => api.post("/payments", data),
  getByOrderId: (id) => api.get(`/payments/order/${id}`),
};

export const wishlistAPI = {
  get: (uid) => api.get(`/wishlist/${uid}`),
  add: (uid, pid) => api.post("/wishlist/add", { userId: uid, productId: pid }),
  remove: (uid, pid) =>
    api.delete("/wishlist/remove", { data: { userId: uid, productId: pid } }),
  moveToCart: (uid, pid) =>
    api.post(`/wishlist/${uid}/${pid}/move-to-cart`),
};

export const reviewAPI = {
  add: (uid, data) => api.post(`/reviews/${uid}`, data),
  getByProduct: (pid, sort = "newest") => {
    const map = {
      newest: `/reviews/newest/${pid}`,
      highest: `/reviews/rating/high/${pid}`,
      lowest: `/reviews/rating/low/${pid}`,
    };
    return api.get(map[sort] || map.newest);
  },
  getAvgRating: (pid) => api.get(`/reviews/avg/${pid}`),
  delete: (rid, uid) => api.delete(`/reviews/${rid}/user/${uid}`),
};

export const returnAPI = {
  request: (data) => api.post("/returns", data),
  getUserReturns: () => api.get("/returns"),
  getByOrderId: (id) => api.get(`/returns/order/${id}`),
};

export const couponAPI = {
  validate: (code, total) =>
    api.get("/coupons/validate", { params: { code, cartTotal: total } }),
  getActive: () => api.get("/coupons/active"),
  getAll: () => api.get("/coupons/all"),
};

export const addressAPI = {
  getAll: (uid) => api.get("/addresses", { params: { userId: uid } }),
  getById: (aid, uid) =>
    api.get(`/addresses/${aid}`, { params: { userId: uid } }),
  create: (uid, data) =>
    api.post("/addresses", data, { params: { userId: uid } }),
  update: (aid, uid, data) =>
    api.put(`/addresses/${aid}`, data, { params: { userId: uid } }),
  delete: (aid, uid) =>
    api.delete(`/addresses/${aid}`, { params: { userId: uid } }),
  setDefault: (aid, uid) =>
    api.patch(`/addresses/${aid}/default`, null, { params: { userId: uid } }),
};

export const userAPI = {
  getProfile: (uid) => api.get(`/users/${uid}`),
  update: (uid, data) => api.put(`/users/${uid}`, data),
};

export const shopAPI = {
  getMyShops: () => api.get("/shops/my"),
  getById: (sid) => api.get(`/shops/${sid}`),
  create: (data) => api.post("/shops", data),
  update: (sid, data) => api.put(`/shops/${sid}`, data),
  delete: (sid) => api.delete(`/shops/${sid}`),
};

export const inventoryAPI = {
  get: (pid) => api.get(`/inventory/${pid}`),
  update: (pid, qty) =>
    api.post(`/inventory/${pid}/init`, null, { params: { quantity: qty } }),
};

export const adminAPI = {
  users: {
    getAll: () => api.get('/admin/users'),
    getById: (userId) => api.get(`/admin/users/${userId}`),
    updateStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, null, { params: { status } }),
    delete: (userId) => api.delete(`/admin/users/${userId}`),
  },
  shops: {
    getAll: () => api.get('/admin/shops'),
    getPending: () => api.get('/admin/shops/pending'),
    getEvery: () => api.get('/admin/allshops'),
    approve: (shopId) => api.patch(`/admin/shops/${shopId}/approve`),
    reject: (shopId) => api.patch(`/admin/shops/${shopId}/reject`),
    delete: (shopId) => api.delete(`/admin/shops/${shopId}`),
  },
  coupons: {
    getAll: () => api.get('/admin/coupons'),
    create: (couponData) => api.post('/admin/coupons', couponData),
    update: (id, couponData) => api.put(`/admin/coupons/${id}`, couponData),
    delete: (id) => api.delete(`/admin/coupons/${id}`),
  },
  logs: {
    get: (limit = 20) => api.get('/admin/logs', { params: { limit } }),
    getLogs: (limit = 20) => api.get(`admin/logs`, { params: { limit } })
  },
  orders: {
    getAll: () => api.get('/orders/admin/all'),
    update: (orderId, status) =>
      api.patch(`/orders/admin/${orderId}/status`, null, {
        params: { status },
      }),
  },
  products: {
    getAll: () => api.get('/admin/products'),
    getByShop: (shopId) => api.get(`/products/shop/${shopId}`),
    delete: (id) => api.delete(`/products/${id}`),
    update: (id, body) => api.put(`/products/${id}`, body),
  },
  categories: {
    create: (data) => api.post('/categories', data),
    delete: (id) => api.delete(`/categories/${id}`),
    update: (id, data) => api.put(`/categories/${id}`, data),
    activate: (id) => api.put(`/categories/${id}/activate`),
  }
};

export const shopkeeperAPI = {
  shops: {
    getMy: () => api.get("/shops/my"),
  },
  shop: {
    getMyShops: () => api.get("/shops/my"),
    create: (data) => api.post("/shops", data),
    getById: (id) => api.get(`/shops/${id}`),
    update: (id, data) => api.put(`/shops/${id}`, data),
    delete: (id) => api.delete(`/shops/${id}`),
  },
  products: {
    create: (data) => api.post("/products/manage", data),
    update: (id, data) => api.put(`/products/manage/${id}`, data),
    delete: (id) => api.delete(`/products/manage/${id}`),
  },
  coupons: {
    getByShop: (id) => api.get(`/coupons/shop/${id}`),
    create: (data) => api.post("/coupons/create", data),
    update: (id, data) => api.put(`/coupons/${id}`, data),
    delete: (id) => api.delete(`/coupons/${id}`),
  },
};

export default api;

