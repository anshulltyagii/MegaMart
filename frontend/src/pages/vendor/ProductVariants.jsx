// ProductVariants.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PlusCircle, Edit2, Trash2, RefreshCw, Save } from "lucide-react";
import { variantAPI } from "../../services/api";

/**
 * Full pro UI Variant Manager (style B)
 * Route: /vendor/products/:productId/variants
 *
 * Features:
 * - Accordion-style group panels
 * - Create/Edit/Delete groups
 * - Create/Edit/Delete values
 * - Inline stock editor per value (save per-value)
 * - Uses variantAPI (centralized)
 */

export default function ProductVariants() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [valuesByGroup, setValuesByGroup] = useState({}); // { groupId: [values] }
  const [stocks, setStocks] = useState([]); // stock entries
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // forms / editors
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState(null); // { id, name }

  const [newValueName, setNewValueName] = useState("");
  const [editingValue, setEditingValue] = useState(null); // { id, name, groupId }

  const [stockInputs, setStockInputs] = useState({}); // { valueId: qty }

  // load everything
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([loadGroups(), loadStock()]);
    } finally {
      setLoading(false);
    }
  }

  async function loadGroups() {
    try {
      const res = await variantAPI.getGroups(productId);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setGroups(list);
      // If a group is open, reload its values. Otherwise open first group.
      if (list.length) {
        const firstId = openGroupId || list[0].id;
        setOpenGroupId(firstId);
        await loadValues(firstId);
      } else {
        setOpenGroupId(null);
        setValuesByGroup({});
      }
    } catch (err) {
      console.error("loadGroups", err);
      setGroups([]);
    }
  }

  async function loadValues(groupId) {
    if (!groupId) return;
    try {
      const res = await variantAPI.getValues(productId, groupId);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setValuesByGroup((prev) => ({ ...prev, [groupId]: list }));

      // initialize stockInputs for these values from stocks
      const stockMap = (Array.isArray(stocks) ? stocks : []).reduce((acc, s) => {
        acc[s.valueId ?? s.value_id] = s.quantity ?? s.qty ?? 0;
        return acc;
      }, {});
      setStockInputs((prev) => {
        const copy = { ...prev };
        list.forEach((v) => {
          if (copy[v.id] === undefined) copy[v.id] = stockMap[v.id] ?? 0;
        });
        return copy;
      });
    } catch (err) {
      console.error("loadValues", err);
      setValuesByGroup((prev) => ({ ...prev, [groupId]: [] }));
    }
  }

  async function loadStock() {
    try {
      const res = await variantAPI.getStock(productId);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setStocks(list);
    } catch (err) {
      console.warn("loadStock", err);
      setStocks([]);
    }
  }

  // ---------- Group actions ----------
  async function createGroup(e) {
    e?.preventDefault();
    if (!newGroupName.trim()) return alert("Enter group name");
    try {
await variantAPI.createGroup(productId, { groupName: newGroupName.trim() });
      setNewGroupName("");
      await loadGroups();
    } catch (err) {
      alert(err?.response?.data || "Unable to create group");
    }
  }

  function beginEditGroup(g) {
setEditingGroup({ id: g.id, name: g.groupName });
  }

  async function saveEditGroup(e) {
    e?.preventDefault();
    if (!editingGroup?.name?.trim()) return alert("Group name required");
    try {
await variantAPI.updateGroup(productId, editingGroup.id, { groupName: editingGroup.name.trim() });
      setEditingGroup(null);
      await loadGroups();
    } catch (err) {
      alert(err?.response?.data || "Unable to update group");
    }
  }

  async function removeGroup(groupId) {
    const ok = window.confirm("Delete this group and all its values?");
    if (!ok) return;
    try {
      await variantAPI.deleteGroup(productId, groupId);
      if (openGroupId === groupId) setOpenGroupId(null);
      await loadGroups();
      await loadStock();
    } catch (err) {
      alert(err?.response?.data || "Unable to delete group");
    }
  }

  // ---------- Value actions ----------
  async function createValue(e) {
    e?.preventDefault();
    if (!openGroupId) return alert("Select a group first");
    if (!newValueName.trim()) return alert("Enter value name");
    try {
await variantAPI.createValue(productId, openGroupId, { valueName: newValueName.trim() });
      setNewValueName("");
      await loadValues(openGroupId);
      await loadStock();
    } catch (err) {
      alert(err?.response?.data || "Unable to create value");
    }
  }

  function beginEditValue(v) {
setEditingValue({ id: v.id, name: v.valueName, groupId: openGroupId });
  }

  async function saveEditValue(e) {
    e?.preventDefault();
    if (!editingValue?.name?.trim()) return alert("Value name required");
    try {
await variantAPI.updateValue(productId, editingValue.id, { valueName: editingValue.name.trim() });
      setEditingValue(null);
      await loadValues(openGroupId);
    } catch (err) {
      alert(err?.response?.data || "Unable to update value");
    }
  }

  async function removeValue(valueId) {
    const ok = window.confirm("Delete this variant value?");
    if (!ok) return;
    try {
      await variantAPI.deleteValue(productId, valueId);
      await loadValues(openGroupId);
      await loadStock();
    } catch (err) {
      alert(err?.response?.data || "Unable to delete value");
    }
  }

  // ---------- Stock ----------
  function onStockChange(valueId, raw) {
    const v = raw === "" ? "" : Number(raw);
    setStockInputs((s) => ({ ...s, [valueId]: v }));
  }

  async function saveStock(valueId) {
    const qty = Number(stockInputs[valueId] ?? 0);
    if (isNaN(qty) || qty < 0) return alert("Enter valid quantity");
    setSavingId(valueId);
    try {
      await variantAPI.upsertStock(productId, valueId, { quantity: qty });
      await loadStock();
      alert("Stock saved");
    } catch (err) {
      alert(err?.response?.data || "Unable to save stock");
    } finally {
      setSavingId(null);
    }
  }

  // helpers
  function getStockForValue(valueId) {
    const rec = stocks.find((s) => (s.valueId ?? s.value_id) === valueId);
    return rec ? (rec.quantity ?? rec.qty ?? 0) : 0;
  }

  // ---------- UI helpers ----------
  const toggleAccordion = async (groupId) => {
    const willOpen = openGroupId !== groupId;
    setOpenGroupId(willOpen ? groupId : null);
    if (willOpen) await loadValues(groupId);
  };

  // render
  if (loading) {
    return <div className="p-6">Loading variant manager...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Variant Manager</h2>
        <div className="text-sm text-gray-600">Product: {productId}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups column */}
        <div className="col-span-1 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Groups</h3>
            <button
              onClick={() => { setNewGroupName(""); setEditingGroup(null); }}
              className="text-sm text-gray-500 flex items-center gap-1"
              title="Refresh groups"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <form onSubmit={createGroup} className="flex gap-2 mb-3">
            <input
              placeholder="New group (e.g., Size)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded flex items-center gap-1">
              <PlusCircle size={14} /> Add
            </button>
          </form>

          {editingGroup && (
            <form onSubmit={saveEditGroup} className="mb-3 flex gap-2">
              <input
                value={editingGroup.name}
                onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                className="flex-1 px-3 py-2 border rounded"
              />
              <button className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-1">
                Save
              </button>
              <button type="button" onClick={() => setEditingGroup(null)} className="px-3 py-2 border rounded">
                Cancel
              </button>
            </form>
          )}

          <div className="space-y-2">
            {groups.length === 0 && <p className="text-sm text-gray-500">No groups yet.</p>}
            {groups.map((g) => (
              <div
                key={g.id}
                className={`p-2 rounded cursor-pointer transition-shadow ${openGroupId === g.id ? "bg-indigo-50 shadow-sm" : "hover:shadow-sm"}`}
              >
                <div className="flex items-center justify-between">
                  <div onClick={() => toggleAccordion(g.id)} className="flex-1">
<div className="font-medium">{g.groupName}</div>
                    <div className="text-xs text-gray-500">ID: {g.id}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => beginEditGroup(g)} className="p-1 rounded hover:bg-gray-100" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => removeGroup(g.id)} className="p-1 rounded hover:bg-gray-100 text-red-600" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values & Stock */}
        <div className="col-span-2 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Values & Stock</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { loadGroups(); loadValues(openGroupId); loadStock(); }} className="px-3 py-1 border rounded text-sm">
                Refresh
              </button>
              <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded text-sm">Back</button>
            </div>
          </div>

          {!openGroupId ? (
            <div className="text-sm text-gray-500">Select a group to view or create values.</div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <form onSubmit={createValue} className="flex flex-1 gap-2">
                  <input
                    placeholder="New value (e.g., Red, XL)"
                    value={newValueName}
                    onChange={(e) => setNewValueName(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded"
                  />
                  <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded flex items-center gap-1">
                    <PlusCircle size={14} /> Add Value
                  </button>
                </form>

                {editingValue && (
                  <form onSubmit={saveEditValue} className="flex gap-2">
                    <input
                      value={editingValue.name}
                      onChange={(e) => setEditingValue({ ...editingValue, name: e.target.value })}
                      className="px-3 py-2 border rounded"
                    />
                    <button className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-1">
                      <Save size={14} /> Save
                    </button>
                    <button type="button" onClick={() => setEditingValue(null)} className="px-3 py-2 border rounded">Cancel</button>
                  </form>
                )}
              </div>

              <div className="space-y-3">
                {(valuesByGroup[openGroupId] || []).length === 0 && (
                  <div className="p-6 text-center border rounded text-gray-500">No values. Add one above.</div>
                )}

                {(valuesByGroup[openGroupId] || []).map((v) => (
                  <div key={v.id} className="p-3 border rounded flex items-center justify-between gap-4">
                    <div className="flex-1">
<div className="font-medium">{v.valueName}</div>
                      <div className="text-xs text-gray-500">Value ID: {v.id}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-600">Stock</div>
                      <input
                        type="number"
                        min="0"
                        value={stockInputs[v.id] ?? getStockForValue(v.id)}
                        onChange={(e) => onStockChange(v.id, e.target.value)}
                        className="w-28 px-2 py-1 border rounded"
                      />
                      <button
                        onClick={() => saveStock(v.id)}
                        disabled={savingId === v.id}
                        className="px-3 py-1 border rounded text-sm flex items-center gap-1"
                      >
                        {savingId === v.id ? "Saving..." : <><Save size={14} /> Save</>}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => beginEditValue(v)} className="px-3 py-1 border rounded text-sm">
                        <Edit2 size={14} /> Edit
                      </button>
                      <button onClick={() => removeValue(v.id)} className="px-3 py-1 border rounded text-sm text-red-600">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}