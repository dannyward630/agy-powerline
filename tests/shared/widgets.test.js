"use strict";

const { LAYOUT_ORDER } = require("../../src/lib/config");
const fs = require("fs");
const path = require("path");
const { record } = require("../helpers");
const { renderStatusline, defaultConfig } = require("../../src/lib/shared");
const {
  shortModelName,
  shouldBlink,
  resolveQuotaThresholds,
  limitWidth,
  isValidMaxWidth,
  shortenPath,
  isValidDepth,
  visibleWidth,
} = require("../../src/lib/formatters");
const { buildCustomTheme, THEMES } = require("../../src/lib/themes");
const { buildSegment } = require("../../src/lib/layouts/pills");
const { buildLinesSegment, deriveLinesPalette } = require("../../src/lib/layouts/lines");
const {
  editFields: widgetEditFields,
  MAX_WIDTH_WIDGETS,
  stepNumberField,
} = require("../../src/lib/widget-options");

const strip = (text) => text.replace(/\x1b\[[0-9;]*m/g, "");
const fixture = (name) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "..", "fixtures", name), "utf8"));

function render(data, widgets, options = {}) {
  return strip(
    renderStatusline(
      { ...data, terminal_width: options.width ?? 0 },
      { ...defaultConfig(), layout: options.layout || "pills", ascii: options.ascii, widgets },
      { color: options.color || "none" }
    )
  );
}

async function run() {
  testTightestQuota();
  testSplitTokens();
  testShortModel();
  testOneFormPerSetting();
  testTasks();
  testMode();
  testTitle();
  testWidgetWidthAndDepth();
}

function testTitle() {
  const real = fixture("antigravity-1.3.3-title.json");
  const title = [{ id: "title" }];

  record("title shows the conversation title", /💬 hello /.test(render(real, title)));
  record(
    "lines title shows the conversation title",
    /💬 hello/.test(render(real, title, { layout: "lines" }))
  );

  const long = renderStatusline(
    {
      ...real,
      terminal_width: 0,
      conversation_title: "Refactor the auth\nmiddleware and add \u001b[31mtests for it",
    },
    { ...defaultConfig(), widgets: title },
    { color: "none" }
  );
  record(
    "title is one line without escape sequences, cut to 30 columns",
    /💬 Refactor the auth middleware… /.test(long) && !long.includes("\u001b[31m"),
    JSON.stringify(long)
  );
  record(
    "ASCII title ends a cut with three dots",
    /Refactor the auth middlewar\.\.\. /.test(
      render({ ...real, conversation_title: "Refactor the auth middleware and more" }, title, {
        ascii: true,
      })
    )
  );

  const untitled = { ...real };
  delete untitled.conversation_title;
  record("title hides until the conversation has one", !/💬/.test(render(untitled, title)));
}

