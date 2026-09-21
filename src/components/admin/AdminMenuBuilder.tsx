import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  ExternalLink,
  FileText,
  Calendar,
  Layers,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Menu,
} from "lucide-react";
import { useWebNavigation } from "../../hooks/useWebNavigation";
import { useWebPages } from "../../hooks/useWebPages";
import { WebNavigationItem, WebNavigationType, WebNavigationTreeItem } from "../../types";
import { initialWebNavigation } from "../../data/mockData";

export const AdminMenuBuilder: React.FC = () => {
  const {
    items,
    tree,
    createItem,
    updateItem,
    deleteItem,
    reorderItem,
    toggleVisibility,
    isFirestoreConnected,
  } = useWebNavigation();

  const { pages: cmsPages } = useWebPages();

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<WebNavigationItem | null>(null);

  // Form Fields
  const [formLabel, setFormLabel] = useState<string>("");
  const [formParentId, setFormParentId] = useState<string>("");
  const [formType, setFormType] = useState<WebNavigationType>("page");
  const [formTarget, setFormTarget] = useState<string>("");
  const [formVisible, setFormVisible] = useState<boolean>(true);
  const [formFeedback, setFormFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Confirmation modal for deletion
  const [itemToDelete, setItemToDelete] = useState<WebNavigationItem | null>(null);

  // Confirmation for reset
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Collapsed parents in tree view (for navigation ease)
  const [collapsedParentIds, setCollapsedParentIds] = useState<Record<string, boolean>>({});

  // Quick feedback toast
  const [actionFeedback, setActionFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showActionFeedback = (text: string, type: "success" | "error" = "success") => {
    setActionFeedback({ text, type });
    setTimeout(() => {
      setActionFeedback(null);
    }, 3500);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedParentIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open Create Modal
  const handleOpenCreateModal = (defaultParentId: string = "") => {
    setEditingItem(null);
    setFormLabel("");
    setFormParentId(defaultParentId);
    setFormType("page");
    setFormTarget("");
    setFormVisible(true);
    setFormFeedback(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: WebNavigationItem) => {
    setEditingItem(item);
    setFormLabel(item.label);
    setFormParentId(item.parentId || "");
    setFormType(item.type);
    setFormTarget(item.target || "");
    setFormVisible(item.visible);
    setFormFeedback(null);
    setModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = formLabel.trim();
    if (!trimmedLabel) {
      setFormFeedback({ text: "Tittel / etikett må fylles ut.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setFormFeedback(null);

    const parentIdVal = formParentId ? formParentId : null;

    if (editingItem) {
      // Prevent setting parent to itself
      if (parentIdVal === editingItem.id) {
        setFormFeedback({ text: "Et menypunkt kan ikke være undermeny av seg selv.", type: "error" });
        setIsSubmitting(false);
        return;
      }

      const res = await updateItem(editingItem.id, {
        label: trimmedLabel,
        parentId: parentIdVal,
        type: formType,
        target: formTarget.trim() || undefined,
        visible: formVisible,
      });

      setIsSubmitting(false);
      if (res.success) {
        setModalOpen(false);
        showActionFeedback(`Menypunktet «${trimmedLabel}» ble oppdatert!`);
      } else {
        setFormFeedback({ text: res.error || "Kunne ikke oppdatere menypunkt.", type: "error" });
      }
    } else {
      // Create new
      const res = await createItem({
        label: trimmedLabel,
        parentId: parentIdVal,
        type: formType,
        target: formTarget.trim() || undefined,
        visible: formVisible,
        order: 999, // createItem will recalculate based on siblings
      });

      setIsSubmitting(false);
      if (res.success && res.item) {
        setModalOpen(false);
        showActionFeedback(`Menypunktet «${res.item.label}» ble opprettet i Firestore!`);
      } else {
        setFormFeedback({ text: res.error || "Kunne ikke opprette menypunkt.", type: "error" });
      }
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await deleteItem(itemToDelete.id);
    if (res.success) {
      showActionFeedback(`«${itemToDelete.label}» ble slettet.`);
      setItemToDelete(null);
    } else {
      showActionFeedback(res.error || "Kunne ikke slette menypunkt.", "error");
    }
  };

  // Handle Reorder
  const handleReorder = async (id: string, direction: "up" | "down") => {
    const res = await reorderItem(id, direction);
    if (!res.success) {
      showActionFeedback(res.error || "Kunne ikke endre rekkefølge.", "error");
    }
  };

  // Handle Toggle Visibility
  const handleToggleVisibility = async (item: WebNavigationItem) => {
    const res = await toggleVisibility(item.id);
    if (res.success) {
      showActionFeedback(
        res.visible
          ? `«${item.label}» er nå synlig på den offentlige nettsiden.`
          : `«${item.label}» er nå skjult fra den offentlige nettsiden.`
      );
    } else {
      showActionFeedback(res.error || "Kunne ikke endre synlighet.", "error");
    }
  };

  // Reset to initial demo navigation
  const handleResetToDefault = async () => {
    setShowResetConfirm(false);
    // Delete all current items
    for (const item of items) {
      await deleteItem(item.id);
    }
    // Re-create initial items
    for (const seedItem of initialWebNavigation) {
      await createItem({
        label: seedItem.label,
        parentId: seedItem.parentId,
        type: seedItem.type,
        target: seedItem.target,
        visible: seedItem.visible,
        order: seedItem.order,
      });
    }
    showActionFeedback("Menystrukturen er gjenopprettet til Pilot 1 standard!");
  };

  // Filter root items for parent dropdown selection (exclude currently edited item to prevent cycle)
  const availableParents = items.filter(
    (item) => !item.parentId && (!editingItem || item.id !== editingItem.id)
  );

  const totalItemsCount = items.length;
  const rootItemsCount = tree.length;
  const subItemsCount = items.filter((i) => !!i.parentId).length;
  const visibleItemsCount = items.filter((i) => i.visible).length;

  const getTypeLabel = (type: WebNavigationType): string => {
    switch (type) {
      case "page":
        return "Side";
      case "gathering":
        return "Arrangement";
      case "article":
        return "Artikkel";
      case "external":
        return "Ekstern lenke";
      case "header":
        return "Kun menytittel";
      default:
        return type;
    }
  };

  const getTypeBadgeClass = (type: WebNavigationType): string => {
    switch (type) {
      case "page":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "gathering":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "article":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "external":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "header":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6" id="admin-web-menu-builder">
      {/* Top Architecture Breadcrumb Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-indigo-300 flex items-center gap-1.5">
                <span>WEB</span>
                <span>/</span>
                <span className="text-white">Meny</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Nettsidens CMS-navigasjon
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                isFirestoreConnected
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isFirestoreConnected ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
              {isFirestoreConnected ? "Firestore Sanntid aktiv" : "Kobler til Firestore..."}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          Menyen som administrator bygger her lagres direkte i Firestore (samlingen <code className="text-indigo-200 font-mono text-[11px]">webNavigation</code>). Den offentlige nettsiden leser og oppdaterer menyen i sanntid.
        </p>

        {/* Quick Stats */}
        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300 border-t border-slate-800">
          <div>
            <span className="text-slate-400">Totalt: </span>
            <span className="font-bold text-white">{totalItemsCount}</span> menypunkter
          </div>
          <div>
            <span className="text-slate-400">Hovedmeny: </span>
            <span className="font-bold text-white">{rootItemsCount}</span>
          </div>
          <div>
            <span className="text-slate-400">Undermenyer: </span>
            <span className="font-bold text-white">{subItemsCount}</span>
          </div>
          <div>
            <span className="text-slate-400">Publisert: </span>
            <span className="font-bold text-emerald-400">{visibleItemsCount}</span>
          </div>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div
          id="menu-action-toast"
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {actionFeedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/web"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Åpne fullskjerms CMS Desktop Workspace"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Åpne CMS Workspace (Desktop)</span>
          </Link>

          <button
            type="button"
            id="btn-create-root-menu-item"
            onClick={() => handleOpenCreateModal("")}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nytt hovedmenypunkt</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-reset-demo-menu"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="Gjenopprett opprinnelig menystruktur"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Gjenopprett pilot-standard</span>
          </button>
        </div>
      </div>

      {/* Hierarchical Menu Builder Tree */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Menystruktur (To nivåer: Hovedmeny → Undermeny)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Sortert etter rekkefølge
          </span>
        </div>

        {tree.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Menu className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Ingen menypunkter funnet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Det er ingen menypunkter i databasen ennå. Klikk «Nytt hovedmenypunkt» eller gjenopprett pilot-standarden.
            </p>
            <button
              type="button"
              onClick={() => handleResetToDefault()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Gjenopprett pilotmeny nå
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tree.map((root, rootIndex) => {
              const isCollapsed = collapsedParentIds[root.id];
              const hasChildren = root.children && root.children.length > 0;
              const isFirstRoot = rootIndex === 0;
              const isLastRoot = rootIndex === tree.length - 1;

              return (
                <div key={root.id} className="p-3 transition-colors hover:bg-slate-50/50">
                  {/* Root Item Row */}
                  <div
                    id={`menu-item-${root.id}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border transition-all ${
                      root.visible
                        ? "bg-white border-slate-200/90 shadow-xs"
                        : "bg-slate-50/80 border-dashed border-slate-300 text-slate-500"
                    }`}
                  >
                    {/* Left: Drag/Order index, Label, Type, Target */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Collapse/expand if has children */}
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleCollapse(root.id)}
                          className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                          title={isCollapsed ? "Vis undermenyer" : "Skjul undermenyer"}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </div>
                      )}

                      {/* Order pill */}
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {rootIndex + 1}
                      </span>

                      {/* Label & Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`font-bold text-sm tracking-tight ${
                              root.visible ? "text-slate-900" : "text-slate-500 line-through"
                            }`}
                          >
                            {root.label}
                          </span>

                          {/* Type badge */}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getTypeBadgeClass(
                              root.type
                            )}`}
                          >
                            {getTypeLabel(root.type)}
                          </span>

                          {/* Visibility badge */}
                          {root.visible ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Publisert
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              Skjult
                            </span>
                          )}
                        </div>

                        {/* Target Link preview */}
                        {root.target && (
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5 truncate">
                            <span className="text-slate-400">Lenke:</span>
                            <span className="truncate">{root.target}</span>
                            {root.type === "external" && <ExternalLink className="w-2.5 h-2.5 text-slate-400" />}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions (Order buttons, Add Sub, Edit, Toggle Visibility, Delete) */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      {/* Reorder Up / Down */}
                      <button
                        type="button"
                        id={`btn-order-up-${root.id}`}
                        disabled={isFirstRoot}
                        onClick={() => handleReorder(root.id, "up")}
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                        title="Flytt opp i menyen"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        id={`btn-order-down-${root.id}`}
                        disabled={isLastRoot}
                        onClick={() => handleReorder(root.id, "down")}
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                        title="Flytt ned i menyen"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Add Submenu button */}
                      <button
                        type="button"
                        id={`btn-add-sub-${root.id}`}
                        onClick={() => handleOpenCreateModal(root.id)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Legg til undermeny under dette punktet"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Undermeny</span>
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        id={`btn-toggle-vis-${root.id}`}
                        onClick={() => handleToggleVisibility(root)}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                          root.visible
                            ? "bg-white hover:bg-slate-100 border-slate-200 text-emerald-600"
                            : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-400"
                        }`}
                        title={root.visible ? "Skjul menypunkt" : "Gjør synlig"}
                      >
                        {root.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        id={`btn-edit-${root.id}`}
                        onClick={() => handleOpenEditModal(root)}
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                        title="Rediger menypunkt"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        id={`btn-delete-${root.id}`}
                        onClick={() => setItemToDelete(root)}
                        className="w-7 h-7 rounded-lg border border-red-200/80 hover:bg-red-50 flex items-center justify-center text-red-600 transition-colors cursor-pointer"
                        title="Slett menypunkt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Submenu Tree Items */}
                  {hasChildren && !isCollapsed && (
                    <div className="mt-2 ml-4 pl-4 border-l-2 border-indigo-100 space-y-2">
                      {root.children.map((child, childIndex) => {
                        const isFirstChild = childIndex === 0;
                        const isLastChild = childIndex === root.children.length - 1;

                        return (
                          <div
                            key={child.id}
                            id={`menu-item-${child.id}`}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                              child.visible
                                ? "bg-slate-50/90 border-slate-200/70 hover:bg-white"
                                : "bg-slate-100/60 border-dashed border-slate-300 text-slate-400"
                            }`}
                          >
                            {/* Left info */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="w-4 h-4 rounded bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                                {childIndex + 1}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`font-semibold text-xs ${
                                      child.visible ? "text-slate-800" : "text-slate-500 line-through"
                                    }`}
                                  >
                                    {child.label}
                                  </span>

                                  <span
                                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${getTypeBadgeClass(
                                      child.type
                                    )}`}
                                  >
                                    {getTypeLabel(child.type)}
                                  </span>

                                  {child.visible ? (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Synlig
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                      Skjult
                                    </span>
                                  )}
                                </div>

                                {child.target && (
                                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 truncate mt-0.5">
                                    <span className="text-slate-400">Lenke:</span>
                                    <span className="truncate">{child.target}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Actions for Child */}
                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                              {/* Reorder sub-item */}
                              <button
                                type="button"
                                id={`btn-order-up-${child.id}`}
                                disabled={isFirstChild}
                                onClick={() => handleReorder(child.id, "up")}
                                className="w-6 h-6 rounded border border-slate-200 hover:bg-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 cursor-pointer"
                                title="Flytt opp"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                id={`btn-order-down-${child.id}`}
                                disabled={isLastChild}
                                onClick={() => handleReorder(child.id, "down")}
                                className="w-6 h-6 rounded border border-slate-200 hover:bg-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-600 cursor-pointer"
                                title="Flytt ned"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              {/* Toggle Visibility */}
                              <button
                                type="button"
                                id={`btn-toggle-vis-${child.id}`}
                                onClick={() => handleToggleVisibility(child)}
                                className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer ${
                                  child.visible
                                    ? "bg-white border-slate-200 text-emerald-600"
                                    : "bg-slate-200 border-slate-300 text-slate-400"
                                }`}
                                title={child.visible ? "Skjul undermeny" : "Gjør synlig"}
                              >
                                {child.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                id={`btn-edit-${child.id}`}
                                onClick={() => handleOpenEditModal(child)}
                                className="w-6 h-6 rounded border border-slate-200 hover:bg-white flex items-center justify-center text-slate-600 cursor-pointer"
                                title="Rediger undermeny"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                id={`btn-delete-${child.id}`}
                                onClick={() => setItemToDelete(child)}
                                className="w-6 h-6 rounded border border-red-200/80 hover:bg-red-50 flex items-center justify-center text-red-600 cursor-pointer"
                                title="Slett undermeny"
                              >
                                <Trash2 className="w-3 h-3" />
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

      {/* Live Public Menu Preview Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Forhåndsvisning: Slik fremstår den offentlige menyen nå
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            (Kun synlige elementer)
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-400 font-mono mb-2 uppercase tracking-wider">
            Offentlig desktop-visning
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {tree
              .filter((r) => r.visible)
              .map((root) => {
                const visibleChildren = root.children.filter((c) => c.visible);
                return (
                  <div key={root.id} className="relative group">
                    <div className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors">
                      <span>{root.label}</span>
                      {visibleChildren.length > 0 && <ChevronDown className="w-3 h-3 text-slate-400" />}
                    </div>

                    {visibleChildren.length > 0 && (
                      <div className="hidden group-hover:block absolute left-0 top-full pt-1 z-20 w-44">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-1">
                          {visibleChildren.map((c) => (
                            <div
                              key={c.id}
                              className="px-2.5 py-1 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md transition-colors"
                            >
                              {c.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div
          id="menu-item-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {editingItem ? "Rediger menypunkt" : "Opprett nytt menypunkt"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
              {formFeedback && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 ${
                    formFeedback.type === "error"
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formFeedback.text}</span>
                </div>
              )}

              {/* Tittel / Label */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tittel / Etikett <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-menu-label"
                  required
                  placeholder="f.eks. «OM OSS», «Vår tro», «Barnekirke»"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs bg-slate-50/50"
                />
              </div>

              {/* Plassering / Nivå */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Plassering i menyen
                </label>
                <select
                  id="select-menu-parent"
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs bg-slate-50/50"
                >
                  <option value="">Toppnivå (Hovedmeny)</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      ↳ Undermeny under «{parent.label}»
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Velg om dette skal være et hovedpunkt i navigasjonslinjen eller en undermeny.
                </p>
              </div>

              {/* Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Innholdstype
                </label>
                <select
                  id="select-menu-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as WebNavigationType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs bg-slate-50/50"
                >
                  <option value="page">Side (f.eks. intern innholdsside)</option>
                  <option value="gathering">Arrangement / Kalender</option>
                  <option value="article">Artikkel / Nyhet</option>
                  <option value="external">Ekstern lenke</option>
                  <option value="header">Menyoverskrift (kun dropdown, ingen lenke)</option>
                </select>
              </div>

              {/* Mål / Target / URL */}
              {formType !== "header" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Lenke / Mål-URL (target)
                    </label>
                    {cmsPages.length > 0 && (
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        {cmsPages.length} CMS-sider tilgjengelig
                      </span>
                    )}
                  </div>

                  {/* CMS Page Quick Selector */}
                  {cmsPages.length > 0 && (
                    <div className="p-2 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                      <span className="text-[10px] font-bold text-indigo-900 block">
                        Koble direkte til en CMS-side:
                      </span>
                      <select
                        id="select-cms-page-link"
                        value={
                          cmsPages.some(
                            (p) => (p.slug.startsWith("/") ? p.slug : `/${p.slug}`) === formTarget
                          )
                            ? formTarget
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormTarget(e.target.value);
                            const matched = cmsPages.find(
                              (p) => (p.slug.startsWith("/") ? p.slug : `/${p.slug}`) === e.target.value
                            );
                            if (matched && !formLabel.trim()) {
                              setFormLabel(matched.title);
                            }
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs bg-white text-slate-800 font-medium"
                      >
                        <option value="">— Velg fra CMS-sider i Firestore —</option>
                        {cmsPages.map((page) => {
                          const targetUrl = page.slug.startsWith("/") ? page.slug : `/${page.slug}`;
                          return (
                            <option key={page.id} value={targetUrl}>
                              {page.title} ({targetUrl}) {page.status === "draft" ? "– [Utkast]" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  <input
                    type="text"
                    id="input-menu-target"
                    placeholder="f.eks. /om-oss/tro, /kalender, https://..."
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs font-mono bg-slate-50/50"
                  />
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Standard forslag:</span>
                    {["/", "/kalender", "/kontakt", "/om-oss", "/livet"].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setFormTarget(suggestion)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Synlighet (Visible / Hidden) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="checkbox-menu-visible"
                    checked={formVisible}
                    onChange={(e) => setFormVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 block">
                      Synlig på offentlig nettside (Publisert)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Upubliserte punkter er skjult for vanlige besøkende men beholdes i databasen.
                    </span>
                  </div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  id="btn-save-menu-item"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingItem ? "Oppdater punkt" : "Lagre menypunkt"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Slette «{itemToDelete.label}»?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Er du sikker på at du vil slette dette menypunktet fra Firestore?
                {!itemToDelete.parentId && " Eventuelle tilhørende undermenyer vil også bli slettet."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                id="btn-confirm-delete-menu-item"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Slett nå
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PILOT MENU CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Gjenopprette pilot-standard?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Dette vil erstatte gjeldende menypunkter i Firestore med den opprinnelige menystrukturen fra Pilot 1 (HJEM, OM OSS, LIVET I KIRKA, TALER, KALENDER, KONTAKT OSS).
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                id="btn-confirm-reset-menu"
                onClick={handleResetToDefault}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Gjenopprett nå
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
