import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PlantsPage } from './pages/PlantsPage';
import { PlantDetailsPage } from './pages/PlantDetailsPage';
import { MachinesPage } from './pages/MachinesPage';
import { MachineDetailsPage } from './pages/MachineDetailsPage';
import { MachineMonitoringPage } from './pages/MachineMonitoringPage';
import { FeatureEngineeringPage } from './pages/FeatureEngineeringPage';
import { RulPredictionsPage } from './pages/RulPredictionsPage';
import { MachineHealthPage } from './pages/MachineHealthPage';
import { AlertsPage } from './pages/AlertsPage';
import { FederatedLearningPage } from './pages/FederatedLearningPage';
import { DigitalTwinsListPage } from './pages/DigitalTwinsListPage';
import { DigitalTwinDashboardPage } from './pages/DigitalTwinDashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Phase 3: Plant & Asset Management */}
            <Route path="/plants" element={<PlantsPage />} />
            <Route path="/plants/:id" element={<PlantDetailsPage />} />
            <Route path="/machines" element={<MachinesPage />} />
            <Route path="/machines/:id" element={<MachineDetailsPage />} />

            {/* Phase 4: Telemetry Pipeline & Monitoring */}
            <Route path="/machines/:id/monitoring" element={<MachineMonitoringPage />} />
            <Route path="/sensors" element={<Navigate to="/machines/1/monitoring" replace />} />

            {/* Phase 5: Feature Engineering */}
            <Route path="/machines/:id/features" element={<FeatureEngineeringPage />} />

            {/* Phase 6: RUL Machine Learning & Prediction */}
            <Route path="/machines/:id/predictions" element={<RulPredictionsPage />} />
            <Route path="/predictions" element={<Navigate to="/machines/1/predictions" replace />} />

            {/* Phase 7: Explainable AI & Predictive Maintenance Alerts */}
            <Route path="/machines/:id/health" element={<MachineHealthPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/maintenance" element={<Navigate to="/alerts" replace />} />

            {/* Phase 8: Federated Learning */}
            <Route
              path="/federated"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}>
                  <FederatedLearningPage />
                </ProtectedRoute>
              }
            />
            <Route path="/federated-learning" element={<Navigate to="/federated" replace />} />

            {/* Phase 9: Digital Twin */}
            <Route path="/digital-twins" element={<DigitalTwinsListPage />} />
            <Route path="/digital-twins/:id" element={<DigitalTwinDashboardPage />} />
            <Route path="/digital-twins/machine/:machineId" element={<DigitalTwinDashboardPage />} />
            <Route path="/digital-twin" element={<Navigate to="/digital-twins" replace />} />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ENGINEER']}>
                  <PlaceholderPage
                    title="Fab Analytics & OEE"
                    phase="Phase 9 (Upcoming)"
                    description="Overall Equipment Effectiveness, wafer yield correlation analysis, and throughput optimization."
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PlaceholderPage
                    title="User Management & Access Control"
                    phase="Admin Portal"
                    description="Manage platform engineers, operators, role assignments, and authentication audit trails."
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PlaceholderPage
                    title="Platform Settings & Ingestion Gateways"
                    phase="Admin Portal"
                    description="Cluster configuration, TimescaleDB hypertable policies, MQTT/Kafka edge connectors, and security secrets."
                  />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