function testWidgetWidthAndDepth() {
  const paths = [
    { path: "~/a/b/c/d", shown: "~/…/c/d", ascii: "~/.../c/d" },
    { path: "C:\\x\\y\\z", shown: "C:\\…\\y\\z", ascii: "C:\\...\\y\\z" },
    { path: "/a/b", shown: "/a/b", ascii: "/a/b" },
    { path: "~", shown: "~", ascii: "~" },
  ];
  for (const layout of LAYOUT_ORDER) {
    for (const ascii of [false, true]) {
      for (const { path: cwd, shown, ascii: asciiShown } of paths) {
        const expected = ascii ? asciiShown : shown;
        const output = render(
          { ...fixture("antigravity-1.3.0.json"), cwd },
          [{ id: "cwd", depth: 2 }],
          { layout, ascii }
        );
        record(
          `${layout} cwd depth shortens ${cwd}`,
          output.includes(expected) && (!ascii || !/[^\x00-\x7f]/.test(output)),
          output
        );
      }
    }
  }

  const value = "abcdefghijklmnop";
  const widthWidgets = [
    {
      widget: { id: "cwd", maxWidth: 8 },
      data: { cwd: `/${value}` },
      shown: "/abcdef…",
      ascii: "/abcd...",
    },
    {
      widget: { id: "project", maxWidth: 8 },
      data: { workspace: { project_dir: `/root/${value}` } },
      shown: "abcdefg…",
      ascii: "abcde...",
    },
    {
      widget: { id: "git", maxWidth: 8 },
      data: { vcs: { type: "git", branch: value, dirty: true, ahead: 2, behind: 1 } },
      shown: "abcdefg…",
      ascii: "abcde...",
    },
    {
      widget: { id: "title", maxWidth: 8 },
      data: { conversation_title: value },
      shown: "abcdefg…",
      ascii: "abcde...",
    },
    {
      widget: { id: "model", maxWidth: 8 },
      data: { model: { display_name: value } },
      shown: "abcdefg…",
      ascii: "abcde...",
    },
    {
      widget: { id: "customText", text: value, maxWidth: 8 },
      data: {},
      shown: "abcdefg…",
      ascii: "abcde...",
    },
    {
      widget: { id: "exec", cmd: "echo hi", maxWidth: 4 },
      data: {},
      shown: "[cm…",
      ascii: "[...",
    },
  ];
  for (const layout of LAYOUT_ORDER) {
    for (const { widget, data, shown, ascii: asciiShown } of widthWidgets) {
      const base = { ...fixture("antigravity-1.3.0.json"), ...data };
      for (const ascii of [false, true]) {
        const expected = ascii ? asciiShown : shown;
        const output = render(base, [widget], { layout, ascii });
        record(
          `${layout} ${widget.id} maxWidth clips to ${expected}`,
          output.includes(expected) && (!ascii || !/[^\x00-\x7f]/.test(output)),
          output
        );
      }
      for (const invalid of [0, -1, "5", 1e9, null]) {
        const output = render(base, [{ ...widget, maxWidth: invalid }], { layout });
        const unchanged = render(base, [{ ...widget, maxWidth: undefined }], { layout });
        record(
          `${layout} ${widget.id} ignores invalid maxWidth ${String(invalid)}`,
          output === unchanged
        );
      }
    }
  }

  const invalidDepths = [0, -1, "2", 1e9, null];
  for (const layout of LAYOUT_ORDER) {
    const base = { ...fixture("antigravity-1.3.0.json"), cwd: "/a/b/c/d" };
    const original = render(base, [{ id: "cwd" }], { layout });
    for (const depth of invalidDepths) {
      record(
        `${layout} cwd ignores invalid depth ${String(depth)}`,
        render(base, [{ id: "cwd", depth }], { layout }) === original
      );
    }
  }

  for (const layout of LAYOUT_ORDER) {
    const data = {
      ...fixture("antigravity-1.3.0.json"),
      cwd: "/very/long/folders/with/a/name-that-will-not-fit",
    };
    const output = render(data, [{ id: "cwd", depth: 2, maxWidth: 10 }, { id: "model" }], {
      layout,
      width: 40,
    });
    record(
      `${layout} cwd maxWidth applies before terminal fitting`,
      visibleWidth(output) <= 40 && output.includes("…") && /Gemini/.test(output),
      output
    );
  }

  const cjk = limitWidth("A猫BC", { maxWidth: 4 });
  const cjkAscii = limitWidth("A猫BC", { maxWidth: 4 }, true);
  const emoji = limitWidth("A💾BCD", { maxWidth: 5 });
  const emojiAscii = limitWidth("A💾BCDE", { maxWidth: 6 }, true);
  const colored = limitWidth("\x1b[31mabcdefghijkl\x1b[0m", { maxWidth: 8 });
  record(
    "maxWidth counts CJK and emoji as two columns in Unicode and ASCII modes",
    cjk === "A猫…" &&
      cjkAscii === "A..." &&
      emoji === "A💾B…" &&
      emojiAscii === "A💾..." &&
      visibleWidth(cjk) === 4 &&
      visibleWidth(emoji) === 5 &&
      colored === "\x1b[31mabcdefg…\x1b[0m" &&
      visibleWidth(colored) === 8
  );

  const gitSession = {
    git: { branch: value, dirty: true, ahead: 2, behind: 1 },
    exceeds200k: false,
  };
  const gitWidget = { id: "git", maxWidth: 8 };
  const colors = THEMES["dark-aurora"].colors;
  for (const layout of LAYOUT_ORDER) {
    for (const ascii of [false, true]) {
      const output =
        layout === "pills"
          ? buildSegment("git", gitSession, colors, !ascii, ascii, gitWidget, { layout }).text
          : buildLinesSegment(
              "git",
              gitSession,
              deriveLinesPalette(colors),
              !ascii,
              ascii,
              gitWidget,
              { layout, widgets: [gitWidget] }
            );
      const branch = ascii ? "abcde..." : "abcdefg…";
      const marker = layout === "pills" ? (ascii ? `* ${branch}` : `● ${branch}`) : `${branch}*`;
      const sync = ascii ? "^2 v1" : "⇡2 ⇣1";
      record(
        `${layout} git maxWidth clips only the branch, keeping its marker and sync counts`,
        strip(output).includes(marker) && strip(output).includes(sync),
        strip(output)
      );
    }
  }

  const validWidths = [4, 50, 200];
  const invalidWidths = [0, -1, "5", 1e9, null, NaN, Infinity];
  const validDepth = [1, 10];
  record(
    "maxWidth and depth validate only their documented integer ranges",
    validWidths.every(isValidMaxWidth) &&
      invalidWidths.every((width) => !isValidMaxWidth(width)) &&
      validDepth.every(isValidDepth) &&
      invalidDepths.every((depth) => !isValidDepth(depth)) &&
      invalidWidths.every((width) => limitWidth("value", { maxWidth: width }) === "value") &&
      shortenPath("~/a/b/c", 0) === "~/a/b/c"
  );

  const maxWidthIds = [
    "cwd",
    "project",
    "git",
    "title",
    "model",
    "customText",
    "exec",
    "gitWorktree",
  ];
  const depthField = widgetEditFields({ id: "cwd" }).find(({ key }) => key === "depth");
  const maxWidthField = widgetEditFields({ id: "model" }).find(({ key }) => key === "maxWidth");
  const warnField = widgetEditFields({ id: "fiveHourBar" }).find(({ key }) => key === "warn");
  record(
    "configure exposes Folder depth and a bounded Max width control",
    JSON.stringify([...MAX_WIDTH_WIDGETS].sort()) === JSON.stringify([...maxWidthIds].sort()) &&
      JSON.stringify(depthField?.values) === JSON.stringify([undefined, 1, 2, 3, 4]) &&
      depthField.show(undefined) === "full path" &&
      depthField.show(0) === "full path" &&
      maxWidthField.number === 10 &&
      maxWidthField.step === 5 &&
      maxWidthField.min === 10 &&
      maxWidthField.max === 80 &&
      stepNumberField(maxWidthField, undefined, 1) === 15 &&
      stepNumberField(maxWidthField, 75, 1) === 80 &&
      stepNumberField(maxWidthField, 80, 1) === 80 &&
      stepNumberField(maxWidthField, 10, -1) === 10 &&
      stepNumberField(maxWidthField, "bad", 1) === 15 &&
      stepNumberField(warnField, 30, 1) === 35 &&
      maxWidthField.show(undefined) === "no limit" &&
      maxWidthField.show(201) === "no limit"
  );
}

