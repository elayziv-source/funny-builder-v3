
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { FunnelConfig, PageConfig, ThemeConfig, LayoutConfig, SplitTestConfig } from '../types';
import { INITIAL_CONFIG } from '../constants';

// --- Types for AI Chat ---
export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    image?: string; // base64
    fileName?: string; // For PDFs/Files
    actionPerformed?: string;
    error?: boolean;
    timestamp: number;
}

// --- Validation Types ---
export interface ValidationError {
    type: 'error' | 'warning';
    field: string;
    message: string;
    pageId?: string;
}

const MAX_HISTORY = 50; // Prevent unbounded memory growth

interface FunnelContextType {
  config: FunnelConfig;
  activePageId: string;
  setActivePageId: (id: string) => void;
  updatePage: (pageId: string, newConfig: PageConfig) => void;
  updateTheme: (newTheme: ThemeConfig) => void;
  updateLayout: (newLayout: LayoutConfig) => void;
  updateSplitTest: (newSplitTest: SplitTestConfig) => void;
  updateEvents: (eventsConfig: Partial<FunnelConfig>) => void;
  addPage: (pageId: string, newConfig: PageConfig) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (newOrder: string[]) => void;
  deletePage: (pageId: string) => void;
  deleteTemplate: (templateId: string) => void;
  downloadConfig: () => void;
  downloadPageConfig: (pageId: string) => void;
  downloadThemeConfig: () => void;
  copyToClipboard: (data: any) => Promise<void>;
  downloadAsText: (data: any, filename: string) => void;
  loadConfig: (file: File) => void;
  validateConfig: () => ValidationError[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Toast-style notifications instead of alert()
  notification: { message: string; type: 'success' | 'error' | 'warning' | 'info' } | null;
  clearNotification: () => void;

  // AI Chat Persistence
  chatHistory: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  isAiLoading: boolean;
  setAiLoading: (loading: boolean) => void;
}

const FunnelContext = createContext<FunnelContextType | undefined>(undefined);

export const FunnelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<FunnelConfig>(INITIAL_CONFIG);
  const [history, setHistory] = useState<{ past: FunnelConfig[], future: FunnelConfig[] }>({ past: [], future: [] });

  const firstPage = Object.keys(INITIAL_CONFIG.pages)[0];
  const [activePageId, setActivePageId] = useState<string>(firstPage || '');

  // Toast notification state (replaces alert())
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      if (notificationTimer.current) clearTimeout(notificationTimer.current);
      setNotification({ message, type });
      notificationTimer.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  const clearNotification = useCallback(() => setNotification(null), []);

  // AI Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiLoading, setAiLoading] = useState(false);

