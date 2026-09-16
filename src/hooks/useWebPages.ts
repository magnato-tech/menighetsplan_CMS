import { useMemo, useCallback } from "react";
import { useMockData } from "../context/MockDataContext";
import { WebPage, ContentBlock } from "../types";

export function useWebPages() {
  const {
    webPages,
    createWebPage,
    updateWebPage,
    deleteWebPage,
    publishWebPage,
    unpublishWebPage,
    getPageBySlug,
    isFirestoreConnected,
  } = useMockData();

  const publishedPages = useMemo(
    () => webPages.filter((p) => p.status === "published"),
    [webPages]
  );

  const draftPages = useMemo(
    () => webPages.filter((p) => p.status === "draft"),
    [webPages]
  );

  const archivedPages = useMemo(
    () => webPages.filter((p) => p.status === "archived"),
    [webPages]
  );

  const addBlockToPage = useCallback(
    async (pageId: string, block: Omit<ContentBlock, "id" | "order">) => {
      const page = webPages.find((p) => p.id === pageId);
      if (!page) return { success: false, error: "Side ikke funnet" };

      const existingBlocks = page.blocks || [];
      const newBlock: ContentBlock = {
        ...block,
        id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order: existingBlocks.length,
      };

      return updateWebPage(pageId, {
        blocks: [...existingBlocks, newBlock],
      });
    },
    [webPages, updateWebPage]
  );

  const updatePageBlock = useCallback(
    async (pageId: string, blockId: string, updates: Partial<ContentBlock>) => {
      const page = webPages.find((p) => p.id === pageId);
      if (!page) return { success: false, error: "Side ikke funnet" };

      const updatedBlocks = (page.blocks || []).map((b) =>
        b.id === blockId ? { ...b, ...updates } : b
      );

      return updateWebPage(pageId, { blocks: updatedBlocks });
    },
    [webPages, updateWebPage]
  );

  const removeBlockFromPage = useCallback(
    async (pageId: string, blockId: string) => {
      const page = webPages.find((p) => p.id === pageId);
      if (!page) return { success: false, error: "Side ikke funnet" };

      const updatedBlocks = (page.blocks || [])
        .filter((b) => b.id !== blockId)
        .map((b, idx) => ({ ...b, order: idx }));

      return updateWebPage(pageId, { blocks: updatedBlocks });
    },
    [webPages, updateWebPage]
  );

  return {
    pages: webPages,
    publishedPages,
    draftPages,
    archivedPages,
    getPageBySlug,
    createPage: createWebPage,
    updatePage: updateWebPage,
    deletePage: deleteWebPage,
    publishPage: publishWebPage,
    unpublishPage: unpublishWebPage,
    addBlockToPage,
    updatePageBlock,
    removeBlockFromPage,
    isFirestoreConnected,
  };
}