function testMode() {
  const real = fixture("antigravity-1.3.3-modes.json");
  const mode = [{ id: "mode" }];

  record(
    "mode shows the approval mode and the Vim mode",
    /accept-edits, INSERT/.test(render(real, mode))
  );
  record(
    "lines mode shows the approval mode and the Vim mode",
    /accept-edits, INSERT/.test(render(real, mode, { layout: "lines" }))
  );

  const vimOnly = { ...real };
  delete vimOnly.cycle_mode;
  record("mode shows the Vim mode alone", /🧭 INSERT /.test(render(vimOnly, mode)));

  const approvalOnly = { ...real };
  delete approvalOnly.vim;
  record("mode shows the approval mode alone", /🧭 accept-edits /.test(render(approvalOnly, mode)));

  const neither = { ...vimOnly, cycle_mode: "default" };
  delete neither.vim;
  record("mode hides in the default mode with Vim editing off", !/🧭/.test(render(neither, mode)));
}

function testTasks() {
  const real = fixture("antigravity-1.3.3-subagents.json");
  const tasks = [{ id: "tasks" }];

  record(
    "tasks shows running subagents and background tasks",
    /1 subagent, 1 task/.test(render(real, tasks))
  );
  record(
    "lines tasks shows running subagents and background tasks",
    /1 subagent, 1 task/.test(render(real, tasks, { layout: "lines" }))
  );

  // Finished subagents stay in the payload's list; they must not count.
  const mixed = {
    ...real,
    subagents: [{ status: "running" }, { status: "running" }, { status: "completed" }],
    task_count: 3,
  };
  record("tasks counts only running subagents", /2 subagents, 3 tasks/.test(render(mixed, tasks)));

  const idle = { ...real, subagents: [{ status: "completed" }] };
  delete idle.task_count;
  record("tasks hides when nothing runs", render(idle, tasks).trim() === "");
  record(
    "tasks shows background tasks alone",
    /👥 2 tasks /.test(render({ ...idle, task_count: 2 }, tasks))
  );
}

