import React from 'react';

export default function ItemsList({ items }) {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--surface)]">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text)]">Item Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text)]">Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface)]">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--bg)]">
                <td className="px-6 py-4 text-sm font-medium text-[var(--text)]">{item.name}</td>
                <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
