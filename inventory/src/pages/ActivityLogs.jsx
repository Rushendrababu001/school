import React, { useState, useEffect } from 'react';
import { activitiesAPI, ticketsAPI } from '../services/api';

export default function ActivityLogs() {
  const [activities, setActivities] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const normalizeResults = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const [activitiesResponse, ticketsResponse] = await Promise.all([
        activitiesAPI.list(),
        ticketsAPI.list()
      ]);
      setActivities(normalizeResults(activitiesResponse.data));
      setTickets(normalizeResults(ticketsResponse.data));
    } catch (err) {
      setError('Failed to load activities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const combinedLogs = [
    ...activities.map(activity => ({ ...activity, type: 'Activity' })),
    ...tickets.map(ticket => ({ ...ticket, type: 'Ticket' }))
  ].sort((a, b) => new Date(b.created_at || b.raised_at) - new Date(a.created_at || a.raised_at));

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Activity Logs</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {combinedLogs.length > 0 ? (
          combinedLogs.map((log) => (
            <div
              key={`${log.type}-${log.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border-l-4 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start flex-1">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {log.type === 'Activity' ? log.item : log.item_name}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        log.type === 'Activity'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          : log.status === 'open'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          : log.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                          : log.status === 'resolved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'
                      }`}>
                        {log.type === 'Activity' ? log.action_display : log.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {log.type === 'Activity' ? log.description : log.problem}
                    </p>

                    <div className="flex flex-wrap gap-6 mt-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">By: </span>
                        <span className="text-gray-600 dark:text-gray-400">{log.type === 'Activity' ? log.performed_by : log.raised_by}</span>
                      </div>
                      {log.type === 'Ticket' && log.device_no && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Device: </span>
                          <span className="text-gray-600 dark:text-gray-400">{log.device_no || log.device_serial_number}</span>
                        </div>
                      )}
                      {log.type === 'Ticket' && log.assigned_to && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Assigned To: </span>
                          <span className="text-gray-600 dark:text-gray-400">{log.assigned_to}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date/Time */}
                <div className="flex-shrink-0 text-right text-sm">
                  <div className="text-gray-500 dark:text-gray-400 font-medium">
                    {new Date(log.created_at || log.raised_at).toLocaleDateString()}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(log.created_at || log.raised_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activity logs found</h3>
            <p className="text-gray-500 dark:text-gray-400">Activity logs will appear here as you use the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}
