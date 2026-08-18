import { useAssociatedProductStock } from './useAssociatedProductStock';
import { useStockDrawers } from './useStockDrawers';
import { useStockListing } from './useStockListing';


export function useStockData({
  active,
  ensureLoaded,
  refreshKey,
  setTabLoading,
  showActionMsg,
}) {
  const listing = useStockListing({
    active,
    ensureLoaded,
    refreshKey,
    setTabLoading,
  });
  const associatedProducts = useAssociatedProductStock({
    active: active && listing.stockViewMode === 'products',
    refreshKey,
    stockRows: listing.stockData,
  });
  const drawers = useStockDrawers({ showActionMsg });

  return {
    ...drawers,
    ...listing,
    ...associatedProducts,
  };
}