function testTightestQuota() {
  const real = fixture("antigravity-1.3.0.json");
  const quota = [{ id: "quota" }];

  // gemini-weekly (28.6%) is lower than gemini-5h (52.3%); the exhausted 3p
  // bucket belongs to third-party models, not to the Gemini model in use.
  const gemini = render(real, quota);
  record(
    "quota shows the tightest bucket for the Gemini model in use",
    /7d 28\.6% rem/.test(gemini) && /11hr 35m/.test(gemini) && !/3P/.test(gemini),
    gemini
  );

  const claude = render({ ...real, model: { display_name: "Claude Sonnet 4.6" } }, quota);
  record(
    "quota shows the third-party buckets for a non-Gemini model",
    /3P 7d 0\.0% rem/.test(claude),
    claude
  );

  // Google AI Pro sends Argon's own weekly bucket (8.2% left) whatever model
  // is in use; it is not Flash's quota.
  const argonPayload = fixture("antigravity-1.4.0-argon.json");
  const flash = render(argonPayload, quota);
  record(
    "quota leaves the Argon bucket out for other Gemini models",
    /7d 93\.9% rem/.test(flash) && !/Argon|argon/.test(flash),
    flash
  );

  const argonModel = { display_name: "Gemini 4 Argon" };
  const argon = render({ ...argonPayload, model: argonModel }, quota);
  record(
    "quota shows the Argon bucket for an Argon model",
    /Argon 7d 8\.2% rem/.test(argon) && /6d 13h/.test(argon),
    argon
  );

  // Ultra: no Argon bucket, Argon counts toward the Gemini buckets.
  const ultra = render({ ...real, model: argonModel }, quota);
  record(
    "quota uses the Gemini buckets for Argon without an Argon bucket",
    /7d 28\.6% rem/.test(ultra) && !/3P/.test(ultra),
    ultra
  );

  const argonWidgets = [{ id: "argonWeekly" }, { id: "argonReset" }];
  const argonPills = render(argonPayload, argonWidgets);
  record(
    "argonWeekly and argonReset show Argon's own quota whatever the model",
    /🔮 Argon 7d: .*8\.2% rem/.test(argonPills) && /Argon reset: 6d 13h/.test(argonPills),
    argonPills
  );
  const argonLines = render(argonPayload, argonWidgets, { layout: "lines" });
  record(
    "lines argonWeekly and argonReset show Argon's quota and reset",
    /Argon 7d: .*8\.2% rem/.test(argonLines) && /Argon reset: 6d 13h/.test(argonLines),
    argonLines
  );
  for (const layout of LAYOUT_ORDER) {
    const hidden = render(real, argonWidgets, { layout });
    record(`${layout} Argon widgets hide without an Argon bucket`, hidden.trim() === "", hidden);
  }

  const unknown = render(
    {
      model: { display_name: "Gemini 3.8 Flash" },
      quota: { "new-bucket": { remaining_fraction: 0.4 } },
    },
    quota
  );
  record(
    "quota falls back to every bucket when none matches the model",
    /new-bucket 40\.0% rem/.test(unknown),
    unknown
  );

  const disabled = render({ quota: { "3p-5h": { remaining_fraction: 0, disabled: true } } }, quota);
  record("quota hides when every bucket is disabled", disabled.trim() === "", disabled);

  const low = renderStatusline(
    { ...fixture("antigravity-near-limits.json"), terminal_width: 0 },
    { ...defaultConfig(), widgets: quota },
    { color: "truecolor" }
  );
  // dark-aurora danger color #f48771 at 3% left.
  record("quota turns to the danger color when nearly used up", low.includes("2;244;135;113m"));

  const lines = render(real, quota, { layout: "lines" });
  record(
    "lines quota shows the bucket, % left and reset",
    /Quota: 7d 28\.6% rem · 11hr 35m/.test(strip(lines)),
    lines
  );
}

