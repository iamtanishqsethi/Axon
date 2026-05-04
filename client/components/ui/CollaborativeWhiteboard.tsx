"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

interface CollaborativeWhiteboardProps {
  roomId: string;
  userName: string;
}

const COLORS = [
  "#FF3366", "#33CC99", "#3399FF", "#FF9933",
  "#9933FF", "#00CFFF", "#FF3399", "#00FF66",
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawImperativeAPI = any;

export default function CollaborativeWhiteboard({ roomId, userName }: CollaborativeWhiteboardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SocketIOProvider | null>(null);
  const colorRef = useRef(getRandomColor());
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = (resolvedTheme || theme || "dark") as "dark" | "light";

  /**
   * Accumulated map of element IDs → the last version+versionNonce we received
   * from a remote Yjs update.  We NEVER clear this map — we only update entries.
   *
   * In onChange we skip any element whose id+version+nonce exactly matches the
   * last remote entry, because that element came FROM Yjs and we must not echo
   * it back.  As soon as the local user edits that element its versionNonce
   * changes, so it will no longer match and will be pushed normally.
   */
  const remoteVersionsRef = useRef<Map<string, { version: number; versionNonce: number }>>(new Map());

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!excalidrawAPI || !mounted) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const serverUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_SERVER_URL ||
      "http://localhost:5050";

    const provider = new SocketIOProvider(serverUrl, `whiteboard-${roomId}`, ydoc, {
      autoConnect: true,
    });
    providerRef.current = provider;

    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: colorRef.current,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yElementsMap = ydoc.getMap<any>("elementsMap");

    // Remote Yjs → Excalidraw
    const applyRemoteElements = () => {
      if (!excalidrawAPI) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elements: any[] = Object.values(yElementsMap.toJSON());

      // ACCUMULATE (not replace) the last-known remote version for each element.
      elements.forEach((el) => {
        remoteVersionsRef.current.set(el.id, {
          version: el.version,
          versionNonce: el.versionNonce,
        });
      });

      excalidrawAPI.updateScene({ elements, commitToHistory: false });
    };

    yElementsMap.observe(applyRemoteElements);

    // Collaborative cursors
    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const collaborators = new Map();
      states.forEach((state, clientId) => {
        if (clientId === provider.awareness.clientID) return;
        if (state.user && state.pointer) {
          collaborators.set(String(clientId), {
            pointer: state.pointer,
            button: state.button || "up",
            username: state.user.name,
            color: state.user.color,
          });
        }
      });
      excalidrawAPI.updateScene({ collaborators });
    };

    provider.awareness.on("change", handleAwarenessChange);

    // Hydrate canvas if joining a session already in progress
    if (Object.keys(yElementsMap.toJSON()).length > 0) {
      applyRemoteElements();
    }

    return () => {
      yElementsMap.unobserve(applyRemoteElements);
      provider.awareness.off("change", handleAwarenessChange);
      provider.destroy();
      ydoc.destroy();
    };
  }, [excalidrawAPI, mounted, roomId, userName]);

  // Local Excalidraw → Yjs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = useCallback((elements: readonly any[]) => {
    if (!ydocRef.current) return;

    const yElementsMap = ydocRef.current.getMap("elementsMap");
    const remoteVersions = remoteVersionsRef.current;

    // Filter to only elements that differ from the last remote state we applied.
    // This prevents echoing remote elements back to Yjs while still allowing
    // local edits (which change the versionNonce even at the same version).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changed = elements.filter((el: any) => {
      const remote = remoteVersions.get(el.id);
      if (!remote) return true; // brand-new local element — always push
      // If exact same version+nonce it's an unchanged remote element — skip
      return !(remote.version === el.version && remote.versionNonce === el.versionNonce);
    });

    if (changed.length === 0) return;

    ydocRef.current.transact(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      changed.forEach((el: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = yElementsMap.get(el.id) as any;
        if (
          !existing ||
          el.version > existing.version ||
          (el.version === existing.version && el.versionNonce !== existing.versionNonce) ||
          (el.isDeleted && !existing.isDeleted)
        ) {
          yElementsMap.set(el.id, el);
        }
      });
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerUpdate = useCallback((payload: any) => {
    if (!providerRef.current) return;
    providerRef.current.awareness.setLocalStateField("pointer", payload.pointer);
    providerRef.current.awareness.setLocalStateField("button", payload.button);
  }, []);

  const excalidrawUIOptions = React.useMemo(
    () => ({ canvasActions: { loadScene: false, export: false } } as const),
    []
  );

  const excalidrawInitialData = React.useMemo(
    () => ({ appState: { viewBackgroundColor: "transparent", theme: currentTheme } }),
    [currentTheme]
  );

  const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <span className="text-white/30 text-sm">Loading whiteboard...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-background overflow-hidden">
      <div className="relative z-20 flex items-center justify-between gap-2 px-3 py-2 bg-muted/20 border-b border-border/50 backdrop-blur-xl">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
          Whiteboard
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/40 hidden sm:inline">
            Collaborative &bull; {userName}
          </span>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0">
          <Excalidraw
            excalidrawAPI={handleExcalidrawAPI}
            onChange={handleChange}
            onPointerUpdate={handlePointerUpdate}
            theme={currentTheme}
            UIOptions={excalidrawUIOptions}
            initialData={excalidrawInitialData}
          />
        </div>
      </div>
    </div>
  );
}
