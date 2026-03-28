import React, { useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    item_list: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsResponse, itemsResponse] = await Promise.all([
        itemsAPI.dashboardStats(),
        itemsAPI.list(),
      ]);
      const data = statsResponse.data || {};
      const fetchedItems = Array.isArray(data.item_list)
        ? data.item_list
        : itemsResponse.data;

      setStats({
        item_list: fetchedItems,
        total_items: data.total_items || fetchedItems.length,
        total_quantity: data.total_quantity || 0,
        damaged_items: data.damaged_items || 0,
        under_repair_items: data.under_repair_items || 0,
        low_stock_items: data.low_stock_items || 0,
      });
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stats.item_list.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600">
              <div className="text-center space-y-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{item.name}</h3>
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400">{item.quantity}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
