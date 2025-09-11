import { useState } from "react";
import { Header } from "@/components/Header";
import { IMEISearch } from "@/components/IMEISearch";
import { ItemCard } from "@/components/ItemCard";
import { ItemSelectionList } from "@/components/ItemSelectionList";
import { OutflowForm } from "@/components/OutflowForm";
import { InflowActions } from "@/components/InflowActions";
import { NotesDialog } from "@/components/NotesDialog";
import { OutflowSuccess } from "@/components/OutflowSuccess";
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface SearchAndRegisterProps {
  onBack: () => void;
}

type ViewState = 'search' | 'multiple-results' | 'item-details' | 'outflow-form' | 'inflow-actions' | 'notes-dialog' | 'outflow-success';

export const SearchAndRegister = ({ onBack }: SearchAndRegisterProps) => {
  const [viewState, setViewState] = useState<ViewState>('search');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [multipleItems, setMultipleItems] = useState<InventoryItem[]>([]);

  const handleItemFound = (item: InventoryItem) => {
    setSelectedItem(item);
    setViewState('item-details');
  };

  const handleMultipleFound = (items: InventoryItem[]) => {
    setMultipleItems(items);
    setViewState('multiple-results');
  };

  const handleItemSelected = (item: InventoryItem) => {
    setSelectedItem(item);
    setViewState('item-details');
  };

  const handleRegisterOutflow = () => {
    setViewState('outflow-form');
  };

  const handleInflowActions = () => {
    setViewState('inflow-actions');
  };

  const handleViewNotes = () => {
    setViewState('notes-dialog');
  };

  const handleBackToSearch = () => {
    setViewState('search');
    setSelectedItem(null);
    setMultipleItems([]);
  };

  const handleOutflowComplete = () => {
    // Status will be updated automatically by database triggers
    setViewState('outflow-success');
  };

  const handleAddAnother = () => {
    setViewState('search');
    setSelectedItem(null);
    setMultipleItems([]);
  };

  const handleBackToMenu = () => {
    onBack();
  };

  const handleInflowComplete = () => {
    // Update item status based on action (mock)
    handleBackToSearch();
  };

  const renderContent = () => {
    switch (viewState) {
      case 'search':
        return (
          <IMEISearch 
            onItemFound={handleItemFound}
            onMultipleFound={handleMultipleFound}
          />
        );

      case 'multiple-results':
        return (
          <ItemSelectionList
            items={multipleItems}
            onSelectItem={handleItemSelected}
            onBack={handleBackToSearch}
          />
        );

      case 'item-details':
        return selectedItem ? (
          <ItemCard
            item={selectedItem}
            onRegisterOutflow={handleRegisterOutflow}
            onReturn={handleInflowActions}
            onMarkSold={handleInflowActions}
            onViewNotes={handleViewNotes}
            onAddNote={handleViewNotes}
          />
        ) : null;

      case 'outflow-form':
        return selectedItem ? (
          <OutflowForm
            item={selectedItem}
            onComplete={handleOutflowComplete}
            onCancel={() => setViewState('item-details')}
          />
        ) : null;

      case 'inflow-actions':
        return selectedItem ? (
          <InflowActions
            item={selectedItem}
            onComplete={handleInflowComplete}
            onCancel={() => setViewState('item-details')}
          />
        ) : null;

      case 'notes-dialog':
        return selectedItem ? (
          <NotesDialog
            item={selectedItem}
            onClose={() => setViewState('item-details')}
          />
        ) : null;

      case 'outflow-success':
        return selectedItem ? (
          <OutflowSuccess
            item={selectedItem}
            onAddAnother={handleAddAnother}
            onBackToMenu={handleBackToMenu}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Buscar & Registrar"
        showBack={true}
        onBack={viewState === 'search' ? onBack : handleBackToSearch}
      />
      
      <main className="container mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
};