function testSplitTokens() {
  const real = fixture("antigravity-1.3.0.json");
  const split = [{ id: "totalTokens", split: true }];

  record(
    "totalTokens shows the session total by default",
    /478\.2K/.test(render(real, [{ id: "totalTokens" }]))
  );
  record("totalTokens split shows input and output", /123\.1K↑ 355\.0K↓/.test(render(real, split)));
  record(
    "totalTokens split in ASCII mode uses in/out",
    /123\.1K in 355\.0K out/.test(render(real, split, { ascii: true }))
  );
  record(
    "lines totalTokens split shows input and output",
    /123\.1K↑ 355\.0K↓/.test(render(real, split, { layout: "lines" }))
  );
}

function testShortModel() {
  record(
    "shortModelName drops Gemini and joins the variant",
    shortModelName("Gemini 3.8 Flash (High)") === "3.8 Flash·High" &&
      shortModelName("Gemini 3.8 Flash (High)", true) === "3.8 Flash High" &&
      shortModelName("Claude Sonnet 4.6") === "Claude Sonnet 4.6" &&
      shortModelName("Claude Sonnet 4.6 (Thinking)") === "Claude Sonnet 4.6·Thinking"
  );

  const real = fixture("antigravity-1.3.0.json");
  record(
    "model short option shows the short name",
    /3\.8 Flash·High/.test(render(real, [{ id: "model", short: true }]))
  );

  // At 60 columns the first default row only fits once the model name is short.
  const narrow = render(
    { ...real, vcs: { type: "git", branch: "main" } },
    defaultConfig().widgets,
    {
      width: 60,
    }
  );
  record(
    "a narrow terminal shortens the model name before dropping widgets",
    /3\.8 Flash·High/.test(narrow) && !/Gemini 3\.8/.test(narrow),
    narrow
  );
}

// Each setting has one documented form; the other spellings do nothing.
function testOneFormPerSetting() {
  const quotaOnly = (thresholds, widget = {}) => resolveQuotaThresholds(widget, { thresholds });
  record(
    "only quotaWarn/quotaCrit and a widget's warn/crit set quota thresholds",
    quotaOnly({ quotaWarn: 40, quotaCrit: 5 }).warn === 40 &&
      quotaOnly({}, { warn: 25, crit: 3 }).crit === 3 &&
      quotaOnly({ fiveHourWarn: 50, weeklyWarn: 50, warn: 50 }).warn === 30 &&
      quotaOnly({}, { threshold: { warn: 50 } }).warn === 30
  );

  record(
    'blink takes true (danger) and "warn" (caution too); other values never blink',
    shouldBlink("crit", true) &&
      !shouldBlink("warn", true) &&
      shouldBlink("warn", "warn") &&
      shouldBlink("crit", "warn") &&
      !shouldBlink("crit", "crit") &&
      !shouldBlink("crit", "all") &&
      !shouldBlink("crit", "critical")
  );

  const real = fixture("antigravity-1.3.0.json");
  record(
    "customText shows text, ignores label, and hides without text",
    /Ship it/.test(render(real, [{ id: "customText", text: "Ship it" }])) &&
      render(real, [{ id: "customText", label: "Ship it" }]).trim() === ""
  );

  const execOut = renderStatusline(
    { ...real, terminal_width: 0 },
    { ...defaultConfig(), widgets: [{ id: "exec", command: "echo hi" }] }
  );
  record("exec runs cmd only and ignores a command key", strip(execOut).trim() === "");

  const base = THEMES["dark-aurora"].colors.model.join();
  record(
    'customTheme colors are read from "colors" only',
    buildCustomTheme({ colors: { model: "#ff0000" } }).colors.model.join() === "255,0,0" &&
      buildCustomTheme({ model: "#ff0000" }).colors.model.join() === base
  );
}

module.exports = { run };
