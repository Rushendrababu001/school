import React, { useState, useEffect } from 'react';
import { locationsAPI } from '../services/api';
import LocationForm from '../components/LocationForm';
import LocationsList from '../components/LocationsList';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsAPI.list();
      setLocations(response.data);
    } catch (err) {
      setError('Failed to load locations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingLocation) {
        await locationsAPI.update(editingLocation.id, formData);
      } else {
        await locationsAPI.create(formData);
      }
      setShowForm(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (err) {
      setError('Failed to save location');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await locationsAPI.delete(id);
        fetchLocations();
      } catch (err) {
        setError('Failed to delete location');
        console.error(err);
      }
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[var(--text)]">Location Management</h1>
        <button
          onClick={() => {
            setEditingLocation(null);
            setShowForm(!showForm);
          }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Location'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          {error}
        </div>
      )}

      {showForm && (
        <LocationForm
          location={editingLocation}
          onSubmit={handleSubmit}
        />
      )}

      <LocationsList
        locations={locations}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
