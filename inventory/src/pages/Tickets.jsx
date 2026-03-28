import React, { useState, useEffect } from 'react';
import { ticketsAPI, itemsAPI, locationsAPI, deviceUnitsAPI } from '../services/api';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [deviceUnits, setDeviceUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTicketPanel, setShowTicketPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    item: '',
    device_unit: '',
    device_no: '',
    raised_by: '',
    location: '',
    problem: '',
    status: 'open',
    raised_at: new Date().toISOString().slice(0, 16),
    assigned_to: '',
    time_taken_minutes: '',
    suggestions: '',
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
    setLoading(true);

    try {
      const ticketsRes = await ticketsAPI.list();
      setTickets(normalizeResults(ticketsRes.data));
    } catch (err) {
      console.error('tickets API error', err);
      setError(`Ticket list load failed: ${err.response?.status || err.message}`);
      setTickets([]);
    }

    try {
      const itemsRes = await itemsAPI.list();
      setItems(normalizeResults(itemsRes.data));
    } catch (err) {
      console.error('items API error', err);
      setError((prev) => `${prev ? prev + ' | ' : ''}Items load failed: ${err.response?.status || err.message}`);
      setItems([]);
    }

    try {
      const deviceUnitsRes = await deviceUnitsAPI.list();
      setDeviceUnits(normalizeResults(deviceUnitsRes.data));
    } catch (err) {
      console.error('device units API error', err);
      setError((prev) => `${prev ? prev + ' | ' : ''}Device Units load failed: ${err.response?.status || err.message}`);
      setDeviceUnits([]);
    }

    try {
      const locationsRes = await locationsAPI.list();
      setLocations(normalizeResults(locationsRes.data));
    } catch (err) {
      console.error('locations API error', err);
      setError((prev) => `${prev ? prev + ' | ' : ''}Locations load failed: ${err.response?.status || err.message}`);
      setLocations([]);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'item') {
      setForm((prev) => ({
        ...prev,
        item: value,
        device_unit: '',
        device_no: '',
        location: '',
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDeviceUnitChange = (e) => {
    const unitId = e.target.value;
    const unit = deviceUnits.find((d) => String(d.id) === String(unitId));
    if (unit) {
      setForm((prev) => ({
        ...prev,
        device_unit: unit.id,
        device_no: unit.serial_number || '',
        item: unit.item || prev.item,
        location: unit.location || prev.location,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        device_unit: '',
        device_no: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ticketsAPI.create(form);
      setForm({
        item: '',
        device_unit: '',
        device_no: '',
        raised_by: '',
        location: '',
        problem: '',
        status: 'open',
        raised_at: new Date().toISOString().slice(0, 16),
        assigned_to: '',
        time_taken_minutes: '',
        suggestions: '',
      });
      fetchData();
      setShowTicketPanel(false);
    } catch (err) {
      console.error(err);
      setError('Unable to raise ticket.');
    }
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleString() : '-');

  if (loading) return <div className="text-center py-10">Loading tickets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Ticket Management</h1>
        <button
          onClick={() => setShowTicketPanel(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Ticket
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Tickets</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track all support tickets</p>
        </div>
        
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by item, device number, problem, location, or raised by..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Device No</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Problem</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Raised By</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Time Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {(Array.isArray(tickets) ? tickets : []).filter((ticket) => {
                const query = searchQuery.toLowerCase();
                return (
                  (ticket.item_name?.toLowerCase().includes(query)) ||
                  (ticket.device_no?.toLowerCase().includes(query)) ||
                  (ticket.device_serial_number?.toLowerCase().includes(query)) ||
                  (ticket.problem?.toLowerCase().includes(query)) ||
                  (ticket.location_name?.toLowerCase().includes(query)) ||
                  (ticket.raised_by?.toLowerCase().includes(query))
                );
              }).map((ticket, index) => (
                <tr key={ticket.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">#{ticket.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{ticket.item_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.device_no || ticket.device_serial_number || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                    <div className="truncate" title={ticket.problem}>{ticket.problem}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.location_name || 'Not specified'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'
                    }`}>
                      {ticket.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{ticket.raised_by}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{ticket.assigned_to || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(ticket.raised_at) || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{ticket.time_taken_minutes ? `${ticket.time_taken_minutes}m` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(Array.isArray(tickets) && tickets.length === 0) && !loading && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets found</h3>
            <p className="text-gray-500 dark:text-gray-400">Get started by creating your first ticket.</p>
          </div>
        )}
        {(Array.isArray(tickets) && tickets.length > 0 && tickets.filter((ticket) => {
          const query = searchQuery.toLowerCase();
          return (
            (ticket.item_name?.toLowerCase().includes(query)) ||
            (ticket.device_no?.toLowerCase().includes(query)) ||
            (ticket.device_serial_number?.toLowerCase().includes(query)) ||
            (ticket.problem?.toLowerCase().includes(query)) ||
            (ticket.location_name?.toLowerCase().includes(query)) ||
            (ticket.raised_by?.toLowerCase().includes(query))
          );
        }).length === 0) && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No search results</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {showTicketPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowTicketPanel(false)}
            aria-hidden="true"
          />
          <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Ticket</h2>
              <button
                onClick={() => setShowTicketPanel(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">Item Name (choose first)</label>
                  <select
                    name="item"
                    value={form.item}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">Device Number (Pick relevant device)</label>
                  <select
                    name="device_unit"
                    value={form.device_unit}
                    onChange={handleDeviceUnitChange}
                    required
                    disabled={!form.item}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">{form.item ? 'Select device number' : 'Choose item first'}</option>
                    {deviceUnits
                      .filter((unit) => String(unit.item) === String(form.item))
                      .map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.serial_number || `${unit.item_name || 'Item'} ${unit.id}`}
                        </option>
                      ))}
                  </select>
                  {form.item && deviceUnits.filter((unit) => String(unit.item) === String(form.item)).length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No device units available for selected item.</p>
                  )}
                </div>

                <input type="hidden" name="item" value={form.item} />
                <input type="hidden" name="location" value={form.location} />

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">Raised By <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="raised_by"
                    value={form.raised_by}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">Location <span className="text-red-500">*</span></label>
                  <select
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">Date & Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    name="raised_at"
                    value={form.raised_at}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">Problem Description <span className="text-red-500">*</span></label>
                  <textarea
                    name="problem"
                    value={form.problem}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe the issue in detail..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">Time Taken (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      name="time_taken_minutes"
                      value={form.time_taken_minutes}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">Assigned To</label>
                    <input
                      type="text"
                      name="assigned_to"
                      value={form.assigned_to}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Assignee name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">Suggestions</label>
                  <textarea
                    name="suggestions"
                    value={form.suggestions}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Any suggestions or notes..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Create Ticket
                </button>
              </form>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
