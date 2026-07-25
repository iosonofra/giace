import { DashboardIngestionWidgets } from './DashboardIngestionWidgets';
import { DashboardOperationsWidgets } from './DashboardOperationsWidgets';
import { DashboardOverview } from './DashboardOverview';


export function DashboardPage({ dashboard }) {
  return (
    <>
      <DashboardOverview dashboard={dashboard} />
      <div className="dashboard-grid">
        <DashboardIngestionWidgets dashboard={dashboard} />
        <DashboardOperationsWidgets dashboard={dashboard} />
      </div>
    </>
  );
}
