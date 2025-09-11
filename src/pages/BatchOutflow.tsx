import { useState } from "react";
import { Header } from "@/components/Header";
import { BatchItemSelector } from "@/components/BatchItemSelector";
import { BatchItemList } from "@/components/BatchItemList";
import { BatchOutflowForm } from "@/components/BatchOutflowForm";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface BatchOutflowProps {
  onBack: () => void;
}

type BatchFlowState = 'selecting' | 'form-filling' | 'confirming';

export const BatchOutflow = ({ onBack }: BatchOutflowProps) => {
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [flowState, setFlowState] = useState<BatchFlowState>('selecting');

  const handleItemSelected = (item: InventoryItem) => {
    // Check if item already selected
    if (selectedItems.find(i => i.imei === item.imei)) {
      return; // Already selected
    }
    
    setSelectedItems(prev => [...prev, item]);
  };

  const handleRemoveItem = (imei: string) => {
    setSelectedItems(prev => prev.filter(item => item.imei !== imei));
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  const handleProceedToForm = () => {
    setFlowState('form-filling');
  };

  const handleBackToSelection = () => {
    setFlowState('selecting');
  };

  const handleComplete = () => {
    // Reset and go back to home
    setSelectedItems([]);
    setFlowState('selecting');
    onBack();
  };

  const getBackHandler = () => {
    if (flowState === 'form-filling') {
      return handleBackToSelection;
    }
    return onBack;
  };

  const renderContent = () => {
    switch (flowState) {
      case 'selecting':
        return (
          <div className="space-y-6">
            <BatchItemSelector 
              onItemSelected={handleItemSelected}
              selectedItems={selectedItems}
            />
            {selectedItems.length > 0 && (
              <BatchItemList
                items={selectedItems}
                onRemoveItem={handleRemoveItem}
                onClearAll={handleClearAll}
                onProceed={handleProceedToForm}
              />
            )}
          </div>
        );
      
      case 'form-filling':
        return (
          <BatchOutflowForm
            items={selectedItems}
            onComplete={handleComplete}
            onCancel={handleBackToSelection}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        showBack={true} 
        onBack={getBackHandler()}
        title={flowState === 'selecting' ? 'Saída em Lote' : 'Confirmar Saída em Lote'}
      />
      
      <main className="container mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
};