import { ref, shallowRef } from "vue";

export type PermissionActionConfig = "ask" | "allow" | "deny";

export type PermissionObjectConfig = {
  [key: string]: PermissionActionConfig
}

export type PermissionRuleConfig = PermissionActionConfig | PermissionObjectConfig

export type PermissionConfig =
  | {
      __originalKeys?: Array<string>
      read?: PermissionRuleConfig
      edit?: PermissionRuleConfig
      glob?: PermissionRuleConfig
      grep?: PermissionRuleConfig
      list?: PermissionRuleConfig
      bash?: PermissionRuleConfig
      task?: PermissionRuleConfig
      external_directory?: PermissionRuleConfig
      todowrite?: PermissionActionConfig
      todoread?: PermissionActionConfig
      question?: PermissionActionConfig
      webfetch?: PermissionActionConfig
      websearch?: PermissionActionConfig
      codesearch?: PermissionActionConfig
      lsp?: PermissionRuleConfig
      doom_loop?: PermissionActionConfig
      skill?: PermissionRuleConfig
      [key: string]: PermissionRuleConfig | Array<string> | PermissionActionConfig | undefined
    }
  | PermissionActionConfig

const PERMISSION_KEYS = [
  "read",
  "edit",
  "glob",
  "grep",
  "list",
  "bash",
  "task",
  "skill",
  "todoread",
  "todowrite",
  "webfetch",
  "websearch",
  "codesearch",
  "external_directory",
] as const;

export type ProviderConfig = {
  api?: string
  name?: string
  env?: Array<string>
  id?: string
  npm?: string
  models?: {
    [key: string]: {
      id?: string
      name?: string
      family?: string
      release_date?: string
      attachment?: boolean
      reasoning?: boolean
      temperature?: boolean
      tool_call?: boolean
      interleaved?:
        | true
        | {
            field: "reasoning_content" | "reasoning_details"
          }
      cost?: {
        input: number
        output: number
        cache_read?: number
        cache_write?: number
        context_over_200k?: {
          input: number
          output: number
          cache_read?: number
          cache_write?: number
        }
      }
      limit?: {
        context: number
        input?: number
        output: number
      }
      modalities?: {
        input: Array<"text" | "audio" | "image" | "video" | "pdf">
        output: Array<"text" | "audio" | "image" | "video" | "pdf">
      }
      experimental?: boolean
      status?: "alpha" | "beta" | "deprecated"
      options?: {
        [key: string]: unknown
      }
      headers?: {
        [key: string]: string
      }
      provider?: {
        npm?: string
        api?: string
      }
      /**
       * Variant-specific configuration
       */
      variants?: {
        [key: string]: {
          /**
           * Disable this variant for the model
           */
          disabled?: boolean
          [key: string]: unknown | boolean | undefined
        }
      }
    }
  }
  whitelist?: Array<string>
  blacklist?: Array<string>
  options?: {
    apiKey?: string
    baseURL?: string
    /**
     * GitHub Enterprise URL for copilot authentication
     */
    enterpriseUrl?: string
    /**
     * Enable promptCacheKey for this provider (default false)
     */
    setCacheKey?: boolean
    /**
     * Timeout in milliseconds for requests to this provider. Default is 300000 (5 minutes). Set to false to disable timeout.
     */
    timeout?: number | false
    [key: string]: unknown | string | boolean | number | false | undefined
  }
}

interface OpencodeConfig {
  permission?: PermissionConfig;
  disabled_providers?: string[];
  enabled_providers?: string[];
  provider?: Record<string, ProviderConfig>;
}

declare global {
  interface Window {
    uniAiPedestal: {
      getFileContent: (filePath: string) => Promise<string>;
      writeFileContent: (filePath: string, content: string) => Promise<void>;
    };
  }
}

const CONFIG_PATH = "/.config/myagent/opencode.json";
const DEFAULT_CONFIG: OpencodeConfig = {
  disabled_providers: [],
  enabled_providers: [],
  provider: {},
  permission: {},
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function getConfigPath(): string {
  const userProfile = process.env.USERPROFILE || process.env.HOME || "";
  return `${userProfile}${CONFIG_PATH}`;
}

async function loadConfig(): Promise<OpencodeConfig> {
  try {
    const filePath = getConfigPath();
    const content = await window.uniAiPedestal.getFileContent(filePath);
    return JSON.parse(content) as OpencodeConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

async function saveConfig(config: OpencodeConfig): Promise<void> {
  const filePath = getConfigPath();
  const content = JSON.stringify(config, null, 2);
  await window.uniAiPedestal.writeFileContent(filePath, content);
}

function isPermissionObjectConfig(obj: unknown): obj is {
  __originalKeys?: Array<string>
  read?: PermissionRuleConfig
  edit?: PermissionRuleConfig
  glob?: PermissionRuleConfig
  grep?: PermissionRuleConfig
  list?: PermissionRuleConfig
  bash?: PermissionRuleConfig
  task?: PermissionRuleConfig
  external_directory?: PermissionRuleConfig
  todowrite?: PermissionActionConfig
  todoread?: PermissionActionConfig
  question?: PermissionActionConfig
  webfetch?: PermissionActionConfig
  websearch?: PermissionActionConfig
  codesearch?: PermissionActionConfig
  lsp?: PermissionRuleConfig
  doom_loop?: PermissionActionConfig
  skill?: PermissionRuleConfig
  [key: string]: PermissionRuleConfig | Array<string> | PermissionActionConfig | undefined
} {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}

function debouncedSave(config: OpencodeConfig): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    saveConfig(config);
    debounceTimer = null;
  }, 500);
}

