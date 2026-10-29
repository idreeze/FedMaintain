import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { Machine, Plant, ProductionArea, MachineStatus, MachineCriticality, CreateMachineRequest } from '../types/assets';
import { useAuth } from '../context/AuthContext';

export const MachinesPage: React.FC = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>();
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<MachineStatus | ''>('');
  const [selectedCriticality, setSelectedCriticality] = useState<MachineCriticality | ''>('');

  // Dropdown options
  const [plants, setPlants] = useState<Plant[]>([]);
  const [areas, setAreas] = useState<ProductionArea[]>([]);

  // Create Machine Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formAreaId, setFormAreaId] = useState<number | ''>('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('CMP');
  const [formManufacturer, setFormManufacturer] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formCriticality, setFormCriticality] = useState<MachineCriticality>('MEDIUM');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'ENGINEER';

  // Load plants for dropdown
  useEffect(() => {
    assetService.getAllPlants().then(setPlants).catch(console.error);
  }, []);

  // Load areas when plant filter changes
  useEffect(() => {
    if (selectedPlantId) {
      assetService.getAreasByPlantId(selectedPlantId).then(setAreas).catch(console.error);
    } else {
      setAreas([]);
      setSelectedAreaId(undefined);
    }
  }, [selectedPlantId]);

  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assetService.getMachines({
        search: search || undefined,
        plantId: selectedPlantId,
        areaId: selectedAreaId,
        status: (selectedStatus as MachineStatus) || undefined,
        criticality: (selectedCriticality as MachineCriticality) || undefined,
        page,
        size: 10,
        sortBy: 'machineCode',
        direction: 'asc',
      });
      setMachines(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch machines');
    } finally {
      setLoading(false);
    }
  }, [search, selectedPlantId, selectedAreaId, selectedStatus, selectedCriticality, page]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAreaId) {
      setModalError('Please select a production area');
      return;
    }

    try {
      setFormSubmitting(true);
      setModalError(null);
      const req: CreateMachineRequest = {
        machineCode: formCode,
        name: formName,
        machineType: formType,
        manufacturer: formManufacturer,
        modelNumber: formModel,
        serialNumber: formSerial,
        criticality: formCriticality,
      };
      await assetService.createMachine(Number(formAreaId), req);
      setIsCreateOpen(false);
      // Reset form
      setFormCode('');
      setFormName('');
      setFormManufacturer('');
      setFormModel('');
      setFormSerial('');
      await fetchMachines();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to register machine');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Machine Fleet</h1>
          <p className="text-sm text-gray-500 mt-1">
            Semiconductor production tools, wafer processing equipment, and digital twins
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Register Tool
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Search Tools
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by code, model, name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Plant
            </label>
            <select
              value={selectedPlantId || ''}
              onChange={(e) => {
                setSelectedPlantId(e.target.value ? Number(e.target.value) : undefined);
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Plants</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as MachineStatus | '');
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DECOMMISSIONED">DECOMMISSIONED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Criticality
            </label>
            <select
              value={selectedCriticality}
              onChange={(e) => {
                setSelectedCriticality(e.target.value as MachineCriticality | '');
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Criticality</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Machines Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : machines.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-base font-medium text-gray-900">No equipment matches criteria</p>
            <p className="text-sm text-gray-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Machine Code</th>
                  <th className="px-6 py-3">Model & Manufacturer</th>
                  <th className="px-6 py-3">Plant / Area</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Criticality</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {machines.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-600">{m.machineCode}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono">
                          {m.machineType}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{m.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 font-medium">{m.manufacturer || 'OEM'}</div>
                      <div className="text-xs text-gray-500">{m.modelNumber || 'Standard'} • S/N: {m.serialNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 font-medium">{m.plantCode}</div>
                      <div className="text-xs text-gray-500">{m.areaName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : m.status === 'MAINTENANCE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : m.status === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {m.status === 'ACTIVE' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        )}
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                          m.criticality === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : m.criticality === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {m.criticality}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Link
                        to={`/machines/${m.id}/monitoring`}
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                        Telemetry
                      </Link>
                      <Link
                        to={`/machines/${m.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing page {page + 1} of {totalPages} ({totalElements} tools total)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-medium disabled:opacity-50 hover:bg-white"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-medium disabled:opacity-50 hover:bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Machine Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Register Semiconductor Tool</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateMachine} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Plant & Production Bay *
                </label>
                <select
                  required
                  value={formAreaId}
                  onChange={(e) => setFormAreaId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Target Bay</option>
                  {plants.map((p) => (
                    <optgroup key={p.id} label={`${p.code} - ${p.name}`}>
                      {/* If areas are not preloaded for other plants, user can pick current plant */}
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {areas.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Tip: Select a Plant filter above or create a bay in the plant view first.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Machine Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CMP-002"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Tool Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="CMP">CMP (Planarization)</option>
                    <option value="ETCH">ETCH (Plasma Etcher)</option>
                    <option value="CVD">CVD (Vapor Deposition)</option>
                    <option value="PVD">PVD (Physical Sputtering)</option>
                    <option value="LITHO">LITHO (Photolithography)</option>
                    <option value="CLEAN">CLEAN (Wet Bench)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Machine Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Applied Materials Reflexion LK Secondary"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="Applied Materials"
                    value={formManufacturer}
                    onChange={(e) => setFormManufacturer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Model Number
                  </label>
                  <input
                    type="text"
                    placeholder="Reflexion LK"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="AMAT-2024-CMP-902"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Operational Criticality
                  </label>
                  <select
                    value={formCriticality}
                    onChange={(e) => setFormCriticality(e.target.value as MachineCriticality)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {formSubmitting ? 'Registering...' : 'Register Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MachinesPage;
