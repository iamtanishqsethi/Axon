"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { MonacoBinding } from "y-monaco";
import Editor from "@monaco-editor/react";
import { ChevronDown, Play, Trash2, Terminal, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

interface CollaborativeEditorProps {
  roomId: string;
  userName: string;
}

interface LanguageOption {
  id: number;          // Judge0 language_id
  monacoId: string;    // Monaco language id for syntax highlighting
  label: string;
  icon: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 102, monacoId: "javascript", label: "JavaScript", icon: "JS" },
  { id: 101, monacoId: "typescript", label: "TypeScript", icon: "TS" },
  { id: 100, monacoId: "python",     label: "Python",     icon: "PY" },
  { id: 91,  monacoId: "java",       label: "Java",       icon: "JV" },
  { id: 104, monacoId: "c",          label: "C",          icon: "C"  },
  { id: 105, monacoId: "cpp",        label: "C++",        icon: "++" },
  { id: 107, monacoId: "go",         label: "Go",         icon: "GO" },
  { id: 108, monacoId: "rust",       label: "Rust",       icon: "RS" },
  { id: 72,  monacoId: "ruby",       label: "Ruby",       icon: "RB" },
  { id: 51,  monacoId: "csharp",     label: "C#",         icon: "C#" },
  { id: 98,  monacoId: "php",        label: "PHP",        icon: "HP" },
  { id: 83,  monacoId: "swift",      label: "Swift",      icon: "SW" },
];

