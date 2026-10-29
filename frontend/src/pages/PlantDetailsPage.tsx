import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { Plant, ProductionArea, Machine, CreateAreaRequest } from '../types/assets';
import { useAuth } from '../context/AuthContext';

export const PlantDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const plantId = Number(id);

  const [plant, setPlant] = useState<Plant | null>(null);
  const [areas, setAreas] = useState<ProductionArea[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Area Modal State
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [areaCode, setAreaCode] = useState('');
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [submittingArea, setSubmittingArea] = useState(false);
  const [areaModalError, setAreaModalError] = useState<string | null>(null);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'ENGINEER';

  const loadPlantData = useCallback(async () => {
    if (isNaN(plantId)) return;
    try {
      setLoading(true);
      setError(null);
      const [plantData, areasData, machinesData] = await Promise.all([
        assetService.getPlantById(plantId),
        assetService.getAreasByPlantId(plantId),
        assetService.getMachines({ plantId, size: 100 }),
      ]);
      setPlant(plantData);
      setAreas(areasData);
      setMachines(machinesData.content);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load plant details');
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    loadPlantData();
  }, [loadPlantData]);

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingArea(true);
      setAreaModalError(null);
      const req: CreateAreaRequest = {
        code: areaCode,
        name: areaName,
        description: areaDescription,
      };
      await assetService.createArea(plantId, req);
      setIsAreaModalOpen(false);
      setAreaCode('');
      setAreaName('');
      setAreaDescription('');
      await loadPlantData();
    } catch (err: any) {
      setAreaModalError(err.response?.data?.message || 'Failed to create production area');
    } finally {
      setSubmittingArea(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="space-y-4">
        <Link to="/plants" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
          ← Back to Plants
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error || 'Plant not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm font-medium text-gray-500 space-x-2">
        <Link to="/plants" className="hover:text-indigo-600">Plants</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{plant.name}</span>
      </nav>

      {/* Plant Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{plant.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {plant.code}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  plant.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {plant.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {plant.location}
            </p>
            {plant.description && (
              <p className="mt-2 text-sm text-gray-600">{plant.description}</p>
            )}
          </div>

          {canEdit && (
            <button
              onClick={() => setIsAreaModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Production Bay
            </button>
          )}
        </div>
      </div>

      {/* Production Areas & Machines Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Production Bays & Functional Areas</h2>
          <span className="text-sm text-gray-500">{areas.length} Bay{areas.length !== 1 ? 's' : ''} Configured</span>
        </div>

        {areas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            No production areas configured for this plant yet.
          </div>
        ) : (
          <div className="space-y-6">
            {areas.map((area) => {
              const areaMachines = machines.filter((m) => m.areaId === area.id);

              return (
                <div key={area.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-gray-200 text-gray-800">
                          {area.code}
                        </span>
                        <h3 className="text-base font-bold text-gray-900">{area.name}</h3>
                      </div>
                      {area.description && (
                        <p className="text-xs text-gray-500 mt-1">{area.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {areaMachines.length} Machine{areaMachines.length !== 1 ? 's' : ''} Assigned
                    </span>
                  </div>

                  {areaMachines.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">
                      No machines installed in this bay yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {areaMachines.map((machine) => (
                        <div key={machine.id} className="p-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-sm font-bold text-indigo-600">
                                {machine.machineCode}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{machine.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  machine.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : machine.status === 'MAINTENANCE'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : machine.status === 'CRITICAL'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {machine.status}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  machine.criticality === 'CRITICAL'
                                    ? 'bg-red-100 text-red-800'
                                    : machine.criticality === 'HIGH'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {machine.criticality}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {machine.machineType} • {machine.manufacturer || 'OEM'} {machine.modelNumber ? `• ${machine.modelNumber}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Link
                              to={`/machines/${machine.id}/monitoring`}
                              className="inline-flex items-center px-3 py-1.5 border border-indigo-200 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                              Live Telemetry
                            </Link>
                            <Link
                              to={`/machines/${machine.id}`}
                              className="text-xs font-medium text-gray-500 hover:text-gray-900"
                            >
                              Details →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for adding a production area */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Add Production Area</h3>
              <button onClick={() => setIsAreaModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {areaModalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-lg">
                {areaModalError}
              </div>
            )}

            <form onSubmit={handleCreateArea} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Area Code (e.g. CMP-BAY-02) *
                </label>
                <input
                  type="text"
                  required
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  placeholder="CMP-BAY-02"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Area Name *
                </label>
                <input
                  type="text"
                  required
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="CMP Polishing Bay 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={areaDescription}
                  onChange={(e) => setAreaDescription(e.target.value)}
                  placeholder="Functional details and purpose of this cleanroom bay"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingArea}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingArea ? 'Saving...' : 'Add Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlantDetailsPage;
