import { StockSyncCards } from './StockSyncCards';
import { StockTablePanel } from './StockTablePanel';


export function StockPage({ stock }) {
  return (
    <>
      <StockSyncCards stock={stock} />
      <StockTablePanel stock={stock} />
    </>
  );
}