const COLORS = [
  "#FF3366", "#33CC99", "#3399FF", "#FF9933",
  "#9933FF", "#00CFFF", "#FF3399", "#00FF66",
  "#FFCC00", "#FF6633",
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export default function CollaborativeEditor({ roomId, userName }: CollaborativeEditorProps) {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [outputType, setOutputType] = useState<"idle" | "success" | "error">("idle");
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme || "dark";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SocketIOProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const colorRef = useRef(getRandomColor());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cursorObserverRef = useRef<MutationObserver | null>(null);

  // ─── Close dropdown on outside click ─────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // ─── Apply cursor labels via MutationObserver ────────────────────
  const applyCursorLabels = useCallback((provider: SocketIOProvider) => {
    const awarenessStates = provider.awareness.getStates();
    awarenessStates.forEach((state, clientId) => {
      if (clientId === provider.awareness.clientID) return;
      const user = state.user;
      if (!user?.name) return;

      // Find all elements for this user. y-monaco typically uses .yRemoteSelectionHead and .yRemoteSelectionHead-${clientId}
      const heads = document.querySelectorAll(`.yRemoteSelectionHead[data-client-id="${clientId}"], .yRemoteSelectionHead-${clientId}, .yRemoteSelectionHead`);
      
      heads.forEach((h) => {
        const el = h as HTMLElement;
        
        // We need to make sure we're applying it to the correct user's cursor
        // If it's a generic .yRemoteSelectionHead, we might need a better way to map it, 
        // but usually y-monaco adds the clientId class or attribute.
        
        // If the element doesn't have a client ID yet, and it's not our own, 
        // we might have a race condition or it might be another user's.
        // For now, we trust the specific selectors.
        
        if (el.classList.contains(`yRemoteSelectionHead-${clientId}`) || el.getAttribute('data-client-id') === String(clientId)) {
          el.setAttribute("data-user-name", user.name);
          el.setAttribute("data-client-id", String(clientId));
          if (user.color) {
            el.style.setProperty("--cursor-color", user.color);
          }
        }
      });
    });
  }, []);

  // ─── Editor mount handler ────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Initialize Yjs Document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Connect to Yjs WebSocket via socket.io
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5050";

    // Use a unique room name for the editor to avoid conflicts with whiteboard
    const editorRoomId = `editor-${roomId}`;

    const provider = new SocketIOProvider(serverUrl, editorRoomId, ydoc, {
      autoConnect: true,
    });
    providerRef.current = provider;

    // Setup Awareness
    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: colorRef.current,
    });

    // Bind Yjs to Monaco
    const type = ydoc.getText("monaco");
    bindingRef.current = new MonacoBinding(
      type,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );

    // Sync Language Selection via Yjs shared map
    const configMap = ydoc.getMap("config");

    // Listen for remote language changes
    configMap.observe((event) => {
      if (event.keysChanged.has("language")) {
        const newLangId = configMap.get("language") as number;
        if (newLangId) {
          const found = LANGUAGES.find((l) => l.id === newLangId);
          if (found) setLanguage(found);
        }
      }
    });

    // If a language was already set in the document, use it
    const existingLang = configMap.get("language") as number;
    if (existingLang) {
      const found = LANGUAGES.find((l) => l.id === existingLang);
      if (found) setLanguage(found);
    } else {
      configMap.set("language", language.id);
    }

    // ── MutationObserver for cursor labels ──────────────────────────
    const editorDom = editor.getDomNode();
    if (editorDom) {
      const observer = new MutationObserver(() => {
        applyCursorLabels(provider);
      });

      observer.observe(editorDom, {
        childList: true,
        subtree: true,
      });

      cursorObserverRef.current = observer;
    }

    // Also listen to awareness changes as a fallback
    provider.awareness.on("change", () => {
      requestAnimationFrame(() => applyCursorLabels(provider));
    });

    // Initial apply
    setTimeout(() => applyCursorLabels(provider), 500);
  };

  // ─── Language change handler ─────────────────────────────────────
  const handleLanguageChange = (lang: LanguageOption) => {
    setLanguage(lang);
    setDropdownOpen(false);

    if (ydocRef.current) {
      const configMap = ydocRef.current.getMap("config");
      configMap.set("language", lang.id);
    }
  };

  // ─── Cleanup ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cursorObserverRef.current?.disconnect();
      bindingRef.current?.destroy();
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
    };
  }, []);

  // ─── Run code ────────────────────────────────────────────────────
  const runCode = async () => {
    if (!editorRef.current) return;

    setIsRunning(true);
    setOutput("");
    setOutputType("idle");

    const code = editorRef.current.getValue();

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: language.id,
          code: code,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOutput(data.output || "Program executed successfully (no output).");
        setOutputType(data.output ? "success" : "idle");
      } else if (data.error) {
        setOutput(data.error);
        setOutputType("error");
      } else {
        setOutput("Execution failed with an unknown error.");
        setOutputType("error");
      }
    } catch {
      setOutput("Failed to connect to execution service. Please try again later.");
      setOutputType("error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background overflow-hidden">
      {/* ── Toolbar — z-20 to sit above Monaco's stacking context ──── */}
      <div className="relative z-20 flex items-center justify-between gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 hidden sm:inline">
            Editor
          </span>

          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
          >
            {isRunning ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span className="hidden sm:inline">Running</span>
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                <span className="hidden sm:inline">Run</span>
              </>
            )}
          </button>
        </div>

        {/* Language Selector */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
          >
            <span className="text-[10px] font-mono font-bold text-white/40 w-5 text-center">{language.icon}</span>
            <span className="hidden sm:inline">{language.label}</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 max-h-72 overflow-y-auto rounded-xl z-[100] bg-popover/90 backdrop-blur-2xl border border-border shadow-2xl py-1 dark:bg-black/80 dark:border-white/10">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                    language.id === lang.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-muted-foreground/40 w-5 text-center">{lang.icon}</span>
                  {lang.label}
                  {language.id === lang.id && (
                    <div className="ml-auto size-1.5 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Editor + Output ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 relative min-h-0">
          <Editor
            height="100%"
            language={language.monacoId}
            theme={currentTheme === "dark" ? "vs-dark" : "light"}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              padding: { top: 16 },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              formatOnPaste: true,
              formatOnType: true,
              scrollBeyondLastLine: false,
              renderLineHighlightOnlyWhenFocus: true,
            }}
          />
        </div>

        {/* Output Panel */}
        <div className="h-36 flex flex-col border-t border-border/50 bg-muted/20">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30">
            <div className="flex items-center gap-1.5">
              <Terminal size={11} className="text-muted-foreground/40" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Output</span>
              {outputType === "error" && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">Error</span>
              )}
            </div>
            {output && (
              <button
                onClick={() => { setOutput(""); setOutputType("idle"); }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Trash2 size={10} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
          <div className="flex-1 px-3 py-2 overflow-y-auto font-mono text-[13px] leading-relaxed">
            {output ? (
              <pre className={`whitespace-pre-wrap break-words ${
                outputType === "error" ? "text-red-500/90" : "text-foreground/80"
              }`}>
                {output}
              </pre>
            ) : (
              <span className="text-muted-foreground/30 text-xs italic">
                {isRunning ? "Executing..." : 'Click "Run" to execute your code.'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