  const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      setChatHistory(prev => [...prev, {
          ...msg,
          id: `msg-${Date.now()}-${Math.random()}`,
          timestamp: Date.now()
      }]);
  };

  const clearChat = () => setChatHistory([]);

  // Refs for undo/redo to avoid stale closures
  const configRef = useRef(config);
  const historyRef = useRef(history);

  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { historyRef.current = history; }, [history]);

  // Wrapper for setConfig to handle history with bounded stack
  const setConfig = (newConfig: FunnelConfig | ((prev: FunnelConfig) => FunnelConfig)) => {
      setConfigState((prevConfig) => {
          const nextConfig = typeof newConfig === 'function' ? newConfig(prevConfig) : newConfig;

          setHistory(h => ({
              past: [...h.past, prevConfig].slice(-MAX_HISTORY), // Cap at MAX_HISTORY
              future: []
          }));

          return nextConfig;
      });
  };

  const undo = useCallback(() => {
      const h = historyRef.current;
      const currentConfig = configRef.current;
      if (h.past.length === 0) return;

      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);

      setHistory({
          past: newPast,
          future: [currentConfig, ...h.future]
      });
      setConfigState(previous);
  }, []);

  const redo = useCallback(() => {
      const h = historyRef.current;
      const currentConfig = configRef.current;
      if (h.future.length === 0) return;

      const next = h.future[0];
      const newFuture = h.future.slice(1);

      setHistory({
          past: [...h.past, currentConfig],
          future: newFuture
      });
      setConfigState(next);
  }, []);

  // Keyboard Shortcuts - no more stale closure issues
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Don't intercept when typing in inputs
          const tag = (e.target as HTMLElement)?.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              if (e.shiftKey) {
                  redo();
              } else {
                  undo();
              }
              e.preventDefault();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              redo();
              e.preventDefault();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const reindexPages = (pages: Record<string, PageConfig>): Record<string, PageConfig> => {
      const newPages: Record<string, PageConfig> = {};
      Object.keys(pages).forEach((key, index) => {
          newPages[key] = {
              ...pages[key],
              path: (index + 1).toString()
          };
      });
      return newPages;
  };

  /**
   * Build a map of event name -> owner page key by scanning template_data
   * for string values that match event routing keys.
   */
  const buildEventOwnerMap = (
      pages: Record<string, PageConfig>,
      routing: Record<string, any>
  ): Record<string, string> => {
      const ownerMap: Record<string, string> = {};
      const eventNames = new Set(Object.keys(routing));
      Object.entries(pages).forEach(([pageKey, page]) => {
          if (page.template_data) {
              Object.values(page.template_data).forEach(val => {
                  if (typeof val === 'string' && eventNames.has(val)) {
                      ownerMap[val] = pageKey;
                  }
              });
          }
      });
      return ownerMap;
  };

  /**
   * After reindexing pages, update all event_routing route.to values
   * using smart sequential detection:
   *  - If an event's route.to was "next page" (ownerPath + 1), keep it as
   *    the owner's new path + 1 so the sequential flow follows visual order.
   *  - If the route was non-sequential (custom jump), preserve the target
   *    page identity via pathMap so the link follows the specific page.
   *  - Conditional branch targets always preserve page identity via pathMap.
   */
  const reindexEventRouting = (
      oldPages: Record<string, PageConfig>,
      newPages: Record<string, PageConfig>,
      routing: Record<string, any>
  ): { routing: Record<string, any>; sequentialCount: number; customCount: number } => {
      // Build a map of old path -> new path (by page key identity)
      const pathMap: Record<string, string> = {};
      Object.entries(oldPages).forEach(([key, oldPage]) => {
          const newPage = newPages[key];
          if (newPage && oldPage.path !== newPage.path) {
              pathMap[oldPage.path] = newPage.path;
          }
      });

      if (Object.keys(pathMap).length === 0 && Object.keys(routing).length === 0) {
          return { routing, sequentialCount: 0, customCount: 0 };
      }

      // Map event -> owner page key (using OLD pages, before reorder)
      const eventOwnerMap = buildEventOwnerMap(oldPages, routing);

      let sequentialCount = 0;
      let customCount = 0;

      const newRouting = JSON.parse(JSON.stringify(routing));
      for (const eventName in newRouting) {
          const event = newRouting[eventName];
          if (!event?.route?.to) continue;

          const ownerPageKey = eventOwnerMap[eventName];
          const ownerOldPath = ownerPageKey ? oldPages[ownerPageKey]?.path : null;
          const ownerNewPath = ownerPageKey ? newPages[ownerPageKey]?.path : null;

          // Check if this event followed the sequential "next page" pattern
          const oldRouteTo = event.route.to;
          const wasSequential = ownerOldPath != null &&
              parseInt(oldRouteTo) === parseInt(ownerOldPath) + 1;

          if (wasSequential && ownerNewPath != null) {
              // Maintain "next page" semantics — route to owner's new position + 1
              event.route.to = (parseInt(ownerNewPath) + 1).toString();
              sequentialCount++;
          } else if (pathMap[oldRouteTo]) {
              // Non-sequential: follow the specific target page to its new position
              event.route.to = pathMap[oldRouteTo];
              customCount++;
          }

          // Conditional branch targets always preserve page identity
          if (Array.isArray(event?.route?.conditions)) {
              for (const cond of event.route.conditions) {
                  if (cond.target && pathMap[cond.target]) {
                      cond.target = pathMap[cond.target];
                  }
              }
          }
      }
      return { routing: newRouting, sequentialCount, customCount };
  };

  const updatePage = (pageId: string, newConfig: PageConfig) => {
    setConfig((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageId]: newConfig,
      },
    }));
  };

  const updateTheme = (newTheme: ThemeConfig) => {
    setConfig((prev) => ({
        ...prev,
        theme: newTheme
    }));
  };

  const updateLayout = (newLayout: LayoutConfig) => {
      setConfig((prev) => ({
          ...prev,
          layout: newLayout
      }));
  };

  const updateSplitTest = (newSplitTest: SplitTestConfig) => {
      setConfig((prev) => ({
          ...prev,
          split_test: newSplitTest
      }));
  };

  const updateEvents = (eventsConfig: Partial<FunnelConfig>) => {
      setConfig((prev) => ({
          ...prev,
          ...eventsConfig
      }));
  };

  const addPage = (pageId: string, newConfig: PageConfig) => {
     setConfig((prev) => {
       const updatedPages = { ...prev.pages, [pageId]: newConfig };
       const reindexed = reindexPages(updatedPages);
       const { routing: updatedRouting } = reindexEventRouting(prev.pages, reindexed, prev.event_routing);
       return {
         ...prev,
         pages: reindexed,
         event_routing: updatedRouting
       };
    });
    setActivePageId(pageId);
  };

  const duplicatePage = (pageId: string) => {
      const pageToClone = config.pages[pageId];
      if (!pageToClone) return;

      const newId = `${pageId}-copy-${Date.now()}`;

      const newPage = {
          ...JSON.parse(JSON.stringify(pageToClone)),
          name: `${pageToClone.name} (Copy)`
      };

      const pageEntries = Object.entries(config.pages);
      const index = pageEntries.findIndex(([key]) => key === pageId);

      const newEntries = [
          ...pageEntries.slice(0, index + 1),
          [newId, newPage],
          ...pageEntries.slice(index + 1)
      ];

      const newPagesRaw = Object.fromEntries(newEntries);
      const reindexed = reindexPages(newPagesRaw);

      setConfig(prev => {
          const { routing: updatedRouting } = reindexEventRouting(prev.pages, reindexed, prev.event_routing);
          return {
              ...prev,
              pages: reindexed,
              event_routing: updatedRouting
          };
      });
      setActivePageId(newId);
  };

  const reorderPages = (newOrder: string[]) => {
      let seqCount = 0;
      let custCount = 0;
      setConfig(prev => {
          const newPagesRaw: Record<string, PageConfig> = {};
          newOrder.forEach(key => {
              if (prev.pages[key]) {
                  newPagesRaw[key] = prev.pages[key];
              }
          });
          const reindexed = reindexPages(newPagesRaw);
          const { routing: updatedRouting, sequentialCount, customCount } = reindexEventRouting(prev.pages, reindexed, prev.event_routing);
          seqCount = sequentialCount;
          custCount = customCount;
          return { ...prev, pages: reindexed, event_routing: updatedRouting };
      });
      // Show routing change summary toast
      if (seqCount > 0 || custCount > 0) {
          const parts: string[] = [];
          if (seqCount > 0) parts.push(`${seqCount} route${seqCount > 1 ? 's' : ''} follow new order`);
          if (custCount > 0) parts.push(`${custCount} custom route${custCount > 1 ? 's' : ''} preserved`);
          notify(`Routing updated: ${parts.join(', ')}`, 'info');
      }
  };

  // --- ROBUST DELETE PAGE FUNCTION ---
  const deletePage = (pageId: string) => {
      const pageKeys = Object.keys(config.pages);

      // Safety check: Don't delete if it's the only page or doesn't exist
      if (!pageKeys.includes(pageId)) return;
      if (pageKeys.length <= 1) {
          notify("Cannot delete the last page.", 'warning');
          return;
      }

      // 1. Calculate the new Active ID *before* modifying state
      let nextIdToActivate = activePageId;

      if (activePageId === pageId) {
          const currentIndex = pageKeys.indexOf(pageId);
          if (currentIndex > 0) {
              nextIdToActivate = pageKeys[currentIndex - 1];
          } else {
              nextIdToActivate = pageKeys[currentIndex + 1];
          }
      }

      // 2. Perform Atomic Update - also clean up event routing
      setConfig(prev => {
          const remainingPagesEntries = Object.entries(prev.pages).filter(([key]) => key !== pageId);
          const remainingPagesObj = Object.fromEntries(remainingPagesEntries);
          const reindexed = reindexPages(remainingPagesObj);

          // Clean up event routing: fix route.to values after reindex
          const { routing: updatedRouting } = reindexEventRouting(prev.pages, reindexed, prev.event_routing);

          return {
              ...prev,
              pages: reindexed,
              event_routing: updatedRouting
          };
      });

      // 3. Update Active ID
      setActivePageId(nextIdToActivate);
      notify("Page deleted.", 'info');
  };

  const deleteTemplate = (templateId: string) => {
      // Safety: Check if any pages reference this template
      const referencingPages = (Object.entries(config.pages) as [string, PageConfig][])
          .filter(([, page]) => page.template === templateId)
          .map(([key, page]) => page.name || key);

      if (referencingPages.length > 0) {
          notify(
              `Cannot delete "${templateId}" - used by: ${referencingPages.join(', ')}. Update those pages first.`,
              'error'
          );
          return;
      }

      // Don't delete header/footer templates
      if (templateId === 'header' || templateId === 'footer') {
          notify(`Cannot delete the ${templateId} template.`, 'warning');
          return;
      }

      setConfig(prev => {
          const newTemplates = { ...prev.templates };
          delete newTemplates[templateId];
          return {
              ...prev,
              templates: newTemplates
          };
      });
      notify(`Template "${templateId}" deleted.`, 'info');
  };

  const downloadAsText = (data: any, filename: string) => {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 4));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const copyToClipboard = async (data: any) => {
      try {
          await navigator.clipboard.writeText(JSON.stringify(data, null, 4));
          notify("Copied to clipboard!", 'success');
      } catch (err) {
          console.error("Failed to copy:", err);
          notify("Failed to copy to clipboard.", 'error');
      }
  };

  const loadConfig = (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);

              // Validate required top-level fields
              if (!json.pages || typeof json.pages !== 'object') {
                  notify("Invalid config: missing 'pages' object.", 'error');
                  return;
              }
              if (!json.theme || typeof json.theme !== 'object') {
                  notify("Invalid config: missing 'theme' object.", 'error');
                  return;
              }
              if (!json.templates || typeof json.templates !== 'object') {
                  notify("Invalid config: missing 'templates' object.", 'error');
                  return;
              }

              // Ensure required theme sub-objects exist
              if (!json.theme.colors) json.theme.colors = {};
              if (!json.theme.fonts) json.theme.fonts = {};
              if (!json.theme.spacing) json.theme.spacing = {};
              if (!json.theme.border_radius) json.theme.border_radius = {};
              if (!json.theme.width) json.theme.width = {};
              if (!json.theme.border) json.theme.border = {};

              // Ensure layout exists
              if (!json.layout) {
                  json.layout = {
                      header: { template: 'header', template_data: {} },
                      footer: { template: 'footer', template_data: {} }
                  };
              }

              setConfigState(json);
              setHistory({ past: [], future: [] });

              const firstKey = Object.keys(json.pages)[0];
              if (firstKey) setActivePageId(firstKey);
              notify(`Config loaded: ${json.name || file.name} (v${json.version || '?'})`, 'success');
          } catch (e) {
              console.error(e);
              notify("Error parsing JSON file. Check the file format.", 'error');
          }
      };
      reader.readAsText(file);
  };

  // --- CONFIG VALIDATION (Funny Schema Compliance) ---
  const validateConfig = useCallback((): ValidationError[] => {
      const errors: ValidationError[] = [];
      const pages = config.pages;
      const templates = config.templates;
      const routing = config.event_routing || {};

      // 1. Check page paths are sequential
      const paths: number[] = [];
      for (const [pageId, page] of Object.entries(pages) as [string, PageConfig][]) {
          if (!page.path) {
              errors.push({ type: 'error', field: 'path', message: `Missing path`, pageId });
          } else {
              const pathNum = parseInt(page.path, 10);
              if (isNaN(pathNum)) {
                  errors.push({ type: 'error', field: 'path', message: `Non-numeric path: "${page.path}"`, pageId });
              } else {
                  paths.push(pathNum);
              }
          }
      }
      const sortedPaths = [...paths].sort((a, b) => a - b);
      const expected = Array.from({ length: paths.length }, (_, i) => i + 1);
      if (JSON.stringify(sortedPaths) !== JSON.stringify(expected)) {
          errors.push({ type: 'error', field: 'paths', message: `Path sequence broken: [${sortedPaths.join(',')}] vs expected [${expected.join(',')}]` });
      }

      // 2. Check all page templates exist
      for (const [pageId, page] of Object.entries(pages) as [string, PageConfig][]) {
          if (!page.template) {
              errors.push({ type: 'error', field: 'template', message: `Missing template`, pageId });
          } else if (!templates[page.template]) {
              errors.push({ type: 'error', field: 'template', message: `Template "${page.template}" not found in templates`, pageId });
          }
          if (!page.name) {
              errors.push({ type: 'warning', field: 'name', message: `Missing page name`, pageId });
          }
      }

      // 3. Check all route.to targets exist (including conditional targets)
      const validPaths = new Set((Object.values(pages) as PageConfig[]).map(p => p.path));
      for (const [eventName, event] of Object.entries(routing) as [string, any][]) {
          if (event?.route?.to) {
              const target = event.route.to;
              if (!validPaths.has(target)) {
                  errors.push({ type: 'error', field: 'event_routing', message: `Event "${eventName}" routes to non-existent path: "${target}"` });
              }
          }
          // Validate conditional route targets
          if (Array.isArray(event?.route?.conditions)) {
              event.route.conditions.forEach((cond: any, idx: number) => {
                  if (cond.target && !validPaths.has(cond.target)) {
                      errors.push({ type: 'error', field: 'event_routing', message: `Event "${eventName}" condition #${idx + 1} routes to non-existent path: "${cond.target}"` });
                  }
                  if (!cond.field) {
                      errors.push({ type: 'warning', field: 'event_routing', message: `Event "${eventName}" condition #${idx + 1} has no field specified` });
                  }
              });
          }
      }

      // 4. Check template_data event references exist in routing
      for (const [pageId, page] of Object.entries(pages) as [string, PageConfig][]) {
          const td = page.template_data || {};
          for (const [key, value] of Object.entries(td)) {
              if (key.startsWith('_on_') && typeof value === 'string' && value !== '') {
                  if (!routing[value]) {
                      errors.push({ type: 'warning', field: key, message: `References event "${value}" not found in event_routing`, pageId });
                  }
              }
          }
      }

      // 5. Check for empty required template_data fields
      for (const [pageId, page] of Object.entries(pages) as [string, PageConfig][]) {
          const td = page.template_data || {};
          if (!td._title_text && !td._html && !td._html_title) {
              errors.push({ type: 'warning', field: '_title_text', message: `No title or HTML content`, pageId });
          }
      }

      // 6. Check theme tokens
      if (!config.theme.colors.primary) errors.push({ type: 'warning', field: 'theme.colors.primary', message: 'Missing primary color' });
      if (!config.theme.colors.background) errors.push({ type: 'warning', field: 'theme.colors.background', message: 'Missing background color' });
      if (Object.keys(config.theme.fonts).length === 0) errors.push({ type: 'warning', field: 'theme.fonts', message: 'No fonts defined' });

      // 7. Check for __template_preview__ page (stale preview)
      if (pages['__template_preview__']) {
          errors.push({ type: 'warning', field: 'pages', message: 'Stale template preview page found - will be removed on export' });
      }

      return errors;
  }, [config]);

  const prepareConfigForExport = (): { config: FunnelConfig; errors: ValidationError[] } => {
      const compiled: FunnelConfig = JSON.parse(JSON.stringify(config));

      // Remove stale preview pages
      delete compiled.pages['__template_preview__'];

      // Re-index pages
      const pageIds = Object.keys(compiled.pages);
      pageIds.forEach((id, index) => {
          compiled.pages[id].path = (index + 1).toString();
      });

      // Validate before export
      const errors = validateConfig();
      const criticalErrors = errors.filter(e => e.type === 'error' && e.field !== 'pages');

      return { config: compiled, errors: criticalErrors };
  };

  const downloadConfig = () => {
      const { config: finalConfig, errors } = prepareConfigForExport();

      if (errors.length > 0) {
          const errorMessages = errors.map(e => `- ${e.message}${e.pageId ? ` (page: ${e.pageId})` : ''}`).join('\n');
          const proceed = window.confirm(
              `Config has ${errors.length} validation error(s):\n\n${errorMessages}\n\nDownload anyway?`
          );
          if (!proceed) return;
      }

      downloadAsText(finalConfig, `${finalConfig.brand}_v${finalConfig.version}_compiled.json`);
      notify("Config downloaded!", 'success');
  };

  const downloadPageConfig = (pageId: string) => {
      const pageData = { [pageId]: config.pages[pageId] };
      downloadAsText(pageData, `${pageId}_config.json`);
  };

  const downloadThemeConfig = () => downloadAsText(config.theme, `${config.brand}_theme.json`);

  return (
    <FunnelContext.Provider value={{
        config,
        activePageId,
        setActivePageId,
        updatePage,
        updateTheme,
        updateLayout,
        updateSplitTest,
        updateEvents,
        addPage,
        duplicatePage,
        reorderPages,
        deletePage,
        deleteTemplate,
        downloadConfig,
        downloadPageConfig,
        downloadThemeConfig,
        copyToClipboard,
        downloadAsText,
        loadConfig,
        validateConfig,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        // Notifications
        notification,
        clearNotification,
        // Chat
        chatHistory,
        addChatMessage,
        clearChat,
        isAiLoading,
        setAiLoading
    }}>
      {children}
    </FunnelContext.Provider>
  );
};

export const useFunnel = () => {
  const context = useContext(FunnelContext);
  if (!context) {
    throw new Error('useFunnel must be used within a FunnelProvider');
  }
  return context;
};
