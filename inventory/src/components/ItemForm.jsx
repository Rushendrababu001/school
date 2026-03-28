import React, { useState } from 'react';

export default function ItemForm({ item, onSubmit }) {
  const [formData, setFormData] = useState(item || {
    name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' ? parseInt(value, 10) || 1 : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-xl font-bold text-[var(--text)] mb-6">
        {item ? 'Edit Item' : 'Add New Item'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            Item Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-base"
            placeholder="e.g., CPU"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="submit" className="btn-primary">
          {item ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}
