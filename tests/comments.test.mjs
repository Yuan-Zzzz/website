import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

test("giscus comments and guestbook lifecycle", async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://www.yuanzzzz.com/" });
  const win = dom.window;
  for (const name of ["window", "document", "HTMLElement", "customElements", "localStorage", "history", "location", "ShadowRoot", "Document", "CSSStyleSheet"]) {
    Object.defineProperty(globalThis, name, { value: win[name], configurable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const messageListeners = new Set();
  const add = win.addEventListener.bind(win);
  const remove = win.removeEventListener.bind(win);
  win.addEventListener = (type, listener, options) => {
    if (type === "message") messageListeners.add(listener);
    add(type, listener, options);
  };
  win.removeEventListener = (type, listener, options) => {
    if (type === "message") messageListeners.delete(listener);
    remove(type, listener, options);
  };
  let timeoutCallback;
  const originalTimeout = win.setTimeout.bind(win);
  win.setTimeout = (callback, delay, ...args) => {
    if (delay === 25000) timeoutCallback = callback;
    return originalTimeout(callback, delay, ...args);
  };
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { default: Comments } = await import("../components/public/Comments.tsx");
  const config = { repo: "Yuan-Zzzz/website-comments", repoId: "R_kgDOVAxc4A", category: "Comments", categoryId: "DIC_kwDOVAxc4M4DHU3s" };
  const root = createRoot(document.getElementById("root"));
  const settle = async () => {
    for (let count = 0; count < 30; count++) {
      await React.act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
      const mounted = document.querySelector("giscus-widget")?.shadowRoot?.querySelector("iframe");
      if (mounted) {
        // jsdom does not create browsing contexts for shadow-root iframes.
        Object.defineProperty(mounted, "contentWindow", { value: win, configurable: true });
        return;
      }
    }
    assert.fail("Official giscus widget did not mount");
  };
  const render = async (term) => {
    await React.act(async () => root.render(React.createElement(Comments, { term, config })));
    await settle();
  };
  const frame = () => document.querySelector("giscus-widget").shadowRoot.querySelector("iframe");
  const send = async (data, source = frame().contentWindow, origin = "https://giscus.app") => {
    await React.act(async () => win.dispatchEvent(new win.MessageEvent("message", { origin, source, data: { giscus: data } })));
  };
  t.after(async () => {
    await React.act(async () => root.unmount());
    assert.equal(messageListeners.size, 0, "all comment message listeners must be removed");
    win.close();
  });

  await t.test("guestbook uses the dedicated key and Chinese, light, top-input settings", async () => {
    await render("guestbook");
    const params = new URL(frame().src).searchParams;
    for (const [key, value] of Object.entries({ term: "guestbook", strict: "1", inputPosition: "top", theme: "light", reactionsEnabled: "1", emitMetadata: "1", repo: config.repo, repoId: config.repoId, categoryId: config.categoryId })) {
      assert.equal(params.get(key), value);
    }
    assert.equal(new URL(frame().src).pathname, "/zh-CN/widget");
    assert.equal(document.querySelectorAll("giscus-widget").length, 1);
    assert.ok(document.getElementById("guestbook"));
  });

  await t.test("messages must come from the current iframe and giscus origin", async () => {
    await send({ resizeHeight: 300 }, null);
    assert.match(document.body.textContent, /正在加载评论/);
    await send({ resizeHeight: 300 }, frame().contentWindow, "https://example.com");
    assert.match(document.body.textContent, /正在加载评论/);
    await send({ resizeHeight: 300 });
    assert.doesNotMatch(document.body.textContent, /正在加载评论/);
  });

  await t.test("new discussions are not failures; service failures can be retried", async () => {
    await send({ error: "Discussion not found" });
    assert.doesNotMatch(document.body.textContent, /评论暂时无法加载/);
    await send({ error: "API rate limit exceeded" });
    assert.match(document.body.textContent, /评论暂时无法加载/);
    const retry = [...document.querySelectorAll("button")].find((button) => button.textContent === "重新加载评论");
    await React.act(async () => retry.click());
    await settle();
    assert.doesNotMatch(document.body.textContent, /评论暂时无法加载/);
    assert.equal(document.querySelectorAll("giscus-widget").length, 1);
    await React.act(async () => timeoutCallback());
    assert.match(document.body.textContent, /评论暂时无法加载/);
    await send({ resizeHeight: 300 });
    assert.doesNotMatch(document.body.textContent, /评论暂时无法加载/);
  });

  await t.test("article ID mapping survives title and URL changes and switches cleanly", async () => {
    const term = "article:6a21a41357cd492cf0ebc037";
    await render(term);
    assert.equal(new URL(frame().src).searchParams.get("term"), term);
    assert.equal(document.querySelectorAll("giscus-widget").length, 1);
    await send({ discussion: { url: "https://github.com/Yuan-Zzzz/website-comments/discussions/1" } });
    assert.equal(document.querySelector("a").href, "https://github.com/Yuan-Zzzz/website-comments/discussions/1");
    const previousFrame = frame();
    document.title = "Changed article title";
    win.history.replaceState(null, "", "/articles/changed-slug");
    await render(term);
    assert.equal(frame(), previousFrame);
    assert.equal(new URL(frame().src).searchParams.get("term"), term);
    await render("article:6a17096557cd492cf0ebc036");
    assert.equal(new URL(frame().src).searchParams.get("term"), "article:6a17096557cd492cf0ebc036");
    assert.notEqual(document.querySelector("a").href, "https://github.com/Yuan-Zzzz/website-comments/discussions/1");
    assert.equal(document.querySelectorAll("giscus-widget").length, 1);
  });

  await t.test("unconfigured comments remove widget and listeners", async () => {
    await React.act(async () => root.render(React.createElement(Comments, { term: "guestbook", config: null })));
    assert.match(document.body.textContent, /评论区正在准备中/);
    assert.equal(document.querySelectorAll("giscus-widget").length, 0);
    assert.equal(messageListeners.size, 0);
  });
});
