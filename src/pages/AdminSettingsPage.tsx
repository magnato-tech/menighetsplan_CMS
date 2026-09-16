import React from "react";
import { Link } from "react-router-dom";
import { useModuleConfig, useAdminDashboard } from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import {
  Shield,
  ArrowLeft,
  Settings,
  Calendar,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Sliders,
  Info,
} from "lucide-react";

export const AdminSettingsPage: React.FC = () => {
  const { isAdmin, currentUser } = useAdminDashboard();
  const { kalender, meldinger, toggleKalender, toggleMeldinger } = useModuleConfig();

  // Friendly access denied screen if user is not admin
  if (!isAdmin) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Admin-tilgang kreves</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {currentUser.name} har rollen <span className="font-semibold text-slate-700">«{currentUser.globalRole}»</span> og har ikke tilgang til innstillingsflaten.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til Min side
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Mock User Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Top Header */}
      <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
        <Link
          to="/admin"
          id="btn-back-to-admin-from-settings"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin-oversikt
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
          Innstillinger
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Valgfrie moduler</h2>
            <p className="text-xs text-slate-500 font-medium">
              Aktiver eller deaktiver tilleggsfunksjoner for menigheten
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-950">Modulstatus i prototypen</p>
            <p className="text-[11px] text-blue-800/90 mt-0.5">
              Valgfrie moduler er som standard satt til <strong>«off»</strong>. Når de slås på, vises modulens fane i toppmenyen og åpner en plassholderside.
            </p>
          </div>
        </div>

        {/* Module Switches Section */}
        <section
          id="admin-module-toggles-section"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-500" />
              Tilleggsmoduler (useModuleConfig)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Session mock-state</span>
          </div>

          <div className="space-y-3">
            {/* Kalender Toggle Card */}
            <div
              id="module-toggle-card-kalender"
              className={`p-3.5 rounded-xl border transition-all ${
                kalender === "on"
                  ? "bg-emerald-50/60 border-emerald-200/80"
                  : "bg-slate-50/70 border-slate-200/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      kalender === "on"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Kalendermodul
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          kalender === "on"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {kalender.toUpperCase()}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Felles kalenderoversikt for menighetens arrangementer.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-settings-toggle-kalender"
                  onClick={toggleKalender}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    kalender === "on"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {kalender === "on" ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      På (on)
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Av (off)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Meldinger Toggle Card */}
            <div
              id="module-toggle-card-meldinger"
              className={`p-3.5 rounded-xl border transition-all ${
                meldinger === "on"
                  ? "bg-blue-50/60 border-blue-200/80"
                  : "bg-slate-50/70 border-slate-200/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      meldinger === "on"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Meldingsmodul
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          meldinger === "on"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {meldinger.toUpperCase()}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Separat meldingsmodul (fremtidig produktområde). «Beskjed til gruppen» i gruppelederflaten fungerer uavhengig av denne innstillingen.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-settings-toggle-meldinger"
                  onClick={toggleMeldinger}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    meldinger === "on"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {meldinger === "on" ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      På (on)
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Av (off)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
