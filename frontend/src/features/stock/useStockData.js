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
  const drawers = useStockDrawers({ showActionMsg });

  return {
    ...drawers,
    ...listing,
  };
}
