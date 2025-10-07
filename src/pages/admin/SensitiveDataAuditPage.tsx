import { SensitiveDataAudit } from '@/components/SensitiveDataAudit';
import { RoleGuard } from '@/components/RoleGuard';

export default function SensitiveDataAuditPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']}>
      <div className="container mx-auto p-6">
        <SensitiveDataAudit />
      </div>
    </RoleGuard>
  );
}
