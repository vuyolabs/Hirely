"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Quote,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Describe role responsibilities, team structure, qualifications, and benefits...",
  disabled = false,
  className,
  minHeight = "220px",
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const isInternalChange = React.useRef(false);

  // Sync external value changes into contentEditable innerHTML
  React.useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    isInternalChange.current = true;
    const html = editorRef.current.innerHTML;
    // If empty or only a break tag, normalize to empty string
    if (html === "<br>" || html === "<div><br></div>" || html.trim() === "") {
      onChange("");
    } else {
      onChange(html);
    }
  };

  const executeCommand = (command: string, arg?: string) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-input bg-transparent shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/20",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border/70 bg-muted/40 px-2.5 py-1.5 rounded-t-xl">
        <button
          type="button"
          disabled={disabled}
          onClick={() => executeCommand("bold")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => executeCommand("italic")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          disabled={disabled}
          onClick={() => executeCommand("formatBlock", "<h2>")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
          title="Section Heading (H2)"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => executeCommand("formatBlock", "<h3>")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
          title="Sub-heading (H3)"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          disabled={disabled}
          onClick={() => executeCommand("insertUnorderedList")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => executeCommand("insertOrderedList")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => executeCommand("formatBlock", "<blockquote>")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
          title="Quote Block"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => executeCommand("formatBlock", "<pre>")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => executeCommand("undo")}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
            title="Undo"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => executeCommand("redo")}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none"
            title="Redo"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editable Canvas */}
      <div className="relative p-3">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          style={{ minHeight }}
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none outline-none leading-relaxed",
            "[&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-foreground",
            "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-foreground",
            "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5",
            "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5",
            "[&_li]:my-0.5",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2",
            "[&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2"
          )}
        />

        {/* Floating placeholder when empty */}
        {(!value || value.trim() === "") && (
          <div
            onClick={() => editorRef.current?.focus()}
            className="pointer-events-none absolute left-3 top-3 select-none text-xs text-muted-foreground"
          >
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
