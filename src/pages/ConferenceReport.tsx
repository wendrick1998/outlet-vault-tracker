import React from 'react';
import { useParams } from 'react-router-dom';
import { InventoryConferenceReport } from '@/components/InventoryConferenceReport';

export function ConferenceReport() {
  const { auditId } = useParams<{ auditId: string }>();

  if (!auditId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Relatório não encontrado</h1>
          <p className="text-muted-foreground">ID da conferência não foi fornecido.</p>
        </div>
      </div>
    );
  }

  return <InventoryConferenceReport auditId={auditId} />;
}