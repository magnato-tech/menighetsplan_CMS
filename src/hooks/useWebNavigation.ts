import { useMemo } from "react";
import { useMockData } from "../context/MockDataContext";
import { WebNavigationItem, WebNavigationTreeItem } from "../types";

export function useWebNavigation() {
  const {
    webNavigation,
    createWebNavigationItem,
    updateWebNavigationItem,
    deleteWebNavigationItem,
    reorderWebNavigationItem,
    toggleWebNavigationVisibility,
    isFirestoreConnected,
  } = useMockData();

  // Complete tree (both visible & hidden, used in Admin Menu Builder)
  const tree = useMemo<WebNavigationTreeItem[]>(() => {
    const roots = webNavigation
      .filter((item) => !item.parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return roots.map((root) => {
      const children = webNavigation
        .filter((child) => child.parentId === root.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      return {
        ...root,
        children,
      };
    });
  }, [webNavigation]);

  // Public visible tree (only visible parents and visible submenus, used in Header/Web)
  const visibleTree = useMemo<WebNavigationTreeItem[]>(() => {
    const visibleRoots = webNavigation
      .filter((item) => !item.parentId && item.visible)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return visibleRoots.map((root) => {
      const children = webNavigation
        .filter((child) => child.parentId === root.id && child.visible)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      return {
        ...root,
        children,
      };
    });
  }, [webNavigation]);

  return {
    items: webNavigation,
    tree,
    visibleTree,
    createItem: createWebNavigationItem,
    updateItem: updateWebNavigationItem,
    deleteItem: deleteWebNavigationItem,
    reorderItem: reorderWebNavigationItem,
    toggleVisibility: toggleWebNavigationVisibility,
    isFirestoreConnected,
  };
}
