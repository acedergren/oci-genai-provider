import { O as ensure_array_like, P as attr_class, Q as stringify, T as attr_style, V as clsx, X as attr } from './index-Dv037QX6.js';
import { DefaultChatTransport, AbstractChat } from 'ai';
import { k as escape_html, e as is_array, c as get_prototype_of, o as object_prototype } from './context-CKR25gbz.js';
import 'clsx';

const empty = [];
function snapshot(value, skip_warning = false, no_tojson = false) {
  return clone(value, /* @__PURE__ */ new Map(), "", empty, null, no_tojson);
}
function clone(value, cloned, path, paths, original = null, no_tojson = false) {
  if (typeof value === "object" && value !== null) {
    var unwrapped = cloned.get(value);
    if (unwrapped !== void 0) return unwrapped;
    if (value instanceof Map) return (
      /** @type {Snapshot<T>} */
      new Map(value)
    );
    if (value instanceof Set) return (
      /** @type {Snapshot<T>} */
      new Set(value)
    );
    if (is_array(value)) {
      var copy = (
        /** @type {Snapshot<any>} */
        Array(value.length)
      );
      cloned.set(value, copy);
      if (original !== null) {
        cloned.set(original, copy);
      }
      for (var i = 0; i < value.length; i += 1) {
        var element = value[i];
        if (i in value) {
          copy[i] = clone(element, cloned, path, paths, null, no_tojson);
        }
      }
      return copy;
    }
    if (get_prototype_of(value) === object_prototype) {
      copy = {};
      cloned.set(value, copy);
      if (original !== null) {
        cloned.set(original, copy);
      }
      for (var key in value) {
        copy[key] = clone(
          // @ts-expect-error
          value[key],
          cloned,
          path,
          paths,
          null,
          no_tojson
        );
      }
      return copy;
    }
    if (value instanceof Date) {
      return (
        /** @type {Snapshot<T>} */
        structuredClone(value)
      );
    }
    if (typeof /** @type {T & { toJSON?: any } } */
    value.toJSON === "function" && !no_tojson) {
      return clone(
        /** @type {T & { toJSON(): any } } */
        value.toJSON(),
        cloned,
        path,
        paths,
        // Associate the instance with the toJSON clone
        value
      );
    }
  }
  if (value instanceof EventTarget) {
    return (
      /** @type {Snapshot<T>} */
      value
    );
  }
  try {
    return (
      /** @type {Snapshot<T>} */
      structuredClone(value)
    );
  } catch (e) {
    return (
      /** @type {Snapshot<T>} */
      value
    );
  }
}
class Chat extends AbstractChat {
  constructor(init) {
    super({ ...init, state: new SvelteChatState(init.messages) });
  }
}
class SvelteChatState {
  messages;
  status = "ready";
  error = void 0;
  constructor(messages = []) {
    this.messages = messages;
  }
  setMessages = (messages) => {
    this.messages = messages;
  };
  pushMessage = (message) => {
    this.messages.push(message);
  };
  popMessage = () => {
    this.messages.pop();
  };
  replaceMessage = (index, message) => {
    this.messages[index] = message;
  };
  snapshot = (thing) => snapshot(thing);
}
function Spinner($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { variant = "dots", size = "md", label, color } = $$props;
    const sizeClasses = { sm: "text-sm", md: "text-base", lg: "text-lg" };
    const dots = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const pulse = ["●", "◐", "○", "◑"];
    let frameIndex = 0;
    const currentFrame = variant === "pulse" ? pulse[frameIndex] : dots[frameIndex];
    $$renderer2.push(`<span${attr_class(`inline-flex items-center gap-2 ${stringify(sizeClasses[size])}`)}>`);
    if (variant === "ring") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span${attr_class("inline-block animate-spin rounded-full border-2 border-current border-t-transparent", void 0, {
        "w-4": size === "sm",
        "h-4": size === "sm",
        "w-5": size === "md",
        "h-5": size === "md",
        "w-6": size === "lg",
        "h-6": size === "lg"
      })}${attr_style("", { color: color || "var(--agent-thinking)" })}></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<span class="font-mono"${attr_style("", { color: color || "var(--agent-thinking)" })}>${escape_html(currentFrame)}</span>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (label) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-secondary">${escape_html(label)}</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></span>`);
  });
}
function Badge($$renderer, $$props) {
  let { variant = "default", children } = $$props;
  const variantClasses = {
    default: "badge-default",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    info: "badge-info",
    accent: "badge-accent"
  };
  $$renderer.push(`<span${attr_class(`badge ${stringify(variantClasses[variant])}`)}>`);
  children($$renderer);
  $$renderer.push(`<!----></span>`);
}
function Collapsible($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { title, isOpen = false, shortcut, badge, children, ontoggle } = $$props;
    $$renderer2.push(`<div class="panel mb-2"><button class="panel-header w-full flex items-center justify-between rounded-t-md"${attr("aria-expanded", isOpen)}><div class="flex items-center gap-2"><span${attr_class("text-tertiary transition-transform", void 0, { "rotate-90": isOpen })}>▶</span> <span class="text-primary font-medium">${escape_html(title)}</span> `);
    if (badge) {
      $$renderer2.push("<!--[-->");
      badge($$renderer2);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (shortcut) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-tertiary text-sm">[${escape_html(shortcut)}]</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></button> `);
    if (isOpen) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="panel-content animate-slide-in-up">`);
      children($$renderer2);
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function ModelPicker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      isOpen = false,
      currentModel = "meta.llama-3.3-70b-instruct",
      models: propModels,
      region = "unknown"
    } = $$props;
    const defaultModels = [
      // Google Gemini models
      {
        id: "google.gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Most capable Gemini model"
      },
      {
        id: "google.gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Fast and efficient Gemini"
      },
      {
        id: "google.gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash-Lite",
        description: "Lightweight Gemini for cost efficiency"
      },
      // Meta Llama 4 models
      {
        id: "meta.llama-4-maverick",
        name: "Llama 4 Maverick",
        description: "Flagship Llama 4 (17B active / 400B total)"
      },
      {
        id: "meta.llama-4-scout",
        name: "Llama 4 Scout",
        description: "Efficient Llama 4 (17B active / 109B total)"
      },
      // Meta Llama 3.x models
      {
        id: "meta.llama-3.3-70b-instruct",
        name: "Llama 3.3 70B",
        description: "Fast, capable general-purpose model"
      },
      {
        id: "meta.llama-3.2-90b-vision-instruct",
        name: "Llama 3.2 90B Vision",
        description: "Multimodal with image understanding"
      },
      {
        id: "meta.llama-3.2-11b-vision-instruct",
        name: "Llama 3.2 11B Vision",
        description: "Lightweight multimodal model"
      },
      {
        id: "meta.llama-3.1-405b-instruct",
        name: "Llama 3.1 405B",
        description: "Most capable Llama 3, best quality"
      },
      // Cohere models
      {
        id: "cohere.command-a-03-2025",
        name: "Command A",
        description: "Latest Cohere with tool use, 256K context"
      },
      {
        id: "cohere.command-a-reasoning",
        name: "Command A Reasoning",
        description: "Optimized for complex reasoning tasks"
      },
      {
        id: "cohere.command-a-vision",
        name: "Command A Vision",
        description: "Multimodal Command with vision"
      },
      {
        id: "cohere.command-r-plus-08-2024",
        name: "Command R+ (08-2024)",
        description: "Advanced RAG optimization"
      },
      {
        id: "cohere.command-r-08-2024",
        name: "Command R (08-2024)",
        description: "Fast and efficient"
      },
      // xAI Grok models
      {
        id: "xai.grok-4",
        name: "Grok 4",
        description: "Latest flagship Grok model"
      },
      {
        id: "xai.grok-4-fast",
        name: "Grok 4 Fast",
        description: "Optimized Grok 4 for speed"
      },
      {
        id: "xai.grok-4.1-fast",
        name: "Grok 4.1 Fast",
        description: "Updated fast Grok model"
      },
      {
        id: "xai.grok-3",
        name: "Grok 3",
        description: "Capable reasoning model"
      },
      {
        id: "xai.grok-3-mini",
        name: "Grok 3 Mini",
        description: "Efficient smaller Grok"
      },
      {
        id: "xai.grok-code-fast-1",
        name: "Grok Code Fast",
        description: "Optimized for code generation"
      }
    ];
    const models = propModels && propModels.length > 0 ? propModels : defaultModels;
    let selectedIndex = 0;
    if (
      // Reset selection and focus when opened
      // Focus the dialog after it renders
      isOpen
    ) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button class="fixed inset-0 bg-black/50 z-40" aria-label="Close model picker"></button> <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 bg-secondary border border-default rounded-lg shadow-xl animate-slide-in-up outline-none" role="dialog" aria-modal="true" aria-label="Select model" tabindex="-1"><div class="p-4 border-b border-muted"><div class="flex items-center justify-between"><h2 class="text-lg font-semibold text-primary">Select Model</h2> <span class="text-xs text-tertiary font-mono">${escape_html(region)}</span></div> <p class="text-sm text-tertiary mt-1">Use arrow keys and Enter, or click to select</p></div> <div class="p-2 max-h-80 overflow-y-auto"><!--[-->`);
      const each_array = ensure_array_like(models);
      for (let index = 0, $$length = each_array.length; index < $$length; index++) {
        let model = each_array[index];
        $$renderer2.push(`<button${attr_class(`w-full text-left p-3 rounded-lg transition-fast ${stringify(index === selectedIndex ? "bg-elevated border border-focused" : "hover:bg-hover border border-transparent")}`)}><div class="flex items-center justify-between"><span class="font-medium text-primary">${escape_html(model.name)}</span> `);
        if (model.id === currentModel) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-accent text-sm">current</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div> <p class="text-sm text-secondary mt-1">${escape_html(model.description)}</p> <p class="text-xs text-tertiary mt-1 font-mono">${escape_html(model.id)}</p></button>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="p-3 border-t border-muted text-xs text-tertiary flex justify-between"><span>[↑↓] navigate</span> <span>[Enter] select</span> <span>[Esc] close</span></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function ThoughtPanel($$renderer, $$props) {
  let { isOpen = false, isThinking = false, ontoggle } = $$props;
  {
    let badge = function($$renderer2) {
      if (isThinking) {
        $$renderer2.push("<!--[-->");
        Spinner($$renderer2, { variant: "pulse", size: "sm" });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    };
    Collapsible($$renderer, {
      title: "Thought",
      isOpen,
      shortcut: "t",
      ontoggle,
      badge,
      children: ($$renderer2) => {
        $$renderer2.push(`<div class="max-h-40 overflow-y-auto">`);
        {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<p class="text-tertiary text-sm italic">${escape_html(isThinking ? "Thinking..." : "No active thought")}</p>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
    });
  }
}
function ReasoningPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { isOpen = false, steps = [], ontoggle } = $$props;
    {
      let badge = function($$renderer3) {
        if (steps.length > 0) {
          $$renderer3.push("<!--[-->");
          Badge($$renderer3, {
            variant: "info",
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(steps.length)}`);
            }
          });
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      };
      Collapsible($$renderer2, {
        title: "Reasoning",
        isOpen,
        shortcut: "r",
        ontoggle,
        badge,
        children: ($$renderer3) => {
          $$renderer3.push(`<div class="max-h-60 overflow-y-auto space-y-2">`);
          if (steps.length > 0) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<!--[-->`);
            const each_array = ensure_array_like(steps);
            for (let index = 0, $$length = each_array.length; index < $$length; index++) {
              let step = each_array[index];
              $$renderer3.push(`<div class="flex gap-2 animate-slide-in-up"><span class="text-accent font-medium">${escape_html(index + 1)}.</span> <span class="text-secondary text-sm">${escape_html(step.content)}</span></div>`);
            }
            $$renderer3.push(`<!--]-->`);
          } else {
            $$renderer3.push("<!--[!-->");
            $$renderer3.push(`<p class="text-tertiary text-sm italic">No reasoning steps yet</p>`);
          }
          $$renderer3.push(`<!--]--></div>`);
        }
      });
    }
  });
}
function ToolPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      isOpen = false,
      tools = [],
      ontoggle
    } = $$props;
    const runningCount = tools.filter((t) => t.status === "running").length;
    const statusColors = {
      pending: "text-tertiary",
      awaiting_approval: "text-warning",
      running: "text-executing",
      completed: "text-success",
      error: "text-error"
    };
    const statusIcons = {
      pending: "○",
      awaiting_approval: "?",
      running: "●",
      completed: "✓",
      error: "✗"
    };
    {
      let badge = function($$renderer3) {
        $$renderer3.push(`<div class="flex items-center gap-1">`);
        if (runningCount > 0) {
          $$renderer3.push("<!--[-->");
          Spinner($$renderer3, { size: "sm" });
          $$renderer3.push(`<!----> `);
          Badge($$renderer3, {
            variant: "info",
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(runningCount)}`);
            }
          });
          $$renderer3.push(`<!---->`);
        } else {
          $$renderer3.push("<!--[!-->");
          if (tools.length > 0) {
            $$renderer3.push("<!--[-->");
            Badge($$renderer3, {
              variant: "default",
              children: ($$renderer4) => {
                $$renderer4.push(`<!---->${escape_html(tools.length)}`);
              }
            });
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></div>`);
      };
      Collapsible($$renderer2, {
        title: "Tools",
        isOpen,
        shortcut: "o",
        ontoggle,
        badge,
        children: ($$renderer3) => {
          $$renderer3.push(`<div class="space-y-3">`);
          {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> <div class="max-h-40 overflow-y-auto space-y-1">`);
          if (tools.length > 0) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<!--[-->`);
            const each_array_1 = ensure_array_like(tools);
            for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
              let tool = each_array_1[$$index_1];
              $$renderer3.push(`<div class="flex items-center gap-2 text-sm"><span${attr_class(clsx(statusColors[tool.status]))}>`);
              if (tool.status === "running") {
                $$renderer3.push("<!--[-->");
                Spinner($$renderer3, { size: "sm" });
              } else {
                $$renderer3.push("<!--[!-->");
                $$renderer3.push(`${escape_html(statusIcons[tool.status])}`);
              }
              $$renderer3.push(`<!--]--></span> <span class="text-secondary">${escape_html(tool.name)}</span> `);
              if (tool.completedAt && tool.startedAt) {
                $$renderer3.push("<!--[-->");
                $$renderer3.push(`<span class="text-tertiary text-xs">${escape_html(tool.completedAt - tool.startedAt)}ms</span>`);
              } else {
                $$renderer3.push("<!--[!-->");
              }
              $$renderer3.push(`<!--]--></div>`);
            }
            $$renderer3.push(`<!--]-->`);
          } else {
            $$renderer3.push("<!--[!-->");
            {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<p class="text-tertiary text-sm italic">No tool executions</p>`);
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]--></div></div>`);
        }
      });
    }
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let localSessions = data.sessions;
    let localSessionId = data.currentSessionId;
    let input = "";
    let thoughtOpen = false;
    let reasoningOpen = false;
    let toolsOpen = true;
    let selectedModel = "meta.llama-3.3-70b-instruct";
    let modelPickerOpen = false;
    let availableModels = [];
    let currentRegion = "loading...";
    let reasoningSteps = [];
    let toolCalls = [];
    const chat = new Chat({ transport: new DefaultChatTransport({ api: "/api/chat" }) });
    const isLoading = chat.status === "submitted" || chat.status === "streaming";
    const isThinking = chat.status === "submitted";
    const isStreaming = chat.status === "streaming";
    $$renderer2.push(`<div class="flex h-screen bg-primary text-primary overflow-hidden"><button class="fixed top-4 left-4 z-50 lg:hidden btn btn-secondary" aria-label="Toggle sidebar">☰</button> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<aside class="w-64 border-r border-default bg-secondary flex-shrink-0 hidden lg:flex flex-col animate-slide-in-right"><div class="p-4 border-b border-muted"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-primary font-bold">◆</div> <div><h1 class="font-bold text-lg text-primary">OCI GenAI</h1> <p class="text-xs text-tertiary">Agentic Chat</p></div></div></div> <div class="p-3"><button class="w-full btn btn-secondary">+ New Chat</button></div> <div class="flex-1 overflow-y-auto p-2 space-y-1"><!--[-->`);
      const each_array = ensure_array_like(localSessions);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let session = each_array[$$index];
        $$renderer2.push(`<button${attr_class(`w-full text-left px-3 py-2 text-sm rounded-lg transition-fast group ${stringify(localSessionId === session.id ? "bg-elevated border border-focused" : "hover:bg-hover border border-transparent")}`)}><div class="flex items-center justify-between"><span class="truncate text-primary">${escape_html(session.title || "New Chat")}</span> `);
        if (localSessionId === session.id) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-accent">●</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-2 mt-1">`);
        Badge($$renderer2, {
          variant: "default",
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(session.model.split(".").pop())}`);
          }
        });
        $$renderer2.push(`<!----></div></button>`);
      }
      $$renderer2.push(`<!--]--></div></aside>`);
    }
    $$renderer2.push(`<!--]--> <main class="flex-1 flex overflow-hidden"><div class="flex-1 flex flex-col overflow-hidden"${attr_style("", { width: "var(--panel-chat)" })}><header class="flex items-center justify-between p-4 border-b border-default bg-secondary"><div class="flex items-center gap-3"><span class="text-accent font-bold">◆</span> <button class="hover:opacity-80 transition-fast cursor-pointer" title="Change model [m]">`);
    Badge($$renderer2, {
      variant: "default",
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->${escape_html(selectedModel.split(".").pop())}`);
      }
    });
    $$renderer2.push(`<!----></button></div> <div class="flex items-center gap-4"><div class="flex items-center gap-2">`);
    if (isThinking) {
      $$renderer2.push("<!--[-->");
      Spinner($$renderer2, { variant: "pulse", color: "var(--agent-thinking)" });
      $$renderer2.push(`<!----> <span class="text-thinking text-sm">Thinking</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (isStreaming) {
        $$renderer2.push("<!--[-->");
        Spinner($$renderer2, { variant: "dots", color: "var(--agent-streaming)" });
        $$renderer2.push(`<!----> <span class="text-streaming text-sm">Streaming</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="text-tertiary">○</span> <span class="text-tertiary text-sm">Ready</span>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <button class="btn btn-secondary text-sm" aria-label="Toggle side panel">${escape_html("◀")}</button></div></header> <div class="flex-1 overflow-y-auto p-4 space-y-4">`);
    if (chat.messages.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex items-center justify-center h-full"><div class="text-center space-y-4"><div class="text-6xl text-accent animate-pulse-glow">◆</div> <h2 class="text-xl font-semibold text-primary">OCI GenAI Agent</h2> <p class="text-secondary max-w-md">Manage your Oracle Cloud Infrastructure resources with natural language.
                Ask me to list instances, create VCNs, manage databases, and more.</p> <div class="flex flex-wrap justify-center gap-2 mt-4">`);
      Badge($$renderer2, {
        variant: "default",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Compute`);
        }
      });
      $$renderer2.push(`<!----> `);
      Badge($$renderer2, {
        variant: "default",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Networking`);
        }
      });
      $$renderer2.push(`<!----> `);
      Badge($$renderer2, {
        variant: "default",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Storage`);
        }
      });
      $$renderer2.push(`<!----> `);
      Badge($$renderer2, {
        variant: "default",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Database`);
        }
      });
      $$renderer2.push(`<!----> `);
      Badge($$renderer2, {
        variant: "default",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Identity`);
        }
      });
      $$renderer2.push(`<!----></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(chat.messages);
      for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
        let message = each_array_1[index];
        $$renderer2.push(`<div${attr_class(`message flex ${stringify(message.role === "user" ? "justify-end" : "justify-start")}`)}><div${attr_class(`max-w-[80%] rounded-lg px-4 py-3 ${stringify(message.role === "user" ? "message-user" : "message-assistant")}`)}><div class="flex items-center gap-2 mb-2"><span${attr_class(clsx(message.role === "user" ? "text-accent" : "text-primary"))}>${escape_html(message.role === "user" ? "You" : "Agent")}</span> `);
        if (message.role === "assistant" && index === chat.messages.length - 1 && isStreaming) {
          $$renderer2.push("<!--[-->");
          Spinner($$renderer2, { variant: "dots", size: "sm", color: "var(--agent-streaming)" });
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div> <!--[-->`);
        const each_array_2 = ensure_array_like(message.parts);
        for (let partIndex = 0, $$length2 = each_array_2.length; partIndex < $$length2; partIndex++) {
          let part = each_array_2[partIndex];
          if (part.type === "text") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="whitespace-pre-wrap text-primary">${escape_html(part.text)}</div>`);
          } else {
            $$renderer2.push("<!--[!-->");
            if (part.type === "tool-invocation") {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="message-tool mt-2 rounded px-3 py-2"><div class="flex items-center gap-2">`);
              Badge($$renderer2, {
                variant: "info",
                children: ($$renderer3) => {
                  $$renderer3.push(`<!---->${escape_html(part.toolInvocation.toolName)}`);
                }
              });
              $$renderer2.push(`<!----> <span class="text-tertiary text-xs">${escape_html(part.toolInvocation.state)}</span></div></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--> `);
        if (message.role === "assistant" && index === chat.messages.length - 1 && isStreaming) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="inline-block w-2 h-4 bg-streaming animate-typing-cursor ml-1"></span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (isLoading && chat.messages.length > 0 && chat.messages[chat.messages.length - 1].role === "user") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex justify-start"><div class="message-assistant rounded-lg px-4 py-3"><div class="flex items-center gap-2">`);
        Spinner($$renderer2, { variant: "dots" });
        $$renderer2.push(`<!----> <span class="text-secondary">Thinking...</span></div></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <form class="p-4 border-t border-default bg-secondary"><div class="flex gap-3"><input${attr("value", input)} placeholder="Ask about OCI resources..." class="chat-input flex-1 px-4 py-3 rounded-lg"${attr("disabled", isLoading, true)}/> <button type="submit"${attr("disabled", isLoading || !input.trim(), true)} class="btn btn-primary px-6">`);
    if (isLoading) {
      $$renderer2.push("<!--[-->");
      Spinner($$renderer2, { variant: "ring", size: "sm", color: "var(--bg-primary)" });
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`Send`);
    }
    $$renderer2.push(`<!--]--></button></div></form></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<aside class="w-80 border-l border-default bg-secondary overflow-y-auto p-3 animate-slide-in-right">`);
      ThoughtPanel($$renderer2, {
        isOpen: thoughtOpen,
        isThinking,
        ontoggle: () => thoughtOpen = !thoughtOpen
      });
      $$renderer2.push(`<!----> `);
      ReasoningPanel($$renderer2, {
        isOpen: reasoningOpen,
        steps: reasoningSteps,
        ontoggle: () => reasoningOpen = !reasoningOpen
      });
      $$renderer2.push(`<!----> `);
      ToolPanel($$renderer2, {
        isOpen: toolsOpen,
        tools: toolCalls,
        ontoggle: () => toolsOpen = !toolsOpen
      });
      $$renderer2.push(`<!----></aside>`);
    }
    $$renderer2.push(`<!--]--></main></div> `);
    ModelPicker($$renderer2, {
      isOpen: modelPickerOpen,
      currentModel: selectedModel,
      models: availableModels,
      region: currentRegion
    });
    $$renderer2.push(`<!----> <footer class="fixed bottom-0 left-0 right-0 h-6 bg-tertiary border-t border-muted px-4 flex items-center justify-between text-xs text-tertiary"><div class="flex items-center gap-4"><span>[t] thought</span> <span>[r] reasoning</span> <span>[o] tools</span> <span>[m] model</span> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-4">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <span>${escape_html(currentRegion)}</span></div></footer>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BrdTwkWQ.js.map