export function useOpencodeConfig() {
  const opencodeConfig = shallowRef<OpencodeConfig>(DEFAULT_CONFIG);
  const isLoading = ref(true);
  const error = ref<Error | null>(null);

  async function init(): Promise<void> {
    try {
      isLoading.value = true;
      opencodeConfig.value = await loadConfig();
    } catch (e) {
      error.value = e as Error;
    } finally {
      isLoading.value = false;
    }
  }

  function setDeletePermission(permission: "allow" | "ask"): void {
    const config = opencodeConfig.value;
    if (!config.permission || typeof config.permission === "string") {
      config.permission = { "*": "allow" };
    }

    const perm = config.permission;
    const bashPerm = perm.bash;
    if (isPermissionObjectConfig(bashPerm)) {
      bashPerm["rm *"] = permission;
    } else {
      perm.bash = {
        "*": "allow",
        "rm *": permission,
      };
    }

    opencodeConfig.value = { ...config };
    debouncedSave(config);
  }

  function addSafeDirectories(paths: string[]): void {
    const config = opencodeConfig.value;
    if (!config.permission || typeof config.permission === "string") {
      config.permission = { "*": "allow" };
    }

    const perm = config.permission;
    
    const normalizedPaths = paths.map((p) => {
      const normalized = p.replace(/\\/g, "/");
      return normalized.endsWith("/*") ? normalized : `${normalized}/*`;
    });

    for (const path of normalizedPaths) {
      for (const key of PERMISSION_KEYS) {
        const permItem = perm[key];
        if (isPermissionObjectConfig(permItem)) {
          permItem[path] = "ask";
        } else {
          const newRule: PermissionRuleConfig = {
            "*": "allow",
            [path]: "ask",
          };
          (perm as Record<string, PermissionRuleConfig>)[key] = newRule;
        }
      }
    }

    opencodeConfig.value = { ...config };
    debouncedSave(config);
  }

  function removeSafeDirectories(paths: string[]): void {
    const config = opencodeConfig.value;
    if (!config.permission || typeof config.permission === "string") {
      config.permission = { "*": "allow" };
    }

    const perm = config.permission;

    const normalizedPaths = paths.map((p) => {
      const normalized = p.replace(/\\/g, "/");
      return normalized.endsWith("/*") ? normalized : `${normalized}/*`;
    });

    for (const path of normalizedPaths) {
      for (const key of PERMISSION_KEYS) {
        const permItem = perm[key];
        if (isPermissionObjectConfig(permItem)) {
          delete permItem[path];
        }
      }
    }

    opencodeConfig.value = { ...config };
    debouncedSave(config);
  }

  function setProviderEnabled(providerId: string, enabled: boolean): void {
    const config = opencodeConfig.value;

    if (enabled) {
      if (!config.disabled_providers) {
        config.disabled_providers = [];
      }
      const index = config.disabled_providers.indexOf(providerId);
      if (index !== -1) {
        config.disabled_providers.splice(index, 1);
      }

      if (config.enabled_providers && !config.enabled_providers.includes(providerId)) {
        config.enabled_providers.push(providerId);
      }
    } else {
      if (!config.disabled_providers) {
        config.disabled_providers = [];
      }
      if (!config.disabled_providers.includes(providerId)) {
        config.disabled_providers.push(providerId);
      }

      if (config.enabled_providers) {
        const idx = config.enabled_providers.indexOf(providerId);
        if (idx !== -1) {
          config.enabled_providers.splice(idx, 1);
        }
      }
    }

    opencodeConfig.value = { ...config };
    debouncedSave(config);
  }

  init();

  return {
    opencodeConfig,
    isLoading,
    error,
    setDeletePermission,
    addSafeDirectories,
    removeSafeDirectories,
    setProviderEnabled,
  };
}
