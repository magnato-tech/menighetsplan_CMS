import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Undo,
  Redo,
  Unlink,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  placeholder = "Skriv innholdet ditt her...",
}) => {
  const [showSource, setShowSource] = useState<boolean>(false);
  const [sourceCode, setSourceCode] = useState<string>(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-600 underline font-semibold hover:text-indigo-800",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-2xl my-4 max-h-96 object-cover border border-slate-200/80 shadow-xs",
        },
      }),
    ],
    content: content || `<p>${placeholder}</p>`,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none min-h-[260px] p-4 text-sm sm:text-base leading-relaxed text-slate-800",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setSourceCode(html);
      onChange(html);
    },
  });

  // Sync external content changes if editor content differs
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || `<p>${placeholder}</p>`);
      setSourceCode(content);
    }
  }, [content, editor, placeholder]);

  // Handle source code view update
  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setSourceCode(newHtml);
    onChange(newHtml);
    if (editor) {
      editor.commands.setContent(newHtml);
    }
  };

  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Skriv inn URL / lenkeadresse:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleAddImage = () => {
    if (!editor) return;
    const url = window.prompt(
      "Skriv inn bildeadresse (URL):",
      "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1200&auto=format&fit=crop&q=80"
    );

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!editor) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-2xl animate-pulse">
        Laster rik teksteditor...
      </div>
    );
  }

  return (
    <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/90 border-b border-slate-200 text-slate-600 sticky top-0 z-10 backdrop-blur-xs">
        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
            editor.isActive("heading", { level: 2 })
              ? "bg-indigo-100 text-indigo-800"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Overskrift H2"
        >
          <Heading2 className="w-3.5 h-3.5" />
          <span>H2</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
            editor.isActive("heading", { level: 3 })
              ? "bg-indigo-100 text-indigo-800"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Mellomtittel H3"
        >
          <Heading3 className="w-3.5 h-3.5" />
          <span>H3</span>
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Basic formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("bold")
              ? "bg-indigo-100 text-indigo-800"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Fet (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("italic")
              ? "bg-indigo-100 text-indigo-800"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Kursiv (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("strike")
              ? "bg-indigo-100 text-indigo-800"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Gjennomstreking"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("bulletList")
              ? "bg-indigo-100 text-indigo-800"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Punktliste"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("orderedList")
              ? "bg-indigo-100 text-indigo-800"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Nummerert liste"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("blockquote")
              ? "bg-indigo-100 text-indigo-800"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Sitatblokk"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Skillelinje"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Link and Image */}
        <button
          type="button"
          onClick={handleSetLink}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("link")
              ? "bg-indigo-100 text-indigo-800"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Sett inn lenke"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-lg hover:bg-red-100 text-red-700 transition-colors cursor-pointer"
            title="Fjern lenke"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleAddImage}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Sett inn bilde (URL)"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
          title="Angre (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
          title="Gjenta (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>

        {/* Source view toggle */}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setShowSource((prev) => !prev)}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              showSource
                ? "bg-indigo-600 text-white"
                : "hover:bg-slate-200 text-slate-600 bg-slate-100"
            }`}
            title="Vis/rediger HTML-kildekode"
          >
            <Code className="w-3 h-3" />
            <span>{showSource ? "Visuelt" : "Kilde"}</span>
          </button>
        </div>
      </div>

      {/* EDITOR CONTENT AREA */}
      {showSource ? (
        <textarea
          rows={12}
          value={sourceCode}
          onChange={handleSourceChange}
          className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-900 text-emerald-400 focus:outline-hidden min-h-[260px] leading-relaxed resize-y"
          placeholder="<p>HTML-kildekode...</p>"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
};
