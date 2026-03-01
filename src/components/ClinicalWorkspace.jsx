import { Suspense, lazy, useEffect, useState } from 'react';
import RuleEditor from './RuleEditor.jsx';
import ClinicalEvaluator from './ClinicalEvaluator.jsx';
import OperatorGate from './OperatorGate.jsx';
import InventoryManager from './InventoryManager.jsx';
import EstablishmentSelector from './EstablishmentSelector.jsx';
import AppModeSelector from './AppModeSelector.jsx';
import ClinicalVariableManager from './ClinicalVariableManager.jsx';
import MainLayout from './MainLayout.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import BottomNav from './BottomNav.jsx';
import { ClinicalStoreProvider, useClinicalStore } from '../store/clinicalStore.jsx';
import { EstablishmentsStoreProvider, useEstablishmentsStore } from '../store/establishmentsStore.jsx';
import { AuditStoreProvider } from '../store/auditStore.jsx';
import { DecisionLogStoreProvider } from '../store/decisionLogStore.jsx';
import { AppModeStoreProvider, useAppModeStore } from '../store/appModeStore.jsx';
import { VariablesStoreProvider } from '../store/variablesStore.jsx';
import { NationalMedicationsStoreProvider } from '../store/nationalMedicationsStore.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';

const AuditViewer = lazy(() => import('./AuditViewer.jsx'));
const VersionControlPanel = lazy(() => import('./VersionControlPanel.jsx'));
const DecisionPanel = lazy(() => import('./DecisionPanel.jsx'));
const NationalMedicationManager = lazy(() => import('./NationalMedicationManager.jsx'));
const SystemDashboard = lazy(() => import('./SystemDashboard.jsx'));

const SpinnerFallback = () => (
  <div style={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid #cbd5e1',
        borderTopColor: '#1a56db',
        animation: 'dosifica-spin 0.9s linear infinite',
      }}
    />
    <style>{`@keyframes dosifica-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

const WorkspaceContent = () => {
  const { mode, isProduction, operatorId } = useAppModeStore();
  const { activeNtsVersion } = useClinicalStore();
  const { activeEstablishment } = useEstablishmentsStore();

  const [activeSection, setActiveSection] = useState('dashboard');
  const [compactMode, setCompactMode] = useState(false);
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isTablet);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSidebarCollapsed(isTablet);
  }, [isTablet]);

  const sections = {
    dashboard: <SystemDashboard filterText={searchTerm} />,
    evaluacion: (
      <>
        {isProduction && !operatorId && <OperatorGate />}
        <ClinicalEvaluator onEditRelatedRules={() => setActiveSection('reglas')} />
      </>
    ),
    reglas: <RuleEditor filterText={searchTerm} />,
    variables: <ClinicalVariableManager />,
    inventario: <InventoryManager />,
    petitorio: <NationalMedicationManager />,
    auditoria: <AuditViewer />,
    decisiones: <DecisionPanel />,
    versionado: <VersionControlPanel />,
    establecimientos: <EstablishmentSelector />,
  };

  const renderSection = sections[activeSection];

  return (
    <MainLayout
      compactMode={compactMode}
      sidebar={(
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        />
      )}
      topbar={(
        <TopBar
          mode={mode}
          activeNtsVersion={activeNtsVersion}
          activeEstablishment={activeEstablishment}
          compactMode={compactMode}
          onToggleCompact={() => setCompactMode((prev) => !prev)}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}
      bottomNav={<BottomNav activeSection={activeSection} onSelectSection={setActiveSection} />}
    >
      <AppModeSelector />
      <Suspense fallback={<SpinnerFallback />}>
        {renderSection}
      </Suspense>
    </MainLayout>
  );
};

/**
 * Pantalla integrada del motor clínico.
 */
const ClinicalWorkspace = () => {
  return (
    <AppModeStoreProvider>
      <VariablesStoreProvider>
        <NationalMedicationsStoreProvider>
          <ClinicalStoreProvider>
            <EstablishmentsStoreProvider>
              <AuditStoreProvider>
                <DecisionLogStoreProvider>
                  <WorkspaceContent />
                </DecisionLogStoreProvider>
              </AuditStoreProvider>
            </EstablishmentsStoreProvider>
          </ClinicalStoreProvider>
        </NationalMedicationsStoreProvider>
      </VariablesStoreProvider>
    </AppModeStoreProvider>
  );
};

export default ClinicalWorkspace;
