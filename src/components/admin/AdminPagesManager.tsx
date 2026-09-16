import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useWebPages } from "../../hooks/useWebPages";
import { WebPage, ContentBlock, ContentBlockType } from "../../types";
import { initialWebPages } from "../../data/mockData";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Archive,
  Image as ImageIcon,
  Heading,
  AlignLeft,
  Link as LinkIcon,
  Quote,
  ArrowUp,
  ArrowDown,
  X,
  Save,
  Search,
  RefreshCw,
  Sparkles,
  Layers,
  Globe,
} from "lucide-react";

export const AdminPagesManager: React.FC = () => {
  const {
    pages,
    publishedPages,
    draftPages,
    archivedPages,
    createPage,
    updatePage,
    deletePage,
    publishPage,
    unpublishPage,
    isFirestoreConnected,
  } = useWebPages();

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingPage, setEditingPage] = useState<WebPage | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState<string>("");
  const [formSlug, setFormSlug] = useState<string>("");
  const [formIngress, setFormIngress] = useState<string>("");
  const [formBodyText, setFormBodyText] = useState<string>("");
  const [formImageUrl, setFormImageUrl] = useState<string>("");
  const [formStatus, setFormStatus] = useState<"draft" | "published" | "archived">("draft");
  const [formBlocks, setFormBlocks] = useState<ContentBlock[]>([]);
  const [editorTab, setEditorTab] = useState<"content" | "blocks" | "preview">("content");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Delete modal state
  const [pageToDelete, setPageToDelete] = useState<WebPage | null>(null);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Helper to generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/[^a-z0-9\s/-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/\/+/g, "/")
      .replace(/^-+|-+$/g, "");
  };

  // Filtered pages
  const filteredPages = useMemo(() => {
    return pages
      .filter((page) => {
        if (statusFilter !== "all" && page.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = page.title.toLowerCase().includes(q);
          const matchSlug = page.slug.toLowerCase().includes(q);
          const matchIngress = page.ingress?.toLowerCase().includes(q);
          return matchTitle || matchSlug || matchIngress;
        }
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  }, [pages, statusFilter, searchQuery]);

  // Open Create Page modal
  const handleOpenCreate = () => {
    setEditingPage(null);
    setFormTitle("");
    setFormSlug("");
    setFormIngress("");
    setFormBodyText("");
    setFormImageUrl("");
    setFormStatus("published");
    setFormBlocks([]);
    setEditorTab("content");
    setIsEditorOpen(true);
  };

  // Open Edit Page modal
  const handleOpenEdit = (page: WebPage) => {
    setEditingPage(page);
    setFormTitle(page.title);
    setFormSlug(page.slug);
    setFormIngress(page.ingress || "");
    setFormBodyText(page.bodyText || "");
    setFormImageUrl(page.imageUrl || "");
    setFormStatus(page.status);
    setFormBlocks(page.blocks ? [...page.blocks] : []);
    setEditorTab("content");
    setIsEditorOpen(true);
  };

  // Auto slug generation if user types title
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingPage) {
      setFormSlug(generateSlug(val));
    }
  };

  // Save Page (Create or Update)
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showFeedback("Tittel kan ikke være tom.", "error");
      return;
    }
    const cleanSlug = generateSlug(formSlug || formTitle);
    if (!cleanSlug) {
      showFeedback("URL-sti (slug) kan ikke være tom.", "error");
      return;
    }

    setIsSaving(true);
    try {
      if (editingPage) {
        // Update
        const res = await updatePage(editingPage.id, {
          title: formTitle.trim(),
          slug: cleanSlug,
          ingress: formIngress.trim() || undefined,
          bodyText: formBodyText.trim() || undefined,
          imageUrl: formImageUrl.trim() || undefined,
          status: formStatus,
          blocks: formBlocks,
        });

        if (res.success) {
          showFeedback(`Siden «${formTitle}» ble lagret!`);
          setIsEditorOpen(false);
        } else {
          showFeedback(res.error || "Kunne ikke oppdatere side.", "error");
        }
      } else {
        // Create
        const res = await createPage({
          title: formTitle.trim(),
          slug: cleanSlug,
          ingress: formIngress.trim() || undefined,
          bodyText: formBodyText.trim() || undefined,
          imageUrl: formImageUrl.trim() || undefined,
          status: formStatus,
          blocks: formBlocks,
        });

        if (res.success && res.page) {
          showFeedback(`Siden «${res.page.title}» ble opprettet og lagret i Firestore!`);
          setIsEditorOpen(false);
        } else {
          showFeedback(res.error || "Kunne ikke opprette side.", "error");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle publish / unpublish
  const handleTogglePublish = async (page: WebPage) => {
    if (page.status === "published") {
      const res = await unpublishPage(page.id);
      if (res.success) {
        showFeedback(`«${page.title}» er nå satt til Utkast (avpublisert).`);
      } else {
        showFeedback(res.error || "Kunne ikke avpublisere side.", "error");
      }
    } else {
      const res = await publishPage(page.id);
      if (res.success) {
        showFeedback(`«${page.title}» er nå publisert på nettsiden!`);
      } else {
        showFeedback(res.error || "Kunne ikke publisere side.", "error");
      }
    }
  };

  // Delete page
  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;
    const res = await deletePage(pageToDelete.id);
    if (res.success) {
      showFeedback(`«${pageToDelete.title}» ble slettet.`);
      setPageToDelete(null);
    } else {
      showFeedback(res.error || "Kunne ikke slette side.", "error");
    }
  };

  // Block management
  const handleAddBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      order: formBlocks.length,
      headingText: type === "heading" ? "Ny overskrift" : undefined,
      headingLevel: type === "heading" ? "h2" : undefined,
      text: type === "text" ? "Skriv ditt avsnitt her..." : undefined,
      imageUrl: type === "image" ? "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1000&auto=format&fit=crop&q=80" : undefined,
      imageCaption: type === "image" ? "Bildetekst" : undefined,
      buttonLabel: type === "button" ? "Les mer" : undefined,
      buttonUrl: type === "button" ? "/kontakt" : undefined,
      buttonStyle: type === "button" ? "primary" : undefined,
      quoteText: type === "quote" ? "«Troen flytter fjell, men kjærligheten bygger fellesskapet.»" : undefined,
      quoteAuthor: type === "quote" ? "Pastor" : undefined,
    };
    setFormBlocks((prev) => [...prev, newBlock]);
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    setFormBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    );
  };

  const handleRemoveBlock = (blockId: string) => {
    setFormBlocks((prev) =>
      prev.filter((b) => b.id !== blockId).map((b, idx) => ({ ...b, order: idx }))
    );
  };

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    const index = formBlocks.findIndex((b) => b.id === blockId);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formBlocks.length) return;

    const newBlocks = [...formBlocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);
    setFormBlocks(newBlocks.map((b, idx) => ({ ...b, order: idx })));
  };

  // Seed / Reset initial sample pages if needed
  const handleRestoreInitialPages = async () => {
    if (!window.confirm("Vil du gjenopprette standard test-sider (Vår tro, Lederskap, Søndag, Barnekirke, Ungdom, Bønn, Sosialt, Misjon)?")) {
      return;
    }
    try {
      for (const p of initialWebPages) {
        await createPage(p);
      }
      showFeedback("Standard CMS-sider ble gjenopprettet!");
    } catch (err) {
      showFeedback("Feil under gjenoppretting.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Stats & Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                CMS Sider & Innhold
              </h2>
              {isFirestoreConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Firestore Live
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Opprett og administrer dynamiske nettsider. Sider er rene dataobjekter i Firestore som gjengis automatisk av den generelle side-rendereren.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-restore-pages"
              onClick={handleRestoreInitialPages}
              title="Gjenopprett standard testsider"
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Gjenopprett testsider</span>
            </button>

            <button
              type="button"
              id="btn-create-cms-page"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ny side</span>
            </button>
          </div>
        </div>

        {/* Counter chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Alle sider</span>
            <span className="text-lg font-black text-slate-800">{pages.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[11px] text-emerald-700 font-medium block">Publisert</span>
            <span className="text-lg font-black text-emerald-800">{publishedPages.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
            <span className="text-[11px] text-amber-700 font-medium block">Utkast</span>
            <span className="text-lg font-black text-amber-800">{draftPages.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Arkivert</span>
            <span className="text-lg font-black text-slate-700">{archivedPages.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Alle ({pages.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("published")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === "published" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Publisert ({publishedPages.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === "draft" ? "bg-white text-amber-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Utkast ({draftPages.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("archived")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === "archived" ? "bg-white text-slate-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Arkivert ({archivedPages.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Søk tittel eller sti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pages List */}
      <div className="space-y-3">
        {filteredPages.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Ingen sider funnet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `Ingen sider matcher søket «${searchQuery}».`
                : statusFilter !== "all"
                ? `Ingen sider med status «${statusFilter}».`
                : "Du har ikke opprettet noen sider ennå. Klikk på «Ny side» eller «Gjenopprett testsider»."}
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Opprett første side</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredPages.map((page) => {
              const fullRoute = page.slug.startsWith("/") ? page.slug : `/${page.slug}`;
              const blockCount = page.blocks?.length || 0;

              return (
                <div
                  key={page.id}
                  id={`page-card-${page.id}`}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Thumbnail */}
                    {page.imageUrl ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0">
                        <img
                          src={page.imageUrl}
                          alt={page.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {page.title}
                        </h3>

                        {/* Status Badge */}
                        {page.status === "published" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Publisert
                          </span>
                        )}
                        {page.status === "draft" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            Utkast
                          </span>
                        )}
                        {page.status === "archived" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                            <Archive className="w-3 h-3" />
                            Arkivert
                          </span>
                        )}

                        {blockCount > 0 && (
                          <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {blockCount} {blockCount === 1 ? "blokk" : "blokker"}
                          </span>
                        )}
                      </div>

                      {/* Slug / URL */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 text-[11px]">
                          {fullRoute}
                        </span>
                        <Link
                          to={fullRoute}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                        >
                          <span>Åpne på web</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Ingress snippet */}
                      {page.ingress && (
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                          {page.ingress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Toggle publish button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(page)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                        page.status === "published"
                          ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800"
                          : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
                      }`}
                      title={page.status === "published" ? "Sett til utkast" : "Publiser på nettsiden"}
                    >
                      {page.status === "published" ? "Avpubliser" : "Publiser"}
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      id={`btn-edit-page-${page.id}`}
                      onClick={() => handleOpenEdit(page)}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      title="Rediger side"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      id={`btn-delete-page-${page.id}`}
                      onClick={() => setPageToDelete(page)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      title="Slett side"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-6 shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingPage ? `Rediger «${editingPage.title}»` : "Opprett ny nettside"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    CMS Pilot 2 – Data lagres i Firestore og vises på offentlig web
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tab Selector */}
            <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setEditorTab("content")}
                className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  editorTab === "content"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                1. Hovedinnhold
              </button>
              <button
                type="button"
                onClick={() => setEditorTab("blocks")}
                className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  editorTab === "blocks"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>2. Innholdsblokker</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                  {formBlocks.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEditorTab("preview")}
                className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                  editorTab === "preview"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Forhåndsvisning</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePage} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 1: Content fields */}
              {editorTab === "content" && (
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sidetittel <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="input-page-title"
                      required
                      placeholder="f.eks. Misjon, Barnekirke, Vår tro..."
                      value={formTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm font-semibold"
                    />
                  </div>

                  {/* Slug / Path */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        URL-sti (slug) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormSlug(generateSlug(formTitle))}
                        className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                      >
                        Generer fra tittel
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-mono text-xs select-none">
                        /
                      </span>
                      <input
                        type="text"
                        id="input-page-slug"
                        required
                        placeholder="f.eks. misjon eller om-oss/tro"
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value)}
                        className="w-full pl-6 pr-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs font-mono bg-slate-50/50"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Siden blir tilgjengelig på URL: <strong className="text-slate-700">/{formSlug || "side"}</strong>
                    </p>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Publiseringsstatus
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormStatus("published")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                          formStatus === "published"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Publisert</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormStatus("draft")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                          formStatus === "draft"
                            ? "bg-amber-50 border-amber-300 text-amber-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Utkast</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormStatus("archived")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                          formStatus === "archived"
                            ? "bg-slate-100 border-slate-300 text-slate-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Archive className="w-4 h-4 text-slate-500" />
                        <span>Arkivert</span>
                      </button>
                    </div>
                  </div>

                  {/* Ingress */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ingress (kort sammendrag)
                    </label>
                    <textarea
                      id="input-page-ingress"
                      rows={2}
                      placeholder="Kort innledning som oppsummerer sidens innhold..."
                      value={formIngress}
                      onChange={(e) => setFormIngress(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs text-slate-700"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hovedbilde URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        id="input-page-image"
                        placeholder="https://images.unsplash.com/..."
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs font-mono"
                      />
                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormImageUrl("")}
                          className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Quick Image Suggestions */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400">Forslagsbilder:</span>
                      {[
                        { label: "Gudstjeneste", url: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1200&auto=format&fit=crop&q=80" },
                        { label: "Barn", url: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=1200&auto=format&fit=crop&q=80" },
                        { label: "Ungdom", url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80" },
                        { label: "Bønn", url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&auto=format&fit=crop&q=80" },
                        { label: "Misjon", url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80" },
                      ].map((sug) => (
                        <button
                          key={sug.label}
                          type="button"
                          onClick={() => setFormImageUrl(sug.url)}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer"
                        >
                          {sug.label}
                        </button>
                      ))}
                    </div>

                    {/* Image preview */}
                    {formImageUrl && (
                      <div className="mt-2 h-32 rounded-xl overflow-hidden border border-slate-200">
                        <img
                          src={formImageUrl}
                          alt="Forhåndsvisning"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Body Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Brødtekst
                    </label>
                    <textarea
                      id="input-page-body"
                      rows={5}
                      placeholder="Skriv hovedteksten for siden her. Du kan også legge til strukturerte innholdsblokker under fanen «Innholdsblokker»..."
                      value={formBodyText}
                      onChange={(e) => setFormBodyText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs text-slate-700 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Content Blocks */}
              {editorTab === "blocks" && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-950 block">
                        Modulære innholdsblokker
                      </span>
                      <span className="text-[11px] text-indigo-800">
                        Bygg opp siden med overskrifter, avsnitt, ekstra bilder, handlingsknapper og sitatbokser.
                      </span>
                    </div>
                  </div>

                  {/* Block Builder Toolbar */}
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 self-center px-1">
                      Legg til:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("heading")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Heading className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Overskrift</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("text")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tekstavsnitt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("image")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bilde</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("button")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Knapp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("quote")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Quote className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sitat</span>
                    </button>
                  </div>

                  {/* List of active blocks */}
                  {formBlocks.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                      <Layers className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-medium">Ingen innholdsblokker er lagt til ennå.</p>
                      <p className="text-[11px] text-slate-400">
                        Klikk på en av knappene ovenfor for å legge til innhold.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formBlocks.map((block, idx) => (
                        <div
                          key={block.id}
                          className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-xs"
                        >
                          {/* Block Header */}
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600">
                                {idx + 1}
                              </span>
                              {block.type === "heading" && "Overskrift"}
                              {block.type === "text" && "Tekstavsnitt"}
                              {block.type === "image" && "Bildeblokk"}
                              {block.type === "button" && "Handlingsknapp"}
                              {block.type === "quote" && "Sitatblokk"}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveBlock(block.id, "up")}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                title="Flytt opp"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === formBlocks.length - 1}
                                onClick={() => handleMoveBlock(block.id, "down")}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                title="Flytt ned"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveBlock(block.id)}
                                className="p-1 text-slate-400 hover:text-red-600 cursor-pointer ml-1"
                                title="Fjern blokk"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Block Fields based on Type */}
                          {block.type === "heading" && (
                            <div className="grid grid-cols-4 gap-2">
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  placeholder="Overskriftstekst..."
                                  value={block.headingText || ""}
                                  onChange={(e) =>
                                    handleUpdateBlock(block.id, { headingText: e.target.value })
                                  }
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                                />
                              </div>
                              <div>
                                <select
                                  value={block.headingLevel || "h2"}
                                  onChange={(e) =>
                                    handleUpdateBlock(block.id, {
                                      headingLevel: e.target.value as "h2" | "h3",
                                    })
                                  }
                                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                                >
                                  <option value="h2">Nivå H2</option>
                                  <option value="h3">Nivå H3</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {block.type === "text" && (
                            <div>
                              <textarea
                                rows={3}
                                placeholder="Skriv innhold her..."
                                value={block.text || ""}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { text: e.target.value })
                                }
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                              />
                            </div>
                          )}

                          {block.type === "image" && (
                            <div className="space-y-2">
                              <input
                                type="url"
                                placeholder="Bilde URL..."
                                value={block.imageUrl || ""}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { imageUrl: e.target.value })
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono"
                              />
                              <input
                                type="text"
                                placeholder="Bildetekst (caption)..."
                                value={block.imageCaption || ""}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { imageCaption: e.target.value })
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                              />
                            </div>
                          )}

                          {block.type === "button" && (
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Knappetekst (f.eks. Bli med)..."
                                value={block.buttonLabel || ""}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { buttonLabel: e.target.value })
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
                              />
                              <input
                                type="text"
                                placeholder="Mål-URL (f.eks. /kontakt)..."
                                value={block.buttonUrl || ""}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { buttonUrl: e.target.value })
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono"
                              />
                            </div>
                          )}

                          {block.type === "quote" && (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                placeholder="Sitattekst..."
                                value={block.quoteText || ""}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { quoteText: e.target.value })
                                }
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs italic text-slate-700"
                              />
                              <input
                                type="text"
                                placeholder="Kilde / Forfatter..."
                                value={block.quoteAuthor || ""}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { quoteAuthor: e.target.value })
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Preview */}
              {editorTab === "preview" && (
                <div className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                        Forhåndsvisning
                      </span>
                      <span className="text-xs font-mono text-slate-400">/{formSlug || "side"}</span>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900">{formTitle || "Uten tittel"}</h1>

                    {formIngress && (
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        {formIngress}
                      </p>
                    )}

                    {formImageUrl && (
                      <div className="rounded-xl overflow-hidden max-h-64 border border-slate-200">
                        <img
                          src={formImageUrl}
                          alt={formTitle}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {formBodyText && (
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pt-2">
                        {formBodyText}
                      </div>
                    )}

                    {/* Preview of blocks */}
                    {formBlocks.map((b) => (
                      <div key={b.id} className="pt-2">
                        {b.type === "heading" && (
                          <h2 className="text-base font-bold text-slate-900 mt-2">
                            {b.headingText}
                          </h2>
                        )}
                        {b.type === "text" && (
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {b.text}
                          </p>
                        )}
                        {b.type === "image" && b.imageUrl && (
                          <figure className="my-2">
                            <img
                              src={b.imageUrl}
                              alt={b.imageCaption || ""}
                              className="rounded-xl max-h-48 object-cover mx-auto"
                              referrerPolicy="no-referrer"
                            />
                            {b.imageCaption && (
                              <figcaption className="text-center text-[10px] text-slate-400 mt-1">
                                {b.imageCaption}
                              </figcaption>
                            )}
                          </figure>
                        )}
                        {b.type === "button" && (
                          <div className="pt-1">
                            <span className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs">
                              {b.buttonLabel || "Knapp"}
                            </span>
                          </div>
                        )}
                        {b.type === "quote" && (
                          <blockquote className="border-l-4 border-indigo-600 pl-3 py-1 my-2 italic text-xs text-slate-700 bg-indigo-50/40 rounded-r-lg">
                            <p>{b.quoteText}</p>
                            {b.quoteAuthor && (
                              <cite className="block text-[10px] text-slate-500 font-semibold not-italic mt-0.5">
                                – {b.quoteAuthor}
                              </cite>
                            )}
                          </blockquote>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer / Submit */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    Status: <strong className="text-slate-800 capitalize">{formStatus}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    id="btn-save-page"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingPage ? "Lagre endringer" : "Opprett og publiser"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Slette siden «{pageToDelete.title}»?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Er du sikker på at du vil slette denne siden fra Firestore? Denne handlingen kan ikke angres.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPageToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                id="btn-confirm-delete-page"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
              >
                Ja, slett side
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
