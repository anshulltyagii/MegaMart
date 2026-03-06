import React, { useEffect, useState } from "react";
import axios from "../../services/api";
import { LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer } from "recharts";

const AdminUsersPage = () => {

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  // ------------------------------------
  // Fetch All Users
  // ------------------------------------
  const loadUsers = async () => {
    try {
      const res = await axios.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ------------------------------------
  // Update User Status (PATCH)
  // ------------------------------------
  const updateStatus = async (id, newStatus) => {
    if (!window.confirm("Update this user's status?")) return;

    try {
      await axios.patch(`/admin/users/${id}/status`, null, {
        params: { status: newStatus },
      });

      setUsers(prev =>
        prev.map(u => (u.id === id ? { ...u, accountStatus: newStatus } : u))
      );

    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  //---------export data as csv------------
  const exportCSV = () => {
    const header = ["ID", "Name", "Email", "Role", "Status"];
    const rows = filteredUsers.map(u => [
      u.id,
      u.fullName,
      u.email,
      u.role,
      u.accountStatus
    ]);
  
    let csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map(e => e.join(",")).join("\n");
  
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "users.csv";
    link.click();
  };
  

  // ------------------------------------
  // Soft Delete (Change to Suspended)
  // ------------------------------------
  const deleteUser = async (id) => {
    if (!window.confirm("Suspend this user?")) return;

    try {
      await axios.delete(`/admin/users/${id}`);

      setUsers(prev =>
        prev.map(u => (u.id === id ? { ...u, accountStatus: "SUSPENDED" } : u))
      );

    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // ------------------------------------
  // Role Filter
  // ------------------------------------
  const filterByRole = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // ------------------------------------
  // Status Filter
  // ------------------------------------
  const filterByStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // ------------------------------------
  // Final Filtering Logic
  // ------------------------------------
  const filteredUsers = users.filter(u => {
    // ROLE
    if (selectedRoles.length > 0 && !selectedRoles.includes(u.role)) return false;

    // STATUS
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(u.accountStatus)) return false;

    // SEARCH
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !u.fullName.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    return true;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.accountStatus === "ACTIVE").length;
  const suspendedUsers = users.filter(u => u.accountStatus === "SUSPENDED").length;
  const pendingUsers = users.filter(u => u.accountStatus === "PENDING").length;

  const totalCustomers = users.filter(u => u.role === "CUSTOMER").length;
  const totalShopkeepers = users.filter(u => u.role === "SHOPKEEPER").length;
  const totalAdmins = users.filter(u => u.role === "ADMIN").length;

  const chartData = [
    { name: "Active", value: activeUsers },
    { name: "Suspended", value: suspendedUsers },
    { name: "Pending", value: pendingUsers },
    { name: "Customers", value: totalCustomers },
    { name: "Shopkeepers", value: totalShopkeepers }
  ];


  // ------------------------------------
  // Beautiful Badge Styles
  // ------------------------------------
  const roleBadge = {
    CUSTOMER: "bg-blue-100 text-blue-700",
    SHOPKEEPER: "bg-green-100 text-green-700",
    ADMIN: "bg-purple-100 text-purple-700",
  };

  const statusBadge = {
    ACTIVE: "bg-green-100 text-green-700",
    SUSPENDED: "bg-red-100 text-red-700",
    PENDING: "bg-yellow-100 text-yellow-700",
  };


  return (
    <div className="p-8 bg-gray-100 min-h-screen">
     
      <h1 className="text-4xl font-bold mb-8 text-gray-700">Users Management</h1>

      {/* --------------------------- */}
      {/* STATS DASHBOARD */}
      {/* --------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-gray-500">Total Users</p>
          <h2 className="text-3xl font-bold text-blue-600">{totalUsers}</h2>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-gray-500">Active</p>
          <h2 className="text-3xl font-bold text-green-600">{activeUsers}</h2>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-gray-500">Suspended</p>
          <h2 className="text-3xl font-bold text-red-600">{suspendedUsers}</h2>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-gray-500">Pending</p>
          <h2 className="text-3xl font-bold text-yellow-600">{pendingUsers}</h2>
        </div>
      </div>


      {/* ROLE DETAILS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-gray-500">Customers</p>
          <h2 className="text-3xl font-bold text-indigo-600">
            {totalCustomers}
          </h2>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-gray-500">Shopkeepers</p>
          <h2 className="text-3xl font-bold text-purple-600">
            {totalShopkeepers}
          </h2>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-gray-500">Admins</p>
          <h2 className="text-3xl font-bold text-pink-600">{totalAdmins}</h2>
        </div>
      </div>


      {/* --------------------------- */}
      {/* ANALYTICS CHART */}
      {/* --------------------------- */}
      <div className="bg-white p-6 rounded-xl shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">
          User Analytics
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="name" stroke="#888" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#ff0077" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ------------------------------------ */}
      {/* FILTER BUTTONS */}
      {/* ------------------------------------ */}
      <div className="mb-6 space-y-4">

        {/* ROLE FILTER */}
        <div className="flex gap-3">
          {["CUSTOMER", "SHOPKEEPER", "ADMIN"].map(role => (
            <button
              key={role}
              onClick={() => filterByRole(role)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition
                ${selectedRoles.includes(role)
                    ? "bg-blue-600 text-white shadow"
                    : "bg-white hover:bg-gray-200"}`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* STATUS FILTER */}
        <div className="flex gap-3">
          {["ACTIVE", "SUSPENDED", "PENDING"].map(stat => (
            <button
              key={stat}
              onClick={() => filterByStatus(stat)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition
                ${selectedStatuses.includes(stat)
                    ? "bg-green-600 text-white shadow"
                    : "bg-white hover:bg-gray-200"}`}
            >
              {stat}
            </button>
          ))}
        </div>

        <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
        >
            Export CSV
        </button>
        
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full p-3 border rounded-lg shadow-sm"
        />

      </div>


      {/* ------------------------------------ */}
      {/* USERS TABLE */}
      {/* ------------------------------------ */}

      <div className="bg-white rounded-xl shadow p-6">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b text-gray-600">
              <th className="pb-3">ID</th>
              <th className="pb-3">Name</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50 transition">

                <td className="py-3">{user.id}</td>

                <td>{user.fullName}</td>

                <td>{user.email}</td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${roleBadge[user.role]}`}
                  >
                    {user.role}
                  </span>
                </td>

                <td>
                  <select
                    value={user.accountStatus}
                    onChange={(e) => updateStatus(user.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </td>

                <td className="text-center">
                  <button
                    disabled={user.accountStatus === "SUSPENDED"}
                    onClick={() => deleteUser(user.id)}
                    className={`px-4 py-1 rounded text-white font-semibold transition
                       ${user.accountStatus === "SUSPENDED"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"}`}
                  >
                    Delete
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminUsersPage;
