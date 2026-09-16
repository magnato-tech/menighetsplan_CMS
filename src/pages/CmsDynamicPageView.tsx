import React from "react";
import { useLocation, Link, useNavigate, useParams } from "react-router-dom";
import { useWebPages } from "../hooks/useWebPages";
import { useWebNavigation } from "../hooks/useWebNavigation";
import { useLeaderDashboard } from "../hooks/useAppHooks";
import {
  Globe,
  ChevronRight,
  ArrowLeft,
  FileText,
  ExternalLink,
  Shield,
  Layers,
  AlertTriangle,
  Clock,
  Archive,
  Edit3,
  Plus,
  Home,
  CheckCircle2,
} from "lucide-react";

export const CmsDynamicPageView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ slug?: string }>();
  const { getPageBySlug, publishPage } = useWebPages();
  const { items } = useWebNavigation();
  const { currentUser } = useLeaderDashboard();
  const isAdmin = currentUser.globalRole === "admin";

  // Determine lookup slug:
  // Can be from route params (:slug), or the raw location.pathname (e.g. "/misjon", "/om-oss/tro")
  const rawPath = location.pathname;
  const currentSlug = params.slug || rawPath;

  // Retrieve CMS page by slug
  const page = getPageBySlug(currentSlug);

  // Check if there is a navigation item in webNavigation matching this path
  const currentNavItem = items.find((item) => {
    if (!item.target) return false;
    const cleanTarget = item.target.replace(/^\/+|\/+$/g, "");
    const cleanCurrent = rawPath.replace(/^\/+|\/+$/g, "");
    return cleanTarget === cleanCurrent;
  });

  const parentNavItem = currentNavItem?.parentId
    ? items.find((i) => i.id === currentNavItem.parentId)
    : null;

  const siblings = currentNavItem
    ? items.filter(
        (i) => (i.parentId || null) === (currentNavItem.parentId || null) && i.id !== currentNavItem.id && i.visible
      )
    : [];

  // If page exists in CMS
  if (page) {
    const isUnpublished = page.status !== "published";

    // If page is not published and viewer is NOT an admin, show friendly 403/unavailable screen
    if (isUnpublished && !isAdmin) {
      return (
        <div className="w-full max-w-2xl mx-auto px-4 py-12 space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
              <Clock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Siden er ikke publisert</h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Denne nettsiden er for øyeblikket lagret som et utkast eller arkivert og er ikke tilgjengelig for offentligheten ennå.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Tilbake til forsiden</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Sort content blocks by order
    const sortedBlocks = page.blocks
      ? [...page.blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : [];

    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
        {/* Breadcrumb navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto pb-1">
          <Link to="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <span>Hjem</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {parentNavItem && (
            <>
              <span className="text-slate-600 font-medium">{parentNavItem.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </>
          )}
          <span className="font-bold text-slate-900 truncate">{page.title}</span>
        </nav>

        {/* Admin Draft Banner if unpublished */}
        {isUnpublished && isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold block">
                  UTKAST / IKKE PUBLISERT FOR BESØKENDE
                </span>
                <span className="text-[11px] text-amber-700">
                  Denne siden har status <strong>«{page.status}»</strong>. Den er kun synlig fordi du er innlogget som administrator.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => publishPage(page.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publiser nå</span>
              </button>
              <Link
                to="/admin?tab=web&subtab=pages"
                className="px-3 py-1.5 bg-white text-amber-900 border border-amber-200 hover:bg-amber-100 text-xs font-semibold rounded-xl transition-colors"
              >
                Rediger
              </Link>
            </div>
          </div>
        )}

        {/* Main Article Container */}
        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-6">
          {/* Header section */}
          <div className="space-y-3 border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[11px] font-bold">
                  <Globe className="w-3.5 h-3.5" />
                  <span>CMS Dynamisk Side</span>
                </span>
                <span className="text-xs font-mono text-slate-400">/{page.slug}</span>
              </div>

              {isAdmin && (
                <Link
                  to="/admin?tab=web&subtab=pages"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-slate-50 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Rediger i Web Admin</span>
                </Link>
              )}
            </div>

            {/* Page Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {page.title}
            </h1>

            {/* Ingress */}
            {page.ingress && (
              <p className="text-base sm:text-lg font-medium text-slate-600 leading-relaxed pt-1">
                {page.ingress}
              </p>
            )}
          </div>

          {/* Main Hero / Header Image */}
          {page.imageUrl && (
            <div className="rounded-2xl overflow-hidden max-h-96 border border-slate-200/80 shadow-xs">
              <img
                src={page.imageUrl}
                alt={page.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Main Body Text */}
          {page.bodyText && (
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
              {page.bodyText}
            </div>
          )}

          {/* Dynamic Content Blocks */}
          {sortedBlocks.length > 0 && (
            <div className="space-y-6 pt-2">
              {sortedBlocks.map((block) => (
                <div key={block.id} className="space-y-3">
                  {/* HEADING BLOCK */}
                  {block.type === "heading" && (
                    <div>
                      {block.headingLevel === "h3" ? (
                        <h3 className="text-lg font-bold text-slate-900 mt-4 mb-1">
                          {block.headingText}
                        </h3>
                      ) : (
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-6 mb-2 border-b border-slate-100 pb-2">
                          {block.headingText}
                        </h2>
                      )}
                    </div>
                  )}

                  {/* TEXT BLOCK */}
                  {block.type === "text" && block.text && (
                    <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                      {block.text}
                    </div>
                  )}

                  {/* IMAGE BLOCK */}
                  {block.type === "image" && block.imageUrl && (
                    <figure className="my-4">
                      <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs max-h-80">
                        <img
                          src={block.imageUrl}
                          alt={block.imageCaption || page.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      {block.imageCaption && (
                        <figcaption className="text-center text-xs text-slate-500 mt-2 font-medium">
                          {block.imageCaption}
                        </figcaption>
                      )}
                    </figure>
                  )}

                  {/* BUTTON / LINK BLOCK */}
                  {block.type === "button" && block.buttonLabel && (
                    <div className="py-2">
                      <Link
                        to={block.buttonUrl || "/kontakt"}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
                      >
                        <span>{block.buttonLabel}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* QUOTE BLOCK */}
                  {block.type === "quote" && block.quoteText && (
                    <blockquote className="border-l-4 border-indigo-600 pl-4 py-2 my-4 bg-indigo-50/40 rounded-r-2xl space-y-1">
                      <p className="text-sm italic font-medium text-slate-800 leading-relaxed">
                        {block.quoteText}
                      </p>
                      {block.quoteAuthor && (
                        <cite className="block text-xs font-semibold text-slate-500 not-italic">
                          — {block.quoteAuthor}
                        </cite>
                      )}
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sibling navigation if linked to menu */}
          {siblings.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Flere sider under {parentNavItem ? `«${parentNavItem.label}»` : "denne seksjonen"}:
              </h4>
              <div className="flex flex-wrap gap-2">
                {siblings.map((sib) => (
                  <Link
                    key={sib.id}
                    to={sib.target || "/"}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                  >
                    {sib.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer back button */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Gå tilbake</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <span>Til forsiden</span>
            </Link>
          </div>
        </article>
      </div>
    );
  }

  // Fallback: If page is NOT in CMS, check if it's a known menu navigation item
  if (currentNavItem) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto pb-1">
          <Link to="/" className="hover:text-slate-900 transition-colors">Hjem</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {parentNavItem && (
            <>
              <span className="text-slate-600 font-medium">{parentNavItem.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </>
          )}
          <span className="font-bold text-slate-900">{currentNavItem.label}</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Menypunkt i navigasjon</span>
            </span>

            {isAdmin && (
              <Link
                to="/admin?tab=web&subtab=pages"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Opprett CMS-side for dette punktet</span>
              </Link>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {currentNavItem.label}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Dette menypunktet er aktivt i navigasjonen, men det er ikke opprettet noe eget sideinnhold i CMS-sideoversikten ennå.
          </p>

          {isAdmin && (
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2">
              <span className="text-xs font-bold text-indigo-950 block">
                Administrator: Opprett side-innhold
              </span>
              <p className="text-xs text-indigo-800">
                Du kan når som helst opprette en side med URL-sti <strong className="font-mono">{currentNavItem.target}</strong> i Web Admin for å fylle denne siden med bilder, ingress og innholdsblokker.
              </p>
              <Link
                to="/admin?tab=web&subtab=pages"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gå til Web Admin → Sider</span>
              </Link>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Gå tilbake</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <span>Til forsiden</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 404 Not Found fallback
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-16 text-center space-y-5 animate-in fade-in duration-200">
      <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
        <FileText className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900">404 – Siden ble ikke funnet</h1>
        <p className="text-xs text-slate-500 font-mono">
          {rawPath}
        </p>
      </div>
      <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
        Siden du leter etter finnes ikke i CMS-et eller har blitt flyttet.
      </p>

      {isAdmin && (
        <div className="pt-2">
          <Link
            to="/admin?tab=web&subtab=pages"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Opprett «{rawPath.replace(/^\//, "")}» i Web Admin</span>
          </Link>
        </div>
      )}

      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Gå til forsiden</span>
        </Link>
      </div>
    </div>
  );
};
