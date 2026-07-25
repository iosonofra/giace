import { useEffect } from 'react';

export function useAppShellEffects({
  activeTab,
  selectedSkuForOrders,
  selectedSkuForProducts,
  setActiveTab,
  setIsAssociationModalOpen,
  setIsMobileSidebarOpen,
  setSelectedSkuForOrders,
  setSelectedSkuForProducts,
  setShowClearAnomaliesConfirm,
  setShowDeleteAssociationConfirm,
  setShowRestoreConfirm,
  setTimeTick,
  theme,
}) {
  useEffect(() => {
    document.body.classList.toggle(
      'light-theme',
      theme === 'light',
    );
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeTab, setIsMobileSidebarOpen]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const drawerOpen = Boolean(
      selectedSkuForOrders || selectedSkuForProducts,
    );

    root.classList.toggle('drawer-open', drawerOpen);
    body.classList.toggle('drawer-open', drawerOpen);

    return () => {
      root.classList.remove('drawer-open');
      body.classList.remove('drawer-open');
    };
  }, [selectedSkuForOrders, selectedSkuForProducts]);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setIsAssociationModalOpen(false);
        setSelectedSkuForOrders(null);
        setSelectedSkuForProducts(null);
        setShowRestoreConfirm(false);
        setShowClearAnomaliesConfirm(false);
        setShowDeleteAssociationConfirm(false);
        setIsMobileSidebarOpen(false);
      }

      if (
        event.altKey
        && event.key >= '1'
        && event.key <= '7'
      ) {
        event.preventDefault();
        const targetTab = {
          1: 'dashboard',
          2: 'stock',
          3: 'associations',
          4: 'orders',
          5: 'picking',
          6: 'anomalies',
          7: 'settings',
        }[event.key];
        if (targetTab) setActiveTab(targetTab);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    setActiveTab,
    setIsAssociationModalOpen,
    setIsMobileSidebarOpen,
    setSelectedSkuForOrders,
    setSelectedSkuForProducts,
    setShowClearAnomaliesConfirm,
    setShowDeleteAssociationConfirm,
    setShowRestoreConfirm,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, [setTimeTick]);
}
