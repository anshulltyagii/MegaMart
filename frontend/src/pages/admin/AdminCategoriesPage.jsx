import React, { useEffect, useState } from "react";
import { adminAPI,categoryAPI } from "../../services/api"; // update path accordingly

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  // -----------------------------------------------
  // LOAD ACTIVE CATEGORIES
  // -----------------------------------------------
  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryAPI.getAll(); // GET /categories
      const list = res.data.data || [];
      setCategories(list);
      setFiltered(list);
    } catch (err) {
      console.error("Failed loading categories", err);
      alert("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // -----------------------------------------------
  // SEARCH FILTER
  // -----------------------------------------------
  useEffect(() => {
    let list = [...categories];

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(term));
    }

    setFiltered(list);
  }, [search, categories]);

  // -----------------------------------------------
  // CREATE CATEGORY
  // -----------------------------------------------
  const handleCreate = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;

    try {
      await adminAPI.categories.create({ name });
      setShowAddModal(false);
      loadCategories(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to create category");
    }
  };

  // -----------------------------------------------
  // UPDATE CATEGORY
  // -----------------------------------------------
  const handleUpdate = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;

    try {
      await adminAPI.categories.update(editCategory.id, { name });
      setShowEditModal(false);
      loadCategories();
    } catch (err) {
      console.error(err);
      alert("Failed to update category");
    }
  };

  // -----------------------------------------------
  // DELETE CATEGORY (SOFT DELETE)
  // -----------------------------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await adminAPI.categories.deleteSoft(id);
      loadCategories(); // deleted category disappears
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  // -----------------------------------------------
  // PAGE UI
  // -----------------------------------------------
  return (
    <div className="p-6 max-w-5xl mx-auto">

      <h1 className="text-3xl font-semibold mb-4">Admin – Categories</h1>

      {/* SEARCH + ADD BUTTON */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search category..."
          className="border p-2 rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded"
          onClick={() => setShowAddModal(true)}
        >
          + Add Category
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-3">{c.id}</td>
                <td className="p-3">{c.name}</td>

                <td className="p-3 flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                    onClick={() => {
                      setEditCategory(c);
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    onClick={() => handleDelete(c.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center p-6 text-gray-500">No categories found.</p>
        )}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <form
            className="bg-white p-6 rounded w-96"
            onSubmit={handleCreate}
          >
            <h2 className="text-xl font-semibold mb-4">Add Category</h2>

            <input
              name="name"
              required
              placeholder="Category name"
              className="border p-2 w-full mb-4 rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1 border rounded"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <form
            className="bg-white p-6 rounded w-96"
            onSubmit={handleUpdate}
          >
            <h2 className="text-xl font-semibold mb-4">Edit Category</h2>

            <input
              name="name"
              defaultValue={editCategory.name}
              required
              className="border p-2 w-full mb-4 rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1 border rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminCategoriesPage;
