import React, { useState } from "react";
import { WebPage } from "../../../types";
import {
  X,
  Smartphone,
  Monitor,
  ExternalLink,
  Globe,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";

interface CmsPreviewModalProps {
  page: WebPage;
  onClose: () => void;
  onPublishToggle?: () => void;
}

export const CmsPreviewModal: React.FC<CmsPreviewModalProps> = ({
  page,
  onClose,
  onPublishToggle,
}) => {
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const fullUrl = page.slug.startsWith("/") ? page.slug : `/${page.slug}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      {/* Top Preview Bar */}
      <div className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Forhåndsvisning:</span>
            <span className="font-mono text-indigo-400 font-semibold">{fullUrl}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {page.status === "published" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                Publisert
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-bold">
                <Clock className="w-3 h-3" />
                Utkast (ikke publisert)
              </span>
            )}
          </div>
        </div>

        {/* Center Device Switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setDeviceView("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              deviceView === "desktop"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceView("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              deviceView === "mobile"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobil</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {onPublishToggle && (
            <button
              type="button"
              onClick={onPublishToggle}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                page.status === "published"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {page.status === "published" ? "Sett til utkast" : "Publiser nå"}
            </button>
          )}

          <a
            href={fullUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <span>Åpne i ny fane</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Lukk forhåndsvisning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
        <div
          className={`bg-slate-100 transition-all duration-200 rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col ${
            deviceView === "mobile"
              ? "w-[390px] min-h-[720px] max-w-full my-auto"
              : "w-full max-w-4xl min-h-[600px]"
          }`}
        >
          {/* Simulated Browser Bar */}
          <div className="h-9 bg-slate-200/90 border-b border-slate-300/80 px-4 flex items-center gap-2 text-slate-500 text-xs select-none">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 max-w-sm mx-auto bg-white/80 rounded-md py-0.5 px-3 text-center font-mono text-[10px] text-slate-600 truncate border border-slate-300/60">
              lillesandmisjonskirke.no{fullUrl}
            </div>
          </div>

          {/* Rendered Page Content */}
          <div className="p-6 sm:p-10 space-y-6 bg-white min-h-[500px]">
            {/* Header section */}
            <div className="space-y-3 border-b border-slate-100 pb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {page.title || "Uten tittel"}
              </h1>

              {page.ingress && (
                <p className="text-base sm:text-lg font-medium text-slate-600 leading-relaxed">
                  {page.ingress}
                </p>
              )}
            </div>

            {/* Main Header Image */}
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

            {/* Rich HTML body text or plain text */}
            {page.bodyText && (
              <div
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: page.bodyText }}
              />
            )}

            {/* Blocks */}
            {page.blocks && page.blocks.length > 0 && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                {page.blocks.map((block) => (
                  <div key={block.id} className="space-y-3">
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

                    {block.type === "text" && block.text && (
                      <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                        {block.text}
                      </div>
                    )}

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

                    {block.type === "button" && block.buttonLabel && (
                      <div className="py-2">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs">
                          <span>{block.buttonLabel}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}

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
          </div>
        </div>
      </div>
    </div>
  );
};
