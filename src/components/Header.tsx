import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserSwitcher } from "./UserSwitcher";
import { useLeaderDashboard, useModuleConfig } from "../hooks/useAppHooks";
import { useWebNavigation } from "../hooks/useWebNavigation";
import {
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Globe,
  Sparkles,
  Shield,
  Layers,
} from "lucide-react";

export const Header: React.FC = () => {
  const location = useLocation();
  const { isLeader, urgentGatherings, currentUser } = useLeaderDashboard();
  const { isKalenderOn, isMeldingerOn } = useModuleConfig();
  const { visibleTree, isFirestoreConnected } = useWebNavigation();

  const isAdmin = currentUser.globalRole === "admin";

  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Active hover/open dropdown on desktop
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile submenu accordion state
  const [expandedMobileParentIds, setExpandedMobileParentIds] = useState<Record<string, boolean>>({});

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdownId(null);
  }, [location.pathname]);

  const toggleMobileParent = (id: string) => {
    setExpandedMobileParentIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleMouseEnter = (id: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdownId(id);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdownId(null);
    }, 150);
  };

  const isLeaderPath = location.pathname.startsWith("/leder");
  const isAdminPath = location.pathname.startsWith("/admin");
  const isKalenderPath = location.pathname.startsWith("/kalender");
  const isMeldingerPath = location.pathname.startsWith("/meldinger");
  const isMyPagePath =
    !isLeaderPath && !isAdminPath && !isKalenderPath && !isMeldingerPath;

  // Helper to check if a navigation item is active
  const isItemActive = (target?: string, children?: { target?: string }[]) => {
    if (target && target !== "#" && location.pathname === target) return true;
    if (children && children.some((c) => c.target && location.pathname === c.target)) {
      return true;
    }
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Top bar: Brand, Public Desktop Navigation, and User Switcher */}
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Brand Logo & Name */}
          <Link
            to="/"
            id="app-logo-link"
            className="flex flex-col group transition-opacity hover:opacity-90 shrink-0"
          >
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Menighetsplan
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/60 hidden sm:inline-block">
                CMS 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Varmt fellesskap. Enkel tjeneste.
            </p>
          </Link>

          {/* Desktop Public Dynamic Navigation Bar (Firestore-driven) */}
          <nav
            id="public-desktop-navigation"
            aria-label="Hovednavigasjon"
            className="hidden md:flex items-center gap-1 lg:gap-1.5 flex-1 justify-center max-w-2xl"
          >
            {visibleTree.map((root) => {
              const hasChildren = root.children && root.children.length > 0;
              const isActive = isItemActive(root.target, root.children);
              const isDropdownOpen = openDropdownId === root.id;

              if (hasChildren) {
                return (
                  <div
                    key={root.id}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(root.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      type="button"
                      id={`nav-dropdown-${root.id}`}
                      onClick={() => setOpenDropdownId(isDropdownOpen ? null : root.id)}
                      aria-expanded={isDropdownOpen}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : isDropdownOpen
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span>{root.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Submenu Dropdown Box */}
                    {isDropdownOpen && (
                      <div
                        id={`submenu-card-${root.id}`}
                        className="absolute left-0 top-full pt-1.5 z-50 w-52 animate-in fade-in slide-in-from-top-1 duration-150"
                      >
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 space-y-0.5">
                          {root.children.map((child) => {
                            const isChildActive = location.pathname === child.target;
                            const isExternal = child.type === "external" || child.target?.startsWith("http");

                            if (isExternal) {
                              return (
                                <a
                                  key={child.id}
                                  href={child.target}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/70 transition-colors"
                                >
                                  <span>{child.label}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              );
                            }

                            return (
                              <Link
                                key={child.id}
                                to={child.target || "/"}
                                className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                                  isChildActive
                                    ? "bg-indigo-50 text-indigo-700 font-bold"
                                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                                }`}
                              >
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Simple root link without children
              const isExternal = root.type === "external" || root.target?.startsWith("http");
              if (isExternal) {
                return (
                  <a
                    key={root.id}
                    href={root.target}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
                  >
                    <span>{root.label}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                );
              }

              return (
                <Link
                  key={root.id}
                  to={root.target || "/"}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {root.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Section: User Switcher & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <UserSwitcher />

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Lukk meny" : "Åpne meny"}
              className="md:hidden w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Role Quick Bar (Min side / Leder / Admin / Kalender / Meldinger) */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100/90 text-xs overflow-x-auto scrollbar-none gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 hidden sm:inline-block">
              Verktøy:
            </span>

            <Link
              to="/"
              id="nav-tab-min-side"
              className={`font-bold px-2.5 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isMyPagePath
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Min side
            </Link>

            {isLeader && (
              <Link
                to="/leder"
                id="nav-tab-leder"
                className={`font-bold px-2.5 py-1 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isLeaderPath
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60"
                }`}
              >
                <span>Gruppeleder</span>
                {urgentGatherings.length > 0 && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLeaderPath ? "bg-amber-300" : "bg-red-500"
                    } animate-pulse`}
                    title="Trenger vikar"
                  />
                )}
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  id="nav-tab-admin"
                  className={`font-bold px-2.5 py-1 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                    isAdminPath
                      ? "bg-indigo-700 text-white shadow-xs"
                      : "text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/60"
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Admin</span>
                </Link>

                <Link
                  to="/admin/web"
                  id="nav-tab-cms-workspace"
                  className="font-bold px-2.5 py-1 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer text-slate-800 bg-white hover:bg-slate-100 border border-slate-300/80 shadow-2xs"
                  title="Åpne CMS Desktop Arbeidsflate (Pilot 2.1 & 3)"
                >
                  <Layers className="w-3 h-3 text-indigo-600" />
                  <span>CMS Workspace</span>
                  <span className="text-[9px] font-extrabold uppercase px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 leading-none">
                    Desktop
                  </span>
                </Link>
              </>
            )}

            {isKalenderOn && (
              <Link
                to="/kalender"
                id="nav-tab-kalender"
                className={`font-bold px-2.5 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isKalenderPath
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60"
                }`}
              >
                Kalender
              </Link>
            )}

            {isMeldingerOn && (
              <Link
                to="/meldinger"
                id="nav-tab-meldinger"
                className={`font-bold px-2.5 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isMeldingerPath
                    ? "bg-blue-700 text-white shadow-xs"
                    : "text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60"
                }`}
              >
                Meldinger
              </Link>
            )}
          </div>

          {/* Quick link to CMS menu builder for Admin */}
          {isAdmin && (
            <Link
              to="/admin?tab=web"
              id="link-header-cms-builder"
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/70 px-2 py-0.5 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-colors shrink-0"
              title="Gå til Web Admin for å redigere menyen"
            >
              <Globe className="w-3 h-3" />
              <span>Bygg meny (CMS)</span>
            </Link>
          )}
        </div>

        {/* MOBILE NAVIGATION DRAWER (Dropdown for smaller screens) */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-drawer"
            className="md:hidden py-4 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200"
          >
            {/* Dynamic Public Web Navigation */}
            <div className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Offentlig nettsidemeny (Firestore)</span>
                <span className="text-emerald-600 font-bold">Sanntid</span>
              </div>

              {visibleTree.map((root) => {
                const hasChildren = root.children && root.children.length > 0;
                const isExpanded = expandedMobileParentIds[root.id];
                const isActive = isItemActive(root.target, root.children);

                if (hasChildren) {
                  return (
                    <div key={root.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleMobileParent(root.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                          isActive
                            ? "bg-slate-900 text-white"
                            : "text-slate-800 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <span>{root.label}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Expandable Children */}
                      {isExpanded && (
                        <div className="ml-3 pl-3 border-l-2 border-slate-200 space-y-1 py-1">
                          {root.children.map((child) => {
                            const isChildActive = location.pathname === child.target;
                            const isExternal = child.type === "external" || child.target?.startsWith("http");

                            if (isExternal) {
                              return (
                                <a
                                  key={child.id}
                                  href={child.target}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 hover:text-indigo-600 rounded-lg"
                                >
                                  <span>{child.label}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              );
                            }

                            return (
                              <Link
                                key={child.id}
                                to={child.target || "/"}
                                className={`block px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                  isChildActive
                                    ? "bg-indigo-50 text-indigo-700 font-bold"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Simple root item
                return (
                  <Link
                    key={root.id}
                    to={root.target || "/"}
                    className={`block px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {root.label}
                  </Link>
                );
              })}
            </div>

            {/* Admin shortcut in mobile drawer */}
            {isAdmin && (
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/admin?tab=web"
                  className="flex items-center justify-between px-3 py-2.5 bg-indigo-50 text-indigo-800 rounded-xl text-xs font-bold border border-indigo-200/70"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>Web Admin (Menybygger)</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-indigo-200/60 rounded text-indigo-900">
                    CMS
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
