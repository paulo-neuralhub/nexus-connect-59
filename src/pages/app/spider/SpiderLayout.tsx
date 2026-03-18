import { Outlet } from 'react-router-dom';
import { ModuleGate } from '@/components/common/ModuleGate';

export default function SpiderLayout() {
  return (
    <ModuleGate module="spider">
      <Outlet />
    </ModuleGate>
  );
}
