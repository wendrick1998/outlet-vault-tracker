import { StockDashboard } from "@/components/stock/StockDashboard";

interface StockProps {
  onBack: () => void;
}

export const Stock = ({ onBack }: StockProps) => {
  return <StockDashboard onBack={onBack} />;
};