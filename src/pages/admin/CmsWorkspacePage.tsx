import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMockData } from "../../context/MockDataContext";
import {
  WebPage,
  WebNavigationItem,
  ContentBlock,
  ContentBlockType,
  WebPageStatus,
} from "../../types";
import { TiptapEditor } from "../../components/admin/web/TiptapEditor";
import { CmsPreviewModal } from "../../components/admin/web/CmsPreviewModal";
import {
  Globe,
  FileText,
  Menu as MenuIcon,
  Calendar,
  Image as ImageIcon,
  Settings,
  ArrowLeft,
  Search,
  Plus,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  HelpCircle,
  MoveUp,
  MoveDown,
  Compass,
  Link as LinkIcon,
  Tag,
  AlertCircle,
  FolderTree,
  RotateCcw,
  CornerDownRight,
  Layers,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export const CmsWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    webPages,
    webNavigation,
    gatherings,
    createWebPage,
    updateWebPage,
    deleteWebPage,
    createWebNavigationItem,
    updateWebNavigationItem,
    deleteWebNavigationItem,
    reorderWebNavigationItem,
    toggleWebNavigationVisibility,
    isFirestoreConnected,
  } = useMockData();

  // Active module: "pages" (Sider) | "menu" (Meny) | "calendar" (Samlinger) | "media" (Bilder) | "settings" (Innstillinger)
  const [activeModule, setActiveModule] = useState<"pages" | "menu" | "calendar" | "media" | "settings">("pages");

  // Selection states
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Search and tree filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    menuRoot: true,
    standaloneRoot: true,
  });

  // Editor working copy state
  const [editingPage, setEditingPage] = useState<WebPage | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Inspector & Preview states
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Auto-select first page if none selected
  useEffect(() => {
    if (!selectedPageId && webPages.length > 0) {
      const firstPage = webPages[0];
      setSelectedPageId(firstPage.id);
      setEditingPage({ ...firstPage, blocks: firstPage.blocks ? [...firstPage.blocks] : [] });
      setHasUnsavedChanges(false);
    }
  }, [webPages, selectedPageId]);

  // When selectedPageId changes externally, load page into editor
  const handleSelectPage = (pageId: string) => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        "Du har ulagrede endringer på denne siden. Vil du forkaste endringene og bytte side?"
      );
      if (!confirmDiscard) return;
    }

    setSelectedPageId(pageId);
    setSelectedMenuItemId(null);
    setSelectedBlockId(null);

    const page = webPages.find((p) => p.id === pageId);
    if (page) {
      setEditingPage({
        ...page,
        blocks: page.blocks ? [...page.blocks] : [],
      });
      setHasUnsavedChanges(false);
    }
  };

  const handleSelectMenuItem = (menuItemId: string) => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        "Du har ulagrede endringer på denne siden. Vil du forkaste endringene og bytte til menypunkt?"
      );
      if (!confirmDiscard) return;
    }

    setSelectedMenuItemId(menuItemId);
    setSelectedPageId(null);
    setSelectedBlockId(null);
    setEditingPage(null);
    setHasUnsavedChanges(false);
  };

  // Toggle tree folders
  const toggleFolder = (key: string) => {
    setExpandedFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Keyboard shortcut Ctrl+S / Cmd+S for quick saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveCurrentPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Warn before leaving or closing tab if user has unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Menu item actions (Pilot 1 integration)
  const handleCreateMenuItem = async (defaultParentId: string | null = null) => {
    const label = window.prompt("Hva skal det nye menypunktet hete?", "Nytt menypunkt");
    if (!label || !label.trim()) return;

    const res = await createWebNavigationItem({
      label: label.trim(),
      parentId: defaultParentId || null,
      type: "page",
      target: "",
      visible: true,
      order: webNavigation.length,
    });

    if (res.success && res.item) {
      setSelectedMenuItemId(res.item.id);
      setSelectedPageId(null);
      setEditingPage(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleDeleteMenuItem = async (id: string, label: string) => {
    const confirm = window.confirm(`Er du sikker på at du vil slette menypunktet «${label}»?`);
    if (!confirm) return;

    await deleteWebNavigationItem(id);
    if (selectedMenuItemId === id) {
      setSelectedMenuItemId(null);
    }
  };

  const handleReorderMenuItem = async (id: string, direction: "up" | "down", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await reorderWebNavigationItem(id, direction);
  };

  const handleToggleMenuItemVisibility = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await toggleWebNavigationVisibility(id);
  };

  // Save current editing page
  const handleSaveCurrentPage = async () => {
    if (!editingPage) return;
    setIsSaving(true);

    try {
      await updateWebPage(editingPage.id, {
        title: editingPage.title,
        slug: editingPage.slug,
        ingress: editingPage.ingress || "",
        bodyText: editingPage.bodyText || "",
        imageUrl: editingPage.imageUrl || "",
        status: editingPage.status,
        blocks: editingPage.blocks || [],
      });

      const now = new Date();
      const timeString = now.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSavedTime(timeString);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Feil ved lagring av side:", err);
      alert("Kunne ikke lagre siden. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle publish/draft
  const handleTogglePublish = async () => {
    if (!editingPage) return;
    const newStatus: WebPageStatus = editingPage.status === "published" ? "draft" : "published";
    setEditingPage((prev) => (prev ? { ...prev, status: newStatus } : null));
    setHasUnsavedChanges(true);
  };

  // Create new page
  const handleCreateNewPage = async () => {
    const title = window.prompt("Hva skal den nye siden hete?", "Ny side");
    if (!title || !title.trim()) return;

    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[æ]/g, "ae")
      .replace(/[ø]/g, "o")
      .replace(/[å]/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const res = await createWebPage({
      title: title.trim(),
      slug: baseSlug || "side",
      ingress: "Kort oppsummering eller ingress for siden.",
      bodyText: `<p>Her skriver du hovedinnholdet for <strong>${title.trim()}</strong>.</p>`,
      status: "draft",
      imageUrl: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1200&auto=format&fit=crop&q=80",
      blocks: [],
    });

    if (res.success && res.page) {
      setSelectedPageId(res.page.id);
      setSelectedMenuItemId(null);
      setEditingPage({ ...res.page, blocks: res.page.blocks || [] });
      setHasUnsavedChanges(false);
    }
  };

  // Delete page
  const handleDeletePage = async (pageId: string, pageTitle: string) => {
    const confirm = window.confirm(`Er du sikker på at du vil slette siden "${pageTitle}"?`);
    if (!confirm) return;

    await deleteWebPage(pageId);
    if (selectedPageId === pageId) {
      const remaining = webPages.filter((p) => p.id !== pageId);
      if (remaining.length > 0) {
        handleSelectPage(remaining[0].id);
      } else {
        setSelectedPageId(null);
        setEditingPage(null);
      }
    }
  };

  // Block management
  const handleAddBlock = (type: ContentBlockType) => {
    if (!editingPage) return;
    const currentBlocks = editingPage.blocks || [];
    const newBlockId = `block_${Date.now()}`;

    let newBlock: ContentBlock = {
      id: newBlockId,
      type,
      order: currentBlocks.length,
    };

    switch (type) {
      case "heading":
        newBlock = {
          ...newBlock,
          headingText: "Ny overskrift",
          headingLevel: "h2",
        };
        break;
      case "text":
        newBlock = {
          ...newBlock,
          text: "Skriv avsnittstekst her...",
        };
        break;
      case "image":
        newBlock = {
          ...newBlock,
          imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80",
          imageCaption: "Bildetekst",
        };
        break;
      case "button":
        newBlock = {
          ...newBlock,
          buttonLabel: "Les mer eller meld deg på",
          buttonUrl: "/kontakt",
          buttonVariant: "primary",
        };
        break;
      case "quote":
        newBlock = {
          ...newBlock,
          quoteText: "Et inspirerende sitat eller bibelord...",
          quoteAuthor: "Navn på forfatter",
        };
        break;
      case "gathering":
        newBlock = {
          ...newBlock,
          gatheringId: gatherings[0]?.id || "",
          gatheringTitle: gatherings[0]?.title || "Gudstjeneste",
        };
        break;
    }

    const updatedBlocks = [...currentBlocks, newBlock];
    setEditingPage({ ...editingPage, blocks: updatedBlocks });
    setSelectedBlockId(newBlockId);
    setHasUnsavedChanges(true);
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    if (!editingPage) return;
    const updatedBlocks = (editingPage.blocks || []).map((b) =>
      b.id === blockId ? { ...b, ...updates } : b
    );
    setEditingPage({ ...editingPage, blocks: updatedBlocks });
    setHasUnsavedChanges(true);
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    if (!editingPage || !editingPage.blocks) return;
    const blocks = [...editingPage.blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;

    // re-assign orders
    const reordered = blocks.map((b, idx) => ({ ...b, order: idx }));
    setEditingPage({ ...editingPage, blocks: reordered });
    setHasUnsavedChanges(true);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!editingPage || !editingPage.blocks) return;
    const updated = editingPage.blocks.filter((b) => b.id !== blockId);
    setEditingPage({ ...editingPage, blocks: updated });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    setHasUnsavedChanges(true);
  };

  // Filtered pages for the tree
  const filteredPages = useMemo(() => {
    return webPages.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && p.status === "published") ||
        (statusFilter === "draft" && p.status === "draft") ||
        (statusFilter === "archived" && p.status === "archived");
      return matchesSearch && matchesStatus;
    });
  }, [webPages, searchQuery, statusFilter]);

  // Selected block helper
  const selectedBlock = useMemo(() => {
    if (!editingPage || !editingPage.blocks || !selectedBlockId) return null;
    return editingPage.blocks.find((b) => b.id === selectedBlockId) || null;
  }, [editingPage, selectedBlockId]);

  // Active selected menu item (if menu item selected in tree)
  const activeMenuItem = useMemo(() => {
    if (!selectedMenuItemId) return null;
    return webNavigation.find((m) => m.id === selectedMenuItemId) || null;
  }, [selectedMenuItemId, webNavigation]);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden select-none">
      {/* ============================================================ */}
      {/* TOP HEADER BAR                                               */}
      {/* ============================================================ */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Branding & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-semibold border border-slate-800"
            title="Tilbake til Menighetsplan Admin"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Menighetsplan</span>
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[11px] font-bold">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>Web Admin</span>
            </span>

            {isFirestoreConnected && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firestore Live
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 pl-2">
            <span>/</span>
            <span>Nettsider</span>
            {editingPage && (
              <>
                <span>/</span>
                <span className="text-white font-semibold truncate max-w-xs">
                  {editingPage.title}
                </span>
                <span className="text-[11px] font-mono text-indigo-400">
                  ({editingPage.slug.startsWith("/") ? editingPage.slug : `/${editingPage.slug}`})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center: Save indicator */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-700 text-amber-300 text-xs font-medium animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Ulagrede endringer</span>
            </span>
          ) : lastSavedTime ? (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lagret kl. {lastSavedTime}</span>
            </span>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {editingPage && (
            <>
              {/* Quick Publish Toggle */}
              <button
                type="button"
                onClick={handleTogglePublish}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  editingPage.status === "published"
                    ? "bg-emerald-950/90 text-emerald-300 border border-emerald-700 hover:bg-emerald-900"
                    : "bg-amber-950/90 text-amber-300 border border-amber-700 hover:bg-amber-900"
                }`}
                title="Klikk for å endre status"
              >
                {editingPage.status === "published" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Publisert</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Utkast</span>
                  </>
                )}
              </button>

              {/* Preview Button */}
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                title="Forhåndsvis i ekte design (mobil/desktop)"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Forhåndsvis</span>
              </button>

              {/* Live Web Link */}
              <a
                href={editingPage.slug.startsWith("/") ? editingPage.slug : `/${editingPage.slug}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Åpne på offentlig nettside"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveCurrentPage}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
                title="Lagre endringer (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Lagrer..." : "Lagre"}</span>
              </button>
            </>
          )}

          {/* Toggle Inspector Panel */}
          <button
            type="button"
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isInspectorOpen
                ? "bg-slate-800 text-indigo-400 border border-indigo-800/60"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
            }`}
            title={isInspectorOpen ? "Skjul innstillingspanel" : "Vis innstillingspanel"}
          >
            {isInspectorOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 4-COLUMN WORKSPACE BODY                                       */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ------------------------------------------------------------ */}
        {/* SONE 1: MODUL-IKONSTRIPE (VENSTREYTTERST ~60px)              */}
        {/* ------------------------------------------------------------ */}
        <aside className="w-14 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-3 gap-2 shrink-0 z-10">
          <button
            type="button"
            onClick={() => setActiveModule("pages")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
              activeModule === "pages"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
            title="Sider (CMS-innhold)"
          >
            <FileText className="w-4 h-4" />
            <span className="sr-only">Sider</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule("menu")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
              activeModule === "menu"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
            title="Meny & Navigasjon (Pilot 1)"
          >
            <MenuIcon className="w-4 h-4" />
            <span className="sr-only">Meny</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule("calendar")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
              activeModule === "calendar"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
            title="Offentlig Kalender (Samlinger)"
          >
            <Calendar className="w-4 h-4" />
            <span className="sr-only">Kalender</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule("media")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
              activeModule === "media"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
            title="Bilder & Mediebibliotek"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="sr-only">Bilder</span>
          </button>

          <div className="w-8 h-px bg-slate-800 my-1" />

          <button
            type="button"
            onClick={() => setActiveModule("settings")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
              activeModule === "settings"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
            title="Innstillinger & SEO"
          >
            <Settings className="w-4 h-4" />
            <span className="sr-only">Innstillinger</span>
          </button>

          <div className="mt-auto">
            <Link
              to="/admin"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
              title="Gå til intern menighetsapp"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </aside>

        {/* ------------------------------------------------------------ */}
        {/* SONE 2: NAVIGASJONSTRE & STRUKTUR (~280px)                   */}
        {/* ------------------------------------------------------------ */}
        <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          {/* Header of Tree: Search and Quick Add */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Innholdsstruktur
              </span>
              <button
                type="button"
                onClick={handleCreateNewPage}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                title="Opprett ny side"
              >
                <Plus className="w-3 h-3" />
                <span>Ny side</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk i sider og menyer..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center gap-1 text-[10px]">
              {(["all", "published", "draft"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    statusFilter === status
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  {status === "all"
                    ? `Alle (${webPages.length})`
                    : status === "published"
                    ? "Publisert"
                    : "Utkast"}
                </button>
              ))}
            </div>
          </div>

          {/* Tree Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
            {/* SECTION 1: Hovedmeny & Tilknyttede sider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1 py-1">
                <button
                  type="button"
                  onClick={() => toggleFolder("menuRoot")}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 font-bold text-[11px] uppercase tracking-wider text-left cursor-pointer"
                >
                  {expandedFolders.menuRoot ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nettstedets Navigasjon</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateMenuItem()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Opprett nytt toppnivå-menypunkt"
                >
                  <Plus className="w-3 h-3 text-indigo-400" />
                  <span>Nytt punkt</span>
                </button>
              </div>

              {expandedFolders.menuRoot && (
                <div className="pl-2 space-y-0.5 border-l border-slate-800/60 ml-3">
                  {/* Forside item */}
                  <div
                    onClick={() => {
                      const homePage = webPages.find((p) => p.slug === "forside" || p.slug === "");
                      if (homePage) handleSelectPage(homePage.id);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800/60 cursor-pointer group"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400" />
                    <span className="font-semibold text-xs">Forside</span>
                    <span className="ml-auto text-[10px] text-slate-500 font-mono">/</span>
                  </div>

                  {/* Dynamic menu items from Pilot 1 */}
                  {webNavigation
                    .filter((item) => !item.parentId)
                    .sort((a, b) => a.order - b.order)
                    .map((parent, parentIdx, allParents) => {
                      const children = webNavigation.filter((c) => c.parentId === parent.id);
                      const isFolderExpanded = expandedFolders[`menu_${parent.id}`] ?? true;

                      // Check if there is a matching CMS page for this parent
                      const matchingPage = webPages.find(
                        (p) =>
                          parent.target &&
                          (parent.target === `/${p.slug}` || parent.target === p.slug)
                      );

                      const isSelected = selectedMenuItemId === parent.id || (matchingPage && selectedPageId === matchingPage.id);

                      return (
                        <div key={parent.id} className="space-y-0.5">
                          {/* Parent menu row */}
                          <div
                            onClick={() => {
                              if (matchingPage) {
                                handleSelectPage(matchingPage.id);
                              } else {
                                handleSelectMenuItem(parent.id);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group relative ${
                              isSelected
                                ? "bg-indigo-950/90 text-white font-bold border border-indigo-800/60"
                                : "text-slate-300 hover:bg-slate-800/60"
                            } ${!parent.visible ? "opacity-60" : ""}`}
                          >
                            {children.length > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFolder(`menu_${parent.id}`);
                                }}
                                className="p-0.5 hover:text-white text-slate-400"
                              >
                                {isFolderExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </button>
                            ) : (
                              <Layers className="w-3 h-3 text-slate-500" />
                            )}

                            <span className="truncate flex-1 text-xs">{parent.label}</span>

                            {matchingPage ? (
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  matchingPage.status === "published"
                                    ? "bg-emerald-400"
                                    : "bg-amber-400"
                                }`}
                                title={matchingPage.status === "published" ? "Publisert side" : "Utkast-side"}
                              />
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {parent.type}
                              </span>
                            )}

                            {/* Hover Quick Actions */}
                            <div
                              className="hidden group-hover:flex items-center gap-0.5 bg-slate-900/95 border border-slate-700/80 rounded-md p-0.5 shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) => handleToggleMenuItemVisibility(parent.id, e)}
                                className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
                                title={parent.visible ? "Skjul fra meny" : "Gjør synlig i meny"}
                              >
                                {parent.visible ? (
                                  <Eye className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <EyeOff className="w-2.5 h-2.5 text-slate-500" />
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={parentIdx === 0}
                                onClick={(e) => handleReorderMenuItem(parent.id, "up", e)}
                                className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800 disabled:opacity-20"
                                title="Flytt opp"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>

                              <button
                                type="button"
                                disabled={parentIdx === allParents.length - 1}
                                onClick={(e) => handleReorderMenuItem(parent.id, "down", e)}
                                className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800 disabled:opacity-20"
                                title="Flytt ned"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCreateMenuItem(parent.id)}
                                className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
                                title="Legg til undermeny"
                              >
                                <Plus className="w-2.5 h-2.5 text-indigo-400" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectMenuItem(parent.id)}
                                className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
                                title="Menypunkt-innstillinger"
                              >
                                <Settings className="w-2.5 h-2.5 text-slate-300" />
                              </button>
                            </div>
                          </div>

                          {/* Children */}
                          {children.length > 0 && isFolderExpanded && (
                            <div className="pl-4 space-y-0.5 border-l border-slate-800/60 ml-3">
                              {children
                                .sort((a, b) => a.order - b.order)
                                .map((child, childIdx, allChildren) => {
                                  const childPage = webPages.find(
                                    (p) =>
                                      child.target &&
                                      (child.target === `/${p.slug}` || child.target === p.slug)
                                  );

                                  const isChildSelected = selectedMenuItemId === child.id || (childPage && selectedPageId === childPage.id);

                                  return (
                                    <div
                                      key={child.id}
                                      onClick={() => {
                                        if (childPage) {
                                          handleSelectPage(childPage.id);
                                        } else {
                                          handleSelectMenuItem(child.id);
                                        }
                                      }}
                                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group relative ${
                                        isChildSelected
                                          ? "bg-indigo-950/90 text-white font-bold border border-indigo-800/60"
                                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                      } ${!child.visible ? "opacity-50" : ""}`}
                                    >
                                      <CornerDownRight className="w-3 h-3 text-slate-600" />
                                      <span className="truncate flex-1 text-xs">{child.label}</span>

                                      {childPage ? (
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            childPage.status === "published"
                                              ? "bg-emerald-400"
                                              : "bg-amber-400"
                                          }`}
                                          title={
                                            childPage.status === "published"
                                              ? "Publisert"
                                              : "Utkast"
                                          }
                                        />
                                      ) : (
                                        <span className="text-[9px] text-slate-600 truncate max-w-[80px]">
                                          {child.target || "Ingen lenke"}
                                        </span>
                                      )}

                                      {/* Hover actions for child */}
                                      <div
                                        className="hidden group-hover:flex items-center gap-0.5 bg-slate-900/95 border border-slate-700/80 rounded-md p-0.5 shadow-sm"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) => handleToggleMenuItemVisibility(child.id, e)}
                                          className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
                                          title={child.visible ? "Skjul fra meny" : "Gjør synlig"}
                                        >
                                          {child.visible ? (
                                            <Eye className="w-2.5 h-2.5 text-emerald-400" />
                                          ) : (
                                            <EyeOff className="w-2.5 h-2.5 text-slate-500" />
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          disabled={childIdx === 0}
                                          onClick={(e) => handleReorderMenuItem(child.id, "up", e)}
                                          className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800 disabled:opacity-20"
                                          title="Flytt opp"
                                        >
                                          <ArrowUp className="w-2.5 h-2.5" />
                                        </button>

                                        <button
                                          type="button"
                                          disabled={childIdx === allChildren.length - 1}
                                          onClick={(e) => handleReorderMenuItem(child.id, "down", e)}
                                          className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800 disabled:opacity-20"
                                          title="Flytt ned"
                                        >
                                          <ArrowDown className="w-2.5 h-2.5" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleSelectMenuItem(child.id)}
                                          className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
                                          title="Menypunkt-innstillinger"
                                        >
                                          <Settings className="w-2.5 h-2.5 text-slate-300" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* SECTION 2: Alle CMS-sider */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => toggleFolder("standaloneRoot")}
                className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-bold text-[11px] uppercase tracking-wider text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  {expandedFolders.standaloneRoot ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Alle CMS-Sider</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {filteredPages.length}
                </span>
              </button>

              {expandedFolders.standaloneRoot && (
                <div className="space-y-0.5 pl-2">
                  {filteredPages.map((page) => {
                    const isSelected = selectedPageId === page.id;
                    return (
                      <div
                        key={page.id}
                        onClick={() => handleSelectPage(page.id)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors group ${
                          isSelected
                            ? "bg-indigo-600 text-white font-bold shadow-xs"
                            : "text-slate-300 hover:bg-slate-800/60"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            page.status === "published"
                              ? "bg-emerald-400"
                              : page.status === "draft"
                              ? "bg-amber-400"
                              : "bg-slate-500"
                          }`}
                        />
                        <span className="truncate flex-1 font-medium">{page.title}</span>

                        <span
                          className={`text-[10px] font-mono shrink-0 ${
                            isSelected ? "text-indigo-200" : "text-slate-500"
                          }`}
                        >
                          /{page.slug}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* SONE 3: STOR ARBEIDSFLATE (MIDTEN, flex-1)                   */}
        {/* ------------------------------------------------------------ */}
        <main className="flex-1 bg-slate-950 overflow-y-auto flex flex-col p-4 sm:p-8 lg:p-10">
          {editingPage ? (
            <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in duration-200">
              {/* PAGE HERO / COVER IMAGE */}
              <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 h-48 sm:h-64 group shadow-xl">
                {editingPage.imageUrl ? (
                  <img
                    src={editingPage.imageUrl}
                    alt={editingPage.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                    <span className="text-xs">Ingen toppbilde valgt</span>
                  </div>
                )}

                {/* Cover controls overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end justify-between p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold border border-slate-700/80">
                      Toppbilde
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newUrl = window.prompt(
                          "Lim inn bilde-URL for toppbildet:",
                          editingPage.imageUrl || ""
                        );
                        if (newUrl !== null) {
                          setEditingPage((prev) =>
                            prev ? { ...prev, imageUrl: newUrl.trim() } : null
                          );
                          setHasUnsavedChanges(true);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Endre bilde</span>
                    </button>

                    {editingPage.imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPage((prev) =>
                            prev ? { ...prev, imageUrl: "" } : null
                          );
                          setHasUnsavedChanges(true);
                        }}
                        className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-700 backdrop-blur-md transition-colors cursor-pointer"
                        title="Fjern bilde"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* TITLE & INGRESS */}
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={editingPage.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditingPage((prev) =>
                        prev ? { ...prev, title: newTitle } : null
                      );
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Sidetittel (f.eks. Konfirmant 2026/2027)..."
                    className="w-full text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white bg-transparent border-b border-slate-800/80 focus:border-indigo-500 focus:outline-hidden pb-3 placeholder:text-slate-600 tracking-tight"
                  />
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={editingPage.ingress || ""}
                    onChange={(e) => {
                      const newIngress = e.target.value;
                      setEditingPage((prev) =>
                        prev ? { ...prev, ingress: newIngress } : null
                      );
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Skriv en kort ingress eller sammendrag som fanger oppmerksomheten..."
                    className="w-full text-base sm:text-lg text-slate-300 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 focus:outline-hidden focus:border-indigo-500 leading-relaxed placeholder:text-slate-600 resize-y"
                  />
                </div>
              </div>

              {/* RIK TEKSTEDITOR (TIPTAP WYSIWYG) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hovedinnhold (Rik Tekst)</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Støtter overskrifter, lister, sitater og bilder
                  </span>
                </div>

                <TiptapEditor
                  content={editingPage.bodyText || ""}
                  onChange={(html) => {
                    setEditingPage((prev) =>
                      prev ? { ...prev, bodyText: html } : null
                    );
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Begynn å skrive her..."
                />
              </div>

              {/* INNHOLDSBLOKKER ("LEGO-KLOSSER") */}
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Innholdsblokker</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({editingPage.blocks?.length || 0} blokker på siden)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Bygg siden videre med overskrifter, samlinger, sitater og handlingsknapper.
                    </p>
                  </div>
                </div>

                {/* ADD BLOCK BUTTONS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddBlock("heading")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer group"
                  >
                    <span className="font-bold text-xs">H2 / H3</span>
                    <span className="text-[10px] text-slate-500">Overskrift</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("text")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer group"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[10px] text-slate-500">Tekstavsnitt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("image")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer group"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-[10px] text-slate-500">Bildeblokk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("button")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer group"
                  >
                    <LinkIcon className="w-4 h-4 text-indigo-400 mb-1" />
                    <span className="text-[10px] text-slate-500">Knapp / CTA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("gathering")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-700/60 text-slate-300 hover:text-indigo-300 transition-all cursor-pointer group"
                  >
                    <Calendar className="w-4 h-4 text-purple-400 mb-1" />
                    <span className="text-[10px] text-purple-400 font-bold">Samling</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("quote")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer group"
                  >
                    <span className="text-base font-serif italic text-amber-400 leading-none mb-1">“</span>
                    <span className="text-[10px] text-slate-500">Sitatblokk</span>
                  </button>
                </div>

                {/* CURRENT BLOCKS LIST */}
                {editingPage.blocks && editingPage.blocks.length > 0 ? (
                  <div className="space-y-3">
                    {editingPage.blocks.map((block, index) => {
                      const isSelected = selectedBlockId === block.id;

                      return (
                        <div
                          key={block.id}
                          onClick={() => setSelectedBlockId(block.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                            isSelected
                              ? "bg-slate-900 border-indigo-500 ring-1 ring-indigo-500 shadow-md"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
                          }`}
                        >
                          {/* Left: Reorder up/down */}
                          <div
                            className="flex flex-col gap-1 text-slate-500 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(index, "up")}
                              disabled={index === 0}
                              className="p-1 rounded-md hover:bg-slate-800 hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Flytt opp"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(index, "down")}
                              disabled={index === (editingPage.blocks?.length || 0) - 1}
                              className="p-1 rounded-md hover:bg-slate-800 hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Flytt ned"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Center: Block summary & preview */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                                {block.type}
                              </span>
                              <span className="text-xs font-semibold text-white truncate">
                                {block.type === "heading" && (block.headingText || "Overskrift")}
                                {block.type === "text" && (block.text || "Tekstavsnitt")}
                                {block.type === "image" && (block.imageCaption || "Bilde")}
                                {block.type === "button" && (block.buttonLabel || "Knapp")}
                                {block.type === "quote" && (block.quoteText || "Sitat")}
                                {block.type === "gathering" &&
                                  (gatherings.find((g) => g.id === block.gatheringId)?.title ||
                                    "Samling fra kalender")}
                              </span>
                            </div>

                            {/* Block preview text */}
                            <div className="text-xs text-slate-400 truncate">
                              {block.type === "heading" && `${block.headingLevel?.toUpperCase()}: ${block.headingText}`}
                              {block.type === "text" && block.text}
                              {block.type === "image" && block.imageUrl}
                              {block.type === "button" && `Lenke: ${block.buttonUrl}`}
                              {block.type === "quote" && `“${block.quoteText}” — ${block.quoteAuthor || "Anonym"}`}
                              {block.type === "gathering" && (
                                <span className="text-purple-400 font-medium">
                                  Henter automatisk dato, tid og sted fra samlingsdatabasen
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Remove button */}
                          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(block.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Slett blokk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 space-y-1">
                    <p className="text-xs">Ingen ekstra blokker er lagt til ennå.</p>
                    <p className="text-[11px] text-slate-600">
                      Klikk på en av knappene over for å berike siden med innhold.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activeMenuItem ? (
            /* VISUAL MENU ITEM EDITOR */
            <div className="max-w-xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Menyvalg (Pilot 1)
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  Rediger menypunkt: {activeMenuItem.label}
                </h2>
                <p className="text-xs text-slate-400">
                  Styrer plassering, rekkefølge og måladresse for dette navigasjonspunktet.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Meny-etikett (navn i menyen)
                  </label>
                  <input
                    type="text"
                    value={activeMenuItem.label}
                    onChange={(e) => {
                      updateWebNavigationItem(activeMenuItem.id, { label: e.target.value });
                    }}
                    className="w-full text-sm bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mål-URL / Lenke
                  </label>
                  <input
                    type="text"
                    value={activeMenuItem.target || ""}
                    onChange={(e) => {
                      updateWebNavigationItem(activeMenuItem.id, { target: e.target.value });
                    }}
                    className="w-full text-sm bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Koble direkte til en CMS-side
                  </label>
                  <select
                    value={
                      webPages.find(
                        (p) => activeMenuItem.target === `/${p.slug}` || activeMenuItem.target === p.slug
                      )?.slug || ""
                    }
                    onChange={(e) => {
                      const selectedSlug = e.target.value;
                      if (selectedSlug) {
                        updateWebNavigationItem(activeMenuItem.id, { target: `/${selectedSlug}` });
                      }
                    }}
                    className="w-full text-sm bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Velg fra opprettede CMS-sider --</option>
                    {webPages.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.title} (/{p.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center text-slate-500 space-y-3">
              <Compass className="w-12 h-12 mx-auto text-slate-700 animate-pulse" />
              <h3 className="text-base font-bold text-slate-300">Velg en side fra navigasjonstreet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Klikk på en side i venstrekolonnen for å redigere tekst og innhold, eller opprett en ny side med knappen øverst.
              </p>
              <button
                type="button"
                onClick={handleCreateNewPage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Opprett ny side</span>
              </button>
            </div>
          )}
        </main>

        {/* ------------------------------------------------------------ */}
        {/* SONE 4: KONTEKSTPANEL (HØYRE, ~300px)                         */}
        {/* ------------------------------------------------------------ */}
        {isInspectorOpen && (
          <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {selectedBlock ? "Blokkinnstillinger" : "Sideinnstillinger"}
                </span>
              </span>

              {selectedBlock && (
                <button
                  type="button"
                  onClick={() => setSelectedBlockId(null)}
                  className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                >
                  Vis sidevalg
                </button>
              )}
            </div>

            <div className="p-4 space-y-6 text-xs text-slate-300">
              {/* BLOCK SETTINGS (when a block is selected) */}
              {selectedBlock && editingPage ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[11px]">
                      Type: {selectedBlock.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(selectedBlock.id)}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Slett</span>
                    </button>
                  </div>

                  {/* Heading Block Settings */}
                  {selectedBlock.type === "heading" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Nivå
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateBlock(selectedBlock.id, { headingLevel: "h2" })
                            }
                            className={`p-2 rounded-xl border text-center font-bold cursor-pointer ${
                              selectedBlock.headingLevel === "h2"
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-slate-950 border-slate-800 text-slate-400"
                            }`}
                          >
                            H2 (Hovedavsnitt)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateBlock(selectedBlock.id, { headingLevel: "h3" })
                            }
                            className={`p-2 rounded-xl border text-center font-bold cursor-pointer ${
                              selectedBlock.headingLevel === "h3"
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-slate-950 border-slate-800 text-slate-400"
                            }`}
                          >
                            H3 (Mellomtittel)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Overskriftstekst
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.headingText || ""}
                          onChange={(e) =>
                            handleUpdateBlock(selectedBlock.id, { headingText: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Button / Link Block Settings */}
                  {selectedBlock.type === "button" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Knappetekst
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.buttonLabel || ""}
                          onChange={(e) =>
                            handleUpdateBlock(selectedBlock.id, { buttonLabel: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Mål-URL / Lenke
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.buttonUrl || ""}
                          onChange={(e) =>
                            handleUpdateBlock(selectedBlock.id, { buttonUrl: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Gathering Block Settings (Pilot 7 & Masterplan) */}
                  {selectedBlock.type === "gathering" && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-purple-200 text-[11px]">
                        <strong>Én gang inn → Flere visninger:</strong>
                        <p className="mt-1 text-purple-300/80">
                          Denne blokken henter sanntidsinformasjon fra menighetskalenderen. Hvis tid eller sted endres, oppdateres siden automatisk.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Velg Samling fra kalenderen:
                        </label>
                        <select
                          value={selectedBlock.gatheringId || ""}
                          onChange={(e) => {
                            const chosenId = e.target.value;
                            const chosenGathering = gatherings.find((g) => g.id === chosenId);
                            handleUpdateBlock(selectedBlock.id, {
                              gatheringId: chosenId,
                              gatheringTitle: chosenGathering?.title || "",
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-hidden"
                        >
                          <option value="">-- Velg samling --</option>
                          {gatherings.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.title} ({new Date(g.startsAt).toLocaleDateString("no-NO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Image Block Settings */}
                  {selectedBlock.type === "image" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Bilde-URL
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.imageUrl || ""}
                          onChange={(e) =>
                            handleUpdateBlock(selectedBlock.id, { imageUrl: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Bildetekst (Caption)
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.imageCaption || ""}
                          onChange={(e) =>
                            handleUpdateBlock(selectedBlock.id, { imageCaption: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quote Block Settings */}
                  {selectedBlock.type === "quote" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Sitattekst
                        </label>
                        <textarea
                          rows={3}
                          value={selectedBlock.quoteText || ""}
                          onChange={(e) =>
                            handleUpdateBlock(selectedBlock.id, { quoteText: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Forfatter / Kilde
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.quoteAuthor || ""}
                          onChange={(e) =>
                            handleUpdateBlock(selectedBlock.id, { quoteAuthor: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : editingPage ? (
                /* PAGE SETTINGS */
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* PUBLISHING STATUS */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Publiseringsstatus
                    </label>
                    <div className="space-y-1.5">
                      <label
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          editingPage.status === "published"
                            ? "bg-emerald-950/60 border-emerald-600 text-emerald-200"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pageStatus"
                          value="published"
                          checked={editingPage.status === "published"}
                          onChange={() => {
                            setEditingPage((prev) =>
                              prev ? { ...prev, status: "published" } : null
                            );
                            setHasUnsavedChanges(true);
                          }}
                          className="sr-only"
                        />
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-bold text-xs text-white">Publisert</div>
                          <div className="text-[10px] text-slate-400">Synlig for alle på nettsiden</div>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          editingPage.status === "draft"
                            ? "bg-amber-950/60 border-amber-600 text-amber-200"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pageStatus"
                          value="draft"
                          checked={editingPage.status === "draft"}
                          onChange={() => {
                            setEditingPage((prev) =>
                              prev ? { ...prev, status: "draft" } : null
                            );
                            setHasUnsavedChanges(true);
                          }}
                          className="sr-only"
                        />
                        <Clock className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-bold text-xs text-white">Utkast</div>
                          <div className="text-[10px] text-slate-400">Kun synlig for administratorer</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* URL / SLUG */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        URL-adresse (Slug)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const generated = editingPage.title
                            .toLowerCase()
                            .trim()
                            .replace(/[æ]/g, "ae")
                            .replace(/[ø]/g, "o")
                            .replace(/[å]/g, "a")
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "");
                          setEditingPage((prev) =>
                            prev ? { ...prev, slug: generated } : null
                          );
                          setHasUnsavedChanges(true);
                        }}
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        Generer fra tittel
                      </button>
                    </div>

                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus-within:border-indigo-500">
                      <span className="text-slate-500">/</span>
                      <input
                        type="text"
                        value={editingPage.slug}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^\//, "");
                          setEditingPage((prev) =>
                            prev ? { ...prev, slug: val } : null
                          );
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full bg-transparent focus:outline-none text-white pl-1"
                      />
                    </div>
                  </div>

                  {/* MENU ASSIGNMENT */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Plassering i menyen (Pilot 1)
                    </label>

                    {(() => {
                      const linkedMenuItem = webNavigation.find(
                        (item) =>
                          item.target === `/${editingPage.slug}` ||
                          item.target === editingPage.slug
                      );

                      return (
                        <div className="space-y-2">
                          {linkedMenuItem ? (
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                              <div>
                                <span className="text-slate-400 text-[10px] block">Tilknyttet:</span>
                                <span className="font-bold text-white">{linkedMenuItem.label}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold text-[10px]">
                                I menyen
                              </span>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-2">
                              <p>Denne siden er ikke lagt til i hovedmenyen ennå.</p>
                              <button
                                type="button"
                                onClick={async () => {
                                  await createWebNavigationItem({
                                    label: editingPage.title,
                                    target: `/${editingPage.slug}`,
                                    type: "page",
                                    visible: true,
                                    order: webNavigation.length,
                                  });
                                  alert(`La til "${editingPage.title}" i hovedmenyen!`);
                                }}
                                className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                + Legg til i hovedmenyen
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* DANGER ZONE: DELETE */}
                  <div className="pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleDeletePage(editingPage.id, editingPage.title)}
                      className="w-full py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-950 border border-red-900/60 text-red-400 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Slett denne siden</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        )}
      </div>

      {/* ============================================================ */}
      {/* FULL DESIGN PREVIEW MODAL                                    */}
      {/* ============================================================ */}
      {showPreviewModal && editingPage && (
        <CmsPreviewModal
          page={editingPage}
          onClose={() => setShowPreviewModal(false)}
          onPublishToggle={handleTogglePublish}
        />
      )}
    </div>
  );
};
