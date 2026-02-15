import "./style.css";

interface CoworkApi {
  getAppInfo: () => Promise<{ name: string; version: string; platform: string }>;
  pickDirectory: () => Promise<string | null>;
  openExternal: (url: string) => Promise<boolean>;
}

declare global {
  interface Window {
    cowork: CoworkApi;
  }
}

const root = document.getElementById("app");

if (!root) {
  throw new Error("Renderer root element #app not found");
}

root.innerHTML = `
  <main class="container">
    <section class="card">
      <h1>Cowork Desktop Demo</h1>
      <p class="desc">Electron + TypeScript + Vite（Renderer）演示应用</p>
      <dl class="meta">
        <div><dt>App</dt><dd id="app-name">-</dd></div>
        <div><dt>Version</dt><dd id="app-version">-</dd></div>
        <div><dt>Platform</dt><dd id="app-platform">-</dd></div>
      </dl>
      <div class="actions">
        <button id="btn-refresh">刷新应用信息</button>
        <button id="btn-pick">选择目录</button>
        <button id="btn-docs">打开 Electron 官网</button>
      </div>
      <p id="picked-path" class="picked">尚未选择目录</p>
    </section>
  </main>
`;

async function refreshInfo(): Promise<void> {
  const info = await window.cowork.getAppInfo();
  (document.getElementById("app-name") as HTMLSpanElement).textContent = info.name;
  (document.getElementById("app-version") as HTMLSpanElement).textContent = info.version;
  (document.getElementById("app-platform") as HTMLSpanElement).textContent = info.platform;
}

async function bindEvents(): Promise<void> {
  const refreshButton = document.getElementById("btn-refresh") as HTMLButtonElement;
  const pickButton = document.getElementById("btn-pick") as HTMLButtonElement;
  const docsButton = document.getElementById("btn-docs") as HTMLButtonElement;
  const pickedPath = document.getElementById("picked-path") as HTMLParagraphElement;

  refreshButton.addEventListener("click", () => {
    void refreshInfo();
  });

  pickButton.addEventListener("click", async () => {
    const path = await window.cowork.pickDirectory();
    pickedPath.textContent = path ? `已选择: ${path}` : "用户取消了目录选择";
  });

  docsButton.addEventListener("click", () => {
    void window.cowork.openExternal("https://www.electronjs.org/");
  });
}

void refreshInfo();
void bindEvents();
