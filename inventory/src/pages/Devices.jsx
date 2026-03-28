import React, { useState, useEffect } from 'react';
import { itemsAPI, locationsAPI, deviceUnitsAPI, activitiesAPI, ticketsAPI } from '../services/api';

export default function Devices() {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allDeviceUnits, setAllDeviceUnits] = useState([]);
  const [deviceUnits] = useState([]);
  const [activityLogs] = useState([]);
  const [selectedItem] = useState(null);
  const [selectedDeviceUnit, setSelectedDeviceUnit] = useState(null);
  const [deviceHistory, setDeviceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDevicePanelOpen, setIsDevicePanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState(null); // 'view' | 'add' | 'edit'
  const [editingDeviceUnit, setEditingDeviceUnit] = useState(null);
  const [searchDeviceQuery, setSearchDeviceQuery] = useState('');
  const [deviceFilters, setDeviceFilters] = useState({
    item: '',
    location: '',
    status: '',
    fromDate: '',
    toDate: '',
  });
  const [deviceForm, setDeviceForm] = useState({
    item: '',
    serial_suffix: '',
    serial_number: '',
    location: '',
    status: 'working',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const normalizeResults = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, locationsRes, devicesRes] = await Promise.all([
        itemsAPI.list(),
        locationsAPI.list(),
        deviceUnitsAPI.list(),
      ]);
      setItems(normalizeResults(itemsRes.data));
      setLocations(normalizeResults(locationsRes.data));
      setAllDeviceUnits(normalizeResults(devicesRes.data));
      setError(null);
    } catch (err) {
      setError('Failed to load devices data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getItemPrefix = () => {
    const selected = items.find((it) => String(it.id) === String(deviceForm.item));
    if (!selected || !selected.name) return '';
    return selected.name.toUpperCase().replace(/\s+/g, '');
  };

  const handleDeviceChange = (e) => {
    const { name, value } = e.target;

    if (name === 'item') {
      setDeviceForm((prev) => ({
        ...prev,
        item: value,
        serial_suffix: '',
        serial_number: '',
        location: '',
      }));
      return;
    }

    if (name === 'serial_suffix') {
      const prefix = getItemPrefix();
      setDeviceForm((prev) => ({
        ...prev,
        serial_suffix: value,
        serial_number: prefix ? `${prefix}${value}` : value,
      }));
      return;
    }

    setDeviceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setDeviceFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredDeviceUnits = allDeviceUnits.filter((unit) => {
    if (deviceFilters.item && unit.item !== Number(deviceFilters.item) && unit.item !== deviceFilters.item) return false;
    if (deviceFilters.location && unit.location !== Number(deviceFilters.location) && unit.location !== deviceFilters.location) return false;
    if (deviceFilters.status && unit.status !== deviceFilters.status) return false;
    if (deviceFilters.fromDate && new Date(unit.created_at || unit.updated_at) < new Date(deviceFilters.fromDate)) return false;
    if (deviceFilters.toDate && new Date(unit.created_at || unit.updated_at) > new Date(deviceFilters.toDate)) return false;
    return true;
  });

  const filterBySearch = (units) => {
    if (!searchDeviceQuery) return units;
    const query = searchDeviceQuery.toLowerCase();
    return units.filter((unit) => 
      (unit.item_name?.toLowerCase().includes(query)) ||
      (unit.serial_number?.toLowerCase().includes(query)) ||
      (unit.location_name?.toLowerCase().includes(query)) ||
      (unit.status?.toLowerCase().includes(query))
    );
  };

  const displayDeviceUnits = filterBySearch(filteredDeviceUnits);

  const handleDeviceSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const formData = { ...deviceForm };

      // build serial_number from item prefix + suffix if not already set
      const prefix = getItemPrefix();
      formData.serial_number = prefix ? `${prefix}${formData.serial_suffix || ''}` : formData.serial_suffix || formData.serial_number;
      delete formData.serial_suffix;

      // Ensure new devices are always marked as working
      if (!editingDeviceUnit) {
        formData.status = 'working';
      }

      if (editingDeviceUnit) {
        await deviceUnitsAPI.update(editingDeviceUnit.id, formData);
      } else {
        await deviceUnitsAPI.create(formData);
      }

      setDeviceForm({
        item: '',
        serial_suffix: '',
        serial_number: '',
        location: '',
        status: 'working',
        remarks: '',
      });
      setEditingDeviceUnit(null);
      await fetchData();
      setIsDevicePanelOpen(false);
      setPanelMode(null);
    } catch (err) {
      console.error('Device save error:', err);
      
      // Handle validation errors from backend
      if (err.response?.status === 400 && err.response?.data?.serial_number) {
        setError(`Device Number Error: ${err.response.data.serial_number[0]}`);
      } else if (err.response?.data?.detail) {
        setError(`Error: ${err.response.data.detail}`);
      } else {
        setError('Failed to save device unit. Please check the device number and try again.');
      }
    }
  };

  const handleDeleteDevice = async (id) => {
    if (window.confirm('Are you sure you want to delete this device unit?')) {
      try {
        await deviceUnitsAPI.delete(id);
        await fetchData();
      } catch (err) {
        setError('Failed to delete device unit');
        console.error(err);
      }
    }
  };

  const handleViewDevice = async (unit) => {
    setSelectedDeviceUnit(unit);
    setPanelMode('view');
    setIsDevicePanelOpen(true);
    setDeviceHistory([]);

    try {
      const [ticketRes, activityRes] = await Promise.all([
        ticketsAPI.byDeviceUnit(unit.id),
        activitiesAPI.byItem(unit.item),
      ]);

      console.log('Device history - Tickets:', ticketRes.data);
      console.log('Device history - Activities:', activityRes.data);

      const ticketEvents = (Array.isArray(ticketRes.data) ? ticketRes.data : ticketRes.data?.results || []).map((ticket) => ({
        id: `ticket-${ticket.id}`,
        type: 'Ticket',
        timestamp: ticket.raised_at,
        description: `${ticket.status} ticket: ${ticket.problem}`,
        details: ticket,
      }));

      const activityEvents = (Array.isArray(activityRes.data) ? activityRes.data : activityRes.data?.results || []).map((activity) => ({
        id: `activity-${activity.id}`,
        type: 'Activity',
        timestamp: activity.created_at,
        description: activity.description,
        details: activity,
      }));

      const mergedHistory = [...ticketEvents, ...activityEvents].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setDeviceHistory(mergedHistory);
      
      if (mergedHistory.length === 0) {
        console.warn(`No history found for device unit ${unit.id} (item ${unit.item})`);
      }
    } catch (err) {
      console.error('Failed to load device history:', err);
      setDeviceHistory([]);
      setError(`Note: Could not load device history. Tickets & activities may still be associated.`);
    }
  };

  const handleEditDevice = (unit) => {
    const prefix = items.find((it) => String(it.id) === String(unit.item))?.name?.toUpperCase().replace(/\s+/g, '') || '';
    const suffix = prefix ? unit.serial_number?.replace(new RegExp(`^${prefix}`), '') : unit.serial_number || '';

    setEditingDeviceUnit(unit);
    setPanelMode('edit');
    setIsDevicePanelOpen(true);
    setDeviceForm({
      item: unit.item || '',
      serial_suffix: suffix || '',
      serial_number: unit.serial_number || '',
      location: unit.location || '',
      status: unit.status || 'working',
      remarks: unit.remarks || '',
    });
  };

  if (loading) return <div className="text-center py-8">Loading devices...</div>;

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'working':
        return 'badge-success';
      case 'damaged':
        return 'badge-danger';
      case 'under_repair':
        return 'badge-warning';
      default:
        return 'badge-warning';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Device Management</h1>
        <button
          onClick={() => {
            setPanelMode('add');
            setIsDevicePanelOpen(true);
            setEditingDeviceUnit(null);
            setDeviceForm({
              item: '',
              serial_suffix: '',
              serial_number: '',
              location: '',
              status: 'working',
              remarks: '',
            });
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Device
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              Filter Devices
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Search and refine your device inventory</p>
          </div>
          <button
            onClick={() => {
              setDeviceFilters({
                item: '',
                location: '',
                status: '',
                fromDate: '',
                toDate: '',
              });
            }}
            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Item</label>
            <select
              name="item"
              value={deviceFilters.item}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white font-medium"
            >
              <option value="">All Items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <select
              name="location"
              value={deviceFilters.location}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white font-medium"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              name="status"
              value={deviceFilters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white font-medium"
            >
              <option value="">All Statuses</option>
              <option value="working">Working</option>
              <option value="damaged">Damaged</option>
              <option value="under_repair">Under Repair</option>
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              name="fromDate"
              value={deviceFilters.fromDate}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white font-medium"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              name="toDate"
              value={deviceFilters.toDate}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white font-medium"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 -m-4 mb-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by item name, device number, location, or status..."
              value={searchDeviceQuery}
              onChange={(e) => setSearchDeviceQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-lg font-bold mb-3 text-[var(--text)] px-6 pt-4">All Device Units</h2>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--surface)]">
            <tr>
              <th className="px-3 py-2 text-[var(--text)] font-semibold">ID</th>
              <th className="px-3 py-2 text-[var(--text)] font-semibold">Item</th>
              <th className="px-3 py-2 text-[var(--text)] font-semibold">Device Number</th>
              <th className="px-3 py-2 text-[var(--text)] font-semibold">Location</th>
              <th className="px-3 py-2 text-[var(--text)] font-semibold">Status</th>
              <th className="px-3 py-2 text-[var(--text)] font-semibold">Created At</th>
              <th className="px-3 py-2 text-[var(--text)] font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface)]">
            {displayDeviceUnits.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-3 py-4 text-center text-sm text-[var(--text-secondary)]">
                  {searchDeviceQuery ? 'No search results found.' : 'No device units found.'}
                </td>
              </tr>
            ) : (
              displayDeviceUnits.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{unit.id}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{unit.item_name || '-'}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{unit.serial_number || '-'}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{unit.location_name || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${getStatusBadgeColor(unit.status)}`}>{unit.status}</span>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{new Date(unit.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 flex gap-1">
                    <button
                      onClick={() => handleViewDevice(unit)}
                      className="btn-secondary text-xs"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditDevice(unit)}
                      className="btn-warning text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(unit.id)}
                      className="btn-danger text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isDevicePanelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsDevicePanelOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--surface)] shadow-xl z-50 overflow-y-auto">
            <div className="p-4 border-b border-[var(--surface)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--text)]">
                {panelMode === 'add' ? 'Add Device' : panelMode === 'edit' ? 'Edit Device' : 'Device Details'}
              </h2>
              <button
                onClick={() => setIsDevicePanelOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              {(panelMode === 'add' || panelMode === 'edit') ? (
                <form onSubmit={handleDeviceSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Item *</label>
                    <select
                      name="item"
                      value={deviceForm.item}
                      onChange={handleDeviceChange}
                      required
                      className="input-base"
                    >
                      <option value="">Select item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Device Number *</label>
                    <div className="flex gap-2 items-center">
                      <span className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100 text-gray-700">
                        {getItemPrefix() || 'PREFIX'}
                      </span>
                      <input
                        type="text"
                        name="serial_suffix"
                        value={deviceForm.serial_suffix}
                        onChange={handleDeviceChange}
                        required
                        disabled={!deviceForm.item}
                        className="input-base rounded-l-none"
                        placeholder="000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text)]">Location *</label>
                    <select
                      name="location"
                      value={deviceForm.location}
                      onChange={handleDeviceChange}
                      className="input-base"
                    >
                      <option value="">Select location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text)]">Remarks</label>
                    <textarea
                      name="remarks"
                      value={deviceForm.remarks}
                      onChange={handleDeviceChange}
                      className="input-base"
                      rows="3"
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full">
                    {panelMode === 'edit' ? 'Update Device' : 'Add Device'}
                  </button>
                </form>
              ) : selectedDeviceUnit ? (
                <div>
                  <p><strong>Item:</strong> {selectedDeviceUnit.item_name || '-'}</p>
                  <p><strong>Device Number:</strong> {selectedDeviceUnit.serial_number || '-'}</p>
                  <p><strong>Location:</strong> {selectedDeviceUnit.location_name || '-'}</p>
                  <p><strong>Status:</strong> {selectedDeviceUnit.status || '-'}</p>
                  <p><strong>Created:</strong> {new Date(selectedDeviceUnit.created_at || selectedDeviceUnit.updated_at).toLocaleString()}</p>

                  <div className="mt-4">
                    <h4 className="font-semibold text-[var(--text)]">Device History</h4>
                    {deviceHistory.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)]">No history for this device yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {deviceHistory.map((event) => (
                          <li key={event.id} className="p-2 border border-[var(--surface)] rounded bg-[var(--bg)]">
                            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                              <span>{event.type}</span>
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-[var(--text)]">{event.description}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </>
      )}

      {selectedDeviceUnit && (
        <div className="card p-4 mb-4 border-blue-300 bg-blue-50">
          <h3 className="text-lg font-bold text-[var(--text)]">Selected Device</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <div><strong>ID:</strong> {selectedDeviceUnit.id}</div>
            <div><strong>Item:</strong> {selectedDeviceUnit.item_name || '-'}</div>
            <div><strong>Device Number:</strong> {selectedDeviceUnit.serial_number || '-'}</div>
            <div><strong>Location:</strong> {selectedDeviceUnit.location_name || '-'}</div>
            <div><strong>Status:</strong> {selectedDeviceUnit.status || '-'}</div>
            <div><strong>Created:</strong> {new Date(selectedDeviceUnit.created_at || selectedDeviceUnit.updated_at).toLocaleString()}</div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-[var(--text)]">Device History</h4>
            {deviceHistory.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No history for this device yet.</p>
            ) : (
              <ul className="space-y-2">
                {deviceHistory.map((event) => (
                  <li key={event.id} className="p-2 border rounded bg-white">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{event.type}</span>
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-800">{event.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {selectedItem ? (
        <div className="space-y-4">
          <div className="card bg-blue-50 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold text-gray-900">{selectedItem.name}</h2>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <p className="text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold text-blue-700">{selectedItem.quantity}</p>
              </div>
              <div>
                <p className="text-gray-600">Location</p>
                <p className="text-lg font-semibold">{selectedItem.location_name || '-'}</p>
              </div>
            </div>
            {selectedItem.remarks && (
              <div className="mt-3 text-sm text-gray-700">
                <strong>Remarks:</strong> {selectedItem.remarks}
              </div>
            )}
          </div>

          <div className="card">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Device Units</h3>
            </div>

            {deviceUnits.length === 0 ? (
              <p className="text-sm text-gray-600">No device units. Add one to track individual units.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2">Device Number</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Remarks</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {deviceUnits.map((unit) => (
                      <tr key={unit.id}>
                        <td className="px-3 py-2 font-semibold">{unit.serial_number}</td>
                        <td className="px-3 py-2">{unit.location_name || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`badge ${getStatusBadgeColor(unit.status)}`}>{unit.status}</span>
                        </td>
                        <td className="px-3 py-2 text-xs">{unit.remarks || '-'}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleDeleteDevice(unit.id)}
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-bold mb-3">Activity / Complaints</h3>
            {activityLogs.length === 0 ? (
              <p className="text-sm text-gray-600">No activity logged for this item.</p>
            ) : (
              <div className="space-y-2">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded border">
                    <p className="font-semibold text-sm">{log.action_display}</p>
                    <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {log.performed_by} • {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg">Select an item to view device units and activity</p>
        </div>
      )}
    </div>
  );
}


