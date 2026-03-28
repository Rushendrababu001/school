import React, { useState, useEffect } from 'react';
import { itemsAPI, deviceUnitsAPI, activitiesAPI } from '../services/api';
import ItemForm from '../components/ItemForm';
import ItemsList from '../components/ItemsList';

export default function Items() {
  const [items, setItems] = useState([]);
  const [deviceUnits, setDeviceUnits] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const itemsRes = await itemsAPI.list();
      setItems(itemsRes.data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (item) => {
    setSelectedItem(item);
    setDeviceUnits([]);
    setActivityLogs([]);
    try {
      const [deviceRes, activityRes] = await Promise.all([
        deviceUnitsAPI.list({ item_id: item.id }),
        activitiesAPI.byItem(item.id),
      ]);
      setDeviceUnits(deviceRes.data);
      setActivityLogs(activityRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load item details');
      console.error(err);
    }
  };


  const handleSubmit = async (formData) => {
    try {
      const payload = { name: formData.name };
      if (editingItem) {
        await itemsAPI.update(editingItem.id, payload);
      } else {
        await itemsAPI.create(payload);
      }
      setShowForm(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setError('Failed to save item');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete item');
        console.error(err);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[var(--text)]">Inventory Management</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          {error}
        </div>
      )}

      {showForm && (
        <ItemForm
          item={editingItem}
          onSubmit={handleSubmit}
        />
      )}

      <ItemsList
        items={items}
        onView={loadDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {selectedItem && (
        <div className="card">
          <h2 className="text-2xl font-bold text-[var(--text)]">{selectedItem.name} details</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Total quantity: {selectedItem.quantity} in {selectedItem.location_name || 'unassigned'}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Device units</h3>
              {deviceUnits.length === 0 ? (
                <p className="text-sm text-gray-600">No device units available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--surface)]">
                      <tr>
                        <th className="px-3 py-2 text-[var(--text)] font-semibold">Serial Number</th>
                        <th className="px-3 py-2 text-[var(--text)] font-semibold">Status</th>
                        <th className="px-3 py-2 text-[var(--text)] font-semibold">Location</th>
                        <th className="px-3 py-2 text-[var(--text)] font-semibold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceUnits.map((unit) => (
                        <tr key={unit.id} className="border-t border-[var(--surface)]">
                          <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{unit.serial_number}</td>
                          <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{unit.status}</td>
                          <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{unit.location_name || '-'}</td>
                          <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{unit.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">Previous complaints / activity</h3>
              {activityLogs.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No activities logged for this item.</p>
              ) : (
                <ul className="space-y-2">
                  {activityLogs.map((log) => (
                    <li key={log.id} className="bg-[var(--bg)] p-3 rounded-lg border border-[var(--surface)] shadow-sm">
                      <p className="text-sm font-semibold text-[var(--text)]">{log.action_display}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{log.description}</p>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">
                        {log.performed_by} • {new Date(log.created_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <strong className="text-[var(--text)]">Recommendation:</strong> For high-volume items like CPU with 200 units, create device units and track each serial number. Use ticket logs for issue extraction and to assign responsible fixers quickly.
          </div>
        </div>
      )}
    </div>
  );
}
