(function () {
  var APP_VERSION = "1.0.134";
  if (typeof window !== "undefined") {
    window.AEAS_TEST_HOOKS = { version: APP_VERSION, boot: "early" };
  }
  var MIN_SOURCE_ITEMS_BEFORE_COMP_MIX_RETRY = 12;
  var DEFAULT_PRESET_NAME = "bold_yellow_shadow";
  var BOX_DISABLED_PRESET_NAMES = {
    classic_clean: true,
    static_marker_karaoke: true,
    clean_paragraph: true,
    modern_yellow: true,
    bold_yellow_shadow: true,
    reels_bold_yellow: true,
    bold_two_words: true,
    backplate_bold: true,
    backplate_stack: true,
    backplate_yellow: true
  };
  var STANDARD_READABILITY_DEFAULTS = {
    fontSize: 48,
    strokeEnabled: false,
    strokeWidth: 0,
    maxLines: 2,
    maxTextWidth: 900,
    blockScale: 91,
    marginY: 224,
    verticalMarginY: 224,
    positionOffsetX: 0
  };
  var statusEl = document.getElementById("status");
  var liveStatusEl = document.getElementById("liveStatus");
  var sourcesListEl = document.getElementById("sourcesList");
  var progressWrapEl = document.getElementById("runProgress");
  var progressLabelEl = document.getElementById("runProgressLabel");
  var progressFillEl = document.getElementById("runProgressFill");
  var runOverlayEl = document.getElementById("runOverlay");
  var runOverlayTextEl = document.getElementById("runOverlayText");
  var runOverlayQuoteEl = document.getElementById("runOverlayQuote");
  var presetSelectEl = document.getElementById("preset");
  var presetPickerEl = document.getElementById("presetPicker");
  var presetPickerButtonEl = document.getElementById("presetPickerButton");
  var presetPickerLabelEl = document.getElementById("presetPickerLabel");
  var presetPickerPreviewEl = document.getElementById("presetPickerPreview");
  var presetPickerMenuEl = document.getElementById("presetPickerMenu");
  var outputModeSelectEl = document.getElementById("outputMode");
  var outputModePickerEl = document.getElementById("outputModePicker");
  var outputModePickerButtonEl = document.getElementById("outputModePickerButton");
  var outputModePickerLabelEl = document.getElementById("outputModePickerLabel");
  var outputModePickerPreviewEl = document.getElementById("outputModePickerPreview");
  var outputModePickerMenuEl = document.getElementById("outputModePickerMenu");
  var fontSelectEl = document.getElementById("fontSelect");
  var fontPickerEl = document.getElementById("fontPicker");
  var fontPickerButtonEl = document.getElementById("fontPickerButton");
  var fontPickerLabelEl = document.getElementById("fontPickerLabel");
  var fontPickerPreviewEl = document.getElementById("fontPickerPreview");
  var fontPickerSpinnerEl = document.getElementById("fontPickerSpinner");
  var fontPickerMenuEl = document.getElementById("fontPickerMenu");
  var languageSelectEl = document.getElementById("language");
  var languagePickerEl = document.getElementById("languagePicker");
  var languagePickerButtonEl = document.getElementById("languagePickerButton");
  var languagePickerLabelEl = document.getElementById("languagePickerLabel");
  var languagePickerPreviewEl = document.getElementById("languagePickerPreview");
  var languagePickerMenuEl = document.getElementById("languagePickerMenu");
  var outputModeHintEl = document.getElementById("outputModeHint");
  var transcriptReviewListEl = document.getElementById("transcriptReviewList");
  var transcriptReviewMetaEl = document.getElementById("transcriptReviewMeta");
  var referenceTextEl = document.getElementById("referenceText");
  var referenceTextMetaEl = document.getElementById("referenceTextMeta");
  var wordRulesListEl = document.getElementById("wordRulesList");
  var wordRulesMetaEl = document.getElementById("wordRulesMeta");
  var btnAddWordRuleEl = document.getElementById("btnAddWordRule");
  var summaryPresetEl = document.getElementById("summaryPreset");
  var summaryModeEl = document.getElementById("summaryMode");
  var summaryFontEl = document.getElementById("summaryFont");
  var summarySourcesEl = document.getElementById("summarySources");
  var summaryVersionEl = document.getElementById("summaryVersion");
  var styleColorPickerEl = document.getElementById("styleColorPicker");
  var styleColorHexEl = document.getElementById("styleColorHex");
  var styleColorTargetEl = document.getElementById("styleColorTarget");
  var stylePaletteEl = document.getElementById("stylePalette");
  var stylePreviewStageEl = document.getElementById("stylePreviewStage");
  var stylePreviewModeBadgeEl = document.getElementById("stylePreviewModeBadge");
  var layoutPreviewStageEl = stylePreviewStageEl;
  var layoutPreviewCaptionEl = document.getElementById("stylePreviewCaption");
  var layoutPreviewTextEl = document.getElementById("stylePreviewText");
  var layoutPreviewMetaEl = document.getElementById("stylePreviewMeta");
  var layoutPreviewCharsEl = document.getElementById("layoutPreviewChars");
  var layoutPreviewLinesEl = document.getElementById("layoutPreviewLines");
  var layoutPreviewMarginEl = document.getElementById("layoutPreviewMargin");
  var layoutPreviewOffsetXEl = document.getElementById("layoutPreviewOffsetX");
  var fontSizeControlEl = document.getElementById("fontSizeControl");
  var marginXControlEl = document.getElementById("marginX");
  var marginYControlEl = document.getElementById("marginY");
  var blockWidthControlEl = document.getElementById("blockWidthControl");
  var maxLinesControlEl = document.getElementById("maxLinesControl");
  var blockScaleControlEl = document.getElementById("blockScaleControl");
  var leadingControlEl = document.getElementById("leadingControl");
  var trackingControlEl = document.getElementById("trackingControl");
  var strokeWidthControlEl = document.getElementById("strokeWidthControl");
  var strokeEnabledControlEl = document.getElementById("strokeEnabledControl");
  var lineBoxEnabledControlEl = document.getElementById("lineBoxEnabledControl");
  var italicControlEl = document.getElementById("italicControl");
  var boxEnabledControlEl = document.getElementById("boxEnabledControl");
  var boxSmartControlEl = document.getElementById("boxSmartControl");
  var boxPaddingControlEl = document.getElementById("boxPaddingControl");
  var boxRoundnessControlEl = document.getElementById("boxRoundnessControl");
  var boxOpacityControlEl = document.getElementById("boxOpacityControl");
  var stylePreviewCaptionEl = layoutPreviewCaptionEl;
  var stylePreviewTextEl = layoutPreviewTextEl;
  var stylePreviewMetaEl = layoutPreviewMetaEl;
  var activeStyleColorToken = "accentColor";
  var styleOverrideState = {
    accentColor: null,
    fillColor: null,
    strokeColor: null,
    shadowColor: null,
    lineBoxColor: null,
    boxColor: null,
    strokeEnabled: null,
    lineBoxEnabled: null,
    strokeWidth: null,
    fontSize: null,
    maxLines: null,
    maxTextWidth: null,
    blockScale: null,
    positionOffsetX: null,
    marginY: null,
    verticalMarginY: null,
    leading: null,
    tracking: null,
    fauxItalic: null,
    boxEnabled: null,
    boxOpacity: null,
    boxPadding: null,
    boxRoundness: null,
    boxSmart: null
  };
  var runOverlayQuoteTimer = null;
  var previewDragState = null;
  var runOverlayQuoteIndex = -1;
  var previewQuoteIndex = -1;
  var previewMeasureCanvas = null;
  var previewFontEntries = [];
  var isFontCatalogLoading = false;
  var fontCatalogReady = false;
  var fontCatalogRequestStarted = false;
  var fontCatalogVerifiedThisSession = false;
  var transcriptReviewHasFreshPayload = false;
  var previewPresetMap = null;
  var FONT_CACHE_KEY = "aeas_font_cache_v1";
  var runOverlayQuotes = [
    "\"Випити чаю НЕ шкодить вашому здоровʼю!\"",
    "\"Зараз ми ріжемо тишу на титри.\"",
    "\"Кожен кадр заслуговує на влучний рядок.\"",
    "\"Звук уже працює на результат.\"",
    "\"Ще трішки, і таймлайн заговорить.\"",
    "\"Авто-субтитри не сплять, навіть на паузі.\"",
    "\"Найкращі субтитри народжуються в тиші рендера.\"",
    "\"Слова вже шикуються по тайм-кодах.\"",
    "\"Тиша тимчасова, субтитри постійні.\"",
    "\"Пауза для тебе, робота для плагіна.\"",
    "\"Мікрофон відпочиває, алгоритм ні.\"",
    "\"Діалоги вже перетворюються на шари.\"",
    "\"Кадр за кадром, рядок за рядком.\"",
    "\"Робимо так, щоб усе було читабельно.\"",
    "\"Точність понад усе, магія теж.\"",
    "\"Уже ловимо кожне важливе слово.\"",
    "\"Таймлайн скоро стане балакучим.\"",
    "\"Працюємо над тим, щоб ти не працював вручну.\"",
    "\"Підписуємо навіть найшвидші репліки.\"",
    "\"Текст уже м'яко приземляється в кадр.\"",
    "\"Поки ти чекаєш, субтитри дорослішають.\"",
    "\"Налаштовуємо ритм фраз під відео.\"",
    "\"Дихаємо рівно, процес іде штатно.\"",
    "\"Слова вже майже на своїх місцях.\"",
    "\"Це не магія. Це хороший pipeline.\"",
    "\"Шум відсікаємо, сенс залишаємо.\"",
    "\"Момент, коли звук стає видимим.\"",
    "\"Ще декілька секунд до готового результату.\"",
    "\"Алгоритм у фокусі, результат на підході.\"",
    "\"Поглинання звуків вже відбувається!\"",
    "\"Не перемикайся: титри вже в дорозі.\"",
    "\"Розмітка йде, кадр тримаємо.\"",
    "\"Готуємо чистий саб для фінального рендера.\""
  ];
  var previewFallbackQuotes = {
    auto: [
      "I know exactly what you mean.",
      "This changes everything for us.",
      "We should talk about this now.",
      "I did not expect that at all.",
      "You already know the answer."
    ],
    en: [
      "I know exactly what you mean.",
      "This changes everything for us.",
      "We should talk about this now.",
      "I did not expect that at all.",
      "You already know the answer."
    ],
    uk: [
      "Я знаю, про що ти говориш.",
      "Це змінює для нас усе.",
      "Нам треба поговорити зараз.",
      "Я зовсім не цього чекав.",
      "Ти вже знаєш відповідь."
    ],
    es: [
      "Ya sé lo que quieres decir.",
      "Esto lo cambia todo para nosotros.",
      "Tenemos que hablar de esto ya.",
      "No me esperaba esto para nada.",
      "Tú ya sabes la respuesta."
    ],
    hinglish: [
      "Wapas aane ka koi chance?",
      "Mujhe lagta hai ye sahi hai.",
      "Abhi baat karni padegi.",
      "Scene thoda complicated hai.",
      "Tum already answer jaante ho."
    ]
  };
  var previewTranscriptCache = {
    path: "",
    mtimeMs: 0,
    samples: []
  };
  var lastPreviewQuoteSource = "sample";
  var previewPresetFallbacks = {
    classic_clean: {
      font: "Arial-BoldMT",
      fontSize: 78,
      fillColor: [1, 1, 1],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -2,
      leading: 84,
      shadowEnabled: false,
      maxTextWidth: 500
    },
    static_marker_karaoke: {
      font: "ChalkboardSE-Bold",
      fontSize: 82,
      fillColor: [0.02, 0.02, 0.02],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -1,
      leading: 88,
      boxEnabled: false,
      shadowEnabled: false,
      karaokeEnabled: true,
      chunkWordsEnabled: false,
      accentColor: [0.58, 0.03, 0.09],
      maxTextWidth: 820,
      animEnabled: false
    },
    clean_paragraph: {
      font: "Arial-BoldMT",
      fontSize: 72,
      fillColor: [1, 1, 1],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -1,
      leading: 78,
      maxTextWidth: 500
    },
    modern_yellow: {
      font: "Arial-BoldMT",
      fontSize: 82,
      fillColor: [1, 1, 1],
      strokeEnabled: true,
      strokeColor: [0.12, 0.06, 0.08],
      strokeWidth: 6,
      tracking: -2,
      leading: 88,
      accentColor: [1, 0.83, 0.15],
      karaokeEnabled: true,
      chunkWordsEnabled: true,
      chunkMinWords: 3,
      chunkMaxWords: 5,
      chunkTargetWords: 4,
      shadowEnabled: true,
      shadowColor: [0.09, 0.04, 0.06],
      shadowOpacity: 74,
      shadowDistance: 5,
      shadowBlur: 7,
      shadowAngle: 90,
      maxTextWidth: 500
    },
    impact_yellow: {
      font: "Impact",
      fontSize: 52,
      fillColor: [1, 1, 1],
      strokeEnabled: true,
      strokeColor: [0.14, 0.07, 0.09],
      strokeWidth: 4,
      tracking: -6,
      leading: 54,
      forceUppercase: true,
      accentColor: [1, 0.82, 0.12],
      karaokeEnabled: true,
      boxEnabled: true,
      boxSmart: true,
      boxColor: [0.12, 0.05, 0.07],
      boxOpacity: 100,
      boxPaddingX: 12,
      boxPaddingY: 6,
      boxRoundness: 10,
      shadowEnabled: true,
      shadowColor: [0.07, 0.03, 0.04],
      shadowOpacity: 66,
      shadowDistance: 3,
      shadowBlur: 3,
      shadowAngle: 90,
      maxTextWidth: 500
    },
    bold_yellow_shadow: {
      font: "Arial-BoldMT",
      fontSize: 92,
      fillColor: [1, 1, 1],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -3,
      leading: 98,
      forceUppercase: true,
      accentColor: [1, 0.82, 0.14],
      karaokeEnabled: true,
      chunkWordsEnabled: true,
      chunkMinWords: 2,
      chunkMaxWords: 4,
      chunkTargetWords: 3,
      shadowEnabled: true,
      shadowColor: [0, 0, 0],
      shadowOpacity: 76,
      shadowDistance: 4,
      shadowBlur: 14,
      shadowAngle: 90,
      maxTextWidth: 500
    },
    reels_bold_yellow: {
      font: "Arial-BoldMT",
      fontSize: 88,
      fillColor: [1, 1, 1],
      strokeEnabled: true,
      strokeColor: [0, 0, 0],
      strokeWidth: 2,
      tracking: -4,
      leading: 90,
      forceUppercase: true,
      accentColor: [1, 0.84, 0.06],
      accentWordIndex: 0,
      karaokeEnabled: true,
      chunkWordsEnabled: true,
      chunkMinWords: 3,
      chunkMaxWords: 5,
      chunkTargetWords: 4,
      shadowEnabled: true,
      shadowColor: [0, 0, 0],
      shadowOpacity: 72,
      shadowDistance: 3,
      shadowBlur: 5,
      shadowAngle: 90,
      maxTextWidth: 650
    },
    bold_two_words: {
      font: "Arial-BoldMT",
      fontSize: 96,
      fillColor: [1, 1, 1],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -3,
      leading: 102,
      forceUppercase: true,
      forceTwoLines: true,
      chunkWordsEnabled: true,
      chunkMinWords: 2,
      chunkMaxWords: 4,
      chunkTargetWords: 4,
      shadowEnabled: true,
      shadowColor: [0, 0, 0],
      shadowOpacity: 60,
      shadowDistance: 4,
      shadowBlur: 12,
      shadowAngle: 90,
      maxTextWidth: 420
    },
    backplate_bold: {
      font: "Arial-BoldMT",
      fontSize: 88,
      fillColor: [1, 1, 1],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -3,
      leading: 94,
      forceUppercase: true,
      forceTwoLines: true,
      chunkWordsEnabled: true,
      chunkMinWords: 3,
      chunkMaxWords: 6,
      chunkTargetWords: 5,
      backplateEnabled: true,
      backplateRenderMode: "precomp",
      backplateColor: [0, 0, 0],
      backplateOpacity: 100,
      backplatePaddingX: 28,
      backplatePaddingY: 14,
      backplateRoundness: 22,
      lineBoxEnabled: false,
      shadowEnabled: false,
      maxTextWidth: 560
    },
    backplate_stack: {
      font: "Arial-BoldMT",
      fontSize: 92,
      fillColor: [1, 1, 1],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -4,
      leading: 88,
      forceUppercase: true,
      forceTwoLines: true,
      chunkWordsEnabled: true,
      chunkMinWords: 2,
      chunkMaxWords: 4,
      chunkTargetWords: 3,
      backplateEnabled: true,
      backplateRenderMode: "precomp",
      backplateColor: [0, 0, 0],
      backplateOpacity: 100,
      backplatePaddingX: 30,
      backplatePaddingY: 16,
      backplateRoundness: 24,
      lineBoxEnabled: false,
      shadowEnabled: false,
      maxTextWidth: 440
    },
    backplate_yellow: {
      font: "Arial-BoldMT",
      fontSize: 86,
      fillColor: [1, 0.82, 0.12],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -3,
      leading: 92,
      forceUppercase: true,
      forceTwoLines: true,
      chunkWordsEnabled: true,
      chunkMinWords: 3,
      chunkMaxWords: 5,
      chunkTargetWords: 4,
      backplateEnabled: true,
      backplateRenderMode: "precomp",
      backplateColor: [0, 0, 0],
      backplateOpacity: 100,
      backplatePaddingX: 28,
      backplatePaddingY: 14,
      backplateRoundness: 22,
      lineBoxEnabled: false,
      shadowEnabled: false,
      maxTextWidth: 520
    },
    karaoke_classic: {
      font: "Arial-BoldMT",
      fontSize: 54,
      fillColor: [1, 1, 1],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -2,
      leading: 58,
      accentColor: [0.22, 0.63, 1],
      karaokeEnabled: false,
      wordBoxEnabled: true,
      wordBoxColor: [0.22, 0.63, 1],
      wordBoxOpacity: 100,
      wordBoxPaddingX: 8,
      wordBoxPaddingY: 3,
      wordBoxRoundness: 6,
      wordFillColor: [1, 1, 1],
      shadowEnabled: false,
      maxTextWidth: 500
    },
    minimal: {
      font: "Arial-BoldMT",
      fontSize: 56,
      fillColor: [1, 1, 1],
      strokeEnabled: false,
      strokeColor: [0, 0, 0],
      strokeWidth: 0,
      tracking: -2,
      leading: 60,
      shadowEnabled: false,
      maxTextWidth: 500
    },
    white_caption: {
      font: "Arial-BoldMT",
      fontSize: 56,
      fillColor: [1, 1, 1],
      strokeEnabled: true,
      strokeColor: [0, 0, 0],
      strokeWidth: 4,
      tracking: 2,
      leading: 60,
      forceUppercase: true,
      forceTwoLines: true,
      boxEnabled: true,
      boxColor: [0.29, 0.25, 0.27],
      boxOpacity: 92,
      boxPaddingX: 34,
      boxPaddingY: 20,
      boxStrokeEnabled: true,
      boxStrokeColor: [0.42, 0.37, 0.4],
      boxStrokeWidth: 2,
      maxTextWidth: 500
    },
    outline: {
      font: "Arial-BoldMT",
      fontSize: 60,
      fillColor: [1, 1, 1],
      strokeEnabled: true,
      strokeColor: [0, 0, 0],
      strokeWidth: 5,
      tracking: 0,
      leading: 64,
      maxTextWidth: 500
    },
    social_clean: {
      font: "Arial-BoldMT",
      fontSize: 64,
      fillColor: [1, 1, 1],
      strokeEnabled: true,
      strokeColor: [0, 0, 0],
      strokeWidth: 5,
      tracking: 4,
      leading: 70,
      boxEnabled: true,
      boxSmart: true,
      boxColor: [0, 0, 0],
      boxOpacity: 72,
      boxPaddingX: 22,
      boxPaddingY: 16,
      boxRoundness: 999,
      maxTextWidth: 500
    },
    box: {
      font: "Arial-BoldMT",
      fontSize: 60,
      fillColor: [1, 1, 1],
      strokeEnabled: true,
      strokeColor: [0, 0, 0],
      strokeWidth: 5,
      tracking: 4,
      leading: 66,
      boxEnabled: true,
      boxSmart: true,
      boxColor: [0, 0, 0],
      boxOpacity: 78,
      boxPaddingX: 20,
      boxPaddingY: 16,
      boxRoundness: 999,
      maxTextWidth: 500
    },
    bold: {
      font: "Arial-BoldMT",
      fontSize: 72,
      fillColor: [1, 0.93, 0.15],
      strokeEnabled: true,
      strokeColor: [0, 0, 0],
      strokeWidth: 5,
      tracking: 8,
      leading: 78,
      allCaps: true,
      shadowEnabled: true,
      shadowColor: [0, 0, 0],
      shadowOpacity: 64,
      shadowDistance: 4,
      shadowBlur: 10,
      maxTextWidth: 500
    }
  };

  function setLiveStatus(message, isError) {
    if (!liveStatusEl) {
      return;
    }
    var compact = String(message || "").replace(/\s+/g, " ").trim();
    if (compact.length > 140) {
      compact = compact.substring(0, 137) + "...";
    }
    var prefix = isError ? "error" : "ok";
    liveStatusEl.textContent = "live_status " + APP_VERSION + " | " + prefix + " | model " + getSelectedModelValue() + " | " + (compact || "idle");
    liveStatusEl.className = isError ? "live-status error" : "live-status";
  }

  function setStatus(message, isError) {
    var text = String(message || "");
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = isError ? "error" : "";
    }
    setLiveStatus(text, isError);
  }

  function setButtonsDisabled(disabled) {
    var ids = ["btnScanSources", "btnScanSourcesHero", "btnRefreshTimings", "btnFullRun"];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) {
        el.disabled = !!disabled;
      }
    }
  }

  function setRunProgress(percent, label) {
    if (!progressWrapEl || !progressLabelEl || !progressFillEl) {
      return;
    }
    progressWrapEl.classList.remove("hidden");
    if (label) {
      progressLabelEl.textContent = label;
      if (runOverlayTextEl) {
        runOverlayTextEl.textContent = label;
      }
      setLiveStatus(label, false);
    }
    var bounded = Math.max(0, Math.min(100, Number(percent) || 0));
    progressFillEl.style.width = bounded + "%";
  }

  function nextOverlayQuote() {
    if (!runOverlayQuoteEl || !runOverlayQuotes.length) {
      return;
    }

    var nextIndex = runOverlayQuoteIndex;
    if (runOverlayQuotes.length === 1) {
      nextIndex = 0;
    } else {
      while (nextIndex === runOverlayQuoteIndex) {
        nextIndex = Math.floor(Math.random() * runOverlayQuotes.length);
      }
    }

    runOverlayQuoteIndex = nextIndex;
    runOverlayQuoteEl.textContent = runOverlayQuotes[runOverlayQuoteIndex];
  }

  function startOverlayQuotes() {
    if (!runOverlayQuoteEl) return;
    if (runOverlayQuoteTimer) {
      clearInterval(runOverlayQuoteTimer);
      runOverlayQuoteTimer = null;
    }
    nextOverlayQuote();
    runOverlayQuoteTimer = setInterval(nextOverlayQuote, 8400);
  }

  function stopOverlayQuotes() {
    if (runOverlayQuoteTimer) {
      clearInterval(runOverlayQuoteTimer);
      runOverlayQuoteTimer = null;
    }
  }

  function setRunOverlayVisible(visible) {
    if (!runOverlayEl) return;
    if (visible) {
      startOverlayQuotes();
      runOverlayEl.classList.remove("hidden");
      runOverlayEl.setAttribute("aria-hidden", "false");
      return;
    }
    stopOverlayQuotes();
    runOverlayEl.classList.add("hidden");
    runOverlayEl.setAttribute("aria-hidden", "true");
  }

  function beginRun(label) {
    setButtonsDisabled(true);
    setRunOverlayVisible(true);
    setRunProgress(6, label || "Running...");
  }

  function waitForUiPaint() {
    return new Promise(function (resolve) {
      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        window.requestAnimationFrame(function () {
          setTimeout(resolve, 35);
        });
        return;
      }
      setTimeout(resolve, 50);
    });
  }

  function updateRunProgress(percent, label) {
    setRunProgress(percent, label);
  }

  function finishRun(label, isError) {
    if (isError) {
      setRunProgress(100, label || "Failed");
    } else {
      setRunProgress(100, label || "Done");
    }

    setButtonsDisabled(false);
    setRunOverlayVisible(false);
    if (!isError && progressWrapEl) {
      setTimeout(function () {
        progressWrapEl.classList.add("hidden");
      }, 600);
    }
  }

  var cep = window.__adobe_cep__ || null;
  if (!cep) {
    setStatus("Preview mode. Open inside After Effects to scan, generate and apply captions.");
  }
  exposeSelfTestHooks();

  function evalScript(script, options) {
    options = options || {};
    var timeoutMs = Math.max(1000, Number(options.timeoutMs || 45000));
    var label = String(options.label || "AE script");
    return new Promise(function (resolve, reject) {
      if (!cep || typeof cep.evalScript !== "function") {
        resolve(JSON.stringify({ ok: false, error: "Open inside After Effects to scan the active comp." }));
        return;
      }
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        reject(new Error(label + " did not respond after " + Math.round(timeoutMs / 1000) + "s. After Effects is likely busy or stuck; wait for AE to recover, then run again."));
      }, timeoutMs);
      cep.evalScript(script, function (result) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      });
    });
  }

  function jsString(v) {
    return String(v || "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  }

  function shellQuote(v) {
    return "'" + String(v || "").replace(/'/g, "'\"'\"'") + "'";
  }

  var childProcess = null;
  var fs = null;
  var path = null;
  var hasNodeBridge = false;

  function flashButtonText(buttonId, text, timeoutMs) {
    var btn = document.getElementById(buttonId);
    if (!btn) return;
    var original = btn.dataset.originalText || btn.textContent;
    btn.dataset.originalText = original;
    btn.textContent = text;
    btn.classList.add("copied");
    setTimeout(function () {
      btn.textContent = btn.dataset.originalText || original;
      btn.classList.remove("copied");
    }, timeoutMs || 1200);
  }

  function copyWithExecCommand(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    } catch (_err) {
      return false;
    }
  }

  async function copyLogToClipboard() {
    var text = (statusEl && statusEl.textContent ? statusEl.textContent : "").trim();
    if (!text) {
      throw new Error("Log is empty.");
    }

    await copyTextToClipboard(text);
    flashButtonText("btnCopyLog", "Copied", 1400);
  }

  async function copyTextToClipboard(text) {
    var value = String(text || "");
    if (!value) {
      throw new Error("Nothing to copy.");
    }

    var copied = false;

    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        copied = true;
      }
    } catch (_e1) {}

    if (!copied) {
      copied = copyWithExecCommand(value);
    }

    if (!copied) {
      try {
        if (window.cep && window.cep.util && typeof window.cep.util.copyToClipboard === "function") {
          copied = !!window.cep.util.copyToClipboard(value);
        }
      } catch (_e2) {}
    }

    if (!copied) {
      throw new Error("Clipboard unavailable in this CEP host.");
    }
  }

  try {
    childProcess = require("child_process");
    fs = require("fs");
    path = require("path");
    hasNodeBridge = true;
  } catch (_e1) {
    try {
      childProcess = window.cep_node.require("child_process");
      fs = window.cep_node.require("fs");
      path = window.cep_node.require("path");
      hasNodeBridge = true;
    } catch (_e2) {
      hasNodeBridge = false;
    }
  }

  function normPath(raw) {
    if (!raw) return "";
    var value = decodeURIComponent(String(raw));
    if (value.indexOf("file://") === 0) {
      value = value.replace(/^file:\/\//, "");
    }
    return value;
  }

  function getExtensionPath() {
    return normPath(cep.getSystemPath("extension"));
  }

  function normalizeSep(value) {
    return String(value || "").replace(/\\/g, "/");
  }

  function fileExists(filePath) {
    if (!fs) return false;
    try {
      return fs.existsSync(filePath);
    } catch (_err) {
      return false;
    }
  }

  var cachedRepoRoot = null;
  function getRepoRoot() {
    if (cachedRepoRoot) {
      return cachedRepoRoot;
    }

    var extPath = getExtensionPath();

    if (hasNodeBridge && fs && path) {
      var candidates = [extPath];
      try {
        candidates.push(path.resolve(extPath, ".."));
      } catch (_e1) {}

      try {
        var realExtPath = fs.realpathSync(extPath);
        candidates.push(realExtPath);
        candidates.push(path.resolve(realExtPath, ".."));
      } catch (_e2) {}

      var seen = {};
      for (var i = 0; i < candidates.length; i++) {
        var candidate = normalizeSep(candidates[i]);
        if (!candidate || seen[candidate]) {
          continue;
        }
        seen[candidate] = true;

        var hasBackend = fileExists(path.join(candidate, "backend", "transcribe.py"));
        var hasScripts = fileExists(path.join(candidate, "scripts", "create_subtitles.jsx"));
        var hasConfig = fileExists(path.join(candidate, "config", "presets.json"));
        if (hasBackend && hasScripts && hasConfig) {
          cachedRepoRoot = candidate;
          return cachedRepoRoot;
        }
      }
    }

    var fallback = normalizeSep(extPath);
    if (fallback.match(/\/panel$/)) {
      fallback = fallback.replace(/\/panel$/, "");
    }
    cachedRepoRoot = fallback;
    return cachedRepoRoot;
  }

  function deepClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_err) {
      return value;
    }
  }

  function toCssRgb(color, alpha) {
    var arr = Array.isArray(color) ? color : [1, 1, 1];
    var a = alpha;
    if (typeof a !== "number" || isNaN(a)) {
      a = 1;
    }
    var r = Math.max(0, Math.min(255, Math.round((Number(arr[0]) || 0) * 255)));
    var g = Math.max(0, Math.min(255, Math.round((Number(arr[1]) || 0) * 255)));
    var b = Math.max(0, Math.min(255, Math.round((Number(arr[2]) || 0) * 255)));
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
  }

  function componentToHex(value) {
    var bounded = Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
    var hex = bounded.toString(16).toUpperCase();
    return hex.length < 2 ? "0" + hex : hex;
  }

  function rgbArrayToHex(color) {
    var arr = Array.isArray(color) ? color : [1, 1, 1];
    return "#" +
      componentToHex((Number(arr[0]) || 0) * 255) +
      componentToHex((Number(arr[1]) || 0) * 255) +
      componentToHex((Number(arr[2]) || 0) * 255);
  }

  function hexToRgbArray(hex) {
    var value = String(hex || "").trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(value)) {
      return null;
    }
    if (value.charAt(0) !== "#") {
      value = "#" + value;
    }
    return [
      parseInt(value.substr(1, 2), 16) / 255,
      parseInt(value.substr(3, 2), 16) / 255,
      parseInt(value.substr(5, 2), 16) / 255
    ];
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mapFontWeight(styleName) {
    var style = String(styleName || "").toLowerCase();
    if (/(black|heavy)/.test(style)) return "900";
    if (/(extra.?bold|ultra.?bold)/.test(style)) return "800";
    if (/(semi.?bold|demi.?bold)/.test(style)) return "600";
    if (/medium/.test(style)) return "500";
    if (/(light|thin|extra.?light|ultra.?light)/.test(style)) return "300";
    if (/bold/.test(style)) return "700";
    return "400";
  }

  function mapFontStyle(styleName, preset) {
    var style = String(styleName || "").toLowerCase();
    if (/(italic|oblique)/.test(style)) {
      return "italic";
    }
    return preset && preset.fauxItalic ? "italic" : "normal";
  }

  function loadPresetPreviewMap() {
    if (previewPresetMap) {
      return previewPresetMap;
    }
    previewPresetMap = deepClone(previewPresetFallbacks);
    if (!hasNodeBridge || !fs) {
      return previewPresetMap;
    }
    try {
      var presetsPath = getRepoRoot() + "/config/presets.json";
      if (fs.existsSync(presetsPath)) {
        var parsed = JSON.parse(fs.readFileSync(presetsPath, "utf8"));
        if (parsed && typeof parsed === "object") {
          previewPresetMap = parsed;
        }
      }
    } catch (_err) {}
    return previewPresetMap;
  }

  function applyStandardReadabilityDefaults(preset) {
    if (!preset) {
      return preset;
    }
    preset.fontSize = STANDARD_READABILITY_DEFAULTS.fontSize;
    preset.strokeEnabled = STANDARD_READABILITY_DEFAULTS.strokeEnabled;
    preset.strokeWidth = STANDARD_READABILITY_DEFAULTS.strokeWidth;
    preset.maxLines = STANDARD_READABILITY_DEFAULTS.maxLines;
    preset.maxTextWidth = STANDARD_READABILITY_DEFAULTS.maxTextWidth;
    preset.blockScale = STANDARD_READABILITY_DEFAULTS.blockScale;
    preset.marginY = STANDARD_READABILITY_DEFAULTS.marginY;
    preset.verticalMarginY = STANDARD_READABILITY_DEFAULTS.verticalMarginY;
    preset.positionOffsetX = STANDARD_READABILITY_DEFAULTS.positionOffsetX;
    return preset;
  }

  function getPresetPreviewConfig(presetName) {
    var map = loadPresetPreviewMap();
    var key = String(presetName || "");
    if (map && map[key]) {
      return applyStandardReadabilityDefaults(deepClone(map[key]));
    }
    if (map && map.classic_clean) {
      return applyStandardReadabilityDefaults(deepClone(map.classic_clean));
    }
    if (map && map.box) {
      return applyStandardReadabilityDefaults(deepClone(map.box));
    }
    return applyStandardReadabilityDefaults({});
  }

  function isBoxDisabledPreset(presetName) {
    return !!BOX_DISABLED_PRESET_NAMES[String(presetName || DEFAULT_PRESET_NAME)];
  }

  function disableBoxFeaturesForVisiblePreset(preset) {
    if (!preset) {
      return preset;
    }
    preset.boxEnabled = false;
    preset.boxSmart = false;
    preset.wordBoxEnabled = false;
    return preset;
  }

  function isBackplateEnabled(preset) {
    return !!(preset && (preset.backplateEnabled || preset.lineBoxEnabled));
  }

  function getBackplateColor(preset) {
    if (preset && isValidColorArray(preset.backplateColor)) {
      return preset.backplateColor.slice();
    }
    if (preset && isValidColorArray(preset.lineBoxColor)) {
      return preset.lineBoxColor.slice();
    }
    return [0, 0, 0];
  }

  function findFontEntryByPostScript(postScriptName) {
    var wanted = String(postScriptName || "");
    if (!wanted) {
      return null;
    }
    for (var i = 0; i < previewFontEntries.length; i++) {
      var entry = previewFontEntries[i];
      if (String(entry.postScriptName || "") === wanted) {
        return entry;
      }
    }
    return null;
  }

  function getSelectedFontOverride() {
    if (!fontSelectEl) {
      return "";
    }
    return String(fontSelectEl.value || "").trim();
  }

  function getOutputModeLabel(modeValue) {
    return String(modeValue || "layers") === "single_keys" ? "single keys" : "layers";
  }

  function getSelectedModelValue() {
    return String(getValue("model") || "turbo").trim() || "turbo";
  }

  function getSelectedModelLabel() {
    var modelEl = document.getElementById("model");
    var value = getSelectedModelValue();
    if (modelEl && modelEl.options) {
      for (var i = 0; i < modelEl.options.length; i++) {
        if (String(modelEl.options[i].value) === value) {
          return String(modelEl.options[i].textContent || value).trim();
        }
      }
    }
    return value;
  }

  function annotatePayloadTranscriptionModel(payload) {
    if (!payload) {
      return false;
    }
    payload.meta = payload.meta || {};
    payload.meta.sttModel = getSelectedModelValue();
    payload.meta.sttModelLabel = getSelectedModelLabel();
    return true;
  }

  function annotateCurrentSubtitlesTranscriptionModel() {
    if (!hasNodeBridge || !fs) {
      return false;
    }
    var payload = readSubtitlesPayload();
    if (!payload || !Array.isArray(payload.items)) {
      return false;
    }
    annotatePayloadTranscriptionModel(payload);
    fs.writeFileSync(getDefaultSubtitlesPath(), JSON.stringify(payload, null, 2) + "\n", "utf8");
    previewTranscriptCache = { path: "", mtimeMs: 0, samples: [] };
    return true;
  }

  function getPayloadModelLabel(payload) {
    var meta = payload && payload.meta ? payload.meta : {};
    return String(meta.sttModelLabel || meta.sttModel || "unknown").trim() || "unknown";
  }

  function getPayloadModelStaleNote(payload) {
    var meta = payload && payload.meta ? payload.meta : {};
    var used = String(meta.sttModel || "").trim();
    var selected = getSelectedModelValue();
    if (used && selected && used !== selected) {
      return " (selected now: " + selected + "; Retiming needed)";
    }
    return "";
  }

  function getPresetDisplayLabel(presetName) {
    var presetSelectEl = document.getElementById("preset");
    if (presetSelectEl && presetSelectEl.options) {
      for (var i = 0; i < presetSelectEl.options.length; i++) {
        if (String(presetSelectEl.options[i].value) === String(presetName || "")) {
          return String(presetSelectEl.options[i].textContent || presetSelectEl.options[i].label || presetName || "").trim();
        }
      }
    }
    var preset = getPresetPreviewConfig(presetName);
    return String((preset && preset.displayName) || presetName || DEFAULT_PRESET_NAME);
  }

  function updateOutputModeHint() {
    if (!outputModeHintEl) {
      return;
    }
    var mode = String(getValue("outputMode") || "layers");
    if (mode === "single_keys") {
      outputModeHintEl.textContent = "single_keys keeps one subtitle text layer and drives it with Source Text plus transform keyframes.";
      return;
    }
    outputModeHintEl.textContent = "layers creates a separate subtitle layer for each caption item, which is easier to tweak manually on the timeline.";
  }

  function updateSummarySources() {
    if (!summarySourcesEl) {
      return;
    }
    var selectedCount = getSelectedSources().length;
    if (shouldRenderCompMixFirst()) {
      summarySourcesEl.textContent = "comp mix first";
      return;
    }
    if (useCompMixSelection() && selectedCount > 0) {
      summarySourcesEl.textContent = selectedCount + "/" + activeCompSources.length + " fast, mix fallback";
      return;
    }
    if (!activeCompSources.length) {
      summarySourcesEl.textContent = activeCompMixAvailable ? "comp mix available" : "0 selected";
      return;
    }
    summarySourcesEl.textContent = selectedCount + "/" + activeCompSources.length + " selected";
  }

  function updateUiSummary() {
    var presetName = String(getValue("preset") || DEFAULT_PRESET_NAME);
    var modeValue = String(getValue("outputMode") || "layers");
    var preset = getEffectivePresetForPreview();
    var fontInfo = getResolvedPreviewFont(preset);

    if (summaryPresetEl) {
      summaryPresetEl.textContent = getPresetDisplayLabel(presetName);
    }
    if (summaryModeEl) {
      summaryModeEl.textContent = getOutputModeLabel(modeValue);
    }
    if (summaryFontEl) {
      summaryFontEl.textContent = getSelectedFontOverride()
        ? (fontInfo.fullName || fontInfo.postScriptName || "custom")
        : "Preset default";
    }
    if (summaryVersionEl) {
      summaryVersionEl.textContent = APP_VERSION;
    }
    updateSummarySources();
    updateOutputModeHint();
  }

  function getPresetDefaultFont(preset) {
    return String((preset && preset.font) || "").trim();
  }

  function syncFontSelectToPreset(preset, options) {
    if (!fontSelectEl) {
      return;
    }
    options = options || {};
    var current = String(fontSelectEl.value || "").trim();
    if (options.preserveCurrent && current) {
      return;
    }
    fontSelectEl.value = "";
  }

  function getPresetAccentColor(preset) {
    if (preset && Array.isArray(preset.accentColor) && preset.accentColor.length === 3) {
      return preset.accentColor.slice();
    }
    if (preset && Array.isArray(preset.fillColor) && preset.fillColor.length === 3) {
      return preset.fillColor.slice();
    }
    return [1, 1, 1];
  }

  function isValidColorArray(color) {
    return Array.isArray(color) && color.length === 3;
  }

  function getPresetColorByToken(preset, token) {
    if (!preset) {
      return [1, 1, 1];
    }
    if (token === "accentColor") {
      return getPresetAccentColor(preset);
    }
    if (token === "fillColor" && isValidColorArray(preset.fillColor)) {
      return preset.fillColor.slice();
    }
    if (token === "strokeColor" && isValidColorArray(preset.strokeColor)) {
      return preset.strokeColor.slice();
    }
    if (token === "shadowColor" && isValidColorArray(preset.shadowColor)) {
      return preset.shadowColor.slice();
    }
    if (token === "lineBoxColor") {
      return getBackplateColor(preset);
    }
    if (token === "boxColor" && isValidColorArray(preset.boxColor)) {
      return preset.boxColor.slice();
    }
    if (token === "boxColor" && isValidColorArray(preset.wordBoxColor)) {
      return preset.wordBoxColor.slice();
    }
    return [1, 1, 1];
  }

  function getStyleTokenLabel(token) {
    if (token === "accentColor") return "Accent";
    if (token === "fillColor") return "Fill";
    if (token === "strokeColor") return "Stroke";
    if (token === "shadowColor") return "Shadow";
    if (token === "lineBoxColor") return "Backplate";
    if (token === "boxColor") return "Box";
    return "Color";
  }

  function setStyleColorEditor(color, token) {
    var hex = rgbArrayToHex(color);
    activeStyleColorToken = token || activeStyleColorToken || "accentColor";
    if (styleColorPickerEl) {
      styleColorPickerEl.value = hex;
    }
    if (styleColorHexEl) {
      styleColorHexEl.value = hex;
    }
    if (styleColorTargetEl) {
      styleColorTargetEl.textContent = "Editing " + getStyleTokenLabel(activeStyleColorToken);
    }
    var resetBtn = document.getElementById("btnResetStyleColor");
    if (resetBtn) {
      resetBtn.classList.toggle("active-default", !styleOverrideState[activeStyleColorToken]);
    }
  }

  function formatSliderValue(el, value) {
    var numeric = Number(value);
    if (isNaN(numeric)) {
      return String(value);
    }
    var unit = String((el && el.getAttribute && el.getAttribute("data-unit")) || "");
    if (unit === " signed-px") {
      return (numeric > 0 ? "+" : "") + Math.round(numeric) + " px";
    }
    if (unit === "%") {
      return Math.round(numeric) + "%";
    }
    if (unit) {
      return Math.round(numeric) + unit;
    }
    return String(Math.round(numeric));
  }

  function updateSliderValueDisplay(el) {
    if (!el || !el.getAttribute) {
      return;
    }
    var outputId = el.getAttribute("data-output-id");
    if (!outputId) {
      return;
    }
    var outputEl = document.getElementById(outputId);
    if (!outputEl) {
      return;
    }
    outputEl.textContent = formatSliderValue(el, el.value);
  }

  function toggleSliderFieldState(el, disabled) {
    if (!el) {
      return;
    }
    el.disabled = !!disabled;
    var field = el.closest ? el.closest(".slider-field") : null;
    if (field && field.classList) {
      field.classList.toggle("is-disabled", !!disabled);
    }
  }

  function setNumericControlValue(el, value) {
    if (!el) return;
    el.value = String(value);
    updateSliderValueDisplay(el);
  }

  function setCheckboxControlValue(el, value) {
    if (!el) return;
    el.checked = !!value;
  }

  function getPresetBackgroundPadding(preset) {
    if (preset && preset.backplateEnabled) {
      return Number(preset.backplatePaddingX !== undefined ? preset.backplatePaddingX : 28);
    }
    if (preset && preset.lineBoxEnabled) {
      return Number(preset.lineBoxPaddingX !== undefined ? preset.lineBoxPaddingX : 28);
    }
    if (preset && preset.wordBoxEnabled) {
      return Number(preset.wordBoxPaddingX !== undefined ? preset.wordBoxPaddingX : (preset.wordBoxPadding !== undefined ? preset.wordBoxPadding : 10));
    }
    return Number(preset && preset.boxPadding !== undefined ? preset.boxPadding : 18);
  }

  function getPresetBackgroundRoundness(preset) {
    if (preset && preset.backplateEnabled) {
      return Number(preset.backplateRoundness !== undefined ? preset.backplateRoundness : 22);
    }
    if (preset && preset.lineBoxEnabled) {
      return Number(preset.lineBoxRoundness !== undefined ? preset.lineBoxRoundness : 22);
    }
    if (preset && preset.wordBoxEnabled) {
      return Number(preset.wordBoxRoundness !== undefined ? preset.wordBoxRoundness : 8);
    }
    return Number(preset && preset.boxRoundness !== undefined ? preset.boxRoundness : 0);
  }

  function getPresetBackgroundOpacity(preset) {
    if (preset && preset.backplateEnabled) {
      return Number(preset.backplateOpacity !== undefined ? preset.backplateOpacity : 100);
    }
    if (preset && preset.lineBoxEnabled) {
      return Number(preset.lineBoxOpacity !== undefined ? preset.lineBoxOpacity : 100);
    }
    if (preset && preset.wordBoxEnabled) {
      return Number(preset.wordBoxOpacity !== undefined ? preset.wordBoxOpacity : 100);
    }
    return Number(preset && preset.boxOpacity !== undefined ? preset.boxOpacity : 80);
  }

  function syncStyleControlsFromPreset(options) {
    options = options || {};
    var resetOverrides = !!options.resetOverrides;
    var presetName = getValue("preset") || DEFAULT_PRESET_NAME;
    var preset = getPresetPreviewConfig(presetName);
    if (isBoxDisabledPreset(presetName)) {
      disableBoxFeaturesForVisiblePreset(preset);
    }
    if (resetOverrides) {
      Object.keys(styleOverrideState).forEach(function (key) {
        styleOverrideState[key] = null;
      });
    }
    syncFontSelectToPreset(preset, { preserveCurrent: false });
    setStyleColorEditor(getPresetColorByToken(preset, activeStyleColorToken || "accentColor"), activeStyleColorToken || "accentColor");
    setNumericControlValue(fontSizeControlEl, Number(preset.fontSize) || 60);
    setNumericControlValue(maxLinesControlEl, Number(preset.maxLines !== undefined ? preset.maxLines : 2));
    setNumericControlValue(blockWidthControlEl, Number(preset.maxTextWidth) || 500);
    setNumericControlValue(blockScaleControlEl, Number(preset.blockScale !== undefined ? preset.blockScale : 100));
    setNumericControlValue(leadingControlEl, Number(preset.leading) || Number(preset.fontSize) || 66);
    setNumericControlValue(trackingControlEl, Number(preset.tracking) || 0);
    setNumericControlValue(strokeWidthControlEl, Number(preset.strokeWidth !== undefined ? preset.strokeWidth : 4));
    setNumericControlValue(boxPaddingControlEl, getPresetBackgroundPadding(preset));
    setNumericControlValue(boxRoundnessControlEl, getPresetBackgroundRoundness(preset));
    setNumericControlValue(boxOpacityControlEl, getPresetBackgroundOpacity(preset));
    setNumericControlValue(marginXControlEl, 0);
    setNumericControlValue(
      marginYControlEl,
      Number(preset.verticalMarginY !== undefined ? preset.verticalMarginY : (preset.marginY !== undefined ? preset.marginY : 180))
    );
    setCheckboxControlValue(strokeEnabledControlEl, preset.strokeEnabled !== false);
    setCheckboxControlValue(lineBoxEnabledControlEl, isBackplateEnabled(preset));
    setCheckboxControlValue(italicControlEl, !!preset.fauxItalic);
    setCheckboxControlValue(boxEnabledControlEl, !!preset.boxEnabled);
    setCheckboxControlValue(boxSmartControlEl, !!preset.boxSmart);
    refreshControlAvailability();
  }

  function coerceNumberOverride(value, fallback) {
    var n = Number(value);
    return isNaN(n) ? fallback : n;
  }

  function getEffectivePresetForPreview() {
    var presetName = getValue("preset") || DEFAULT_PRESET_NAME;
    var preset = getPresetPreviewConfig(presetName);
    if (styleOverrideState.accentColor) {
      preset.accentColor = styleOverrideState.accentColor.slice();
    } else {
      preset.accentColor = getPresetAccentColor(preset);
    }
    if (styleOverrideState.fillColor) {
      preset.fillColor = styleOverrideState.fillColor.slice();
    }
    if (styleOverrideState.strokeColor) {
      preset.strokeColor = styleOverrideState.strokeColor.slice();
    }
    if (styleOverrideState.shadowColor) {
      preset.shadowColor = styleOverrideState.shadowColor.slice();
    }
    if (styleOverrideState.lineBoxColor) {
      preset.backplateColor = styleOverrideState.lineBoxColor.slice();
      preset.lineBoxColor = styleOverrideState.lineBoxColor.slice();
    }
    if (styleOverrideState.boxColor) {
      preset.boxColor = styleOverrideState.boxColor.slice();
      if (preset.wordBoxEnabled) {
        preset.wordBoxColor = styleOverrideState.boxColor.slice();
      }
    }
    if (styleOverrideState.strokeEnabled !== null) {
      preset.strokeEnabled = !!styleOverrideState.strokeEnabled;
    }
    if (styleOverrideState.lineBoxEnabled !== null) {
      preset.backplateEnabled = !!styleOverrideState.lineBoxEnabled;
      preset.backplateRenderMode = "precomp";
      preset.lineBoxEnabled = false;
    }
    if (isBoxDisabledPreset(presetName)) {
      preset.backplateEnabled = false;
      preset.lineBoxEnabled = false;
    }
    if (styleOverrideState.strokeWidth !== null) {
      preset.strokeWidth = coerceNumberOverride(styleOverrideState.strokeWidth, preset.strokeWidth !== undefined ? preset.strokeWidth : 4);
    }
    if (preset.strokeEnabled) {
      preset.strokeOverFill = false;
      preset.lineJoinType = "round";
    }
    if (styleOverrideState.fontSize !== null) {
      preset.fontSize = coerceNumberOverride(styleOverrideState.fontSize, Number(preset.fontSize) || 60);
    }
    if (styleOverrideState.maxLines !== null) {
      preset.maxLines = Math.max(1, Math.min(4, Math.round(coerceNumberOverride(styleOverrideState.maxLines, Number(preset.maxLines) || 2))));
    }
    if (styleOverrideState.maxTextWidth !== null) {
      preset.maxTextWidth = coerceNumberOverride(styleOverrideState.maxTextWidth, Number(preset.maxTextWidth) || 500);
    }
    if (styleOverrideState.blockScale !== null) {
      preset.blockScale = coerceNumberOverride(styleOverrideState.blockScale, Number(preset.blockScale !== undefined ? preset.blockScale : 100));
    }
    if (styleOverrideState.positionOffsetX !== null) {
      preset.positionOffsetX = coerceNumberOverride(styleOverrideState.positionOffsetX, Number(preset.positionOffsetX !== undefined ? preset.positionOffsetX : 0));
    }
    if (styleOverrideState.marginY !== null) {
      preset.marginY = coerceNumberOverride(styleOverrideState.marginY, Number(preset.marginY !== undefined ? preset.marginY : 180));
      preset.verticalMarginY = preset.marginY;
    } else if (styleOverrideState.verticalMarginY !== null) {
      preset.verticalMarginY = coerceNumberOverride(styleOverrideState.verticalMarginY, Number(preset.verticalMarginY !== undefined ? preset.verticalMarginY : preset.marginY || 180));
      preset.marginY = preset.verticalMarginY;
    }
    if (styleOverrideState.leading !== null) {
      preset.leading = coerceNumberOverride(styleOverrideState.leading, Number(preset.leading) || Number(preset.fontSize) || 66);
    }
    if (styleOverrideState.tracking !== null) {
      preset.tracking = coerceNumberOverride(styleOverrideState.tracking, Number(preset.tracking) || 0);
    }
    if (styleOverrideState.fauxItalic !== null) {
      preset.fauxItalic = !!styleOverrideState.fauxItalic;
    }
    if (styleOverrideState.boxEnabled !== null) {
      preset.boxEnabled = !!styleOverrideState.boxEnabled;
    }
    if (isBackplateEnabled(preset)) {
      preset.boxEnabled = false;
      preset.boxSmart = false;
      preset.wordBoxEnabled = false;
    }
    if (styleOverrideState.boxSmart !== null) {
      preset.boxSmart = !!styleOverrideState.boxSmart;
    }
    if (styleOverrideState.boxPadding !== null) {
      preset.boxPadding = coerceNumberOverride(styleOverrideState.boxPadding, Number(preset.boxPadding !== undefined ? preset.boxPadding : 18));
      preset.boxPaddingX = preset.boxPadding;
      preset.boxPaddingY = preset.boxPadding;
      if (isBackplateEnabled(preset)) {
        preset.backplatePaddingX = preset.boxPadding;
        preset.backplatePaddingY = Math.max(0, Math.round(preset.boxPadding * 0.5));
        preset.lineBoxPaddingX = preset.backplatePaddingX;
        preset.lineBoxPaddingY = preset.backplatePaddingY;
      }
      if (preset.wordBoxEnabled) {
        preset.wordBoxPadding = preset.boxPadding;
        preset.wordBoxPaddingX = preset.boxPadding;
        preset.wordBoxPaddingY = preset.boxPadding;
      }
    }
    if (styleOverrideState.boxRoundness !== null) {
      preset.boxRoundness = coerceNumberOverride(styleOverrideState.boxRoundness, Number(preset.boxRoundness !== undefined ? preset.boxRoundness : 0));
      if (isBackplateEnabled(preset)) {
        preset.backplateRoundness = preset.boxRoundness;
        preset.lineBoxRoundness = preset.boxRoundness;
      }
      if (preset.wordBoxEnabled) {
        preset.wordBoxRoundness = preset.boxRoundness;
      }
    }
    if (styleOverrideState.boxOpacity !== null) {
      preset.boxOpacity = coerceNumberOverride(styleOverrideState.boxOpacity, Number(preset.boxOpacity !== undefined ? preset.boxOpacity : 80));
      if (isBackplateEnabled(preset)) {
        preset.backplateOpacity = preset.boxOpacity;
        preset.lineBoxOpacity = preset.boxOpacity;
      }
      if (preset.wordBoxEnabled) {
        preset.wordBoxOpacity = preset.boxOpacity;
      }
    }
    if (isBoxDisabledPreset(presetName)) {
      disableBoxFeaturesForVisiblePreset(preset);
    }
    return preset;
  }

  function getStyleOverridesPayload() {
    var payload = {};
    var font = getSelectedFontOverride();
    var boxDisabled = isBoxDisabledPreset(getValue("preset") || DEFAULT_PRESET_NAME);
    var effectivePreset = getEffectivePresetForPreview();
    if (font) {
      payload.font = font;
    }
    Object.keys(styleOverrideState).forEach(function (key) {
      if (boxDisabled && /^(box|wordBox)/.test(key) && !(effectivePreset && isBackplateEnabled(effectivePreset) && /^(boxPadding|boxRoundness|boxOpacity)$/.test(key))) {
        return;
      }
      var value = styleOverrideState[key];
      if (value === null || value === undefined) {
        return;
      }
      payload[key] = Array.isArray(value) ? value.slice() : value;
    });
    [
      "fontSize",
      "maxLines",
      "maxTextWidth",
      "blockScale",
      "leading",
      "tracking",
      "strokeWidth"
    ].forEach(function (key) {
      var value = effectivePreset ? Number(effectivePreset[key]) : NaN;
      if (!isNaN(value)) {
        payload[key] = key === "maxLines"
          ? Math.max(1, Math.min(4, Math.round(value)))
          : value;
      }
    });
    if (effectivePreset) {
      payload.strokeEnabled = !!effectivePreset.strokeEnabled;
      if (payload.strokeEnabled) {
        payload.strokeOverFill = false;
        payload.lineJoinType = "round";
      }
    }
    if (boxDisabled) {
      payload.boxEnabled = false;
      payload.boxSmart = false;
      payload.wordBoxEnabled = false;
      payload.backplateEnabled = false;
      payload.lineBoxEnabled = false;
    }
    var offsetX = Number(getValue("marginX") || 0);
    if (!isNaN(offsetX)) {
      payload.positionOffsetX = offsetX;
    }
    var offsetY = Number(getValue("marginY") || 180);
    if (!isNaN(offsetY)) {
      payload.marginY = offsetY;
      payload.verticalMarginY = offsetY;
    }
    if (effectivePreset && isBackplateEnabled(effectivePreset)) {
      payload.backplateEnabled = true;
      payload.backplateRenderMode = "precomp";
      payload.boxEnabled = false;
      payload.boxSmart = false;
      payload.wordBoxEnabled = false;
      payload.backplateColor = getBackplateColor(effectivePreset);
      if (styleOverrideState.boxPadding !== null) {
        payload.backplatePaddingX = effectivePreset.backplatePaddingX !== undefined ? effectivePreset.backplatePaddingX : effectivePreset.lineBoxPaddingX;
        payload.backplatePaddingY = effectivePreset.backplatePaddingY !== undefined ? effectivePreset.backplatePaddingY : effectivePreset.lineBoxPaddingY;
      }
      if (styleOverrideState.boxRoundness !== null) {
        payload.backplateRoundness = effectivePreset.backplateRoundness !== undefined ? effectivePreset.backplateRoundness : effectivePreset.lineBoxRoundness;
      }
      if (styleOverrideState.boxOpacity !== null) {
        payload.backplateOpacity = effectivePreset.backplateOpacity !== undefined ? effectivePreset.backplateOpacity : effectivePreset.lineBoxOpacity;
      }
    }
    return payload;
  }

  function getMaxLinesControlValue() {
    var value = maxLinesControlEl ? Number(maxLinesControlEl.value) : Number(STANDARD_READABILITY_DEFAULTS.maxLines);
    if (isNaN(value)) {
      value = Number(STANDARD_READABILITY_DEFAULTS.maxLines) || 2;
    }
    return Math.max(1, Math.min(4, Math.round(value)));
  }

  function getVisualChunkWordLimit(maxLines) {
    var preset = getEffectivePresetForPreview();
    var lineCount = Math.max(1, Math.min(4, Math.round(Number(maxLines) || getMaxLinesControlValue())));
    var presetMax = preset && preset.chunkMaxWords !== undefined ? Number(preset.chunkMaxWords) : NaN;
    var fallback = lineCount * 3;
    var value = !isNaN(presetMax) && presetMax > 0 ? Math.min(presetMax, fallback) : fallback;
    return Math.max(lineCount, Math.min(12, Math.round(value)));
  }

  function refreshControlAvailability() {
    toggleSliderFieldState(strokeWidthControlEl, strokeEnabledControlEl ? !strokeEnabledControlEl.checked : false);
    var preset = getPresetPreviewConfig(getValue("preset") || DEFAULT_PRESET_NAME);
    var hasBackgroundControls = !!(
      (boxEnabledControlEl && boxEnabledControlEl.checked) ||
      (lineBoxEnabledControlEl && lineBoxEnabledControlEl.checked) ||
      (preset && (preset.wordBoxEnabled || preset.backplateEnabled))
    );
    toggleSliderFieldState(boxPaddingControlEl, !hasBackgroundControls);
    toggleSliderFieldState(boxRoundnessControlEl, !hasBackgroundControls);
    toggleSliderFieldState(boxOpacityControlEl, !hasBackgroundControls);
    if (boxSmartControlEl) {
      boxSmartControlEl.disabled = boxEnabledControlEl ? !boxEnabledControlEl.checked : false;
      var smartWrap = boxSmartControlEl.closest ? boxSmartControlEl.closest(".check-control") : null;
      if (smartWrap && smartWrap.classList) {
        smartWrap.classList.toggle("is-disabled", !!boxSmartControlEl.disabled);
      }
    }
  }

  function buildStyleToken(label, hex, options) {
    options = options || {};
    var classes = ["style-token"];
    if (options.editable) {
      classes.push("editable");
    }
    var swatchClasses = ["style-token-swatch"];
    if (options.kind) {
      swatchClasses.push(options.kind);
    }
    var attrs = [];
    if (options.editable) {
      attrs.push('type="button"');
      attrs.push('data-style-token="' + escapeHtml(options.token || "") + '"');
    }
    var alphaStyle = "";
    if (typeof options.alpha === "number" && !isNaN(options.alpha)) {
      alphaStyle = "--token-alpha:" + Math.max(0, Math.min(1, options.alpha)).toFixed(3) + ";";
    }
    var tag = options.editable ? "button" : "div";
    return (
      "<" + tag + " " + attrs.join(" ") + ' class="' + classes.join(" ") + '">' +
      '<span class="' + swatchClasses.join(" ") + '" style="--token-color:' + hex + ";" + alphaStyle + '"></span>' +
      '<span class="style-token-meta">' +
      '<span class="style-token-label">' + escapeHtml(label) + "</span>" +
      '<span class="style-token-value">' + escapeHtml(hex) + "</span>" +
      "</span>" +
      "</" + tag + ">"
    );
  }

  function updateStylePalette(preset) {
    if (!stylePaletteEl) {
      return;
    }
    if (activeStyleColorToken === "boxColor" && !(preset && (preset.boxEnabled || preset.wordBoxEnabled))) {
      activeStyleColorToken = "accentColor";
      styleOverrideState.boxColor = null;
    }
    var fillHex = rgbArrayToHex(preset.fillColor || [1, 1, 1]);
    var accentHex = rgbArrayToHex(preset.accentColor || preset.fillColor || [1, 1, 1]);
    var strokeHex = rgbArrayToHex(preset.strokeColor || [0, 0, 0]);
    var lineBoxHex = rgbArrayToHex(getBackplateColor(preset));
    var boxHex = rgbArrayToHex(preset.boxColor || [0, 0, 0]);
    var shadowHex = rgbArrayToHex(preset.shadowColor || [0, 0, 0]);
    var html = [];
    html.push(buildStyleToken("Accent", accentHex, { editable: true, token: "accentColor" }));
    html.push(buildStyleToken("Fill", fillHex, { editable: true, token: "fillColor" }));
    if (preset.strokeEnabled) {
      html.push(buildStyleToken("Stroke", strokeHex, { kind: "stroke", editable: true, token: "strokeColor" }));
    } else {
      html.push(buildStyleToken("Stroke", strokeHex, { kind: "stroke", editable: true, token: "strokeColor", alpha: 0.18 }));
    }
    if (preset.shadowEnabled) {
      var shadowAlpha = Math.max(0, Math.min(1, Number(preset.shadowOpacity !== undefined ? preset.shadowOpacity : 60) / 100));
      html.push(buildStyleToken("Shadow", shadowHex, { editable: true, token: "shadowColor", alpha: shadowAlpha }));
    } else {
      html.push(buildStyleToken("Shadow", shadowHex, { editable: true, token: "shadowColor", alpha: 0.12 }));
    }
    if (isBackplateEnabled(preset)) {
      var lineBoxAlpha = Math.max(0, Math.min(1, Number(preset.backplateOpacity !== undefined ? preset.backplateOpacity : (preset.lineBoxOpacity !== undefined ? preset.lineBoxOpacity : 100)) / 100));
      html.push(buildStyleToken("Backplate", lineBoxHex, { kind: "box", alpha: lineBoxAlpha, editable: true, token: "lineBoxColor" }));
    }
    if (preset.boxEnabled || preset.wordBoxEnabled) {
      var boxAlpha = Math.max(0, Math.min(1, Number(preset.boxOpacity !== undefined ? preset.boxOpacity : 100) / 100));
      if (preset.wordBoxEnabled) {
        boxHex = rgbArrayToHex(preset.wordBoxColor || preset.accentColor || [0.22, 0.63, 1]);
        boxAlpha = Math.max(0, Math.min(1, Number(preset.wordBoxOpacity !== undefined ? preset.wordBoxOpacity : 100) / 100));
      }
      html.push(buildStyleToken("Box", boxHex, { kind: "box", alpha: boxAlpha, editable: true, token: "boxColor" }));
    }
    stylePaletteEl.innerHTML = html.join("");
  }

  function getResolvedPreviewFont(preset) {
    var override = getSelectedFontOverride();
    if (override) {
      return findFontEntryByPostScript(override) || {
        postScriptName: override,
        familyName: override,
        styleName: "",
        fullName: override
      };
    }
    var presetFont = preset && preset.font ? String(preset.font) : "";
    return findFontEntryByPostScript(presetFont) || {
      postScriptName: presetFont,
      familyName: presetFont,
      styleName: "",
      fullName: presetFont
    };
  }

  function getPreviewCssFamily(fontInfo) {
    var fullName = String((fontInfo && fontInfo.fullName) || "").trim();
    var family = String((fontInfo && (fontInfo.familyName || fontInfo.postScriptName || fontInfo.fullName)) || "").trim();
    var postScript = String((fontInfo && fontInfo.postScriptName) || "").trim();
    var families = [];
    if (fullName) {
      families.push('"' + fullName.replace(/"/g, '\\"') + '"');
    }
    if (family) {
      families.push('"' + family.replace(/"/g, '\\"') + '"');
    }
    if (postScript && postScript !== family) {
      families.push('"' + postScript.replace(/"/g, '\\"') + '"');
    }
    families.push('"Helvetica Neue"', '"Segoe UI"', "sans-serif");
    return families.join(", ");
  }

  function getFontEntryLabel(entry) {
    if (!entry) {
      return "Preset default";
    }
    var title = String(entry.fullName || entry.familyName || entry.postScriptName || "Custom");
    if (entry.styleName && title.toLowerCase().indexOf(String(entry.styleName).toLowerCase()) === -1) {
      title += " — " + entry.styleName;
    }
    return title;
  }

  function getFontPickerSampleText() {
    return "Кадр за кадром · Aa Bb 123";
  }

  function getPresetPickerMeta(preset) {
    if (!preset) {
      return "preset";
    }
    var parts = [];
    if (preset.font) {
      parts.push(String(preset.font));
    }
    if (isBackplateEnabled(preset)) {
      parts.push("backplate");
    } else if (preset.forceTwoLines) {
      parts.push("2 lines");
    } else if (preset.karaokeEnabled) {
      parts.push("karaoke");
    } else if (preset.boxEnabled) {
      parts.push("boxed");
    } else if (preset.strokeEnabled) {
      parts.push("stroke");
    } else {
      parts.push("clean");
    }
    return parts.join(" · ");
  }

  function getPresetPickerPreviewCopy(presetName, preset) {
    if (!preset) {
      return "Caption style preset.";
    }
    if (preset.wordBoxEnabled) {
      return "Active word pill with karaoke timing.";
    }
    if (isBackplateEnabled(preset)) {
      return "Precomp-backed caption plates that wrap each line.";
    }
    if (presetName === "static_marker_karaoke") {
      return "Static marker text with active word color only.";
    }
    if (preset.karaokeEnabled && preset.shadowEnabled) {
      return "Active word highlight with softened shadow.";
    }
    if (preset.boxEnabled && preset.forceUppercase) {
      return "Bold uppercase caption with compact box.";
    }
    if (preset.forceTwoLines) {
      return "Locked into two compact lines.";
    }
    if (preset.shadowEnabled && !preset.strokeEnabled) {
      return "Clean white text with blurred drop shadow.";
    }
    if (!preset.strokeEnabled && !preset.boxEnabled) {
      return presetName === "clean_paragraph"
        ? "Paragraph-style clean caption without border."
        : "Clean white text without extra accent noise.";
    }
    if (preset.strokeEnabled && !preset.boxEnabled) {
      return "Bold caption with readable stroke and accent.";
    }
    return "Styled caption preset ready for quick tweaking.";
  }

  function getOutputModePickerLabel(modeValue) {
    return String(modeValue || "layers") === "single_keys" ? "Single Keys" : "Layers";
  }

  function getOutputModePickerPreview(modeValue) {
    return String(modeValue || "layers") === "single_keys"
      ? "One subtitle layer driven by Source Text and transform keyframes."
      : "Separate subtitle layers for each caption item.";
  }

  function setOutputModePickerOpen(isOpen) {
    if (!outputModePickerButtonEl || !outputModePickerMenuEl) {
      return;
    }
    outputModePickerMenuEl.classList.toggle("hidden", !isOpen);
    outputModePickerButtonEl.classList.toggle("open", !!isOpen);
    outputModePickerButtonEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      positionFloatingPickerMenu(outputModePickerButtonEl, outputModePickerMenuEl);
    }
  }

  function pulsePickerButton(buttonEl, options) {
    if (!buttonEl) {
      return;
    }
    var opts = options || {};
    var openingMs = Number(opts.openingMs !== undefined ? opts.openingMs : 260);
    var pressingMs = Number(opts.pressingMs !== undefined ? opts.pressingMs : 140);
    buttonEl.classList.add("is-pressing");
    if (opts.opening !== false) {
      buttonEl.classList.add("is-opening");
    }
    setTimeout(function () {
      buttonEl.classList.remove("is-pressing");
    }, pressingMs);
    setTimeout(function () {
      buttonEl.classList.remove("is-opening");
    }, openingMs);
  }

  function updateOutputModePickerDisplay() {
    if (!outputModePickerLabelEl || !outputModePickerPreviewEl) {
      return;
    }
    var modeValue = String(getValue("outputMode") || "layers");
    outputModePickerLabelEl.textContent = getOutputModePickerLabel(modeValue);
    outputModePickerPreviewEl.textContent = getOutputModePickerPreview(modeValue);
  }

  function renderOutputModePickerMenu() {
    if (!outputModePickerMenuEl || !outputModeSelectEl || !outputModeSelectEl.options) {
      return;
    }
    var currentValue = String(getValue("outputMode") || "layers");
    outputModePickerMenuEl.innerHTML = "";
    for (var i = 0; i < outputModeSelectEl.options.length; i++) {
      var option = outputModeSelectEl.options[i];
      var value = String(option.value || "");
      if (!value) {
        continue;
      }
      outputModePickerMenuEl.appendChild(
        buildPresetPickerOption(
          value,
          getOutputModePickerLabel(value),
          { displayName: getOutputModePickerLabel(value), font: "", strokeEnabled: false, boxEnabled: false, shadowEnabled: false, forceUppercase: false, wordBoxEnabled: false, karaokeEnabled: false, fillColor: [1, 1, 1], maxTextWidth: 260, fontSize: 44, tracking: -1, leading: 48 },
          currentValue === value
        )
      );
      var last = outputModePickerMenuEl.lastChild;
      if (last) {
        var sample = last.querySelector(".font-picker-option-sample");
        if (sample) {
          sample.textContent = getOutputModePickerPreview(value);
        }
        var visual = last.querySelector(".preset-picker-visual");
        if (visual) {
          visual.parentNode.removeChild(visual);
        }
      }
    }
    updateOutputModePickerDisplay();
  }

  function getLanguagePickerLabel(langValue) {
    var value = String(langValue || "auto").toLowerCase();
    if (value === "en") return "English";
    if (value === "uk") return "Ukrainian";
    if (value === "es") return "Spanish";
    if (value === "hinglish") return "Indo-English";
    return "Auto";
  }

  function getLanguagePickerPreview(langValue) {
    var value = String(langValue || "auto").toLowerCase();
    if (value === "en") return "Force English transcription.";
    if (value === "uk") return "Force Ukrainian transcription.";
    if (value === "es") return "Force Spanish transcription.";
    if (value === "hinglish") return "Hindi + English mix, output as Latin letters.";
    return "Detect language from the audio automatically.";
  }

  function setLanguagePickerOpen(isOpen) {
    if (!languagePickerButtonEl || !languagePickerMenuEl) {
      return;
    }
    languagePickerMenuEl.classList.toggle("hidden", !isOpen);
    languagePickerButtonEl.classList.toggle("open", !!isOpen);
    languagePickerButtonEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      positionFloatingPickerMenu(languagePickerButtonEl, languagePickerMenuEl);
    }
  }

  function updateLanguagePickerDisplay() {
    if (!languagePickerLabelEl || !languagePickerPreviewEl) {
      return;
    }
    var langValue = String(getValue("language") || "auto");
    languagePickerLabelEl.textContent = getLanguagePickerLabel(langValue);
    languagePickerPreviewEl.textContent = getLanguagePickerPreview(langValue);
  }

  function renderLanguagePickerMenu() {
    if (!languagePickerMenuEl || !languageSelectEl || !languageSelectEl.options) {
      return;
    }
    var currentValue = String(getValue("language") || "auto");
    languagePickerMenuEl.innerHTML = "";
    for (var i = 0; i < languageSelectEl.options.length; i++) {
      var option = languageSelectEl.options[i];
      var value = String(option.value || "");
      if (!value) {
        continue;
      }
      var button = buildPresetPickerOption(
        value,
        getLanguagePickerLabel(value),
        { displayName: getLanguagePickerLabel(value), font: "", strokeEnabled: false, boxEnabled: false, shadowEnabled: false, forceUppercase: false, wordBoxEnabled: false, karaokeEnabled: false, fillColor: [1, 1, 1], maxTextWidth: 260, fontSize: 44, tracking: -1, leading: 48 },
        currentValue === value
      );
      var sample = button.querySelector(".font-picker-option-sample");
      if (sample) {
        sample.textContent = getLanguagePickerPreview(value);
      }
      var visual = button.querySelector(".preset-picker-visual");
      if (visual) {
        visual.parentNode.removeChild(visual);
      }
      languagePickerMenuEl.appendChild(button);
    }
    updateLanguagePickerDisplay();
  }

  function setPresetPickerOpen(isOpen) {
    if (!presetPickerButtonEl || !presetPickerMenuEl) {
      return;
    }
    presetPickerMenuEl.classList.toggle("hidden", !isOpen);
    presetPickerButtonEl.classList.toggle("open", !!isOpen);
    presetPickerButtonEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      positionFloatingPickerMenu(presetPickerButtonEl, presetPickerMenuEl);
    }
  }

  function updatePresetPickerDisplay() {
    if (!presetPickerLabelEl || !presetPickerPreviewEl) {
      return;
    }
    var presetName = String(getValue("preset") || DEFAULT_PRESET_NAME);
    var preset = getPresetPreviewConfig(presetName);
    presetPickerLabelEl.textContent = getPresetDisplayLabel(presetName);
    presetPickerPreviewEl.textContent = getPresetPickerPreviewCopy(presetName, preset);
  }

  function getPresetPickerSampleText(presetName, preset) {
    if (!preset) {
      return "I know what this means.";
    }
    if (preset.wordBoxEnabled) {
      return "You found your home.";
    }
    if (isBackplateEnabled(preset)) {
      return "I see two men right now";
    }
    if (presetName === "static_marker_karaoke") {
      return "We will guide you through a specific sequence";
    }
    if (preset.forceTwoLines) {
      return "Stay with me";
    }
    if (preset.boxEnabled && preset.forceUppercase) {
      return "NEVER LOOK BACK";
    }
    if (preset.karaokeEnabled && preset.shadowEnabled) {
      return "we keep moving";
    }
    if (preset.shadowEnabled && !preset.strokeEnabled) {
      return "Hold on to this.";
    }
    if (presetName === "clean_paragraph") {
      return "I can hear you clearly.";
    }
    return "This feels right.";
  }

  function buildPresetPickerVisual(presetName, preset) {
    var visual = document.createElement("span");
    visual.className = "preset-picker-visual";

    var caption = document.createElement("span");
    caption.className = "preset-picker-caption";

    var textEl = document.createElement("span");
    textEl.className = "preset-picker-caption-text";

    var fontInfo = getResolvedPreviewFont(preset);
    var fontSize = Math.max(14, Math.min(22, Math.round((Number(preset.fontSize) || 60) * 0.28)));
    var strokeWidth = Math.max(0, Math.min(8, Math.round((Number(preset.strokeWidth) || 0) * 0.28)));
    var sampleText = getPresetPickerSampleText(presetName, preset);
    var layout = buildPreviewTextLayout(sampleText, preset, fontInfo, fontSize, strokeWidth, {
      captionMaxWidth: 220,
      minFontSize: Math.max(1, Math.round(fontSize * 0.82))
    });

    textEl.innerHTML = buildPreviewTextHtml(layout);
    applyPreviewTextStyles(textEl, preset, fontInfo, layout.fontSize || fontSize, strokeWidth);
    textEl.style.maxWidth = Math.round(layout.textMaxWidth || getPreviewTextMaxWidth(preset, 220)) + "px";
    applyPreviewAccentStyles(textEl, preset);
    applyPreviewCaptionSurface(caption, preset, 0.72);

    caption.appendChild(textEl);
    visual.appendChild(caption);
    return visual;
  }

  function buildPresetPickerOption(value, label, preset, isCurrent) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "font-picker-option preset-picker-option" + (isCurrent ? " current" : "");
    button.setAttribute("data-preset-value", value || "");

    var top = document.createElement("span");
    top.className = "font-picker-option-top";

    var name = document.createElement("span");
    name.className = "font-picker-option-name";
    name.textContent = label || value || "Preset";

    var meta = document.createElement("span");
    meta.className = "font-picker-option-meta";
    meta.textContent = getPresetPickerMeta(preset);

    var sample = document.createElement("span");
    sample.className = "font-picker-option-sample";
    sample.textContent = getPresetPickerPreviewCopy(value, preset);

    top.appendChild(name);
    top.appendChild(meta);
    button.appendChild(top);
    button.appendChild(buildPresetPickerVisual(value, preset));
    button.appendChild(sample);
    return button;
  }

  function renderPresetPickerMenu() {
    if (!presetPickerMenuEl || !presetSelectEl || !presetSelectEl.options) {
      return;
    }
    var currentValue = String(getValue("preset") || DEFAULT_PRESET_NAME);
    presetPickerMenuEl.innerHTML = "";
    for (var i = 0; i < presetSelectEl.options.length; i++) {
      var option = presetSelectEl.options[i];
      var value = String(option.value || "");
      if (!value) {
        continue;
      }
      var label = String(option.textContent || option.label || value);
      var preset = getPresetPreviewConfig(value);
      presetPickerMenuEl.appendChild(
        buildPresetPickerOption(value, label, preset, currentValue === value)
      );
    }
    updatePresetPickerDisplay();
  }

  function setFontPickerOpen(isOpen) {
    if (!fontPickerButtonEl || !fontPickerMenuEl) {
      return;
    }
    if (isOpen && (isFontCatalogLoading || !fontCatalogReady || !fontCatalogVerifiedThisSession)) {
      renderFontPickerLoadingState(fontPickerPreviewEl && fontPickerPreviewEl.dataset.loadingMessage);
    }
    fontPickerMenuEl.classList.toggle("hidden", !isOpen);
    fontPickerButtonEl.classList.toggle("open", !!isOpen);
    fontPickerButtonEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      positionFloatingPickerMenu(fontPickerButtonEl, fontPickerMenuEl);
    }
  }

  function positionFloatingPickerMenu(buttonEl, menuEl) {
    if (!buttonEl || !menuEl || menuEl.classList.contains("hidden")) {
      return;
    }
    var rect = buttonEl.getBoundingClientRect ? buttonEl.getBoundingClientRect() : null;
    if (!rect) {
      return;
    }
    var viewportWidth = Math.max(280, window.innerWidth || document.documentElement.clientWidth || 360);
    var viewportHeight = Math.max(360, window.innerHeight || document.documentElement.clientHeight || 640);
    var gutter = 10;
    var width = Math.max(220, Math.min(rect.width, viewportWidth - (gutter * 2)));
    var left = Math.max(gutter, Math.min(rect.left, viewportWidth - width - gutter));
    var belowTop = rect.bottom + 8;
    var belowSpace = viewportHeight - belowTop - gutter;
    var aboveSpace = rect.top - gutter - 8;
    var openAbove = belowSpace < 180 && aboveSpace > belowSpace;
    var maxHeight = Math.max(160, Math.min(360, (openAbove ? aboveSpace : belowSpace)));
    var top = openAbove
      ? Math.max(gutter, rect.top - maxHeight - 8)
      : Math.min(belowTop, viewportHeight - maxHeight - gutter);

    menuEl.classList.add("floating-picker-menu");
    menuEl.style.left = Math.round(left) + "px";
    menuEl.style.top = Math.round(top) + "px";
    menuEl.style.width = Math.round(width) + "px";
    menuEl.style.maxHeight = Math.round(maxHeight) + "px";
  }

  function repositionOpenPickerMenus() {
    if (fontPickerButtonEl && fontPickerMenuEl && !fontPickerMenuEl.classList.contains("hidden")) {
      positionFloatingPickerMenu(fontPickerButtonEl, fontPickerMenuEl);
    }
    if (presetPickerButtonEl && presetPickerMenuEl && !presetPickerMenuEl.classList.contains("hidden")) {
      positionFloatingPickerMenu(presetPickerButtonEl, presetPickerMenuEl);
    }
    if (outputModePickerButtonEl && outputModePickerMenuEl && !outputModePickerMenuEl.classList.contains("hidden")) {
      positionFloatingPickerMenu(outputModePickerButtonEl, outputModePickerMenuEl);
    }
    if (languagePickerButtonEl && languagePickerMenuEl && !languagePickerMenuEl.classList.contains("hidden")) {
      positionFloatingPickerMenu(languagePickerButtonEl, languagePickerMenuEl);
    }
  }

  function setFontPickerLoading(isLoading, message) {
    isFontCatalogLoading = !!isLoading;
    if (fontPickerButtonEl) {
      fontPickerButtonEl.classList.toggle("is-loading", !!isLoading);
      fontPickerButtonEl.setAttribute("aria-busy", isLoading ? "true" : "false");
    }
    if (fontPickerSpinnerEl) {
      fontPickerSpinnerEl.classList.toggle("hidden", !isLoading);
    }
    if (fontPickerPreviewEl && isLoading) {
      fontPickerPreviewEl.dataset.loadingMessage = String(message || "Loading fonts from AE...");
    } else if (fontPickerPreviewEl) {
      delete fontPickerPreviewEl.dataset.loadingMessage;
    }
    updateFontPickerDisplay();
  }

  function updateFontPickerDisplay() {
    if (!fontPickerLabelEl || !fontPickerPreviewEl) {
      return;
    }
    var preset = getPresetPreviewConfig(getValue("preset") || DEFAULT_PRESET_NAME);
    var fontInfo = getResolvedPreviewFont(preset);
    var fontLabel = getSelectedFontOverride() ? getFontEntryLabel(fontInfo) : "Preset default";
    fontPickerLabelEl.textContent = fontLabel;
    if (isFontCatalogLoading) {
      fontPickerPreviewEl.textContent = fontPickerPreviewEl.dataset.loadingMessage || "Loading fonts from AE...";
    } else {
      fontPickerPreviewEl.textContent = getSelectedFontOverride()
        ? getFontPickerSampleText()
        : ("Uses " + (preset.font || "preset font"));
    }
    fontPickerPreviewEl.style.fontFamily = getPreviewCssFamily(fontInfo);
    var previewFontStyleName = fontInfo && (fontInfo.styleName || fontInfo.postScriptName || fontInfo.fullName);
    fontPickerPreviewEl.style.fontWeight = mapFontWeight(previewFontStyleName);
    fontPickerPreviewEl.style.fontStyle = mapFontStyle(previewFontStyleName, preset);
  }

  function renderFontPickerLoadingState(message) {
    if (!fontPickerMenuEl) {
      return;
    }
    var loadingMessage = String(message || "Loading fonts from AE...");
    fontPickerMenuEl.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.className = "font-picker-loading";
    wrap.setAttribute("role", "status");
    wrap.setAttribute("aria-live", "polite");

    var orb = document.createElement("div");
    orb.className = "font-picker-loading-orb";

    var face = document.createElement("div");
    face.className = "font-picker-loading-face";
    face.innerHTML = '<span class="font-picker-loading-eye"></span><span class="font-picker-loading-eye"></span><span class="font-picker-loading-mouth"></span>';
    orb.appendChild(face);

    var title = document.createElement("div");
    title.className = "font-picker-loading-title";
    title.textContent = "Fonts are loading";

    var body = document.createElement("div");
    body.className = "font-picker-loading-body";
    body.textContent = loadingMessage;

    var shimmer = document.createElement("div");
    shimmer.className = "font-picker-loading-shimmer";
    shimmer.innerHTML =
      '<span class="font-picker-loading-line short"></span>' +
      '<span class="font-picker-loading-line"></span>' +
      '<span class="font-picker-loading-line tiny"></span>';

    wrap.appendChild(orb);
    wrap.appendChild(title);
    wrap.appendChild(body);
    wrap.appendChild(shimmer);
    fontPickerMenuEl.appendChild(wrap);
  }

  function buildFontPickerOption(value, entry, metaLabel, isCurrent, preset) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "font-picker-option" + (isCurrent ? " current" : "");
    button.setAttribute("data-font-value", value || "");

    var top = document.createElement("span");
    top.className = "font-picker-option-top";

    var name = document.createElement("span");
    name.className = "font-picker-option-name";
    name.textContent = value ? getFontEntryLabel(entry) : "Preset default";

    var meta = document.createElement("span");
    meta.className = "font-picker-option-meta";
    meta.textContent = metaLabel || "";

    top.appendChild(name);
    top.appendChild(meta);

    var sample = document.createElement("span");
    sample.className = "font-picker-option-sample";
    sample.textContent = getFontPickerSampleText();

    var fontInfo = entry || getResolvedPreviewFont(preset);
    var previewFontStyleName = fontInfo && (fontInfo.styleName || fontInfo.postScriptName || fontInfo.fullName);
    sample.style.fontFamily = getPreviewCssFamily(fontInfo);
    sample.style.fontWeight = mapFontWeight(previewFontStyleName);
    sample.style.fontStyle = mapFontStyle(previewFontStyleName, preset);
    name.style.fontFamily = getPreviewCssFamily(fontInfo);
    name.style.fontWeight = mapFontWeight(previewFontStyleName);
    name.style.fontStyle = mapFontStyle(previewFontStyleName, preset);

    button.appendChild(top);
    button.appendChild(sample);
    return button;
  }

  function renderFontPickerMenu() {
    if (!fontPickerMenuEl || !fontSelectEl) {
      return;
    }
    if (isFontCatalogLoading && (!fontCatalogReady || !fontCatalogVerifiedThisSession)) {
      renderFontPickerLoadingState(fontPickerPreviewEl && fontPickerPreviewEl.dataset.loadingMessage);
      return;
    }
    var currentValue = getSelectedFontOverride();
    var preset = getPresetPreviewConfig(getValue("preset") || DEFAULT_PRESET_NAME);
    fontPickerMenuEl.innerHTML = "";
    fontPickerMenuEl.appendChild(
      buildFontPickerOption("", findFontEntryByPostScript(String((preset && preset.font) || "")), preset.font || "preset", !currentValue, preset)
    );
    for (var i = 0; i < previewFontEntries.length; i++) {
      var entry = previewFontEntries[i];
      var value = String(entry.postScriptName || "");
      if (!value) {
        continue;
      }
      fontPickerMenuEl.appendChild(
        buildFontPickerOption(value, entry, entry.styleName || "font", currentValue === value, preset)
      );
    }
    updateFontPickerDisplay();
  }

  function sanitizePreviewQuote(value) {
    var text = String(value || "")
      .replace(/\s+/g, " ")
      .replace(/^"+|"+$/g, "")
      .trim();
    if (!text) {
      return "";
    }
    return text;
  }

  function getPreviewFallbackQuotesForLanguage(languageValue) {
    var key = String(languageValue || "auto").toLowerCase();
    return previewFallbackQuotes[key] || previewFallbackQuotes.auto;
  }

  function readTranscriptPreviewSamples() {
    if (!hasNodeBridge || !fs) {
      return [];
    }
    try {
      var subtitlesPath = getDefaultSubtitlesPath();
      if (!subtitlesPath || !fileExists(subtitlesPath)) {
        previewTranscriptCache = { path: subtitlesPath || "", mtimeMs: 0, samples: [] };
        return [];
      }
      var stats = fs.statSync(subtitlesPath);
      var mtimeMs = Number(stats && stats.mtimeMs) || 0;
      if (
        previewTranscriptCache.path === subtitlesPath &&
        previewTranscriptCache.mtimeMs === mtimeMs &&
        previewTranscriptCache.samples &&
        previewTranscriptCache.samples.length
      ) {
        return previewTranscriptCache.samples.slice();
      }
      var raw = fs.readFileSync(subtitlesPath, "utf8");
      var parsed = JSON.parse(raw);
      var items = parsed && Array.isArray(parsed.items) ? parsed.items : [];
      var seen = {};
      var samples = [];
      for (var i = 0; i < items.length; i++) {
        var item = items[i] || {};
        var text = "";
        if (Array.isArray(item.lines) && item.lines.length) {
          text = item.lines.join(" ");
        } else {
          text = item.text || "";
        }
        text = sanitizePreviewQuote(text);
        if (!text || text.length < 6 || seen[text]) {
          continue;
        }
        seen[text] = true;
        samples.push(text);
        if (samples.length >= 24) {
          break;
        }
      }
      previewTranscriptCache = {
        path: subtitlesPath,
        mtimeMs: mtimeMs,
        samples: samples.slice()
      };
      return samples;
    } catch (_err) {
      return [];
    }
  }

  function readSubtitlesPayload() {
    if (!hasNodeBridge || !fs) {
      return null;
    }
    try {
      var subtitlesPath = getDefaultSubtitlesPath();
      if (!subtitlesPath || !fileExists(subtitlesPath)) {
        return null;
      }
      return JSON.parse(fs.readFileSync(subtitlesPath, "utf8"));
    } catch (_err) {
      return null;
    }
  }

  function getReferenceText() {
    return referenceTextEl ? String(referenceTextEl.value || "").replace(/\s+/g, " ").trim() : "";
  }

  function getReferenceTokens(referenceText) {
    return String(referenceText || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  }

  function normalizeReferenceToken(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9а-яіїєґñáéíóúü]+/gi, "")
      .trim();
  }

  function referenceEditDistance(a, b) {
    a = normalizeReferenceToken(a);
    b = normalizeReferenceToken(b);
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;
    var prev = [];
    var curr = [];
    for (var j = 0; j <= b.length; j++) {
      prev[j] = j;
    }
    for (var i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var cost = a.charAt(i - 1) === b.charAt(k - 1) ? 0 : 1;
        curr[k] = Math.min(
          prev[k] + 1,
          curr[k - 1] + 1,
          prev[k - 1] + cost
        );
      }
      var tmp = prev;
      prev = curr;
      curr = tmp;
    }
    return prev[b.length];
  }

  function referenceTokenSimilarity(sourceToken, referenceToken) {
    var source = normalizeReferenceToken(sourceToken);
    var reference = normalizeReferenceToken(referenceToken);
    if (!source || !reference) return 0;
    if (source === reference) return 1;
    if (source.length <= 2 || reference.length <= 2) {
      return source.charAt(0) === reference.charAt(0) ? 0.42 : 0;
    }
    var maxLen = Math.max(source.length, reference.length);
    var editScore = 1 - (referenceEditDistance(source, reference) / Math.max(1, maxLen));
    var prefixScore = source.charAt(0) === reference.charAt(0) ? 0.12 : 0;
    if (source.indexOf(reference) === 0 || reference.indexOf(source) === 0) {
      prefixScore += 0.16;
    }
    return Math.max(0, Math.min(1, editScore + prefixScore));
  }

  function getItemSourceWordSlots(item, itemIndex) {
    var slots = [];
    if (item && Array.isArray(item.words) && item.words.length) {
      for (var i = 0; i < item.words.length; i++) {
        var word = item.words[i] || {};
        var text = String(word.text || "").trim();
        if (!text) continue;
        slots.push({
          itemIndex: itemIndex,
          text: text,
          start: Number(word.start),
          end: Number(word.end)
        });
      }
    }
    if (!slots.length) {
      var textValue = item && (item.text || (Array.isArray(item.lines) ? item.lines.join(" ") : ""));
      var words = String(textValue || "").trim().split(/\s+/).filter(Boolean);
      var approx = approximateReferenceWords(words, item.start, item.end);
      for (var j = 0; j < approx.length; j++) {
        slots.push({
          itemIndex: itemIndex,
          text: approx[j].text,
          start: approx[j].start,
          end: approx[j].end
        });
      }
    }
    return slots;
  }

  function alignReferenceTokensToSource(sourceSlots, referenceTokens) {
    var n = sourceSlots.length;
    var m = referenceTokens.length;
    if (!n || !m) return [];

    var gapSourcePenalty = -0.42;
    var gapReferencePenalty = -0.58;
    var dp = new Array(n + 1);
    var back = new Array(n + 1);
    for (var i = 0; i <= n; i++) {
      dp[i] = new Array(m + 1);
      back[i] = new Array(m + 1);
    }
    dp[0][0] = 0;
    back[0][0] = null;
    for (var si = 1; si <= n; si++) {
      dp[si][0] = dp[si - 1][0] + gapSourcePenalty;
      back[si][0] = "delete";
    }
    for (var rj = 1; rj <= m; rj++) {
      dp[0][rj] = dp[0][rj - 1] + gapReferencePenalty;
      back[0][rj] = "insert";
    }

    for (var s = 1; s <= n; s++) {
      for (var r = 1; r <= m; r++) {
        var sim = referenceTokenSimilarity(sourceSlots[s - 1].text, referenceTokens[r - 1]);
        var matchScore = sim >= 0.72 ? 1.2 : (sim >= 0.46 ? 0.42 : -0.18);
        var best = dp[s - 1][r - 1] + matchScore;
        var op = "match";
        var delScore = dp[s - 1][r] + gapSourcePenalty;
        if (delScore > best) {
          best = delScore;
          op = "delete";
        }
        var insScore = dp[s][r - 1] + gapReferencePenalty;
        if (insScore > best) {
          best = insScore;
          op = "insert";
        }
        dp[s][r] = best;
        back[s][r] = op;
      }
    }

    var ops = [];
    var x = n;
    var y = m;
    while (x > 0 || y > 0) {
      var step = back[x][y];
      if (step === "match") {
        ops.push({
          type: "match",
          sourceIndex: x - 1,
          referenceIndex: y - 1,
          similarity: referenceTokenSimilarity(sourceSlots[x - 1].text, referenceTokens[y - 1])
        });
        x--;
        y--;
      } else if (step === "delete") {
        ops.push({ type: "delete", sourceIndex: x - 1 });
        x--;
      } else {
        ops.push({ type: "insert", referenceIndex: y - 1, afterSourceIndex: x - 1 });
        y--;
      }
    }
    ops.reverse();
    return ops;
  }

  function makeReferenceGapCaption(tokens, start, end, reason) {
    var safeStart = Number(start);
    var safeEnd = Number(end);
    if (isNaN(safeStart)) safeStart = 0;
    if (!(safeEnd > safeStart)) safeEnd = safeStart + 0.35;
    var text = tokens.join(" ");
    return {
      id: "ref_gap_" + Math.round(safeStart * 1000) + "_" + Math.round(safeEnd * 1000),
      start: Math.round(safeStart * 1000) / 1000,
      end: Math.round(safeEnd * 1000) / 1000,
      text: text,
      lines: splitReferenceCaptionLines(text, Number(getValue("maxChars") || 42), 2),
      words: approximateReferenceWords(tokens, safeStart, safeEnd),
      referenceTextApplied: true,
      referenceTextSynthetic: true,
      referenceTextReason: reason || "missing_whisper_gap"
    };
  }

  function makeReferenceTimedCaption(entries, start, end, reason) {
    var tokens = [];
    for (var i = 0; i < entries.length; i++) {
      if (entries[i] && entries[i].text) {
        tokens.push(entries[i].text);
      }
    }
    var item = makeReferenceGapCaption(tokens, start, end, reason || "reference_overflow_split");
    item.referenceTextSynthetic = false;
    item.referenceTextApplied = true;
    item.referenceTextSource = "reference";
    item.referenceTextSplit = true;
    item.words = buildAlignedReferenceWords(entries, item);
    return item;
  }

  function splitReferenceAssignmentChunks(entries, item, maxChars, maxLines) {
    var source = Array.isArray(entries) ? entries : [];
    if (!source.length) {
      return [];
    }
    var duration = Math.max(0.01, (Number(item && item.end) || 0) - (Number(item && item.start) || 0));
    var charLimit = Math.max(32, Math.min(96, (Number(maxChars) || 42) * Math.max(1, Number(maxLines) || 2)));
    var wordLimit = Math.max(2, Math.min(getVisualChunkWordLimit(maxLines), Math.ceil(duration * 3.4)));
    var chunks = [];
    var current = [];
    var currentChars = 0;
    for (var i = 0; i < source.length; i++) {
      var entry = source[i] || {};
      var text = String(entry.text || "");
      var nextChars = currentChars + (current.length ? 1 : 0) + text.length;
      var shouldBreak = current.length && (current.length >= wordLimit || nextChars > charLimit);
      if (shouldBreak) {
        chunks.push(current);
        current = [];
        currentChars = 0;
      }
      current.push(entry);
      currentChars += (current.length > 1 ? 1 : 0) + text.length;
    }
    if (current.length) {
      chunks.push(current);
    }
    return chunks;
  }

  function rebalanceOversizedReferenceAssignments(items, assignments, syntheticItems) {
    if (!Array.isArray(items) || !Array.isArray(assignments)) {
      return 0;
    }
    var created = 0;
    var maxChars = Number(getValue("maxChars") || 42);
    var maxLines = getMaxLinesControlValue();
    for (var i = 0; i < assignments.length; i++) {
      var assigned = assignments[i] || [];
      if (!assigned.length) {
        continue;
      }
      var item = items[i] || {};
      var chunks = splitReferenceAssignmentChunks(assigned, item, maxChars, maxLines);
      if (chunks.length <= 1) {
        continue;
      }
      var start = Number(item.start) || 0;
      var end = Number(item.end);
      if (!(end > start)) {
        end = start + Math.max(0.35, chunks.length * 0.45);
      }
      var duration = Math.max(0.01, end - start);
      assignments[i] = chunks[0];
      item.end = Math.round((start + (duration / chunks.length)) * 1000) / 1000;
      item.referenceTextSplit = true;
      for (var chunkIdx = 1; chunkIdx < chunks.length; chunkIdx++) {
        var chunkStart = start + (duration * chunkIdx / chunks.length);
        var chunkEnd = chunkIdx === chunks.length - 1
          ? end
          : start + (duration * (chunkIdx + 1) / chunks.length);
        syntheticItems.push(makeReferenceTimedCaption(
          chunks[chunkIdx],
          chunkStart,
          chunkEnd,
          "reference_overflow_split"
        ));
        created++;
      }
    }
    return created;
  }

  function getReferenceItemText(item) {
    return String(
      (item && item.text) ||
      (item && Array.isArray(item.lines) ? item.lines.join(" ") : "") ||
      ""
    ).replace(/\s+/g, " ").trim();
  }

  function retimeReferenceItemWords(item) {
    if (!item) {
      return;
    }
    var text = getReferenceItemText(item);
    var tokens = text ? text.split(/\s+/).filter(Boolean) : [];
    item.lines = splitReferenceCaptionLines(text, Number(getValue("maxChars") || 42), 2);
    item.words = approximateReferenceWords(tokens, item.start, item.end);
  }

  function mergeReferenceTextIntoItem(target, gapItem, prepend) {
    if (!target || !gapItem) {
      return false;
    }
    var gapText = getReferenceItemText(gapItem);
    var targetText = getReferenceItemText(target);
    var nextText = gapText
      ? (prepend ? sanitizePreviewQuote(gapText + " " + targetText) : sanitizePreviewQuote(targetText + " " + gapText))
      : targetText;
    target.originalText = target.originalText || targetText;
    target.text = nextText;
    target.start = Math.round(Math.min(Number(target.start) || 0, Number(gapItem.start) || 0) * 1000) / 1000;
    target.end = Math.round(Math.max(Number(target.end) || target.start, Number(gapItem.end) || target.end) * 1000) / 1000;
    target.referenceTextApplied = true;
    target.referenceTextChanged = true;
    target.referenceTextSource = "reference";
    target.referenceTextAbsorbedGap = true;
    retimeReferenceItemWords(target);
    return true;
  }

  function absorbShortReferenceGapCaptions(items) {
    if (!Array.isArray(items) || !items.length) {
      return 0;
    }
    items.sort(function (a, b) {
      return (Number(a.start) || 0) - (Number(b.start) || 0) || (Number(a.end) || 0) - (Number(b.end) || 0);
    });
    var absorbed = 0;
    for (var i = items.length - 1; i >= 0; i--) {
      var gapItem = items[i];
      if (!gapItem || !gapItem.referenceTextSynthetic) {
        continue;
      }
      var start = Number(gapItem.start);
      var end = Number(gapItem.end);
      var duration = end - start;
      var gapText = getReferenceItemText(gapItem);
      var wordCount = gapText ? gapText.split(/\s+/).filter(Boolean).length : 0;
      var shouldAbsorb = !gapText || duration <= 1.15 || wordCount <= 3;
      if (!shouldAbsorb) {
        continue;
      }
      var prev = i > 0 ? items[i - 1] : null;
      var next = i < items.length - 1 ? items[i + 1] : null;
      var prevDistance = prev ? Math.abs(start - (Number(prev.end) || start)) : Number.MAX_VALUE;
      var nextDistance = next ? Math.abs((Number(next.start) || end) - end) : Number.MAX_VALUE;
      var target = next && nextDistance <= Math.max(prevDistance, 0.35) ? next : prev;
      if (!target) {
        items.splice(i, 1);
        absorbed++;
        continue;
      }
      mergeReferenceTextIntoItem(target, gapItem, target === next);
      items.splice(i, 1);
      absorbed++;
    }
    items.sort(function (a, b) {
      return (Number(a.start) || 0) - (Number(b.start) || 0) || (Number(a.end) || 0) - (Number(b.end) || 0);
    });
    return absorbed;
  }

  function shouldMergeTinyReferenceCaption(item) {
    if (!item) {
      return false;
    }
    var start = Number(item.start);
    var end = Number(item.end);
    var duration = end - start;
    if (!(duration > 0)) {
      return true;
    }
    var text = getReferenceItemText(item);
    var wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    var charCount = text.replace(/\s+/g, "").length;
    var wordsPerSecond = wordCount / duration;
    var charsPerSecond = charCount / duration;
    return (
      duration < 0.95 ||
      (wordCount >= 4 && duration < 1.35) ||
      wordsPerSecond > 5.2 ||
      charsPerSecond > 28
    );
  }

  function mergeTinyReferenceCaptions(items) {
    if (!Array.isArray(items) || items.length < 2) {
      return 0;
    }
    items.sort(function (a, b) {
      return (Number(a.start) || 0) - (Number(b.start) || 0) || (Number(a.end) || 0) - (Number(b.end) || 0);
    });
    var merged = 0;
    var safety = 0;
    while (items.length > 1 && safety < 80) {
      safety++;
      var mergedThisPass = 0;
      for (var i = items.length - 1; i >= 0; i--) {
        var item = items[i];
        if (!shouldMergeTinyReferenceCaption(item)) {
          continue;
        }
        var prev = i > 0 ? items[i - 1] : null;
        var next = i < items.length - 1 ? items[i + 1] : null;
        var start = Number(item.start) || 0;
        var end = Number(item.end) || start;
        var prevGap = prev ? Math.abs(start - (Number(prev.end) || start)) : Number.MAX_VALUE;
        var nextGap = next ? Math.abs((Number(next.start) || end) - end) : Number.MAX_VALUE;
        var target = prev && prevGap <= nextGap ? prev : next;
        if (!target) {
          continue;
        }
        mergeReferenceTextIntoItem(target, item, target === next);
        items.splice(i, 1);
        merged++;
        mergedThisPass++;
      }
      if (!mergedThisPass) {
        break;
      }
      items.sort(function (a, b) {
        return (Number(a.start) || 0) - (Number(b.start) || 0) || (Number(a.end) || 0) - (Number(b.end) || 0);
      });
    }
    items.sort(function (a, b) {
      return (Number(a.start) || 0) - (Number(b.start) || 0) || (Number(a.end) || 0) - (Number(b.end) || 0);
    });
    return merged;
  }

  function getReferenceEntriesFromItem(item) {
    var entries = [];
    if (item && Array.isArray(item.words) && item.words.length) {
      for (var i = 0; i < item.words.length; i++) {
        var word = item.words[i] || {};
        var text = String(word.text || word.word || "").trim();
        if (!text) {
          continue;
        }
        entries.push({
          text: text,
          start: Number(word.start),
          end: Number(word.end)
        });
      }
    }
    if (entries.length) {
      return entries;
    }
    var textValue = getReferenceItemText(item);
    var tokens = textValue ? textValue.split(/\s+/).filter(Boolean) : [];
    var approx = approximateReferenceWords(tokens, Number(item && item.start) || 0, Number(item && item.end) || 0);
    for (var idx = 0; idx < approx.length; idx++) {
      entries.push({
        text: approx[idx].text,
        start: Number(approx[idx].start),
        end: Number(approx[idx].end)
      });
    }
    return entries;
  }

  function splitOversizedReferenceItems(items) {
    if (!Array.isArray(items) || !items.length) {
      return 0;
    }
    var maxChars = Number(getValue("maxChars") || 42);
    var maxLines = getMaxLinesControlValue();
    var created = 0;
    for (var i = items.length - 1; i >= 0; i--) {
      var item = items[i] || {};
      var text = getReferenceItemText(item);
      var entries = getReferenceEntriesFromItem(item);
      var start = Number(item.start) || 0;
      var end = Number(item.end) || start;
      var duration = Math.max(0, end - start);
      var visualWordLimit = getVisualChunkWordLimit(maxLines);
      var tooLarge = entries.length > visualWordLimit || duration > 6 || text.length > Math.max(96, maxChars * maxLines * 1.35);
      if (!tooLarge || entries.length < 2) {
        continue;
      }
      var chunks = splitReferenceAssignmentChunks(entries, item, maxChars, maxLines);
      if (chunks.length <= 1) {
        continue;
      }
      var replacements = [];
      var baseId = String(item.id || zeroPadReferenceId(i + 1)).replace(/__\d+$/, "");
      for (var chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        var chunk = chunks[chunkIdx] || [];
        if (!chunk.length) {
          continue;
        }
        var chunkStart = Number(chunk[0].start);
        var chunkEnd = Number(chunk[chunk.length - 1].end);
        if (!(chunkEnd > chunkStart)) {
          chunkStart = start + (duration * chunkIdx / chunks.length);
          chunkEnd = chunkIdx === chunks.length - 1 ? end : start + (duration * (chunkIdx + 1) / chunks.length);
        }
        var nextItem = makeReferenceTimedCaption(chunk, chunkStart, chunkEnd, "reference_final_safety_split");
        nextItem.id = baseId + "__" + String(chunkIdx + 1).padStart(2, "0");
        nextItem.referenceTextFinalSafetySplit = true;
        replacements.push(nextItem);
      }
      if (replacements.length > 1) {
        items.splice.apply(items, [i, 1].concat(replacements));
        created += replacements.length - 1;
      }
    }
    items.sort(function (a, b) {
      return (Number(a.start) || 0) - (Number(b.start) || 0) || (Number(a.end) || 0) - (Number(b.end) || 0);
    });
    return created;
  }

  function zeroPadReferenceId(value) {
    var raw = String(Math.max(0, Number(value) || 0));
    while (raw.length < 4) {
      raw = "0" + raw;
    }
    return raw;
  }

  function ensureUniqueCaptionIds(payload) {
    if (!payload || !Array.isArray(payload.items)) {
      return 0;
    }
    var changed = 0;
    var seen = {};
    var nextId = 1;
    for (var i = 0; i < payload.items.length; i++) {
      var item = payload.items[i] || {};
      var current = String(item.id || "").trim();
      var hasBadId = !current || /^ref_gap_/.test(current) || !!seen[current];
      if (hasBadId) {
        var candidate = zeroPadReferenceId(Math.max(nextId, i + 1));
        while (seen[candidate]) {
          nextId++;
          candidate = zeroPadReferenceId(nextId);
        }
        item.id = candidate;
        changed++;
      }
      seen[String(item.id || "")] = true;
      nextId = Math.max(nextId, i + 2);
    }
    if (changed) {
      payload.meta = payload.meta || {};
      payload.meta.uniqueCaptionIdsRepaired = changed;
    }
    return changed;
  }

  function buildReferenceAlignedAssignments(items, referenceTokens) {
    var sourceSlots = [];
    for (var i = 0; i < items.length; i++) {
      sourceSlots = sourceSlots.concat(getItemSourceWordSlots(items[i], i));
    }
    var ops = alignReferenceTokensToSource(sourceSlots, referenceTokens);
    var assignments = [];
    for (var init = 0; init < items.length; init++) {
      assignments[init] = [];
    }

    var syntheticItems = [];
    var insertedGapCaptions = 0;
    var missingGapThreshold = 0.75;
    var missingGapPad = 0.05;
    var lastItemIndex = 0;
    for (var opIdx = 0; opIdx < ops.length; opIdx++) {
      var op = ops[opIdx];
      if (op.type === "match") {
        var slot = sourceSlots[op.sourceIndex];
        if (!slot) continue;
        lastItemIndex = Math.max(0, Math.min(items.length - 1, slot.itemIndex));
        assignments[lastItemIndex].push({
          text: referenceTokens[op.referenceIndex],
          start: slot.start,
          end: slot.end,
          similarity: op.similarity
        });
      } else if (op.type === "insert") {
        var insertAfterSourceIndex = Number(op.afterSourceIndex);
        var insertedTokens = [];
        var groupCursor = opIdx;
        while (
          groupCursor < ops.length &&
          ops[groupCursor].type === "insert" &&
          Number(ops[groupCursor].afterSourceIndex) === insertAfterSourceIndex
        ) {
          insertedTokens.push(referenceTokens[ops[groupCursor].referenceIndex]);
          groupCursor++;
        }
        opIdx = groupCursor - 1;

        var beforeSlot = insertAfterSourceIndex >= 0 ? sourceSlots[insertAfterSourceIndex] : null;
        var afterSlot = sourceSlots[insertAfterSourceIndex + 1] || null;
        var gapStart = beforeSlot ? Number(beforeSlot.end) : NaN;
        var gapEnd = afterSlot ? Number(afterSlot.start) : NaN;
        var gapDuration = gapEnd - gapStart;
        if (insertedTokens.length && beforeSlot && afterSlot && gapDuration >= missingGapThreshold) {
          syntheticItems.push(makeReferenceGapCaption(
            insertedTokens,
            gapStart + missingGapPad,
            gapEnd - missingGapPad,
            "missing_whisper_gap"
          ));
          insertedGapCaptions++;
          lastItemIndex = Math.max(0, Math.min(items.length - 1, beforeSlot.itemIndex));
          continue;
        }

        var attachIndex = lastItemIndex;
        if (insertAfterSourceIndex >= 0 && sourceSlots[insertAfterSourceIndex]) {
          attachIndex = sourceSlots[insertAfterSourceIndex].itemIndex;
        } else if (afterSlot) {
          attachIndex = afterSlot.itemIndex;
        }
        attachIndex = Math.max(0, Math.min(items.length - 1, attachIndex));
        for (var tokenIdx = 0; tokenIdx < insertedTokens.length; tokenIdx++) {
          assignments[attachIndex].push({
            text: insertedTokens[tokenIdx],
            inserted: true
          });
        }
      }
    }
    var overflowSplitCaptions = rebalanceOversizedReferenceAssignments(items, assignments, syntheticItems);
    return {
      assignments: assignments,
      syntheticItems: syntheticItems,
      insertedGapCaptions: insertedGapCaptions,
      overflowSplitCaptions: overflowSplitCaptions
    };
  }

  function buildAlignedReferenceWords(assignedWords, item) {
    var tokens = assignedWords.map(function (entry) { return entry.text; }).filter(Boolean);
    if (!tokens.length) {
      return [];
    }
    var fallback = approximateReferenceWords(tokens, item.start, item.end);
    var out = [];
    for (var i = 0; i < tokens.length; i++) {
      var entry = assignedWords[i] || {};
      var start = Number(entry.start);
      var end = Number(entry.end);
      if (!(end > start)) {
        var prevTimed = null;
        var nextTimed = null;
        for (var prevIdx = i - 1; prevIdx >= 0; prevIdx--) {
          var prevEntry = assignedWords[prevIdx] || {};
          var prevStart = Number(prevEntry.start);
          var prevEnd = Number(prevEntry.end);
          if (prevEnd > prevStart) {
            prevTimed = { index: prevIdx, start: prevStart, end: prevEnd };
            break;
          }
        }
        for (var nextIdx = i + 1; nextIdx < assignedWords.length; nextIdx++) {
          var nextEntry = assignedWords[nextIdx] || {};
          var nextStart = Number(nextEntry.start);
          var nextEnd = Number(nextEntry.end);
          if (nextEnd > nextStart) {
            nextTimed = { index: nextIdx, start: nextStart, end: nextEnd };
            break;
          }
        }

        if (prevTimed && nextTimed && nextTimed.start > prevTimed.end + 0.02) {
          var missingBetween = Math.max(1, nextTimed.index - prevTimed.index);
          var localStep = (nextTimed.start - prevTimed.end) / missingBetween;
          start = prevTimed.end + (localStep * (i - prevTimed.index - 1));
          end = prevTimed.end + (localStep * (i - prevTimed.index));
        } else if (prevTimed && item.end > prevTimed.end + 0.02) {
          var tailMissing = Math.max(1, tokens.length - prevTimed.index - 1);
          var tailStep = (Number(item.end) - prevTimed.end) / tailMissing;
          start = prevTimed.end + (tailStep * (i - prevTimed.index - 1));
          end = prevTimed.end + (tailStep * (i - prevTimed.index));
        } else if (nextTimed && nextTimed.start > Number(item.start) + 0.02) {
          var headMissing = Math.max(1, nextTimed.index);
          var headStep = (nextTimed.start - Number(item.start)) / headMissing;
          start = Number(item.start) + (headStep * i);
          end = Number(item.start) + (headStep * (i + 1));
        } else {
          start = fallback[i].start;
          end = fallback[i].end;
        }
      }
      var minStart = Number(item.start);
      var maxEnd = Number(item.end);
      if (isNaN(minStart)) minStart = fallback[i].start;
      if (!(maxEnd > minStart)) maxEnd = fallback[i].end;
      start = Math.max(minStart, Math.min(maxEnd - 0.01, start));
      end = Math.min(maxEnd, Math.max(start + 0.01, end));
      if (out.length && start < out[out.length - 1].end) {
        start = out[out.length - 1].end;
        end = Math.max(start + 0.01, end);
      }
      out.push({
        start: Math.round(start * 1000) / 1000,
        end: Math.round(end * 1000) / 1000,
        text: tokens[i]
      });
    }
    return out;
  }

  function hexToAeColor(hex, fallback) {
    var parsed = hexToRgbArray(hex);
    return parsed || fallback || [1, 0.82, 0.14];
  }

  function aeColorToCss(color, fallbackHex) {
    return rgbArrayToHex((Array.isArray(color) && color.length === 3) ? color : hexToAeColor(fallbackHex || "#FFD124"));
  }

  function normalizeRuleText(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").replace(/^[^\wа-яіїєґñáéíóúü]+|[^\wа-яіїєґñáéíóúü]+$/g, "").trim();
  }

  function getWordRules() {
    if (!wordRulesListEl) {
      return [];
    }
    var rows = wordRulesListEl.querySelectorAll(".word-rule-row");
    var rules = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var phraseEl = row.querySelector("[data-rule-field='phrase']");
      var styleEl = row.querySelector("[data-rule-field='style']");
      var fillEl = row.querySelector("[data-rule-field='fill']");
      var strokeEl = row.querySelector("[data-rule-field='stroke']");
      var phrase = phraseEl ? String(phraseEl.value || "").replace(/\s+/g, " ").trim() : "";
      if (!phrase) {
        continue;
      }
      var style = styleEl ? String(styleEl.value || "fill") : "fill";
      var fillColor = style === "accent"
        ? getPresetAccentColor(getEffectivePresetForPreview())
        : hexToAeColor(fillEl ? fillEl.value : "#FFD124", [1, 0.82, 0.14]);
      var strokeColor = hexToAeColor(strokeEl ? strokeEl.value : "#000000", [0, 0, 0]);
      rules.push({
        phrase: phrase,
        style: style,
        fillColor: fillColor,
        strokeColor: strokeColor,
        strokeWidth: style === "stroke" ? 4 : 0
      });
    }
    return rules;
  }

  function updateWordRulesMeta(matchCount) {
    if (!wordRulesMetaEl) {
      return;
    }
    var rules = getWordRules();
    if (!rules.length) {
      wordRulesMetaEl.textContent = "No word rules yet.";
      return;
    }
    if (typeof matchCount === "number") {
      wordRulesMetaEl.textContent = rules.length + " rule(s), " + matchCount + " highlighted match(es).";
      return;
    }
    wordRulesMetaEl.textContent = rules.length + " rule(s). Transcribe or Run to preview highlights.";
  }

  function renderWordRuleRow(rule) {
    if (!wordRulesListEl) {
      return null;
    }
    rule = rule || {};
    var row = document.createElement("div");
    row.className = "word-rule-row";
    row.innerHTML =
      '<input type="text" data-rule-field="phrase" placeholder="word or phrase" />' +
      '<select data-rule-field="style">' +
        '<option value="fill">Fill</option>' +
        '<option value="accent">Accent</option>' +
        '<option value="stroke">Fill + Stroke</option>' +
      '</select>' +
      '<input type="color" data-rule-field="fill" value="#FFD124" title="Fill color" />' +
      '<input type="color" data-rule-field="stroke" value="#000000" title="Stroke color" />' +
      '<button type="button" class="word-rule-remove" title="Remove rule">×</button>';
    var phraseEl = row.querySelector("[data-rule-field='phrase']");
    var styleEl = row.querySelector("[data-rule-field='style']");
    var fillEl = row.querySelector("[data-rule-field='fill']");
    var strokeEl = row.querySelector("[data-rule-field='stroke']");
    if (phraseEl) phraseEl.value = rule.phrase || "";
    if (styleEl) styleEl.value = rule.style || "fill";
    if (fillEl) fillEl.value = rule.fillHex || "#FFD124";
    if (strokeEl) strokeEl.value = rule.strokeHex || "#000000";

    var sync = function () {
      updateWordRulesMeta();
      if (transcriptReviewHasFreshPayload && applyWordRulesToCurrentSubtitles()) {
        renderTranscriptReview();
        updateStylePreview();
      }
    };
    var inputs = row.querySelectorAll("input, select");
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener("input", sync);
      inputs[i].addEventListener("change", sync);
    }
    var remove = row.querySelector(".word-rule-remove");
    if (remove) {
      remove.addEventListener("click", function () {
        row.parentNode.removeChild(row);
        sync();
      });
    }
    wordRulesListEl.appendChild(row);
    updateWordRulesMeta();
    return row;
  }

  function findRuleHighlightsInText(text, rules) {
    var source = String(text || "");
    var lower = source.toLowerCase();
    var ranges = [];
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var phrase = String(rule.phrase || "").trim();
      if (!phrase) {
        continue;
      }
      var needle = phrase.toLowerCase();
      var cursor = 0;
      while (cursor < lower.length) {
        var idx = lower.indexOf(needle, cursor);
        if (idx === -1) {
          break;
        }
        var before = idx > 0 ? lower.charAt(idx - 1) : " ";
        var afterIndex = idx + needle.length;
        var after = afterIndex < lower.length ? lower.charAt(afterIndex) : " ";
        var boundaryBefore = !/[a-z0-9а-яіїєґñáéíóúü]/i.test(before);
        var boundaryAfter = !/[a-z0-9а-яіїєґñáéíóúü]/i.test(after);
        if (boundaryBefore && boundaryAfter) {
          ranges.push({
            start: idx,
            length: needle.length,
            phrase: phrase,
            style: rule.style || "fill",
            fillColor: rule.fillColor,
            strokeColor: rule.strokeColor,
            strokeWidth: rule.strokeWidth || 0
          });
        }
        cursor = idx + Math.max(1, needle.length);
      }
    }
    ranges.sort(function (a, b) {
      return a.start - b.start || b.length - a.length;
    });
    var filtered = [];
    var occupiedUntil = -1;
    for (var j = 0; j < ranges.length; j++) {
      if (ranges[j].start < occupiedUntil) {
        continue;
      }
      filtered.push(ranges[j]);
      occupiedUntil = ranges[j].start + ranges[j].length;
    }
    return filtered;
  }

  function splitReferenceCaptionLines(text, maxChars, maxLines) {
    var words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) {
      return [];
    }
    var limit = Math.max(12, Number(maxChars) || 42);
    var lineLimit = Math.max(1, Number(maxLines) || 2);
    var lines = [];
    var current = "";
    for (var i = 0; i < words.length; i++) {
      var next = current ? current + " " + words[i] : words[i];
      if (current && next.length > limit && lines.length < lineLimit - 1) {
        lines.push(current);
        current = words[i];
      } else {
        current = next;
      }
    }
    if (current) {
      lines.push(current);
    }
    return lines.length ? lines : [text];
  }

  function approximateReferenceWords(tokens, start, end) {
    var out = [];
    var duration = Math.max(0.01, (Number(end) || 0) - (Number(start) || 0));
    var total = Math.max(1, tokens.length);
    var cursor = Number(start) || 0;
    for (var i = 0; i < tokens.length; i++) {
      var wordEnd = i === tokens.length - 1
        ? Number(end)
        : (Number(start) || 0) + (duration * (i + 1) / total);
      if (!(wordEnd > cursor)) {
        wordEnd = cursor + 0.01;
      }
      out.push({
        start: Math.round(cursor * 1000) / 1000,
        end: Math.round(wordEnd * 1000) / 1000,
        text: tokens[i]
      });
      cursor = wordEnd;
    }
    return out;
  }

  function getSubtitleWordSlots(item) {
    if (item && Array.isArray(item.words) && item.words.length) {
      return item.words.length;
    }
    var text = item && (item.text || (Array.isArray(item.lines) ? item.lines.join(" ") : ""));
    var words = String(text || "").trim().split(/\s+/).filter(Boolean);
    return Math.max(1, words.length);
  }

  function applyReferenceTextToPayload(payload, referenceText) {
    var tokens = getReferenceTokens(referenceText);
    if (!payload || !Array.isArray(payload.items) || !payload.items.length || !tokens.length) {
      return false;
    }
    var items = payload.items;
    var alignment = buildReferenceAlignedAssignments(items, tokens);
    var assignments = alignment.assignments || [];
    if (!assignments.length && !(alignment.syntheticItems && alignment.syntheticItems.length)) {
      return false;
    }

    var changed = 0;
    var maxChars = Number(getValue("maxChars") || 42);
    for (var idx = 0; idx < items.length; idx++) {
      var item = items[idx] || {};
      var oldText = String(item.text || (Array.isArray(item.lines) ? item.lines.join(" ") : "") || "").trim();
      var assigned = assignments[idx] || [];
      var slice = assigned.map(function (entry) { return entry.text; }).filter(Boolean);
      if (!slice.length) {
        continue;
      }
      var nextText = slice.join(" ");
      var hasInsertedReferenceWords = assigned.some(function (entry) { return !!(entry && entry.inserted); });
      var hasLowConfidenceReferenceWords = assigned.some(function (entry) {
        return entry && typeof entry.similarity === "number" && entry.similarity < 0.72;
      });
      var baselineText = String(item.originalText || oldText || "").trim();
      var changedFromBaseline = baselineText !== nextText;
      item.originalText = item.originalText || oldText;
      item.text = nextText;
      item.lines = splitReferenceCaptionLines(nextText, maxChars, 2);
      item.words = buildAlignedReferenceWords(assigned, item);
      item.referenceTextApplied = true;
      item.referenceTextChanged = changedFromBaseline;
      item.referenceTextSource = changedFromBaseline || hasInsertedReferenceWords || hasLowConfidenceReferenceWords
        ? "reference"
        : "model+reference";
      item.referenceTextWordCount = slice.length;
      if (baselineText && changedFromBaseline) {
        changed++;
      }
    }

    if (alignment.syntheticItems && alignment.syntheticItems.length) {
      for (var synthIdx = 0; synthIdx < alignment.syntheticItems.length; synthIdx++) {
        items.push(alignment.syntheticItems[synthIdx]);
      }
      items.sort(function (a, b) {
        return (Number(a.start) || 0) - (Number(b.start) || 0) || (Number(a.end) || 0) - (Number(b.end) || 0);
      });
      var absorbedSyntheticItems = absorbShortReferenceGapCaptions(items);
      for (var reid = 0; reid < items.length; reid++) {
        if (!items[reid].id || /^ref_gap_/.test(String(items[reid].id))) {
          items[reid].id = items[reid].referenceTextSynthetic
            ? ("ref_gap_" + zeroPadReferenceId(reid + 1))
            : zeroPadReferenceId(reid + 1);
        }
      }
    }
    var cadenceMergedItems = mergeTinyReferenceCaptions(items);
    var finalSafetySplitCaptions = splitOversizedReferenceItems(items);

    payload.meta = payload.meta || {};
    payload.meta.referenceTextApplied = true;
    payload.meta.referenceTextAlignment = "word_similarity+missing_gap_fill";
    payload.meta.referenceTextTokens = tokens.length;
    payload.meta.referenceTextChangedItems = changed;
    payload.meta.referenceTextSyntheticItems = (alignment.syntheticItems && alignment.syntheticItems.length) || 0;
    payload.meta.referenceTextInsertedGapCaptions = alignment.insertedGapCaptions || 0;
    payload.meta.referenceTextAbsorbedGapCaptions = absorbedSyntheticItems || 0;
    payload.meta.referenceTextOverflowSplitCaptions = alignment.overflowSplitCaptions || 0;
    payload.meta.referenceTextCadenceMergedCaptions = cadenceMergedItems || 0;
    payload.meta.referenceTextFinalSafetySplitCaptions = finalSafetySplitCaptions || 0;
    ensureUniqueCaptionIds(payload);
    return true;
  }

  function applyReferenceTextToCurrentSubtitles() {
    var referenceText = getReferenceText();
    if (!referenceText || !hasNodeBridge || !fs) {
      if (referenceTextMetaEl && !referenceText) {
        referenceTextMetaEl.textContent = "Optional: paste known-correct script, Hinglish line, quote, or lyrics-style spoken text.";
      }
      return false;
    }
    var subtitlesPath = getDefaultSubtitlesPath();
    if (!subtitlesPath || !fileExists(subtitlesPath)) {
      return false;
    }
    var payload = readSubtitlesPayload();
    if (!applyReferenceTextToPayload(payload, referenceText)) {
      return false;
    }
    if (!writeSubtitlesPayload(payload)) {
      return false;
    }
    if (referenceTextMetaEl) {
      referenceTextMetaEl.textContent =
        "Reference applied: " + payload.meta.referenceTextTokens +
        " words across " + payload.items.length + " captions. Missing Whisper gaps are filled from reference text.";
    }
    return true;
  }

  function applyWordRulesToPayload(payload) {
    var rules = getWordRules();
    if (!payload || !Array.isArray(payload.items)) {
      return 0;
    }
    var total = 0;
    for (var i = 0; i < payload.items.length; i++) {
      var item = payload.items[i] || {};
      var text = String(item.text || (Array.isArray(item.lines) ? item.lines.join(" ") : "") || "");
      var highlights = rules.length ? findRuleHighlightsInText(text, rules) : [];
      if (highlights.length) {
        item.wordRuleHighlights = highlights;
        total += highlights.length;
      } else if (item.wordRuleHighlights) {
        delete item.wordRuleHighlights;
      }
    }
    payload.meta = payload.meta || {};
    payload.meta.wordRulesApplied = rules.length > 0;
    payload.meta.wordRulesCount = rules.length;
    payload.meta.wordRuleMatches = total;
    updateWordRulesMeta(total);
    return total;
  }

  function applyWordRulesToCurrentSubtitles() {
    if (!hasNodeBridge || !fs) {
      updateWordRulesMeta();
      return false;
    }
    var subtitlesPath = getDefaultSubtitlesPath();
    if (!subtitlesPath || !fileExists(subtitlesPath)) {
      updateWordRulesMeta();
      return false;
    }
    var payload = readSubtitlesPayload();
    if (!payload) {
      updateWordRulesMeta();
      return false;
    }
    return writeSubtitlesPayload(payload);
  }

  function applyTextCorrectionsToCurrentSubtitles() {
    var changed = applyReferenceTextToCurrentSubtitles();
    var highlighted = applyWordRulesToCurrentSubtitles();
    return changed || highlighted;
  }

  function normalizeCaptionDiffText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isReferenceChangedCaptionItem(item) {
    if (!item || !item.referenceTextApplied) {
      return false;
    }
    if (item.referenceTextSynthetic || item.referenceTextAbsorbedGap || item.referenceTextSplit) {
      return true;
    }
    if (item.referenceTextSource === "reference" || item.referenceTextChanged) {
      var currentText = normalizeCaptionDiffText(getReferenceItemText(item));
      var originalText = normalizeCaptionDiffText(item.originalText || "");
      if (!originalText) {
        return !!currentText && item.referenceTextSource === "reference";
      }
      return currentText !== originalText;
    }
    return false;
  }

  function readSubtitlesPayloadFromPath(subtitlesPath) {
    if (!hasNodeBridge || !fs || !subtitlesPath) {
      return null;
    }
    try {
      if (!fileExists(subtitlesPath)) {
        return null;
      }
      return JSON.parse(fs.readFileSync(subtitlesPath, "utf8"));
    } catch (_err) {
      return null;
    }
  }

  function writeSubtitlesPayloadToPath(payload, subtitlesPath) {
    if (!hasNodeBridge || !fs || !payload || !subtitlesPath) {
      return false;
    }
    try {
      if (path && path.dirname && fs.mkdirSync) {
        fs.mkdirSync(path.dirname(subtitlesPath), { recursive: true });
      }
    } catch (_mkdirErr) {}
    prepareCaptionDocumentPayload(payload);
    fs.writeFileSync(subtitlesPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    previewTranscriptCache = { path: "", mtimeMs: 0, samples: [] };
    if (stylePreviewTextEl && stylePreviewTextEl.dataset) {
      delete stylePreviewTextEl.dataset.quote;
    }
    return true;
  }

  function buildReferenceChangedPatchPayload(payload) {
    if (!payload || !Array.isArray(payload.items)) {
      return null;
    }
    var patch = deepClone(payload) || {};
    var sourceItems = Array.isArray(payload.items) ? payload.items : [];
    patch.items = [];
    for (var i = 0; i < sourceItems.length; i++) {
      if (isReferenceChangedCaptionItem(sourceItems[i])) {
        patch.items.push(deepClone(sourceItems[i]));
      }
    }
    patch.meta = patch.meta || {};
    patch.meta.captionPatchMode = "reference_changed_only";
    patch.meta.captionPatchSourcePath = getDefaultSubtitlesPath();
    patch.meta.captionPatchTotalItems = sourceItems.length;
    patch.meta.captionPatchChangedItems = patch.items.length;
    patch.meta.captionPatchPreparedAt = new Date().toISOString();
    return patch;
  }

  function buildAndWriteReferenceChangedPatch() {
    if (!hasNodeBridge || !fs) {
      throw new Error("Node runtime is required to build changed-caption patch.");
    }
    applyTextCorrectionsToCurrentSubtitles();
    var payload = readSubtitlesPayload();
    if (!payload || !Array.isArray(payload.items) || !payload.items.length) {
      throw new Error("Generate or retime captions before applying changed-only captions.");
    }
    var patch = buildReferenceChangedPatchPayload(payload);
    if (!patch || !Array.isArray(patch.items) || !patch.items.length) {
      throw new Error("No changed reference captions to apply. Paste reference text that differs from the current transcript first.");
    }
    var patchPath = getReferenceChangedPatchPath();
    if (!writeSubtitlesPayloadToPath(patch, patchPath)) {
      throw new Error("Could not write changed-caption patch.");
    }
    return {
      path: patchPath,
      count: patch.items.length,
      total: Array.isArray(payload.items) ? payload.items.length : 0
    };
  }

  function getCaptionItemText(item) {
    return sanitizePreviewQuote((Array.isArray(item && item.lines) && item.lines.length) ? item.lines.join(" ") : (item && item.text));
  }

  function setCaptionItemText(item, text) {
    if (!item) {
      return;
    }
    var clean = sanitizePreviewQuote(text);
    item.text = clean;
    item.lines = splitReferenceCaptionLines(clean, Number(getValue("maxChars") || 42), getMaxLinesControlValue());
    item.words = approximateReferenceWords(clean.split(/\s+/).filter(Boolean), item.start, item.end);
    item.manualTextEdited = true;
    if (item.wordRuleHighlights) {
      delete item.wordRuleHighlights;
    }
  }

  function writeSubtitlesPayload(payload) {
    var subtitlesPath = getDefaultSubtitlesPath();
    return writeSubtitlesPayloadToPath(payload, subtitlesPath);
  }

  function applyCompDisplayStartMeta(payload) {
    if (!payload) {
      return payload;
    }
    payload.meta = payload.meta || {};
    if (payload.meta.timelineNormalizedToZero) {
      payload.meta.reviewTimeMode = "comp_time";
      return payload;
    }
    payload.meta.compDisplayStartTime = Number(activeCompDisplayStartTime || 0) || 0;
    payload.meta.reviewTimeMode = payload.meta.compDisplayStartTime > 0
      ? "display_time"
      : "comp_time";
    return payload;
  }

  function getPayloadMinimumCaptionStart(payload) {
    var items = payload && Array.isArray(payload.items) ? payload.items : [];
    var minStart = null;
    for (var i = 0; i < items.length; i++) {
      var start = Number(items[i] && items[i].start);
      if (isNaN(start)) {
        continue;
      }
      if (minStart === null || start < minStart) {
        minStart = start;
      }
    }
    return minStart === null ? 0 : minStart;
  }

  function shiftSubtitlePayloadTiming(payload, offset) {
    if (!payload || !Array.isArray(payload.items)) {
      return payload;
    }
    var delta = Number(offset) || 0;
    if (!(delta > 0)) {
      return payload;
    }
    function shiftValue(value) {
      var n = Number(value);
      if (isNaN(n)) {
        return value;
      }
      return Math.round(Math.max(0, n - delta) * 1000) / 1000;
    }
    for (var i = 0; i < payload.items.length; i++) {
      var item = payload.items[i] || {};
      item.start = shiftValue(item.start);
      item.end = Math.max(Number(item.start) + 0.01, shiftValue(item.end));
      item.end = Math.round(item.end * 1000) / 1000;
      if (Array.isArray(item.words)) {
        for (var w = 0; w < item.words.length; w++) {
          var word = item.words[w] || {};
          word.start = shiftValue(word.start);
          word.end = Math.max(Number(word.start) + 0.01, shiftValue(word.end));
          word.end = Math.round(word.end * 1000) / 1000;
        }
      }
    }
    payload.meta = payload.meta || {};
    payload.meta.originalCompDisplayStartTime = Number(payload.meta.compDisplayStartTime || 0) || 0;
    payload.meta.timelineNormalizationOffset = Math.round(delta * 1000) / 1000;
    payload.meta.timelineNormalizedToZero = true;
    payload.meta.compDisplayStartTime = 0;
    payload.meta.reviewTimeMode = "comp_time";
    return payload;
  }

  function normalizeSubtitlePayloadTimeline(payload) {
    if (!payload || payload.meta && payload.meta.timelineNormalizedToZero) {
      return payload;
    }
    var meta = payload.meta || {};
    var displayOffset = Number(meta.compDisplayStartTime || 0) || 0;
    var minStart = getPayloadMinimumCaptionStart(payload);
    var offset = displayOffset > 0 ? displayOffset : (minStart >= 10 ? minStart : 0);
    if (offset > 0) {
      shiftSubtitlePayloadTiming(payload, offset);
    }
    return payload;
  }

  function splitOversizedCaptionItems(payload) {
    if (!payload || !Array.isArray(payload.items) || !payload.items.length) {
      return 0;
    }
    var maxChars = Number(getValue("maxChars") || 42);
    var maxLines = getMaxLinesControlValue();
    var created = 0;
    for (var i = payload.items.length - 1; i >= 0; i--) {
      var item = payload.items[i] || {};
      var entries = getReferenceEntriesFromItem(item);
      var text = getReferenceItemText(item);
      var start = Number(item.start) || 0;
      var end = Number(item.end) || start;
      var duration = Math.max(0, end - start);
      var visualWordLimit = getVisualChunkWordLimit(maxLines);
      var tooLarge = entries.length > visualWordLimit || duration > 6 || text.length > Math.max(96, maxChars * maxLines * 1.35);
      if (!tooLarge || entries.length < 2) {
        continue;
      }
      var chunks = splitReferenceAssignmentChunks(entries, item, maxChars, maxLines);
      if (chunks.length <= 1) {
        continue;
      }
      var baseId = String(item.id || zeroPadReferenceId(i + 1)).replace(/__\d+$/, "");
      var replacements = [];
      for (var chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        var chunk = chunks[chunkIdx] || [];
        if (!chunk.length) {
          continue;
        }
        var chunkText = chunk.map(function (entry) { return entry && entry.text; }).filter(Boolean).join(" ");
        var chunkStart = Number(chunk[0].start);
        var chunkEnd = Number(chunk[chunk.length - 1].end);
        if (!(chunkEnd > chunkStart)) {
          chunkStart = start + (duration * chunkIdx / chunks.length);
          chunkEnd = chunkIdx === chunks.length - 1 ? end : start + (duration * (chunkIdx + 1) / chunks.length);
        }
        var nextItem = {};
        for (var key in item) {
          if (item.hasOwnProperty(key)) {
            nextItem[key] = item[key];
          }
        }
        nextItem.id = baseId + "__" + String(chunkIdx + 1).padStart(2, "0");
        nextItem.start = Math.round(Math.max(0, chunkStart) * 1000) / 1000;
        nextItem.end = Math.round(Math.max(nextItem.start + 0.01, chunkEnd) * 1000) / 1000;
        nextItem.text = chunkText;
        nextItem.lines = splitReferenceCaptionLines(chunkText, maxChars, maxLines);
        nextItem.words = buildAlignedReferenceWords(chunk, nextItem);
        nextItem.captionDocumentSplit = true;
        replacements.push(nextItem);
      }
      if (replacements.length > 1) {
        payload.items.splice.apply(payload.items, [i, 1].concat(replacements));
        created += replacements.length - 1;
      }
    }
    if (created > 0) {
      payload.items.sort(function (a, b) {
        return (Number(a.start) || 0) - (Number(b.start) || 0) || (Number(a.end) || 0) - (Number(b.end) || 0);
      });
    }
    payload.meta = payload.meta || {};
    payload.meta.captionDocumentSplitItems = Number(payload.meta.captionDocumentSplitItems || 0) + created;
    return created;
  }

  function stampCaptionDocumentPayload(payload) {
    if (!payload) {
      return payload;
    }
    payload.meta = payload.meta || {};
    payload.meta.captionDocumentVersion = 1;
    payload.meta.captionDocumentSourceOfTruth = "tmp/subtitles.json";
    payload.meta.captionDocumentPreparedAt = new Date().toISOString();
    payload.meta.captionLayout = {
      preset: getValue("preset") || DEFAULT_PRESET_NAME,
      outputMode: getValue("outputMode") || "layers",
      font: getSelectedFontOverride() || "preset",
      maxChars: Number(getValue("maxChars") || 42),
      maxLines: getMaxLinesControlValue(),
      styleOverrides: getStyleOverridesPayload()
    };
    return payload;
  }

  function prepareCaptionDocumentPayload(payload) {
    if (!payload) {
      return payload;
    }
    applyCompDisplayStartMeta(payload);
    normalizeSubtitlePayloadTimeline(payload);
    splitOversizedCaptionItems(payload);
    ensureUniqueCaptionIds(payload);
    applyWordRulesToPayload(payload);
    stampCaptionDocumentPayload(payload);
    return payload;
  }

  function writeCurrentSubtitlesTimingMeta() {
    if (!hasNodeBridge || !fs) {
      return;
    }
    var payload = readSubtitlesPayload();
    if (!payload) {
      return;
    }
    prepareCaptionDocumentPayload(payload);
    var subtitlesPath = getDefaultSubtitlesPath();
    if (subtitlesPath) {
      fs.writeFileSync(subtitlesPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    }
  }

  function prepareSubtitlesForApply(subtitlesPath) {
    if (!hasNodeBridge || !fs) {
      return false;
    }
    var targetPath = subtitlesPath || getDefaultSubtitlesPath();
    var payload = readSubtitlesPayloadFromPath(targetPath);
    if (!payload) {
      return false;
    }
    return writeSubtitlesPayloadToPath(payload, targetPath);
  }

  function prepareCurrentSubtitlesForApply() {
    return prepareSubtitlesForApply(getDefaultSubtitlesPath());
  }

  function saveCaptionReviewEdit(index, text) {
    var payload = readSubtitlesPayload();
    var items = payload && Array.isArray(payload.items) ? payload.items : [];
    if (!items[index]) {
      return false;
    }
    setCaptionItemText(items[index], text);
    payload.meta = payload.meta || {};
    payload.meta.manualCaptionEdits = true;
    if (!writeSubtitlesPayload(payload)) {
      return false;
    }
    renderTranscriptReview();
    updateStylePreview();
    setStatus("Caption " + (index + 1) + " updated in tmp/subtitles.json.");
    return true;
  }

  function removeFirstTextOccurrence(text, selectedText) {
    var source = String(text || "");
    var selected = String(selectedText || "").replace(/\s+/g, " ").trim();
    if (!source || !selected) {
      return source;
    }
    var idx = source.toLowerCase().indexOf(selected.toLowerCase());
    if (idx < 0) {
      return source;
    }
    return sanitizePreviewQuote(source.slice(0, idx) + " " + source.slice(idx + selected.length));
  }

  function getSelectedTextInside(element) {
    if (!element || typeof window === "undefined" || !window.getSelection) {
      return "";
    }
    var selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      return "";
    }
    var selected = String(selection.toString() || "").replace(/\s+/g, " ").trim();
    if (!selected) {
      return "";
    }
    try {
      var range = selection.getRangeAt(0);
      var owner = range.commonAncestorContainer;
      if (owner && owner.nodeType === 3) {
        owner = owner.parentNode;
      }
      if (owner && element.contains(owner)) {
        return selected;
      }
    } catch (_selectionErr) {}
    return "";
  }

  function moveCaptionReviewText(index, direction, selectedText) {
    var payload = readSubtitlesPayload();
    var items = payload && Array.isArray(payload.items) ? payload.items : [];
    var targetIndex = index + direction;
    if (!items[index] || !items[targetIndex]) {
      return false;
    }
    var currentText = getCaptionItemText(items[index]);
    var targetText = getCaptionItemText(items[targetIndex]);
    var moved = String(selectedText || "").replace(/\s+/g, " ").trim();
    var remaining = currentText;
    if (moved) {
      remaining = removeFirstTextOccurrence(currentText, moved);
    } else {
      var words = currentText.split(/\s+/).filter(Boolean);
      if (!words.length) {
        return false;
      }
      moved = direction < 0 ? words.shift() : words.pop();
      remaining = words.join(" ");
    }
    if (!moved || remaining === currentText) {
      return false;
    }
    var nextTargetText = direction < 0
      ? sanitizePreviewQuote(targetText + " " + moved)
      : sanitizePreviewQuote(moved + " " + targetText);
    setCaptionItemText(items[index], remaining);
    setCaptionItemText(items[targetIndex], nextTargetText);
    payload.meta = payload.meta || {};
    payload.meta.manualCaptionEdits = true;
    if (!writeSubtitlesPayload(payload)) {
      return false;
    }
    renderTranscriptReview();
    updateStylePreview();
    setStatus("Moved text " + (direction < 0 ? "to previous" : "to next") + " caption.");
    return true;
  }

  function buildCaptionReviewHtml(text, highlights) {
    var value = String(text || "");
    var ranges = Array.isArray(highlights) ? highlights.slice() : [];
    ranges.sort(function (a, b) { return Number(a.start || 0) - Number(b.start || 0); });
    var html = [];
    var cursor = 0;
    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i] || {};
      var start = Math.max(0, Math.min(value.length, Number(range.start) || 0));
      var end = Math.max(start, Math.min(value.length, start + (Number(range.length) || 0)));
      if (end <= start || start < cursor) {
        continue;
      }
      html.push(escapeHtml(value.slice(cursor, start)));
      html.push(
        '<span class="caption-word-highlight" style="--rule-fill:' +
        escapeHtml(aeColorToCss(range.fillColor, "#FFD124")) +
        ';--rule-stroke:' +
        escapeHtml(aeColorToCss(range.strokeColor, "#000000")) +
        ';">' +
        escapeHtml(value.slice(start, end)) +
        "</span>"
      );
      cursor = end;
    }
    html.push(escapeHtml(value.slice(cursor)));
    return html.join("");
  }

  function getCaptionReviewSource(item) {
    if (item && item.referenceTextSynthetic) {
      return {
        key: "reference-gap",
        label: "Reference gap",
        title: "Whisper missed this gap; timing was filled from reference text."
      };
    }
    if (item && item.referenceTextApplied) {
      if (item.referenceTextSource === "model+reference") {
        return {
          key: "reference-match",
          label: "Model + Ref",
          title: "Whisper text matched the reference text for this caption."
        };
      }
      return {
        key: "reference",
        label: "Reference",
        title: "Caption text was corrected or filled from reference text."
      };
    }
    return {
      key: "model",
      label: "Model",
      title: "Caption text comes from the transcription model."
    };
  }

  function formatCaptionTime(seconds, includeHours) {
    var value = Math.max(0, Number(seconds) || 0);
    var hours = Math.floor(value / 3600);
    var minutes = Math.floor((value % 3600) / 60);
    var secs = Math.floor(value % 60);
    var millis = Math.round((value - Math.floor(value)) * 1000);
    if (millis >= 1000) {
      millis = 0;
      secs += 1;
    }
    var mm = minutes < 10 ? "0" + minutes : String(minutes);
    var ss = secs < 10 ? "0" + secs : String(secs);
    var ms = millis < 10 ? "00" + millis : (millis < 100 ? "0" + millis : String(millis));
    if (includeHours) {
      var hh = hours < 10 ? "0" + hours : String(hours);
      return hh + ":" + mm + ":" + ss + "." + ms;
    }
    return mm + ":" + ss + "." + ms.substring(0, 1);
  }

  function getPayloadDisplayStartTime(payload) {
    var meta = payload && payload.meta ? payload.meta : {};
    if (meta.timelineNormalizedToZero) {
      return 0;
    }
    var value = Number(meta.compDisplayStartTime);
    if (!isNaN(value) && value > 0) {
      return value;
    }
    value = Number(meta.displayStartTime);
    if (!isNaN(value) && value > 0) {
      return value;
    }
    value = Number(activeCompDisplayStartTime);
    return !isNaN(value) && value > 0 ? value : 0;
  }

  function formatCaptionDisplayTime(seconds, includeHours, payload) {
    var offset = getPayloadDisplayStartTime(payload);
    return formatCaptionTime(Math.max(0, (Number(seconds) || 0) - offset), includeHours);
  }

  function setPreviewQuoteFromCaptionText(text) {
    var clean = sanitizePreviewQuote(text);
    if (!clean || !stylePreviewTextEl || !stylePreviewTextEl.dataset) {
      return;
    }
    stylePreviewTextEl.dataset.quote = clean;
    lastPreviewQuoteSource = "review caption";
    updateStylePreview();
  }

  function renderTranscriptReview() {
    if (!transcriptReviewListEl) {
      return;
    }
    if (!transcriptReviewHasFreshPayload) {
      transcriptReviewListEl.innerHTML = "";
      if (transcriptReviewMetaEl) {
        transcriptReviewMetaEl.textContent = "Current audio has not been transcribed yet.";
      }
      return;
    }
    var payload = readSubtitlesPayload();
    var items = payload && Array.isArray(payload.items) ? payload.items.slice() : [];
    if (!items.length) {
      transcriptReviewListEl.innerHTML = "";
      if (transcriptReviewMetaEl) {
        transcriptReviewMetaEl.textContent = "Current audio has not been transcribed yet.";
      }
      return;
    }

    transcriptReviewListEl.innerHTML = "";
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++) {
      var item = items[i] || {};
      var source = getCaptionReviewSource(item);
      var row = document.createElement("div");
      row.className = (i === 0 ? "caption-row active" : "caption-row") + " is-" + source.key;
      row.setAttribute("data-caption-source", source.key);
      row.setAttribute("data-caption-index", String(i));

      var time = document.createElement("div");
      time.className = "caption-row-time";
      time.textContent = formatCaptionDisplayTime(item.start, false, payload) + " - " + formatCaptionDisplayTime(item.end, false, payload);

      var body = document.createElement("div");
      body.className = "caption-row-body";

      var sourceBadge = document.createElement("span");
      sourceBadge.className = "caption-row-source caption-row-source-" + source.key;
      sourceBadge.textContent = source.label;
      sourceBadge.title = source.title;

      var actions = document.createElement("div");
      actions.className = "caption-row-actions";
      var prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "caption-row-shift";
      prevBtn.textContent = "Prev";
      prevBtn.disabled = i <= 0;
      prevBtn.title = "Move selected text, or the first word, to previous caption";
      var nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "caption-row-shift";
      nextBtn.textContent = "Next";
      nextBtn.disabled = i >= items.length - 1;
      nextBtn.title = "Move selected text, or the last word, to next caption";
      actions.appendChild(prevBtn);
      actions.appendChild(nextBtn);

      var text = document.createElement("div");
      text.className = "caption-row-text";
      text.contentEditable = "true";
      text.spellcheck = false;
      text.dataset.captionIndex = String(i);
      var captionText = getCaptionItemText(item);
      text.innerHTML = buildCaptionReviewHtml(captionText, item.wordRuleHighlights);
      text.title = "Edit spoken text, then blur or press Enter to save";
      text.addEventListener("click", function (event) {
        setPreviewQuoteFromCaptionText(this.innerText);
        event.stopPropagation();
      });
      text.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          saveCaptionReviewEdit(Number(this.dataset.captionIndex), this.innerText);
          this.blur();
        }
      });
      text.addEventListener("blur", function () {
        saveCaptionReviewEdit(Number(this.dataset.captionIndex), this.innerText);
      });
      prevBtn.addEventListener("click", (function (textEl, rowIndex) {
        return function (event) {
          event.stopPropagation();
          moveCaptionReviewText(rowIndex, -1, getSelectedTextInside(textEl));
        };
      })(text, i));
      nextBtn.addEventListener("click", (function (textEl, rowIndex) {
        return function (event) {
          event.stopPropagation();
          moveCaptionReviewText(rowIndex, 1, getSelectedTextInside(textEl));
        };
      })(text, i));
      row.addEventListener("click", (function (captionValue) {
        return function () {
          setPreviewQuoteFromCaptionText(captionValue);
        };
      })(captionText));

      body.appendChild(sourceBadge);
      body.appendChild(actions);
      body.appendChild(text);
      row.appendChild(time);
      row.appendChild(body);
      fragment.appendChild(row);
    }
    transcriptReviewListEl.appendChild(fragment);
    if (transcriptReviewMetaEl) {
      var referenceCount = items.filter(function (item) { return item && item.referenceTextApplied; }).length;
      var changedReferenceCount = items.filter(function (item) { return isReferenceChangedCaptionItem(item); }).length;
      var modelCount = items.length - referenceCount;
      var modelLabel = getPayloadModelLabel(payload);
      var modelStaleNote = getPayloadModelStaleNote(payload);
      transcriptReviewMetaEl.textContent =
        items.length + " of " + payload.items.length +
        " captions loaded from tmp/subtitles.json. " +
        referenceCount + " reference-linked, " + changedReferenceCount + " changed, " + modelCount + " model-only. " +
        "Model: " + modelLabel + modelStaleNote + ".";
    }
  }

  function buildTranscriptReviewCopyText() {
    if (!transcriptReviewHasFreshPayload) {
      throw new Error("Transcribe current audio before copying captions.");
    }
    var payload = readSubtitlesPayload();
    var items = payload && Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) {
      throw new Error("Generate captions before copying spoken text.");
    }
    var lines = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i] || {};
      var text = sanitizePreviewQuote((Array.isArray(item.lines) && item.lines.length) ? item.lines.join(" ") : item.text);
      if (text) {
        lines.push(text);
      }
    }
    if (!lines.length) {
      throw new Error("No spoken caption text found to copy.");
    }
    return lines.join("\n");
  }

  async function copyTranscriptReviewToClipboard() {
    await copyTextToClipboard(buildTranscriptReviewCopyText());
    flashButtonText("btnCopyCaptions", "Copied", 1400);
    setStatus("Copied spoken captions to clipboard.");
  }

  function buildSubtitleExport(format) {
    if (!transcriptReviewHasFreshPayload) {
      throw new Error("Transcribe current audio before exporting " + format.toUpperCase() + ".");
    }
    var payload = readSubtitlesPayload();
    var items = payload && Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) {
      throw new Error("Generate captions before exporting " + format.toUpperCase() + ".");
    }
    if (format === "vtt") {
      var vtt = ["WEBVTT", ""];
      for (var v = 0; v < items.length; v++) {
        var vi = items[v] || {};
        var vText = (Array.isArray(vi.lines) && vi.lines.length) ? vi.lines.join("\\n") : String(vi.text || "");
        vtt.push(formatCaptionDisplayTime(vi.start, true, payload) + " --> " + formatCaptionDisplayTime(vi.end, true, payload));
        vtt.push(vText);
        vtt.push("");
      }
      return vtt.join("\\n");
    }

    var srt = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i] || {};
      var text = (Array.isArray(item.lines) && item.lines.length) ? item.lines.join("\\n") : String(item.text || "");
      srt.push(String(i + 1));
      srt.push(formatCaptionDisplayTime(item.start, true, payload).replace(".", ",") + " --> " + formatCaptionDisplayTime(item.end, true, payload).replace(".", ","));
      srt.push(text);
      srt.push("");
    }
    return srt.join("\\n");
  }

  function exportSubtitleFile(format) {
    if (!hasNodeBridge || !fs || !path) {
      throw new Error("Export requires the CEP Node bridge inside After Effects.");
    }
    var repoRoot = getRepoRoot();
    var outPath = path.join(repoRoot, "tmp", format === "vtt" ? "subtitles.vtt" : "subtitles.srt");
    fs.writeFileSync(outPath, buildSubtitleExport(format), "utf8");
    setStatus("Exported " + format.toUpperCase() + ": " + outPath);
  }

  function getPreviewQuotePool() {
    var transcriptSamples = readTranscriptPreviewSamples();
    if (transcriptSamples.length) {
      lastPreviewQuoteSource = "last transcript";
      return transcriptSamples;
    }
    lastPreviewQuoteSource = "sample line";
    return getPreviewFallbackQuotesForLanguage(getValue("language") || "auto");
  }

  function getPreviewQuoteStressScore(text) {
    var normalized = sanitizePreviewQuote(text);
    if (!normalized) {
      return 0;
    }
    var words = normalized.split(/\s+/).filter(Boolean);
    var visualLimit = getVisualChunkWordLimit(getMaxLinesControlValue());
    var overLimit = Math.max(0, words.length - visualLimit);
    return (words.length * 24) + normalized.length + (overLimit * 80);
  }

  function pickStressPreviewQuote() {
    var previewQuotes = getPreviewQuotePool();
    if (!previewQuotes.length) {
      lastPreviewQuoteSource = "sample line";
      return "I know exactly what you mean.";
    }
    var bestIndex = 0;
    var bestScore = -1;
    for (var i = 0; i < previewQuotes.length; i++) {
      var score = getPreviewQuoteStressScore(previewQuotes[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    previewQuoteIndex = bestIndex;
    return previewQuotes[bestIndex];
  }

  function pickRandomPreviewQuote() {
    var previewQuotes = getPreviewQuotePool();
    if (!previewQuotes.length) {
      lastPreviewQuoteSource = "sample line";
      return "I know exactly what you mean.";
    }
    var nextIndex = previewQuoteIndex;
    if (previewQuotes.length === 1) {
      nextIndex = 0;
    } else {
      while (nextIndex === previewQuoteIndex) {
        nextIndex = Math.floor(Math.random() * previewQuotes.length);
      }
    }
    previewQuoteIndex = nextIndex;
    return previewQuotes[previewQuoteIndex];
  }

  function getPreviewMeasureContext() {
    if (!previewMeasureCanvas && typeof document !== "undefined" && document.createElement) {
      previewMeasureCanvas = document.createElement("canvas");
    }
    return previewMeasureCanvas && previewMeasureCanvas.getContext
      ? previewMeasureCanvas.getContext("2d")
      : null;
  }

  function getPreviewCaptionMaxWidth(preset, stageWidthOverride) {
    var stageWidth = stageWidthOverride
      ? Number(stageWidthOverride)
      : (stylePreviewStageEl && stylePreviewStageEl.clientWidth
        ? stylePreviewStageEl.clientWidth
        : 500);
    if (!stageWidth || isNaN(stageWidth)) {
      stageWidth = 500;
    }
    var presetWidth = Math.max(220, Number(preset && preset.maxTextWidth) || 500);
    return Math.max(180, Math.min(presetWidth, Math.max(180, stageWidth - 28)));
  }

  function getPreviewTextMaxWidth(preset, captionMaxWidth) {
    var padX = 4;
    if (preset && preset.boxEnabled) {
      var rawPadX = Number(
        preset.boxPaddingX !== undefined
          ? preset.boxPaddingX
          : (preset.boxPadding !== undefined ? preset.boxPadding : 18)
      );
      padX = Math.max(4, rawPadX * 0.45);
    }
    return Math.max(32, captionMaxWidth - (padX * 2) - 8);
  }

  function getLayoutPreviewCaptionMaxWidth(preset, previewScale) {
    var stageWidth = layoutPreviewStageEl && layoutPreviewStageEl.clientWidth
      ? layoutPreviewStageEl.clientWidth
      : 520;
    var scale = Number(previewScale) || getLayoutPreviewScale();
    var compBlockWidth = Math.max(180, Number(preset && preset.maxTextWidth) || 500);
    return Math.max(48, Math.min(stageWidth - 16, Math.round(compBlockWidth * scale)));
  }

  function getPreviewCompDimensions() {
    var width = Number(activeCompWidth) || 1080;
    var height = Number(activeCompHeight) || 1920;
    if (!(width > 0) || !(height > 0)) {
      width = 1080;
      height = 1920;
    }
    return { width: width, height: height };
  }

  function getPreviewDesignScaleForComp() {
    var dims = getPreviewCompDimensions();
    var vertical = dims.height >= dims.width;
    var designWidth = vertical ? 1080 : 1920;
    var designHeight = vertical ? 1920 : 1080;
    return Math.max(0.1, Math.min(4, Math.min(dims.width / designWidth, dims.height / designHeight)));
  }

  function getLayoutPreviewScale() {
    var dims = getPreviewCompDimensions();
    var stageHeight = layoutPreviewStageEl && layoutPreviewStageEl.clientHeight
      ? layoutPreviewStageEl.clientHeight
      : 412;
    var stageWidth = layoutPreviewStageEl && layoutPreviewStageEl.clientWidth
      ? layoutPreviewStageEl.clientWidth
      : 232;
    var displayScale = Math.min(stageWidth / dims.width, stageHeight / dims.height);
    return Math.max(0.01, getPreviewDesignScaleForComp() * displayScale);
  }

  function syncLayoutPreviewStageAspect() {
    if (!layoutPreviewStageEl) {
      return;
    }
    var dims = getPreviewCompDimensions();
    layoutPreviewStageEl.style.aspectRatio = String(dims.width) + " / " + String(dims.height);
    layoutPreviewStageEl.setAttribute("data-comp-size", Math.round(dims.width) + "x" + Math.round(dims.height));
  }

  function measurePreviewLineWidth(words, fontInfo, preset, fontSize, strokeWidth) {
    if (!words || !words.length) {
      return 0;
    }
    var ctx = getPreviewMeasureContext();
    var fontStyleName = fontInfo && (fontInfo.styleName || fontInfo.postScriptName || fontInfo.fullName);
    var fontStyle = mapFontStyle(fontStyleName, preset);
    var fontWeight = mapFontWeight(fontStyleName);
    var fontFamily = getPreviewCssFamily(fontInfo);
    var lineText = words.join(" ");
    var visibleChars = lineText.replace(/\s+/g, "").length;
    var letterSpacing = Math.max(0, Number(preset && preset.tracking) || 0) * 0.02;
    var width = 0;
    if (ctx) {
      ctx.font = fontStyle + " " + fontWeight + " " + fontSize + "px " + fontFamily;
      width = ctx.measureText(lineText).width;
    } else {
      width = lineText.length * fontSize * 0.62;
    }
    width += Math.max(0, visibleChars - 1) * letterSpacing;
    width += Math.max(0, strokeWidth) * 2.4;
    width += 6;
    return width;
  }

  function enumeratePreviewWordLayouts(words, lineCount) {
    if (!words.length) {
      return [[[]]];
    }
    if (lineCount <= 1) {
      return [[words.slice()]];
    }
    if (lineCount > words.length) {
      return [];
    }
    var layouts = [];
    function walk(startIndex, remainingLines, acc) {
      if (remainingLines === 1) {
        acc.push(words.slice(startIndex));
        layouts.push(acc.map(function (line) { return line.slice(); }));
        acc.pop();
        return;
      }
      var maxEnd = words.length - (remainingLines - 1);
      for (var end = startIndex + 1; end <= maxEnd; end++) {
        acc.push(words.slice(startIndex, end));
        walk(end, remainingLines - 1, acc);
        acc.pop();
      }
    }
    walk(0, lineCount, []);
    return layouts;
  }

  function buildPreviewWordPairLines(words) {
    var lines = [];
    for (var i = 0; i < words.length; i += 2) {
      lines.push(words.slice(i, i + 2));
    }
    return lines.length ? lines : [words.slice()];
  }

  function getPreviewBalancedLineRange(words, preset) {
    var wordCount = words ? words.length : 0;
    if (!wordCount) {
      return { minLines: 1, maxLines: 1, preferredLines: 1 };
    }
    var hardMaxLines = Math.max(1, Math.min(4, Math.round(Number(preset && preset.maxLines) || getMaxLinesControlValue())));
    if (preset && preset.forceTwoLines) {
      var forcedLines = Math.min(2, hardMaxLines, wordCount);
      return { minLines: forcedLines, maxLines: forcedLines, preferredLines: forcedLines };
    }
    var minLines = wordCount >= 4 ? 2 : 1;
    var maxLines = Math.min(hardMaxLines, wordCount);
    minLines = Math.min(minLines, maxLines);
    var preferredLines = 1;
    if (wordCount >= 10) {
      preferredLines = 4;
    } else if (wordCount >= 7) {
      preferredLines = 3;
    } else if (wordCount >= 4) {
      preferredLines = 2;
    }
    preferredLines = Math.max(minLines, Math.min(maxLines, preferredLines));
    return {
      minLines: minLines,
      maxLines: maxLines,
      preferredLines: preferredLines
    };
  }

  function getPreviewLineLayoutPenalty(layout, totalWords, preferredLines) {
    var penalty = 0;
    var lineCount = layout ? layout.length : 0;
    if (!lineCount) {
      return 1000000;
    }
    var targetWords = lineCount > 0 ? totalWords / lineCount : totalWords;
    for (var i = 0; i < lineCount; i++) {
      var lineWords = layout[i] || [];
      var wordCount = lineWords.length;
      penalty += Math.abs(wordCount - targetWords) * 38;
      if (lineCount > 1 && totalWords >= 4) {
        if (wordCount <= 0) {
          penalty += 1000000;
        } else if (wordCount === 1) {
          penalty += 1000000;
          if (i === 0 || i === lineCount - 1) {
            penalty += 1500000;
          }
          if (String(lineWords[0] || "").replace(/[^A-Za-z0-9\u0900-\u097Fа-яіїєґñáéíóúü]/g, "").length <= 3) {
            penalty += 750000;
          }
        }
      }
    }
    return penalty;
  }

  function pickBestPreviewWordLayout(words, preset, fontInfo, fontSize, strokeWidth, maxWidth) {
    if (!words.length) {
      return {
        lines: [[]],
        overflow: 0,
        maxLineWidth: 0,
        textMaxWidth: maxWidth
      };
    }
    if (preset && preset.forceTwoLines && words.length === 1 && Math.max(1, Math.min(4, Math.round(Number(preset.maxLines) || getMaxLinesControlValue()))) >= 2) {
      var singleWidths = [
        0,
        measurePreviewLineWidth(words, fontInfo, preset, fontSize, strokeWidth)
      ];
      return {
        lines: [[], words.slice()],
        overflow: Math.max(0, singleWidths[1] - maxWidth),
        maxLineWidth: singleWidths[1],
        textMaxWidth: maxWidth
      };
    }
    if (preset && (preset.chunkWordsEnabled || preset.forceTwoLines) && words.length >= 3 && words.length <= 4) {
      var pairLines = buildPreviewWordPairLines(words);
      var pairMaxLines = Math.max(1, Math.min(4, Math.round(Number(preset && preset.maxLines) || getMaxLinesControlValue())));
      if (pairLines.length > pairMaxLines) {
        pairLines = null;
      }
      if (pairLines) {
      var pairOverflow = 0;
      var pairMaxLineWidth = 0;
      for (var pairIdx = 0; pairIdx < pairLines.length; pairIdx++) {
        var pairWidth = measurePreviewLineWidth(pairLines[pairIdx], fontInfo, preset, fontSize, strokeWidth);
        pairMaxLineWidth = Math.max(pairMaxLineWidth, pairWidth);
        pairOverflow += Math.max(0, pairWidth - maxWidth);
      }
      return {
        lines: pairLines,
        overflow: pairOverflow,
        maxLineWidth: pairMaxLineWidth,
        textMaxWidth: maxWidth
      };
      }
    }

    var lineRange = getPreviewBalancedLineRange(words, preset);
    var minLines = lineRange.minLines;
    var maxLines = lineRange.maxLines;
    var preferredLines = lineRange.preferredLines;
    var best = null;

    for (var lineCount = minLines; lineCount <= maxLines; lineCount++) {
      var layouts = enumeratePreviewWordLayouts(words, lineCount);
      for (var i = 0; i < layouts.length; i++) {
        var layout = layouts[i];
        var widths = [];
        var overflow = 0;
        var maxLineWidth = 0;
        var minLineWidth = Number.MAX_VALUE;
        var density = 0;
        for (var j = 0; j < layout.length; j++) {
          var width = measurePreviewLineWidth(layout[j], fontInfo, preset, fontSize, strokeWidth);
          widths.push(width);
          maxLineWidth = Math.max(maxLineWidth, width);
          minLineWidth = Math.min(minLineWidth, width);
          overflow += Math.max(0, width - maxWidth);
          density += Math.abs(layout[j].join(" ").length - (words.join(" ").length / lineCount));
        }
        var targetWidth = maxWidth * (lineCount >= 4 ? 0.66 : (lineCount >= 3 ? 0.76 : 0.86));
        var underfill = Math.max(0, targetWidth - maxLineWidth);
        var widthDelta = Math.abs(maxLineWidth - targetWidth);
        var fillRatio = maxWidth > 0 ? maxLineWidth / maxWidth : 1;
        var columnPenalty = fillRatio < 0.52 && words.length >= 5 ? (0.52 - fillRatio) * 240 : 0;
        var layoutPenalty = getPreviewLineLayoutPenalty(layout, words.length, preferredLines);
        var tallPenalty = lineCount > preferredLines ? Math.pow(lineCount - preferredLines, 2) * 48 : 0;
        var shortLinePenalty = 0;
        for (var k = 0; k < layout.length; k++) {
          var lineLength = layout[k].join(" ").length;
          if (layout[k].length === 1 && words.length >= 4) {
            shortLinePenalty += 180;
          }
          if (lineLength <= 4) {
            shortLinePenalty += 90;
          } else if (lineLength <= 8) {
            shortLinePenalty += 24;
          }
        }
        var score =
          (overflow * 1000) +
          (underfill * 1.6) +
          (widthDelta * 0.45) +
          ((maxLineWidth - minLineWidth) * 0.9) +
          (density * 0.8) +
          (Math.abs(lineCount - preferredLines) * 26) +
          layoutPenalty +
          tallPenalty +
          columnPenalty +
          shortLinePenalty;
        if (preset && preset.forceTwoLines && layout.length === 2) {
          score += Math.abs(layout[0].join(" ").length - layout[1].join(" ").length) * 2.5;
        }
        if (!best || score < best.score) {
          best = {
            lines: layout,
            overflow: overflow,
            maxLineWidth: maxLineWidth,
            textMaxWidth: maxWidth,
            score: score
          };
        }
      }
    }

    return best || {
      lines: [words.slice()],
      overflow: 0,
      maxLineWidth: measurePreviewLineWidth(words, fontInfo, preset, fontSize, strokeWidth),
      textMaxWidth: maxWidth
    };
  }

  function buildPreviewTextLayout(text, preset, fontInfo, baseFontSize, strokeWidth, options) {
    options = options || {};
    var normalized = String(text || "").replace(/^"+|"+$/g, "").trim();
    if (!normalized) {
      normalized = "Кадр за кадром, рядок за рядком.";
    }
    if (preset && preset.forceUppercase) {
      normalized = normalized.toUpperCase();
    }
    var words = normalized.split(/\s+/);
    var accentIndex = -1;
    if (preset && preset.accentWordIndex !== undefined && words.length) {
      accentIndex = Math.max(0, Math.min(words.length - 1, Number(preset.accentWordIndex) || 0));
    } else if (preset && (preset.karaokeEnabled || preset.wordBoxEnabled) && words.length) {
      accentIndex = words.length >= 3 ? 1 : words.length - 1;
    } else if (preset && preset.accentLastWord && words.length) {
      accentIndex = words.length - 1;
    }
    var captionMaxWidth = Math.max(
      100,
      Number(options.captionMaxWidth) || getPreviewCaptionMaxWidth(preset, options.stageWidth)
    );
    var textMaxWidth = getPreviewTextMaxWidth(preset, captionMaxWidth);
    var minFontSize = Math.max(
      1,
      Math.min(baseFontSize, Number(options.minFontSize) || Math.round(baseFontSize * 0.58))
    );
    var bestLayout = null;
    for (var fontSize = baseFontSize; fontSize >= minFontSize; fontSize--) {
      var candidate = pickBestPreviewWordLayout(words, preset, fontInfo, fontSize, strokeWidth, textMaxWidth);
      candidate.fontSize = fontSize;
      candidate.captionMaxWidth = captionMaxWidth;
      if (!bestLayout ||
          candidate.overflow < bestLayout.overflow ||
          (candidate.overflow === bestLayout.overflow && candidate.maxLineWidth < bestLayout.maxLineWidth)) {
        bestLayout = candidate;
      }
      if (candidate.overflow <= 0) {
        bestLayout = candidate;
        break;
      }
    }
    return {
      normalized: normalized,
      accentIndex: accentIndex,
      lines: bestLayout && bestLayout.lines ? bestLayout.lines : [words.slice()],
      fontSize: bestLayout && bestLayout.fontSize ? bestLayout.fontSize : baseFontSize,
      captionMaxWidth: captionMaxWidth,
      textMaxWidth: textMaxWidth
    };
  }

  function buildPreviewTextHtml(layout) {
    var html = [];
    var globalIndex = 0;
    var lines = layout && layout.lines ? layout.lines : [[]];
    var accentIndex = layout ? layout.accentIndex : -1;
    for (var i = 0; i < lines.length; i++) {
      var lineWords = lines[i];
      if (!lineWords.length) {
        html.push('<span class="style-preview-line">&nbsp;</span>');
        continue;
      }
      var parts = [];
      for (var j = 0; j < lineWords.length; j++) {
        var cls = "style-preview-word";
        if (globalIndex === accentIndex) {
          cls += " is-active";
        } else if (accentIndex >= 0 && globalIndex > accentIndex) {
          cls += " is-future";
        }
        parts.push('<span class="' + cls + '">' + escapeHtml(lineWords[j]) + "</span>");
        globalIndex++;
      }
      html.push('<span class="style-preview-line">' + parts.join(" ") + "</span>");
    }
    return html.join("");
  }

  function computeSelfTestPreviewLayout(text, presetName, overrides, options) {
    overrides = overrides || {};
    options = options || {};
    var presetKey = String(presetName || DEFAULT_PRESET_NAME);
    var preset = getPresetPreviewConfig(presetKey);
    for (var key in overrides) {
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        preset[key] = Array.isArray(overrides[key]) ? overrides[key].slice() : overrides[key];
      }
    }
    if (isBoxDisabledPreset(presetKey)) {
      disableBoxFeaturesForVisiblePreset(preset);
      preset.backplateEnabled = false;
      preset.lineBoxEnabled = false;
    }
    if (!previewFontEntries.length) {
      previewFontEntries = buildFallbackFonts();
    }
    var fontInfo = findFontEntryByPostScript(preset.font) || {
      postScriptName: String(preset.font || "Arial-BoldMT"),
      familyName: String(preset.font || "Arial-BoldMT"),
      styleName: "",
      fullName: String(preset.font || "Arial-BoldMT")
    };
    var fontSize = Math.max(1, Math.round(Number(options.fontSize || preset.fontSize) || 60));
    var strokeWidth = Math.max(0, Number(options.strokeWidth !== undefined ? options.strokeWidth : preset.strokeWidth) || 0);
    var captionMaxWidth = Math.max(100, Number(options.captionMaxWidth || preset.maxTextWidth) || 500);
    var layout = buildPreviewTextLayout(String(text || ""), preset, fontInfo, fontSize, strokeWidth, {
      captionMaxWidth: captionMaxWidth,
      minFontSize: Math.max(1, Math.round(Number(options.minFontSize || fontSize) || fontSize))
    });
    var lineStrings = [];
    for (var i = 0; i < layout.lines.length; i++) {
      lineStrings.push(layout.lines[i].join(" "));
    }
    return {
      version: APP_VERSION,
      preset: presetKey,
      font: fontInfo.postScriptName || preset.font || "",
      fontSize: layout.fontSize,
      captionMaxWidth: layout.captionMaxWidth,
      textMaxWidth: layout.textMaxWidth,
      lines: lineStrings
    };
  }

  function exposeSelfTestHooks() {
    if (typeof window === "undefined") {
      return;
    }
    window.AEAS_TEST_HOOKS = {
      version: APP_VERSION,
      computePreviewLayout: computeSelfTestPreviewLayout
    };
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("data-aeas-test-hooks", "ready");
      if (!window.__AEAS_SELFTEST_BRIDGE_BOUND) {
        window.__AEAS_SELFTEST_BRIDGE_BOUND = true;
        document.addEventListener("aeas-selftest-preview-request", function () {
          var requestEl = document.getElementById("aeasSelftestPreviewRequest");
          var resultEl = document.getElementById("aeasSelftestPreviewResult");
          if (!requestEl || !resultEl) {
            return;
          }
          try {
            var payload = JSON.parse(requestEl.textContent || "{}");
            var result = computeSelfTestPreviewLayout(
              payload.text || "",
              payload.preset || DEFAULT_PRESET_NAME,
              payload.overrides || {},
              payload.options || {}
            );
            resultEl.textContent = JSON.stringify({ ok: true, result: result });
          } catch (err) {
            resultEl.textContent = JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) });
          }
        });
      }
      var queryPayload = null;
      try {
        var match = String(window.location && window.location.search || "").match(/[?&]aeasSelftestPreview=([^&]+)/);
        if (match && match[1]) {
          queryPayload = JSON.parse(decodeURIComponent(match[1].replace(/\+/g, "%20")));
        }
      } catch (_queryErr) {
        queryPayload = null;
      }
      if (queryPayload) {
        try {
          var queryResult = computeSelfTestPreviewLayout(
            queryPayload.text || "",
            queryPayload.preset || DEFAULT_PRESET_NAME,
            queryPayload.overrides || {},
            queryPayload.options || {}
          );
          document.documentElement.setAttribute("data-aeas-preview-result", JSON.stringify({ ok: true, result: queryResult }));
        } catch (err2) {
          document.documentElement.setAttribute("data-aeas-preview-result", JSON.stringify({ ok: false, error: String(err2 && err2.message ? err2.message : err2) }));
        }
      }
    }
  }

  function buildPreviewTextShadowCss(preset, scale) {
    scale = Number(scale) || 1;
    var shadows = [];
    if (preset && preset.strokeEnabled) {
      var strokeWidth = Math.max(0, Math.round((Number(preset.strokeWidth) || 0) * scale));
      var strokeColor = toCssRgb(preset.strokeColor || [0, 0, 0], 1);
      var dirs = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [-1, 1], [1, -1], [-1, -1]
      ];
      for (var r = 1; r <= Math.min(12, strokeWidth); r++) {
        for (var d = 0; d < dirs.length; d++) {
          shadows.push((dirs[d][0] * r) + "px " + (dirs[d][1] * r) + "px 0 " + strokeColor);
        }
      }
    }
    if (preset && preset.shadowEnabled) {
      var shadowColor = preset.shadowColor || [0, 0, 0];
      var shadowAlpha = Math.max(0, Math.min(1, Number(preset.shadowOpacity !== undefined ? preset.shadowOpacity : 60) / 100));
      var shadowX = Number(preset.shadowOffsetX !== undefined ? preset.shadowOffsetX : 0);
      var shadowY = Number(preset.shadowDistance !== undefined ? preset.shadowDistance : 4);
      var shadowBlur = Number(preset.shadowBlur !== undefined ? preset.shadowBlur : 8);
      shadows.push(
        Math.round(shadowX * scale) + "px " +
        Math.round(shadowY * scale) + "px " +
        Math.max(0, Math.round(shadowBlur * scale)) + "px " +
        toCssRgb(shadowColor, shadowAlpha)
      );
      return shadows.join(", ");
    }
    if (preset && preset.strokeEnabled) {
      shadows.push("0 4px 14px rgba(0, 0, 0, 0.30)");
      return shadows.join(", ");
    }
    return "0 3px 10px rgba(0, 0, 0, 0.22)";
  }

  function buildLayoutPreviewSampleText(text, maxChars, preset) {
    var normalized = String(text || "").replace(/^"+|"+$/g, "").trim();
    if (!normalized) {
      return "Кадр за кадром, рядок за рядком.";
    }
    var words = normalized.split(/\s+/);
    if (!words.length) {
      return normalized;
    }
    var visualLimit = getVisualChunkWordLimit(getMaxLinesControlValue());
    if (words.length > visualLimit) {
      return words.slice(0, visualLimit).join(" ");
    }
    if (preset && preset.chunkWordsEnabled) {
      var targetWords = Math.max(2, Math.min(visualLimit, Number(preset.chunkTargetWords) || visualLimit));
      return words.slice(0, Math.min(words.length, targetWords)).join(" ");
    }
    return normalized;
  }

  function applyPreviewTextStyles(targetEl, preset, fontInfo, fontSize, strokeWidth) {
    if (!targetEl) {
      return;
    }
    var previewFontStyleName = fontInfo && (fontInfo.styleName || fontInfo.postScriptName || fontInfo.fullName);
    targetEl.style.fontFamily = getPreviewCssFamily(fontInfo);
    targetEl.style.fontWeight = mapFontWeight(previewFontStyleName);
    targetEl.style.fontStyle = mapFontStyle(previewFontStyleName, preset);
    targetEl.style.fontSize = fontSize + "px";
    targetEl.style.letterSpacing = ((Number(preset.tracking) || 0) * 0.02).toFixed(2) + "px";
    targetEl.style.lineHeight = Math.max(0.9, Math.min(1.3, (Number(preset.leading) || 66) / Math.max(1, Number(preset.fontSize) || 60))).toFixed(2);
    targetEl.style.color = toCssRgb(preset.fillColor || [1, 1, 1], 1);
    targetEl.style.textTransform = preset.forceUppercase || preset.allCaps ? "uppercase" : "none";
    targetEl.style.webkitTextStrokeWidth = "0px";
    targetEl.style.webkitTextStrokeColor = strokeWidth ? toCssRgb(preset.strokeColor || [0, 0, 0], 1) : "transparent";
    targetEl.style.paintOrder = strokeWidth ? "stroke fill" : "normal";
    targetEl.classList.toggle("has-line-box", isBackplateEnabled(preset));
    if (preset && isBackplateEnabled(preset)) {
      var lineBoxAlpha = Math.max(0, Math.min(1, Number(preset.backplateOpacity !== undefined ? preset.backplateOpacity : (preset.lineBoxOpacity !== undefined ? preset.lineBoxOpacity : 100)) / 100));
      var lineBoxPadX = Number(preset.backplatePaddingX !== undefined ? preset.backplatePaddingX : (preset.lineBoxPaddingX !== undefined ? preset.lineBoxPaddingX : 24));
      var lineBoxPadY = Number(preset.backplatePaddingY !== undefined ? preset.backplatePaddingY : (preset.lineBoxPaddingY !== undefined ? preset.lineBoxPaddingY : 12));
      var lineBoxRoundness = Number(preset.backplateRoundness !== undefined ? preset.backplateRoundness : (preset.lineBoxRoundness !== undefined ? preset.lineBoxRoundness : 20));
      targetEl.style.setProperty("--line-box-color", toCssRgb(getBackplateColor(preset), lineBoxAlpha));
      targetEl.style.setProperty("--line-box-pad-x", Math.max(0.18, lineBoxPadX / Math.max(1, Number(preset.fontSize) || 80)).toFixed(3) + "em");
      targetEl.style.setProperty("--line-box-pad-y", Math.max(0.08, lineBoxPadY / Math.max(1, Number(preset.fontSize) || 80)).toFixed(3) + "em");
      targetEl.style.setProperty("--line-box-radius", Math.max(0.12, lineBoxRoundness / Math.max(1, Number(preset.fontSize) || 80)).toFixed(3) + "em");
    } else {
      targetEl.style.removeProperty("--line-box-color");
      targetEl.style.removeProperty("--line-box-pad-x");
      targetEl.style.removeProperty("--line-box-pad-y");
      targetEl.style.removeProperty("--line-box-radius");
    }
    targetEl.style.textShadow = buildPreviewTextShadowCss(
      preset,
      Math.max(0.48, Math.min(1, Number(fontSize || 24) / Math.max(1, Number(preset.fontSize) || 60)))
    );
  }

  function applyPreviewAccentStyles(targetEl, preset) {
    if (!targetEl) {
      return;
    }
    var activeWords = targetEl.querySelectorAll(".style-preview-word.active");
    for (var i = 0; i < activeWords.length; i++) {
      if (preset.wordBoxEnabled) {
        activeWords[i].style.color = toCssRgb(preset.wordFillColor || preset.fillColor || [1, 1, 1], 1);
        activeWords[i].style.backgroundColor = toCssRgb(
          preset.wordBoxColor || preset.accentColor || [0.22, 0.63, 1],
          Math.max(0, Math.min(1, Number(preset.wordBoxOpacity !== undefined ? preset.wordBoxOpacity : 100) / 100))
        );
        activeWords[i].style.padding =
          Math.max(1, Math.round(Number(preset.wordBoxPaddingY !== undefined ? preset.wordBoxPaddingY : 3) * 0.6)) +
          "px " +
          Math.max(3, Math.round(Number(preset.wordBoxPaddingX !== undefined ? preset.wordBoxPaddingX : 8) * 0.6)) +
          "px";
        activeWords[i].style.borderRadius = Math.max(3, Math.round(Number(preset.wordBoxRoundness !== undefined ? preset.wordBoxRoundness : 6) * 0.75)) + "px";
        activeWords[i].style.webkitTextStrokeWidth = "0px";
        activeWords[i].style.webkitTextStrokeColor = "transparent";
      } else {
        activeWords[i].style.color = toCssRgb(preset.accentColor || preset.fillColor || [1, 1, 1], 1);
        activeWords[i].style.backgroundColor = "transparent";
        activeWords[i].style.padding = "0px";
        activeWords[i].style.borderRadius = "0px";
      }
    }
  }

  function applyPreviewCaptionSurface(targetEl, preset, scale) {
    if (!targetEl) {
      return;
    }
    scale = Number(scale) || 1;
    if (preset.boxEnabled) {
      var boxAlpha = Math.max(0, Math.min(1, Number(preset.boxOpacity !== undefined ? preset.boxOpacity : 80) / 100));
      var previewPadY = Number(preset.boxPaddingY !== undefined ? preset.boxPaddingY : (preset.boxPadding !== undefined ? preset.boxPadding : 12));
      var previewPadX = Number(preset.boxPaddingX !== undefined ? preset.boxPaddingX : (preset.boxPadding !== undefined ? preset.boxPadding : 18));
      var previewRoundness = Number(preset.boxRoundness !== undefined ? preset.boxRoundness : (preset.boxSmart ? 999 : 8));
      targetEl.style.backgroundColor = toCssRgb(preset.boxColor || [0, 0, 0], boxAlpha);
      targetEl.style.padding = Math.max(2, Math.round(previewPadY * 0.45 * scale)) +
        "px " +
        Math.max(4, Math.round(previewPadX * 0.45 * scale)) +
        "px";
      targetEl.style.borderRadius = Math.max(0, Math.round(Math.min(previewRoundness, 999) * 0.35 * scale)) + "px";
      targetEl.style.border = preset.boxStrokeEnabled
        ? Math.max(1, Math.round(Number(preset.boxStrokeWidth !== undefined ? preset.boxStrokeWidth : 1) * 0.5 * scale)) +
          "px solid " + toCssRgb(preset.boxStrokeColor || [0.4, 0.4, 0.4], 1)
        : "1px solid transparent";
      targetEl.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.18)";
      return;
    }
    targetEl.style.backgroundColor = "transparent";
    targetEl.style.padding = Math.max(1, Math.round(2 * scale)) + "px " + Math.max(2, Math.round(4 * scale)) + "px";
    targetEl.style.borderRadius = "0px";
    targetEl.style.border = "1px solid transparent";
    targetEl.style.boxShadow = "none";
  }

  function updateLayoutPreview(quote, preset, fontInfo) {
    if (!layoutPreviewStageEl || !layoutPreviewCaptionEl || !layoutPreviewTextEl) {
      return;
    }
    var maxChars = Math.max(16, Math.min(72, Number(getValue("maxChars")) || 42));
    var offsetX = Math.max(-540, Math.min(540, Number(getValue("marginX")) || 0));
    var offsetY = Math.max(-720, Math.min(720, Number(getValue("marginY")) || 180));
    var stageHeight = layoutPreviewStageEl && layoutPreviewStageEl.clientHeight
      ? layoutPreviewStageEl.clientHeight
      : 412;
    var stageWidth = layoutPreviewStageEl && layoutPreviewStageEl.clientWidth
      ? layoutPreviewStageEl.clientWidth
      : 232;
    syncLayoutPreviewStageAspect();
    var dims = getPreviewCompDimensions();
    var sampleText = buildLayoutPreviewSampleText(quote, maxChars, preset);
    var previewScale = getLayoutPreviewScale();
    var fontSize = Math.max(1, Math.round((Number(preset.fontSize) || 60) * previewScale));
    var strokeWidth = Math.max(0, Math.min(10, Math.round((Number(preset.strokeWidth) || 0) * previewScale * 1.65)));
    var captionMaxWidth = getLayoutPreviewCaptionMaxWidth(preset, previewScale);
    var layout = buildPreviewTextLayout(sampleText, preset, fontInfo, fontSize, strokeWidth, {
      captionMaxWidth: captionMaxWidth,
      minFontSize: Math.max(1, Math.round(fontSize * 0.78))
    });
    var offsetPreviewPx = Math.round((offsetY / dims.height) * stageHeight);
    var offsetPreviewXPx = Math.round((offsetX / dims.width) * stageWidth);
    var blockScale = Math.max(40, Math.min(180, Number(preset.blockScale !== undefined ? preset.blockScale : 100))) / 100;

    layoutPreviewTextEl.innerHTML = buildPreviewTextHtml(layout);
    applyPreviewTextStyles(layoutPreviewTextEl, preset, fontInfo, layout.fontSize || fontSize, strokeWidth);
    layoutPreviewTextEl.style.maxWidth = Math.round(layout.textMaxWidth || getPreviewTextMaxWidth(preset, captionMaxWidth)) + "px";
    applyPreviewAccentStyles(layoutPreviewTextEl, preset);

    layoutPreviewCaptionEl.style.maxWidth = Math.round(layout.captionMaxWidth || captionMaxWidth) + "px";
    layoutPreviewCaptionEl.setAttribute(
      "data-preview-background",
      (preset.boxEnabled || isBackplateEnabled(preset) || preset.wordBoxEnabled) ? "true" : "false"
    );
    applyPreviewCaptionSurface(layoutPreviewCaptionEl, preset, 1);
    layoutPreviewCaptionEl.style.bottom = "";
    layoutPreviewCaptionEl.style.top = "50%";
    layoutPreviewCaptionEl.style.transform =
      "translate(-50%, -50%) translate(" + offsetPreviewXPx + "px, " + offsetPreviewPx + "px) scale(" + blockScale.toFixed(3) + ")";

    if (layoutPreviewCharsEl) {
      layoutPreviewCharsEl.textContent = String(maxChars);
    }
    if (layoutPreviewLinesEl) {
      layoutPreviewLinesEl.textContent = String((layout.lines && layout.lines.length) || 1);
    }
    if (layoutPreviewMarginEl) {
      layoutPreviewMarginEl.textContent = (offsetY > 0 ? "+" : "") + offsetY + " px";
    }
    if (layoutPreviewOffsetXEl) {
      layoutPreviewOffsetXEl.textContent = (offsetX > 0 ? "+" : "") + offsetX + " px";
    }
    if (layoutPreviewMetaEl) {
      layoutPreviewMetaEl.innerHTML =
        '<span class="style-preview-meta-strong">' + escapeHtml(lastPreviewQuoteSource) + ":</span> " +
        escapeHtml(sampleText) +
        " • comp " + escapeHtml(Math.round(dims.width) + "x" + Math.round(dims.height)) +
        " • block " + escapeHtml(String(Math.round(Number(preset.maxTextWidth) || 500))) + " px" +
        " • max lines " + escapeHtml(String(getMaxLinesControlValue())) +
        " • scale " + escapeHtml(String(Math.round(blockScale * 100))) + "%" +
        " • center offset " + escapeHtml((offsetX > 0 ? "+" : "") + String(offsetX)) + ", " + escapeHtml((offsetY > 0 ? "+" : "") + String(offsetY)) + " px";
    }
  }

  function clampSliderValue(el, value) {
    if (!el) {
      return 0;
    }
    var min = Number(el.min);
    var max = Number(el.max);
    var step = Number(el.step) || 1;
    var n = Number(value) || 0;
    if (!isNaN(min)) n = Math.max(min, n);
    if (!isNaN(max)) n = Math.min(max, n);
    if (step > 0) {
      n = Math.round(n / step) * step;
    }
    return n;
  }

  function setPreviewOffsetControls(offsetX, offsetY) {
    if (marginXControlEl) {
      marginXControlEl.value = String(clampSliderValue(marginXControlEl, offsetX));
      updateSliderValueDisplay(marginXControlEl);
      styleOverrideState.positionOffsetX = Number(marginXControlEl.value) || 0;
    }
    if (marginYControlEl) {
      marginYControlEl.value = String(clampSliderValue(marginYControlEl, offsetY));
      updateSliderValueDisplay(marginYControlEl);
      styleOverrideState.marginY = Number(marginYControlEl.value) || 0;
      styleOverrideState.verticalMarginY = styleOverrideState.marginY;
    }
    updateStylePreview();
  }

  function setPreviewStyleControl(el, overrideKey, value) {
    if (!el) {
      return;
    }
    var nextValue = clampSliderValue(el, value);
    el.value = String(nextValue);
    updateSliderValueDisplay(el);
    if (overrideKey) {
      styleOverrideState[overrideKey] = Number(nextValue);
      if (overrideKey === "marginY") {
        styleOverrideState.verticalMarginY = Number(nextValue);
      }
    }
    refreshControlAvailability();
    updateStylePreview();
  }

  function bindPreviewDrag() {
    if (!layoutPreviewStageEl || !layoutPreviewCaptionEl || !layoutPreviewStageEl.addEventListener) {
      return;
    }
    function beginPreviewDrag(event, clientX, clientY, pointerId) {
      if (previewDragState) {
        return;
      }
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      var handle = event.target && event.target.closest ? event.target.closest("[data-preview-handle]") : null;
      if (handle && !layoutPreviewCaptionEl.contains(handle)) {
        return;
      }
      var dims = getPreviewCompDimensions();
      var stageRect = layoutPreviewStageEl.getBoundingClientRect();
      var captionRect = layoutPreviewCaptionEl.getBoundingClientRect();
      var captionCenterX = captionRect.left + (captionRect.width / 2);
      var captionCenterY = captionRect.top + (captionRect.height / 2);
      var startScaleDistance = Math.max(
        1,
        Math.sqrt(
          Math.pow(event.clientX - captionCenterX, 2) +
          Math.pow(event.clientY - captionCenterY, 2)
        )
      );
      previewDragState = {
        mode: handle ? String(handle.getAttribute("data-preview-handle") || "move") : "move",
        edge: handle ? String(handle.getAttribute("data-preview-edge") || "") : "",
        startX: event.clientX,
        startY: event.clientY,
        scaleCenterX: captionCenterX,
        scaleCenterY: captionCenterY,
        startScaleDistance: startScaleDistance,
        startOffsetX: Number(getValue("marginX")) || 0,
        startOffsetY: Number(getValue("marginY")) || 0,
        startBlockWidth: Number(getValue("blockWidthControl")) || 500,
        startBlockScale: blockScaleControlEl ? Number(blockScaleControlEl.value) || 100 : 100,
        startBoxPadding: boxPaddingControlEl ? Number(boxPaddingControlEl.value) || 0 : 0,
        scaleX: dims.width / Math.max(1, stageRect.width),
        scaleY: dims.height / Math.max(1, stageRect.height)
      };
      layoutPreviewStageEl.classList.add("is-dragging");
      if (pointerId !== undefined && layoutPreviewStageEl.setPointerCapture) {
        try { layoutPreviewStageEl.setPointerCapture(pointerId); } catch (_captureErr) {}
      }
      event.preventDefault();
    }
    function movePreviewDrag(clientX, clientY) {
      if (!previewDragState) {
        return;
      }
      var deltaX = clientX - previewDragState.startX;
      var deltaY = clientY - previewDragState.startY;
      if (previewDragState.mode === "width") {
        var direction = previewDragState.edge === "left" ? -1 : 1;
        setPreviewStyleControl(
          blockWidthControlEl,
          "maxTextWidth",
          previewDragState.startBlockWidth + (deltaX * previewDragState.scaleX * direction)
        );
        return;
      }
      if (previewDragState.mode === "scale") {
        var currentScaleDistance = Math.max(
          1,
          Math.sqrt(
            Math.pow(clientX - previewDragState.scaleCenterX, 2) +
            Math.pow(clientY - previewDragState.scaleCenterY, 2)
          )
        );
        setPreviewStyleControl(
          blockScaleControlEl,
          "blockScale",
          previewDragState.startBlockScale * (currentScaleDistance / previewDragState.startScaleDistance)
        );
        return;
      }
      if (previewDragState.mode === "padding") {
        setPreviewStyleControl(
          boxPaddingControlEl,
          "boxPadding",
          previewDragState.startBoxPadding + ((deltaX + deltaY) * 0.45)
        );
        return;
      }
      setPreviewOffsetControls(
        previewDragState.startOffsetX + (deltaX * previewDragState.scaleX),
        previewDragState.startOffsetY + (deltaY * previewDragState.scaleY)
      );
    }
    function endPreviewDrag() {
      previewDragState = null;
      if (layoutPreviewStageEl && layoutPreviewStageEl.classList) {
        layoutPreviewStageEl.classList.remove("is-dragging");
      }
    }

    layoutPreviewStageEl.addEventListener("pointerdown", function (event) {
      beginPreviewDrag(event, event.clientX, event.clientY, event.pointerId);
    });
    window.addEventListener("pointermove", function (event) {
      movePreviewDrag(event.clientX, event.clientY);
    });
    window.addEventListener("pointerup", endPreviewDrag);
    window.addEventListener("pointercancel", endPreviewDrag);

    layoutPreviewStageEl.addEventListener("mousedown", function (event) {
      beginPreviewDrag(event, event.clientX, event.clientY);
    });
    window.addEventListener("mousemove", function (event) {
      movePreviewDrag(event.clientX, event.clientY);
    });
    window.addEventListener("mouseup", endPreviewDrag);

    layoutPreviewStageEl.addEventListener("touchstart", function (event) {
      if (!event.touches || !event.touches.length) {
        return;
      }
      var touch = event.touches[0];
      beginPreviewDrag(event, touch.clientX, touch.clientY);
    }, { passive: false });
    window.addEventListener("touchmove", function (event) {
      if (!event.touches || !event.touches.length) {
        return;
      }
      var touch = event.touches[0];
      movePreviewDrag(touch.clientX, touch.clientY);
      if (previewDragState) {
        event.preventDefault();
      }
    }, { passive: false });
    window.addEventListener("touchend", endPreviewDrag);
    window.addEventListener("touchcancel", endPreviewDrag);
    if (layoutPreviewCaptionEl && layoutPreviewCaptionEl.addEventListener) {
      layoutPreviewCaptionEl.addEventListener("dblclick", function () {
        setPreviewOffsetControls(0, 180);
      });
    }
  }

  function updateFontSelectOptions() {
    if (!fontSelectEl) {
      return;
    }
    var keepMenuOpen = !!(fontPickerMenuEl && !fontPickerMenuEl.classList.contains("hidden"));
    var currentValue = getSelectedFontOverride();
    var presetName = getValue("preset") || DEFAULT_PRESET_NAME;
    var preset = getPresetPreviewConfig(presetName);
    var defaultFont = String((preset && preset.font) || "");
    var label = defaultFont ? "Preset default (" + defaultFont + ")" : "Preset default";
    var html = ['<option value="">' + label + "</option>"];
    for (var i = 0; i < previewFontEntries.length; i++) {
      var entry = previewFontEntries[i];
      var title = entry.familyName || entry.fullName || entry.postScriptName;
      if (entry.styleName) {
        title += " — " + entry.styleName;
      }
      html.push(
        '<option value="' + String(entry.postScriptName || "").replace(/"/g, "&quot;") + '">' +
        String(title).replace(/</g, "&lt;").replace(/>/g, "&gt;") +
        "</option>"
      );
    }
    fontSelectEl.innerHTML = html.join("");
    if (currentValue && findFontEntryByPostScript(currentValue)) {
      fontSelectEl.value = currentValue;
    }
    renderFontPickerMenu();
    setFontPickerOpen(keepMenuOpen);
    updateFontPickerDisplay();
  }

  function updateStylePreview(options) {
    if (!stylePreviewTextEl || !stylePreviewCaptionEl) {
      return;
    }
    options = options || {};
    var presetName = getValue("preset") || DEFAULT_PRESET_NAME;
    var preset = getEffectivePresetForPreview();
    var outputMode = getValue("outputMode") || "layers";
    updateStylePalette(preset);
    var fontInfo = getResolvedPreviewFont(preset);
    if (options.manualRandomize) {
      stylePreviewTextEl.dataset.quote = pickRandomPreviewQuote();
    } else if (options.randomize || !stylePreviewTextEl.dataset.quote) {
      stylePreviewTextEl.dataset.quote = pickStressPreviewQuote();
    }
    var quote = stylePreviewTextEl.dataset.quote || pickStressPreviewQuote();
    var previewMode = String(getValue("outputMode") || "layers");
    stylePreviewCaptionEl.dataset.mode = previewMode;

    if (stylePreviewStageEl) {
      stylePreviewStageEl.className = outputMode === "single_keys"
        ? "style-preview-stage mode-single-keys"
        : "style-preview-stage mode-layers";
    }
    if (stylePreviewModeBadgeEl) {
      stylePreviewModeBadgeEl.textContent = outputMode === "single_keys" ? "single keys" : "layers";
    }

    if (stylePreviewMetaEl) {
      var presetLabel = getPresetDisplayLabel(presetName);
      var fontLabel = getSelectedFontOverride()
        ? "font override: " + (fontInfo.fullName || fontInfo.postScriptName || "custom")
        : "preset font: " + (fontInfo.fullName || fontInfo.postScriptName || preset.font || "default");
      stylePreviewMetaEl.innerHTML =
        '<span class="style-preview-meta-strong">' + escapeHtml(presetLabel) + "</span>" +
        " • " + escapeHtml(fontLabel) +
        " • " + '<span class="style-preview-mode">' + escapeHtml(previewMode) + "</span>";
    }
    updateLayoutPreview(quote, preset, fontInfo);
    renderTranscriptReview();
    updateFontPickerDisplay();
    updateUiSummary();
  }

  function getValue(id) {
    return document.getElementById(id).value.trim();
  }

  function parseExitTaggedOutput(output) {
    var marker = "__AEAS_EXIT__";
    var idx = output.lastIndexOf(marker);
    if (idx === -1) {
      return { code: null, text: output };
    }

    var text = output.substring(0, idx).trim();
    var tail = output.substring(idx + marker.length).trim();
    var match = tail.match(/^(-?\d+)/);
    var code = match ? parseInt(match[1], 10) : null;
    return { code: code, text: text };
  }

  function inferProgressFromLine(line) {
    var l = String(line || "");
    var tagged = l.match(/^AEAS_PROGRESS\s+(\d+)\s+(.+)$/);
    if (tagged) {
      return { p: Number(tagged[1]), m: tagged[2] };
    }
    if (l.indexOf("Running extract_audio") >= 0) return { p: 18, m: "Extracting audio..." };
    if (l.indexOf("Audio extracted") >= 0) return { p: 35, m: "Audio extracted" };
    if (l.indexOf("Loading model") >= 0) return { p: 52, m: "Loading STT model..." };
    if (l.indexOf("Transcription done") >= 0) return { p: 74, m: "Transcription done" };
    if (l.indexOf("full_run_sources completed") >= 0 || l.indexOf("full_run completed") >= 0) {
      return { p: 88, m: "Backend done, creating subtitles in AE..." };
    }
    return null;
  }

  function runPythonViaAeSystem(args, onProgress) {
    return new Promise(async function (resolve, reject) {
      try {
        var repoRoot = getRepoRoot();
        var backendScript = repoRoot + "/backend/transcribe.py";
        var quotedArgs = [];
        for (var i = 0; i < args.length; i++) {
          quotedArgs.push(shellQuote(args[i]));
        }

        var commandBody =
          "cd " + shellQuote(repoRoot) + " && " +
          "if [ -x " + shellQuote(repoRoot + "/.venv/bin/python3") + " ]; then PY=" + shellQuote(repoRoot + "/.venv/bin/python3") + "; " +
          "elif command -v python3 >/dev/null 2>&1; then PY=python3; " +
          "elif [ -x /opt/homebrew/bin/python3 ]; then PY=/opt/homebrew/bin/python3; " +
          "elif [ -x /usr/local/bin/python3 ]; then PY=/usr/local/bin/python3; " +
          "else echo 'ERROR: python3 not found'; exit 127; fi; " +
          "$PY " + shellQuote(backendScript) + (quotedArgs.length ? " " + quotedArgs.join(" ") : "") + "; " +
          "__ec=$?; echo __AEAS_EXIT__$__ec;";

        var shellInvocation = "/bin/zsh -lc " + shellQuote(commandBody);
        var jsx =
          "(function(){" +
          "if (typeof system === 'undefined' || !system.callSystem) { return 'ERROR: system.callSystem unavailable in host'; }" +
          "var out = system.callSystem(\"" + jsString(shellInvocation) + "\");" +
          "return out;" +
          "})();";

        var result = await evalScript(jsx, { timeoutMs: 1200000, label: "AE backend bridge" });
        var parsed = parseExitTaggedOutput(String(result || ""));
        if (typeof onProgress === "function") {
          onProgress(82, "Backend completed");
        }

        if (parsed.code === 0) {
          resolve({ stdout: parsed.text, stderr: "" });
          return;
        }

        reject(new Error((parsed.text || "python failed via AE system bridge") + "\n(exit=" + (parsed.code === null ? "unknown" : parsed.code) + ")"));
      } catch (err) {
        reject(err);
      }
    });
  }

  function runPython(args, onProgress) {
    if (!hasNodeBridge) {
      if (typeof onProgress === "function") {
        onProgress(16, "Running backend (AE bridge mode)...");
      }
      return runPythonViaAeSystem(args, onProgress);
    }

    return new Promise(function (resolve, reject) {
      var repoRoot = getRepoRoot();
      var backendScript = repoRoot + "/backend/transcribe.py";
      if (!fileExists(backendScript)) {
        reject(new Error("Backend script not found: " + backendScript));
        return;
      }

      var pythonExe = "python3";
      var venvPy = repoRoot + "/.venv/bin/python3";
      if (fileExists(venvPy)) {
        pythonExe = venvPy;
      }

      var proc = childProcess.spawn(pythonExe, [backendScript].concat(args), { cwd: repoRoot });

      var out = "";
      var err = "";
      var lineBuffer = "";

      proc.stdout.on("data", function (d) {
        var chunk = d.toString();
        out += chunk;
        lineBuffer += chunk;
        var lines = lineBuffer.split(/\r?\n/);
        lineBuffer = lines.pop();
        if (typeof onProgress === "function") {
          for (var i = 0; i < lines.length; i++) {
            var step = inferProgressFromLine(lines[i]);
            if (step) {
              onProgress(step.p, step.m);
            }
          }
        }
      });
      proc.stderr.on("data", function (d) { err += d.toString(); });

      proc.on("close", function (code) {
        if (code === 0) {
          resolve({ stdout: out.trim(), stderr: err.trim() });
        } else {
          reject(new Error((err || out || "python failed") + "\n(exit=" + code + ")"));
        }
      });
    });
  }

  function runRepoPythonScriptViaAeSystem(scriptRelativePath, args, onProgress) {
    return new Promise(async function (resolve, reject) {
      try {
        var repoRoot = getRepoRoot();
        var scriptPath = repoRoot + "/" + String(scriptRelativePath || "");
        var quotedArgs = [];
        for (var i = 0; i < (args || []).length; i++) {
          quotedArgs.push(shellQuote(args[i]));
        }
        var commandBody =
          "cd " + shellQuote(repoRoot) + " && " +
          "if [ -x " + shellQuote(repoRoot + "/.venv/bin/python3") + " ]; then PY=" + shellQuote(repoRoot + "/.venv/bin/python3") + "; " +
          "elif command -v python3 >/dev/null 2>&1; then PY=python3; " +
          "elif [ -x /opt/homebrew/bin/python3 ]; then PY=/opt/homebrew/bin/python3; " +
          "elif [ -x /usr/local/bin/python3 ]; then PY=/usr/local/bin/python3; " +
          "else echo 'ERROR: python3 not found'; exit 127; fi; " +
          "$PY " + shellQuote(scriptPath) + (quotedArgs.length ? " " + quotedArgs.join(" ") : "") + "; " +
          "__ec=$?; echo __AEAS_EXIT__$__ec;";
        var shellInvocation = "/bin/zsh -lc " + shellQuote(commandBody);
        var jsx =
          "(function(){" +
          "if (typeof system === 'undefined' || !system.callSystem) { return 'ERROR: system.callSystem unavailable in host'; }" +
          "var out = system.callSystem(\"" + jsString(shellInvocation) + "\");" +
          "return out;" +
          "})();";
        var result = await evalScript(jsx, { timeoutMs: 1200000, label: "AE native QA bridge" });
        var parsed = parseExitTaggedOutput(String(result || ""));
        if (typeof onProgress === "function") {
          onProgress(98, "Native QA finished");
        }
        if (parsed.code === 0) {
          resolve({ stdout: parsed.text, stderr: "" });
          return;
        }
        reject(new Error((parsed.text || "native QA failed via AE system bridge") + "\n(exit=" + (parsed.code === null ? "unknown" : parsed.code) + ")"));
      } catch (err) {
        reject(err);
      }
    });
  }

  function runRepoPythonScript(scriptRelativePath, args, onProgress) {
    if (!hasNodeBridge) {
      if (typeof onProgress === "function") {
        onProgress(12, "Running Native QA through AE bridge...");
      }
      return runRepoPythonScriptViaAeSystem(scriptRelativePath, args || [], onProgress);
    }

    return new Promise(function (resolve, reject) {
      var repoRoot = getRepoRoot();
      var scriptPath = repoRoot + "/" + String(scriptRelativePath || "");
      if (!fileExists(scriptPath)) {
        reject(new Error("Script not found: " + scriptPath));
        return;
      }
      var pythonExe = "python3";
      var venvPy = repoRoot + "/.venv/bin/python3";
      if (fileExists(venvPy)) {
        pythonExe = venvPy;
      }
      var proc = childProcess.spawn(pythonExe, [scriptPath].concat(args || []), { cwd: repoRoot });
      var out = "";
      var err = "";
      var lineBuffer = "";
      proc.stdout.on("data", function (d) {
        var chunk = d.toString();
        out += chunk;
        lineBuffer += chunk;
        var lines = lineBuffer.split(/\r?\n/);
        lineBuffer = lines.pop();
        if (typeof onProgress === "function") {
          for (var i = 0; i < lines.length; i++) {
            var step = inferProgressFromLine(lines[i]);
            if (step) {
              onProgress(step.p, step.m);
            }
          }
        }
      });
      proc.stderr.on("data", function (d) { err += d.toString(); });
      proc.on("close", function (code) {
        if (code === 0) {
          resolve({ stdout: out.trim(), stderr: err.trim() });
        } else {
          reject(new Error((err || out || "native QA failed") + "\n(exit=" + code + ")"));
        }
      });
    });
  }

  function baseName(fullPath) {
    var normalized = String(fullPath || "").replace(/\\/g, "/");
    var idx = normalized.lastIndexOf("/");
    return idx >= 0 ? normalized.substring(idx + 1) : normalized;
  }

  function parseSourcesResult(raw) {
    var value = String(raw || "").trim();
    if (!value) {
      return { ok: false, error: "Empty response from AE" };
    }
    try {
      return JSON.parse(value);
    } catch (_err) {
      return { ok: false, error: value };
    }
  }

  function parseJsonResult(raw, fallbackError) {
    var value = String(raw || "").trim();
    if (!value) {
      return { ok: false, error: fallbackError || "Empty response" };
    }
    try {
      return JSON.parse(value);
    } catch (_err) {
      return { ok: false, error: value };
    }
  }

  function readApplyStatusPayload(applyStatusPath) {
    if (!hasNodeBridge || !fs || !applyStatusPath) {
      return null;
    }
    try {
      if (!fileExists(applyStatusPath)) {
        return null;
      }
      return JSON.parse(fs.readFileSync(applyStatusPath, "utf8"));
    } catch (_statusReadErr) {
      return null;
    }
  }

  function buildFontListScript() {
    return (
      "(function(){" +
      "try{" +
      "if(typeof app==='undefined' || !app.fonts || !app.fonts.allFonts){return JSON.stringify({ok:false,error:'app.fonts unavailable'});}" +
      "var groups=app.fonts.allFonts;" +
      "var out=[]; var seen={};" +
      "for(var i=0;i<groups.length;i++){" +
      " var group=groups[i];" +
      " if(!group || !group.length) continue;" +
      " for(var j=0;j<group.length;j++){" +
      "  var font=group[j]; if(!font) continue;" +
      "  var ps=''; var family=''; var style=''; var full=''; var substitute=false;" +
      "  try{ ps=String(font.postScriptName||''); }catch(_e0){}" +
      "  if(!ps || seen[ps]) continue;" +
      "  seen[ps]=true;" +
      "  try{ family=String(font.familyName||''); }catch(_e1){}" +
      "  try{ style=String(font.styleName||''); }catch(_e2){}" +
      "  try{ full=String(font.fullName||''); }catch(_e3){}" +
      "  try{ substitute=!!font.isSubstitute; }catch(_e4){}" +
      "  out.push({postScriptName:ps,familyName:family,styleName:style,fullName:full,isSubstitute:substitute});" +
      " }" +
      "}" +
      "out.sort(function(a,b){" +
      " var an=((a.familyName||a.fullName||a.postScriptName)||'').toLowerCase();" +
      " var bn=((b.familyName||b.fullName||b.postScriptName)||'').toLowerCase();" +
      " if(an<bn) return -1; if(an>bn) return 1;" +
      " var as=((a.styleName)||'').toLowerCase();" +
      " var bs=((b.styleName)||'').toLowerCase();" +
      " if(as<bs) return -1; if(as>bs) return 1;" +
      " return 0;" +
      "});" +
      "return JSON.stringify({ok:true,fonts:out});" +
      "}catch(e){ return JSON.stringify({ok:false,error:e.toString()}); }" +
      "})();"
    );
  }

  async function loadFontsFromAe() {
    var response = await evalScript(buildFontListScript(), { timeoutMs: 12000, label: "AE font list" });
    var parsed = parseJsonResult(response, "Cannot read fonts from AE.");
    if (!parsed.ok || !Array.isArray(parsed.fonts)) {
      throw new Error(parsed.error || "Cannot read fonts from AE.");
    }
    return parsed.fonts;
  }

  function buildFallbackFonts() {
    var map = loadPresetPreviewMap();
    var list = [];
    var seen = {};
    function pushFont(postScriptName, familyName, styleName) {
      var ps = String(postScriptName || "").trim();
      if (!ps || seen[ps]) {
        return;
      }
      seen[ps] = true;
      list.push({
        postScriptName: ps,
        familyName: String(familyName || ps),
        styleName: String(styleName || ""),
        fullName: String(familyName || ps)
      });
    }
    var presetNames = Object.keys(map || {});
    for (var i = 0; i < presetNames.length; i++) {
      var preset = map[presetNames[i]];
      if (preset && preset.font) {
        pushFont(preset.font, preset.font, "");
      }
    }
    pushFont("Arial-BoldMT", "Arial", "Bold");
    pushFont("ArialMT", "Arial", "Regular");
    pushFont("HelveticaNeue-Bold", "Helvetica Neue", "Bold");
    pushFont("HelveticaNeue", "Helvetica Neue", "Regular");
    pushFont("Impact", "Impact", "Regular");
    return list;
  }

  function readCachedFonts() {
    try {
      if (typeof localStorage === "undefined") {
        return [];
      }
      var raw = localStorage.getItem(FONT_CACHE_KEY);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(function (entry) {
        return entry && String(entry.postScriptName || "").trim();
      }).map(function (entry) {
        return {
          postScriptName: String(entry.postScriptName || "").trim(),
          familyName: String(entry.familyName || entry.fullName || entry.postScriptName || "").trim(),
          styleName: String(entry.styleName || "").trim(),
          fullName: String(entry.fullName || entry.familyName || entry.postScriptName || "").trim(),
          isSubstitute: !!entry.isSubstitute
        };
      });
    } catch (_err) {
      return [];
    }
  }

  function writeCachedFonts(fonts) {
    try {
      if (typeof localStorage === "undefined" || !Array.isArray(fonts) || !fonts.length) {
        return;
      }
      localStorage.setItem(FONT_CACHE_KEY, JSON.stringify(fonts));
    } catch (_err) {}
  }

  async function ensureFontsLoaded(options) {
    options = options || {};
    var forceRefresh = !!options.forceRefresh;
    var showMenuLoading = !!options.showMenuLoading;
    if (fontCatalogRequestStarted) {
      if (!fontCatalogReady || !fontCatalogVerifiedThisSession) {
        setFontPickerLoading(true, fontPickerPreviewEl && fontPickerPreviewEl.dataset.loadingMessage || "Loading fonts from AE...");
        renderFontPickerLoadingState(fontPickerPreviewEl && fontPickerPreviewEl.dataset.loadingMessage);
      }
      return;
    }
    if (previewFontEntries.length && fontCatalogVerifiedThisSession && !forceRefresh) {
      updateFontSelectOptions();
      syncStyleControlsFromPreset({ resetOverrides: false });
      updateStylePreview();
      return;
    }
    fontCatalogRequestStarted = true;
    var cachedFonts = readCachedFonts();
    if (!previewFontEntries.length) {
      previewFontEntries = cachedFonts.length ? cachedFonts : buildFallbackFonts();
    }
    fontCatalogReady = previewFontEntries.length > 0;
    updateFontSelectOptions();
    syncStyleControlsFromPreset({ resetOverrides: true });
    updateStylePreview({ randomize: true });
    setFontPickerLoading(true, fontCatalogReady ? "Checking fonts in AE..." : "Loading fonts from AE...");
    if (showMenuLoading || !fontCatalogReady) {
      renderFontPickerLoadingState(fontPickerPreviewEl && fontPickerPreviewEl.dataset.loadingMessage);
    }
    try {
      await new Promise(function (resolve) { setTimeout(resolve, 20); });
      var fonts = await loadFontsFromAe();
      if (fonts && fonts.length) {
        previewFontEntries = fonts;
        fontCatalogReady = true;
        fontCatalogVerifiedThisSession = true;
        writeCachedFonts(fonts);
        updateFontSelectOptions();
        syncStyleControlsFromPreset({ resetOverrides: false });
        updateStylePreview();
      }
    } catch (_err) {
      fontCatalogVerifiedThisSession = false;
      fontCatalogRequestStarted = false;
    } finally {
      setFontPickerLoading(false);
      updateFontPickerDisplay();
    }
  }

  function buildScanSourcesScript() {
    return (
      "(function(){" +
      "try{" +
      "if(!app.project || !(app.project.activeItem instanceof CompItem)){return JSON.stringify({ok:false,error:'Open an active composition first.'});}" +
      "var comp=app.project.activeItem;" +
      "var displayStart=0; try{ displayStart=Number(comp.displayStartTime)||0; }catch(_eDisplayStart){}" +
      "function pathFromSource(src){ var p=''; try{ if(src&&src.file){ p=src.file.fsName; } }catch(_p0){} if(!p){ try{ if(src&&src.mainSource&&src.mainSource.file){ p=src.mainSource.file.fsName; } }catch(_p1){} } if(!p){ try{ if(src&&src.proxySource&&src.proxySource.file){ p=src.proxySource.file.fsName; } }catch(_p2){} } return String(p||''); }" +
      "var out=[]; var skipped=[]; var seen={}; var nonFileAudioCount=0; var totalAudioCount=0;" +
      "for(var i=1;i<=comp.numLayers;i++){" +
      "var l=comp.layer(i);" +
      "if(!(l instanceof AVLayer)) continue;" +
      "var hasAudio=false; try{ hasAudio=!!l.hasAudio; }catch(_e1){}" +
      "if(!hasAudio) continue;" +
      "var audioEnabled=true; try{ audioEnabled=!!l.audioEnabled; }catch(_e2){}" +
      "if(!audioEnabled){ skipped.push({layerName:l.name,reason:'audio disabled',index:l.index}); continue; }" +
      "if(!l.enabled){ skipped.push({layerName:l.name,reason:'layer disabled',index:l.index}); continue; }" +
      "totalAudioCount++;" +
      "var src=l.source; if(!src){ nonFileAudioCount++; skipped.push({layerName:l.name,reason:'no source object',index:l.index}); continue; }" +
      "var p=pathFromSource(src);" +
      "if(!p){ nonFileAudioCount++; skipped.push({layerName:l.name,reason:'source has no readable file path',sourceName:String(src.name||''),index:l.index}); continue; }" +
      "var inP=Number(l.inPoint)||0;" +
      "var outP=Number(l.outPoint)||inP;" +
      "var st=Number(l.startTime)||0;" +
      "var d=Math.max(0,outP-inP);" +
      "if(d<=0){ skipped.push({layerName:l.name,reason:'zero duration',path:p,index:l.index}); continue; }" +
      "var key=p+'|'+inP.toFixed(3)+'|'+outP.toFixed(3)+'|'+st.toFixed(3);" +
      "if(seen[key]) continue;" +
      "seen[key]=true;" +
      "out.push({layerName:l.name,path:p,inPoint:inP,outPoint:outP,startTime:st,duration:d,index:l.index,compDisplayStartTime:displayStart});" +
      "}" +
      "out.sort(function(a,b){ return b.duration-a.duration; });" +
      "return JSON.stringify({ok:true,compId:(Number(comp.id)||0),compName:comp.name,compWidth:Number(comp.width)||0,compHeight:Number(comp.height)||0,compDisplayStartTime:displayStart,sources:out,skippedSources:skipped,hasNonFileAudio:(nonFileAudioCount>0),nonFileAudioCount:nonFileAudioCount,totalAudioCount:totalAudioCount});" +
      "}catch(e){ return JSON.stringify({ok:false,error:e.toString()}); }" +
      "})();"
    );
  }

  var activeCompSources = [];
  var activeCompName = "";
  var activeCompId = 0;
  var activeCompWidth = 1080;
  var activeCompHeight = 1920;
  var activeCompDisplayStartTime = 0;
  var activeCompHasNonFileAudio = false;
  var activeCompMixAvailable = false;
  var activeCompTotalAudioCount = 0;
  var hasAutoStartedOnLoad = false;
  var backgroundTranscribePromise = null;
  var backgroundTranscribeState = "idle";
  var transcriptTimingSignature = "";
  var startupBackgroundAttempt = 0;
  var startupBackgroundTimer = null;
  var compMixSelectionWasManual = false;

  function getCompMixCheckbox() {
    return document.getElementById("src_comp_mix");
  }

  function useCompMixSelection() {
    var cb = getCompMixCheckbox();
    return !!(cb && cb.checked);
  }

  function shouldRenderCompMixFirst(selectedSources) {
    var selected = Array.isArray(selectedSources) ? selectedSources : getSelectedSources();
    if (!activeCompMixAvailable || !useCompMixSelection()) {
      return false;
    }
    if (compMixSelectionWasManual) {
      return true;
    }
    if (activeCompHasNonFileAudio) {
      return true;
    }
    return !selected.length;
  }

  function getAudioStrategyLabel(selectedSources) {
    var selected = Array.isArray(selectedSources) ? selectedSources : getSelectedSources();
    if (shouldRenderCompMixFirst(selected)) {
      return "comp mix first";
    }
    if (useCompMixSelection() && selected.length) {
      return "fast sources first, comp mix fallback";
    }
    return selected.length ? "file sources" : "no source";
  }

  function handleFileSourceSelectionChange() {
    compMixSelectionWasManual = false;
    var mixCb = getCompMixCheckbox();
    if (mixCb && mixCb.checked) {
      mixCb.checked = false;
    }
    updateSummarySources();
    markTranscriptTimingStale("Audio source selection changed. Press Retiming to recalculate captions with the current model.");
  }

  function handleCompMixSelectionChange(event) {
    var isChecked = !!(event && event.target && event.target.checked);
    compMixSelectionWasManual = true;
    if (isChecked) {
      for (var i = 0; i < activeCompSources.length; i++) {
        var cb = document.getElementById("src_" + i);
        if (cb) {
          cb.checked = false;
        }
      }
    } else if (!getSelectedSources().length) {
      for (var j = 0; j < activeCompSources.length; j++) {
        var fileCb = document.getElementById("src_" + j);
        if (fileCb) {
          fileCb.checked = true;
        }
      }
    }
    updateSummarySources();
    markTranscriptTimingStale("Audio source selection changed. Press Retiming to recalculate captions with the current model.");
  }

  function getTranscriptTimingSignature() {
    var selectedSources = getSelectedSources();
    var selected = selectedSources.map(function (src) {
      return [
        src.path || "",
        Number(src.inPoint || 0).toFixed(3),
        Number(src.outPoint || 0).toFixed(3),
        Number(src.startTime || 0).toFixed(3)
      ].join("@");
    });
    return JSON.stringify({
      compId: activeCompId || 0,
      compName: activeCompName || "",
      useCompMix: shouldRenderCompMixFirst(selectedSources),
      compMixChecked: useCompMixSelection(),
      audioStrategy: getAudioStrategyLabel(selectedSources),
      model: getValue("model") || "turbo",
      language: getValue("language") || "auto",
      maxChars: getValue("maxChars") || "42",
      sources: selected
    });
  }

  function markTranscriptTimingStale(message) {
    if (backgroundTranscribeState === "running") {
      setStatus(message || "Timing settings changed. Current background transcription will finish, then use Retiming if needed.");
      return;
    }
    if (!transcriptReviewHasFreshPayload && backgroundTranscribeState !== "done") {
      return;
    }
    backgroundTranscribeState = "idle";
    backgroundTranscribePromise = null;
    transcriptTimingSignature = "";
    transcriptReviewHasFreshPayload = false;
    renderTranscriptReview();
    setStatus(message || "Transcript timing is stale. Press Retiming before Run.");
  }

  function renderSources() {
    if (!activeCompSources.length && !activeCompMixAvailable) {
      if (activeCompHasNonFileAudio) {
        sourcesListEl.textContent = "Only nested/precomp audio layers were found, but comp mix is unavailable.";
      } else {
        sourcesListEl.textContent = "No audio layers found in the active comp.";
      }
      updateSummarySources();
      return;
    }

    sourcesListEl.innerHTML = "";
    compMixSelectionWasManual = false;
    var defaultUseCompMix = !!activeCompMixAvailable;
    if (activeCompMixAvailable) {
      var mixRow = document.createElement("label");
      mixRow.className = "source-item";

      var mixCb = document.createElement("input");
      mixCb.type = "checkbox";
      mixCb.id = "src_comp_mix";
      mixCb.checked = defaultUseCompMix;
      mixCb.addEventListener("change", handleCompMixSelectionChange);

      var mixContent = document.createElement("div");
      var mixName = document.createElement("div");
      mixName.className = "source-name";
      mixName.textContent = "Active comp mix -> all audible audio in comp";

      var mixMeta = document.createElement("div");
      mixMeta.className = "source-meta";
      mixMeta.textContent = activeCompHasNonFileAudio
        ? "includes nested/precomp voice, music and anything audible in the current composition"
        : "renders the composition exactly as heard, including every enabled audio layer";

      mixContent.appendChild(mixName);
      mixContent.appendChild(mixMeta);
      mixRow.appendChild(mixCb);
      mixRow.appendChild(mixContent);
      sourcesListEl.appendChild(mixRow);
    }

    for (var i = 0; i < activeCompSources.length; i++) {
      var src = activeCompSources[i];
      var row = document.createElement("label");
      row.className = "source-item";

      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = "src_" + i;
      cb.dataset.index = String(i);
      cb.checked = true;
      cb.addEventListener("change", handleFileSourceSelectionChange);

      var content = document.createElement("div");
      var nm = document.createElement("div");
      nm.className = "source-name";
      nm.textContent = src.layerName + " -> " + baseName(src.path);

      var mt = document.createElement("div");
      mt.className = "source-meta";
      mt.textContent = "duration " + src.duration.toFixed(2) + "s";

      content.appendChild(nm);
      content.appendChild(mt);
      row.appendChild(cb);
      row.appendChild(content);
      sourcesListEl.appendChild(row);
    }
    updateSummarySources();
  }

  async function autoRunOnLoadIfReady() {
    if (hasAutoStartedOnLoad) {
      return;
    }

    if (activeCompMixAvailable && shouldRenderCompMixFirst()) {
      hasAutoStartedOnLoad = true;
      setStatus("Auto-start: running from active comp mix audio...");
      await handleFullRun();
      return;
    }

    if (activeCompMixAvailable && !activeCompSources.length) {
      hasAutoStartedOnLoad = true;
      setStatus("Auto-start: running from active comp mix audio...");
      await handleFullRun();
      return;
    }

    var selectedSources = getSelectedSources();
    if (!selectedSources.length) {
      setStatus("Auto-start skipped: no active source is selected.", true);
      return;
    }

    hasAutoStartedOnLoad = true;
    setStatus("Auto-start: running Full Run with selected timeline sources...");
    await handleFullRun();
  }

  function getCreateSettingsSnapshot() {
    return {
      subtitlesPath: getDefaultSubtitlesPath(),
      preset: getValue("preset") || DEFAULT_PRESET_NAME,
      marginY: getValue("marginY") || "180",
      updateMode: "rebuild",
      targetCompName: activeCompName,
      targetCompId: activeCompId,
      outputMode: getValue("outputMode") || "layers",
      fontOverride: getSelectedFontOverride(),
      styleOverrides: JSON.stringify(getStyleOverridesPayload())
    };
  }

  async function applySubtitlesWithSnapshot(snapshot, label) {
    snapshot = snapshot || getCreateSettingsSnapshot();
    beginRun(label || "Applying subtitles...");
    try {
      applyTextCorrectionsToCurrentSubtitles();
      updateRunProgress(84, "Applying queued style settings in AE...");
      await waitForUiPaint();
      var aeResult = await createInAe(
        snapshot.subtitlesPath,
        snapshot.preset,
        snapshot.marginY,
        snapshot.updateMode || "rebuild",
        snapshot.targetCompName,
        snapshot.targetCompId,
        snapshot.outputMode,
        snapshot.fontOverride,
        snapshot.styleOverrides
      );

      if (isAeErrorResult(aeResult)) {
        setStatus(aeResult, true);
        finishRun("Create failed", true);
        return null;
      }
      updateRunProgress(100, "Done");
      setStatus(aeResult || "Create done.");
      finishRun("Create done", false);
      return aeResult;
    } catch (err) {
      finishRun("Create failed", true);
      throw err;
    }
  }

  function startBackgroundTranscribe(reason) {
    if (backgroundTranscribeState === "running" && backgroundTranscribePromise) {
      return backgroundTranscribePromise;
    }
    if (!activeCompMixAvailable && !getSelectedSources().length) {
      return null;
    }

    backgroundTranscribeState = "running";
    transcriptReviewHasFreshPayload = false;
    renderTranscriptReview();
    var selectedSources = getSelectedSources();
    var strategyLabel = getAudioStrategyLabel(selectedSources);
    setRunProgress(8, reason || "Whisper is transcribing in background...");
    setStatus("Background Whisper started (" + strategyLabel + "). Adjust caption style, then press Run to apply when ready.");

    backgroundTranscribePromise = runTranscribePipeline(function (percent, message) {
      setRunProgress(percent, "Background: " + (message || "transcribing..."));
    })
      .then(function (result) {
        backgroundTranscribeState = "done";
        annotateCurrentSubtitlesTranscriptionModel();
        applyTextCorrectionsToCurrentSubtitles();
        transcriptTimingSignature = getTranscriptTimingSignature();
        transcriptReviewHasFreshPayload = true;
        updateRunProgress(88, "Whisper ready. Choose style and press Run.");
        renderTranscriptReview();
        updateStylePreview();
        setStatus("Whisper transcript is ready in tmp/subtitles.json. Choose style and press Run to apply.");
        return result;
      })
      .catch(function (err) {
        backgroundTranscribeState = "error";
        setStatus("Background Whisper failed: " + String(err && err.message ? err.message : err), true);
        throw err;
      });
    backgroundTranscribePromise.catch(function () {});
    return backgroundTranscribePromise;
  }

  async function startStartupBackgroundTranscription(label, showStatus) {
    if (!cep) {
      if (showStatus) {
        setStatus("Preview mode cannot background-transcribe. Open this panel inside After Effects with an active comp.");
      }
      return;
    }
    if (backgroundTranscribeState === "running" || backgroundTranscribeState === "done") {
      return;
    }
    if (showStatus) {
      setRunProgress(3, "Checking active comp audio for background Whisper...");
      setStatus("Checking active comp audio so Whisper can start in background...");
    }
    var scan = await scanSourcesFromAe({ autoStart: false, silent: true });
    if (!scan || !scan.ok) {
      if (showStatus) {
        setStatus("Background Whisper not started yet: open the target composition, then press Scan or wait for retry.");
      }
      return;
    }
    startBackgroundTranscribe(label || "Background: preparing fast audio sources for Whisper...");
  }

  function scheduleStartupBackgroundTranscription() {
    if (!cep || backgroundTranscribeState === "running" || backgroundTranscribeState === "done") {
      return;
    }
    if (startupBackgroundTimer) {
      clearTimeout(startupBackgroundTimer);
      startupBackgroundTimer = null;
    }
    var delays = [220, 900, 2200];
    var delay = delays[Math.min(startupBackgroundAttempt, delays.length - 1)];
    startupBackgroundAttempt++;
    startupBackgroundTimer = setTimeout(function () {
      startStartupBackgroundTranscription(
        "Background: preparing fast audio sources for Whisper...",
        startupBackgroundAttempt > 1
      ).then(function () {
        if (
          backgroundTranscribeState === "idle" &&
          startupBackgroundAttempt < delays.length
        ) {
          scheduleStartupBackgroundTranscription();
        }
      }).catch(function (err) {
        if (startupBackgroundAttempt >= delays.length) {
          setStatus("Background Whisper could not start: " + String(err && err.message ? err.message : err), true);
        } else {
          scheduleStartupBackgroundTranscription();
        }
      });
    }, delay);
  }

  async function handleScanSources() {
    var scan = await scanSourcesFromAe({ autoStart: false });
    if (scan && scan.ok && backgroundTranscribeState !== "running") {
      startBackgroundTranscribe("Background: Whisper restarted from current fast audio sources...");
    }
    return scan;
  }

  async function scanSourcesFromAe(options) {
    options = options || {};
    var autoStart = !!options.autoStart;
    var silent = !!options.silent;

    if (!silent) {
      setStatus("Scanning active comp timeline...");
    }
    var response = await evalScript(buildScanSourcesScript(), { timeoutMs: 15000, label: "AE timeline scan" });
    var parsed = parseSourcesResult(response);

    if (!parsed.ok) {
      activeCompSources = [];
      activeCompName = "";
      activeCompId = 0;
      activeCompWidth = 1080;
      activeCompHeight = 1920;
      activeCompDisplayStartTime = 0;
      activeCompHasNonFileAudio = false;
      activeCompMixAvailable = false;
      activeCompTotalAudioCount = 0;
      renderSources();
      if (!silent) {
        setStatus(parsed.error || "Cannot read timeline sources.", true);
      }
      return null;
    }

    activeCompSources = Array.isArray(parsed.sources) ? parsed.sources : [];
    activeCompName = String(parsed.compName || "");
    activeCompId = Number(parsed.compId || 0) || 0;
    activeCompWidth = Number(parsed.compWidth || 0) || activeCompWidth || 1080;
    activeCompHeight = Number(parsed.compHeight || 0) || activeCompHeight || 1920;
    activeCompDisplayStartTime = Number(parsed.compDisplayStartTime || 0) || 0;
    syncLayoutPreviewStageAspect();
    activeCompHasNonFileAudio = !!parsed.hasNonFileAudio;
    activeCompTotalAudioCount = Number(parsed.totalAudioCount || 0) || 0;
    activeCompMixAvailable = activeCompTotalAudioCount > 0;
    renderSources();

    if (!activeCompSources.length && activeCompMixAvailable) {
      if (!silent) {
        setStatus("No file-backed voice source found. Active comp mix is selected so Run can still hear the comp.");
      }
      if (autoStart) {
        await autoRunOnLoadIfReady();
      }
      return parsed;
    }

    if (!activeCompSources.length) {
      if (!silent) {
        setStatus("No enabled audio layers found in the active comp.", true);
      }
      return parsed;
    }

    var nonFileCount = Number(parsed.nonFileAudioCount || 0);
    var message =
      "Detected " + activeCompSources.length + " file-backed audio source(s) in comp '" +
      (parsed.compName || "") +
      "'. Auto-selected all file-backed sources.";
    if (nonFileCount > 0) {
      message = "Detected " + activeCompSources.length + " file-backed audio source(s) in comp '" +
        (parsed.compName || "") +
        "'. Also found " + nonFileCount + " nested/precomp audio layer(s), so Active comp mix can be used to catch voice inside the comp.";
    }
    if (!silent) {
      setStatus(message);
    }

    if (autoStart) {
      await autoRunOnLoadIfReady();
    }
    return parsed;
  }

  function getSelectedSources() {
    var selected = [];
    for (var i = 0; i < activeCompSources.length; i++) {
      var cb = document.getElementById("src_" + i);
      if (cb && cb.checked) {
        selected.push(activeCompSources[i]);
      }
    }
    return selected;
  }

  function getDefaultSubtitlesPath() {
    return getRepoRoot() + "/tmp/subtitles.json";
  }

  function getReferenceChangedPatchPath() {
    return getRepoRoot() + "/tmp/reference_changed_subtitles.json";
  }

  async function renderActiveCompMixToFile(outPath) {
    var jsx =
      "(function(){" +
      "try{" +
      "if(!app.project || !(app.project.activeItem instanceof CompItem)){return JSON.stringify({ok:false,error:'Open an active composition first.'});}" +
      "var comp=app.project.activeItem;" +
      "var outFile=new File(\"" + jsString(outPath) + "\");" +
      "var parentFolder=outFile.parent;" +
      "if(parentFolder && !parentFolder.exists){ parentFolder.create(); }" +
      "if(outFile.exists){ try{ outFile.remove(); }catch(_e0){} }" +
      "var rq=app.project.renderQueue;" +
      "var prevItems=[];" +
      "var prevFlags=[];" +
      "for(var i=1;i<=rq.numItems;i++){" +
      "  var it=rq.item(i);" +
      "  prevItems.push(it);" +
      "  var prev=false;" +
      "  try{ prev=!!it.render; }catch(_ePrev){}" +
      "  prevFlags.push(prev);" +
      "  try{" +
      "    var st=it.status;" +
      "    var canToggle=(st===RQItemStatus.UNQUEUED || st===RQItemStatus.QUEUED || st===RQItemStatus.NEEDS_OUTPUT);" +
      "    if(canToggle){ it.render=false; }" +
      "  }catch(_eToggle){}" +
      "}" +
      "var item=null;" +
      "var renderErr='';" +
      "try{" +
      "  item=rq.items.add(comp);" +
      "  item.render=true;" +
      "  var renderStart=0;" +
      "  try{ renderStart=Number(comp.displayStartTime)||0; }catch(_eDST){}" +
      "  if(!isFinite(renderStart)){ renderStart=0; }" +
      "  item.timeSpanStart=renderStart;" +
      "  item.timeSpanDuration=Math.max(0, Number(comp.duration)||0);" +
      "  var om=item.outputModule(1);" +
      "  try{ om.applyTemplate('Audio Only'); }catch(_e0a){ try{ om.applyTemplate('Lossless'); }catch(_e1){} }" +
      "  try{" +
      "    var omSettings=om.getSettings(GetSettingsFormat.STRING_SETTABLE);" +
      "    if(omSettings){" +
      "      var changed=false;" +
      "      if(omSettings['Output Audio']!==undefined){ omSettings['Output Audio']='On'; changed=true; }" +
      "      if(omSettings['Audio Output']!==undefined){ omSettings['Audio Output']='On'; changed=true; }" +
      "      if(omSettings['Output Video']!==undefined){ omSettings['Output Video']='Off'; changed=true; }" +
      "      if(omSettings['Video Output']!==undefined){ omSettings['Video Output']='Off'; changed=true; }" +
      "      if(changed){ om.setSettings(omSettings); }" +
      "    }" +
      "  }catch(_e1a){}" +
      "  om.file=outFile;" +
      "  rq.render();" +
      "}catch(_renderEx){ renderErr=String(_renderEx); }" +
      "if(item){ try{ item.remove(); }catch(_e2){} }" +
      "for(var j=0;j<prevItems.length;j++){ try{ prevItems[j].render=prevFlags[j]; }catch(_e3){} }" +
      "try{ if(comp && comp.openInViewer){ comp.openInViewer(); } }catch(_focusErr){}" +
      "if(renderErr){ return JSON.stringify({ok:false,error:'Comp audio render failed: '+renderErr}); }" +
      "if(!outFile.exists){ return JSON.stringify({ok:false,error:'Comp render did not produce output file.'}); }" +
      "return JSON.stringify({ok:true,path:outFile.fsName});" +
      "}catch(e){ return JSON.stringify({ok:false,error:e.toString()}); }" +
      "})();";

    var response = await evalScript(jsx, { timeoutMs: 900000, label: "AE active comp audio render" });
    var parsed = parseJsonResult(response, "Failed to render active comp audio.");
    if (!parsed.ok) {
      throw new Error(parsed.error || "Failed to render active comp audio.");
    }
    return String(parsed.path || outPath);
  }

  function readSubtitlesItemsCount(subtitlesPath) {
    if (!hasNodeBridge || !fs) {
      return null;
    }
    try {
      if (!fs.existsSync(subtitlesPath)) {
        return null;
      }
      var raw = fs.readFileSync(subtitlesPath, "utf8");
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) {
        return 0;
      }
      return parsed.items.length;
    } catch (_err) {
      return null;
    }
  }

  function parseItemsCountFromOutput(output) {
    var text = String(output || "");
    var match = text.match(/['"]items['"]\s*:\s*(\d+)/);
    if (!match) {
      return null;
    }
    var value = parseInt(match[1], 10);
    return isNaN(value) ? null : value;
  }

  async function runTranscribePipeline(onProgress) {
    var selectedSources = getSelectedSources();
    var useCompMix = shouldRenderCompMixFirst(selectedSources);

    var repoRoot = getRepoRoot();
    var rawOut = repoRoot + "/tmp/raw.json";
    var subsOut = repoRoot + "/tmp/subtitles.json";
    var compMixOut = repoRoot + "/tmp/comp_mix_audio.mov";

    function buildArgs(sources) {
      return [
        "--full_run",
        "--out", rawOut,
        "--subtitles_out", subsOut,
        "--wav_out", repoRoot + "/tmp/audio.wav",
        "--lang", getValue("language") || "auto",
        "--model", getValue("model") || "turbo",
        "--beam_size", "5",
        "--best_of", "5",
        "--no_speech_threshold", "0.85",
        "--chunk_seconds", "15",
        "--chunk_overlap", "1.5",
        "--clip_pad", "0.8",
        "--max_chars", getValue("maxChars") || "42",
        "--sources_json", JSON.stringify(sources)
      ];
    }

    function buildCompInputArgs(inputPath) {
      return [
        "--full_run",
        "--input", inputPath,
        "--out", rawOut,
        "--subtitles_out", subsOut,
        "--wav_out", repoRoot + "/tmp/audio.wav",
        "--lang", getValue("language") || "auto",
        "--model", getValue("model") || "turbo",
        "--beam_size", "5",
        "--best_of", "5",
        "--no_speech_threshold", "0.85",
        "--chunk_seconds", "15",
        "--chunk_overlap", "1.5",
        "--max_chars", getValue("maxChars") || "42"
      ];
    }

    async function runCompMixFallback() {
      if (typeof onProgress === "function") {
        onProgress(44, "Rendering active comp audio-only mix...");
      }
      var renderedPath = await renderActiveCompMixToFile(compMixOut);
      if (typeof onProgress === "function") {
        onProgress(60, "Transcribing comp mix audio...");
      }
      return await runPython(buildCompInputArgs(renderedPath), onProgress);
    }

    function getItemsCount(runResult) {
      var count = readSubtitlesItemsCount(subsOut);
      if (count === null) {
        count = parseItemsCountFromOutput((runResult && (runResult.stdout || runResult.stderr)) || "");
      }
      if (typeof count !== "number" || isNaN(count)) {
        return 0;
      }
      return count;
    }

    var result = null;
    var itemsCount = 0;
    var triedCompMix = false;

    async function runSelectedSources(sources, progressValue, message) {
      if (typeof onProgress === "function" && message) {
        onProgress(progressValue, message);
      }
      result = await runPython(buildArgs(sources), onProgress);
      itemsCount = getItemsCount(result);
    }

    async function runCompMixWithReason(progressValue, message, allowFailure) {
      triedCompMix = true;
      if (typeof onProgress === "function" && message) {
        onProgress(progressValue, message);
      }
      try {
        result = await runCompMixFallback();
        itemsCount = getItemsCount(result);
      } catch (err) {
        if (!allowFailure) {
          throw err;
        }
        itemsCount = 0;
        if (typeof onProgress === "function") {
          onProgress(
            Math.min(96, (Number(progressValue) || 0) + 8),
            "Comp mix fallback unavailable, continuing with file sources..."
          );
        }
      }
    }

    if (useCompMix) {
      await runCompMixWithReason(20, "Rendering selected active comp mix...", false);
    } else if (!selectedSources.length && activeCompMixAvailable) {
      await runCompMixWithReason(20, "No file-backed sources selected, rendering active comp mix...", false);
    } else if (!selectedSources.length) {
      throw new Error("Select at least one file-backed audio source or enable Active comp mix.");
    } else if (useCompMixSelection() && activeCompMixAvailable) {
      if (typeof onProgress === "function") {
        onProgress(18, "Fast path: transcribing selected audio sources first; comp mix remains fallback.");
      }
    }

    if (itemsCount === 0 && selectedSources.length && !useCompMix) {
      await runSelectedSources(selectedSources, 40, "Transcribing selected timeline sources...");
    }

    if (itemsCount === 0 && selectedSources.length && activeCompSources.length > selectedSources.length && !useCompMix) {
      await runSelectedSources(activeCompSources, 66, "No speech in top sources, retrying with all timeline audio...");
    }

    if (
      itemsCount > 0 &&
      itemsCount < MIN_SOURCE_ITEMS_BEFORE_COMP_MIX_RETRY &&
      selectedSources.length &&
      activeCompMixAvailable &&
      activeCompHasNonFileAudio &&
      !useCompMix &&
      !triedCompMix
    ) {
      var sourceItemsCount = itemsCount;
      await runCompMixWithReason(74, "Only " + itemsCount + " caption items found; retrying active comp mix for missing phrases...", true);
      if (itemsCount < sourceItemsCount) {
        await runSelectedSources(selectedSources, 82, "Comp mix retry found fewer phrases, restoring selected timeline sources...");
      }
    }

    if (itemsCount === 0) {
      if (!useCompMix && activeCompMixAvailable && activeCompHasNonFileAudio) {
        throw new Error("Selected file-backed sources produced 0 subtitle items. The spoken voice is likely inside nested/precomp audio. Enable Active comp mix and run again.");
      }
      throw new Error("Transcription finished but produced 0 subtitle items.");
    }

    writeCurrentSubtitlesTimingMeta();
    return result;
  }

  function isAeErrorResult(value) {
    var msg = String(value || "").trim();
    if (!msg) return true;
    if (/^ERROR:/i.test(msg)) return true;
    if (/EvalScript error/i.test(msg)) return true;
    var succeededMatch = msg.match(/\bsucceeded=(\d+)/i);
    if (succeededMatch && parseInt(succeededMatch[1], 10) <= 0) return true;
    var failedMatch = msg.match(/\bfailed=(\d+)/i);
    var totalMatch = msg.match(/\btotal=(\d+)/i);
    if (failedMatch && totalMatch) {
      var failed = parseInt(failedMatch[1], 10);
      var total = parseInt(totalMatch[1], 10);
      if (!isNaN(failed) && !isNaN(total) && total > 0 && failed >= total) {
        return true;
      }
    }
    return false;
  }

  async function createInAe(subtitlesPath, preset, marginY, updateMode, targetCompName, targetCompId, outputMode, fontOverride, styleOverrides) {
    var repoRoot = getRepoRoot();
    var jsxPath = repoRoot + "/scripts/create_subtitles.jsx";
    var presetsPath = repoRoot + "/config/presets.json";

    if (hasNodeBridge) {
      if (!fileExists(jsxPath)) {
        throw new Error("JSX script not found: " + jsxPath);
      }
      if (!fileExists(presetsPath)) {
        throw new Error("Presets file not found: " + presetsPath);
      }
      if (!fileExists(subtitlesPath)) {
        throw new Error("Subtitles JSON not found: " + subtitlesPath);
      }
      prepareSubtitlesForApply(subtitlesPath);
    }

    var targetMode = targetCompId ? "comp_id" : (targetCompName ? "comp_name" : "active_comp");
    var targetNameArg = targetCompName || "";
    var targetIdArg = targetCompId ? String(targetCompId) : "";
    var outputModeArg = outputMode || "layers";
    var fontOverrideArg = fontOverride || "";
    var styleOverridesArg = styleOverrides || "{}";
    var applyStatusPath = repoRoot + "/tmp/apply_status.json";
    if (hasNodeBridge) {
      try {
        fs.writeFileSync(applyStatusPath, JSON.stringify({ stage: "queued", detail: "Waiting for AE subtitle apply", time: Date.now() }), "utf8");
      } catch (_statusWriteErr) {}
    }
    var code =
      "(function(){" +
      "try{" +
      "$.global.AE_AUTOSUB_DISABLE_AUTO_RUN = true;" +
      "$.global.AEAS_APPLY_STATUS_PATH = \"" + jsString(applyStatusPath) + "\";" +
      "$.evalFile(\"" + jsString(jsxPath) + "\");" +
      "if (typeof createSubtitlesFromJson !== 'function') { return 'ERROR: createSubtitlesFromJson is not defined'; }" +
      "var __res = createSubtitlesFromJson(\"" + jsString(subtitlesPath) + "\",\"" + jsString(preset) + "\",\"" + jsString(marginY) + "\",\"" + jsString(updateMode) + "\",\"" + jsString(targetMode) + "\",\"" + jsString(targetNameArg) + "\",\"" + jsString(targetIdArg) + "\",\"" + jsString(presetsPath) + "\",\"" + jsString(outputModeArg) + "\",\"" + jsString(fontOverrideArg) + "\",\"" + jsString(styleOverridesArg) + "\");" +
      "return String(__res || '');" +
      "}catch(e){ return 'ERROR: ' + e.toString(); }" +
      "})();";

    try {
      return await evalScript(code, { timeoutMs: 120000, label: "AE subtitle apply" });
    } catch (err) {
      var status = readApplyStatusPayload(applyStatusPath);
      if (status && status.stage === "done" && status.detail) {
        return String(status.detail);
      }
      if (status && status.stage) {
        throw new Error(
          String(err && err.message ? err.message : err) +
          "\nLast AE stage: " + String(status.stage) +
          (status.detail ? " | " + String(status.detail) : "")
        );
      }
      throw err;
    }
  }

  async function handleApplyChangedCaptions() {
    beginRun("Applying changed captions...");
    try {
      updateRunProgress(8, "Refreshing target comp...");
      var scan = await scanSourcesFromAe({ autoStart: false, silent: true });
      if (!scan || !scan.ok) {
        throw new Error("Open the target composition before applying changed captions.");
      }
      updateRunProgress(24, "Building changed-caption patch from reference text...");
      var patch = buildAndWriteReferenceChangedPatch();
      var outputMode = getValue("outputMode") || "layers";
      if (outputMode === "single_keys") {
        throw new Error("Changed-only apply needs Output Mode = Layers. A single keyed text layer cannot update individual caption ids safely.");
      }
      transcriptReviewHasFreshPayload = true;
      renderTranscriptReview();
      updateStylePreview();
      updateRunProgress(42, "Applying " + patch.count + " changed caption(s) in AE...");
      setStatus("Applying only reference-changed subtitle layers. Existing unchanged subtitle layers stay untouched.");
      await waitForUiPaint();
      var aeResult = await createInAe(
        patch.path,
        getValue("preset") || DEFAULT_PRESET_NAME,
        getValue("marginY") || "180",
        "patch_changed",
        activeCompName,
        activeCompId,
        outputMode,
        getSelectedFontOverride(),
        JSON.stringify(getStyleOverridesPayload())
      );

      if (isAeErrorResult(aeResult)) {
        setStatus(aeResult, true);
        finishRun("Changed apply failed", true);
        return;
      }
      updateRunProgress(100, "Done");
      setStatus("Applied " + patch.count + " changed reference caption(s) out of " + patch.total + ".\n" + (aeResult || ""));
      finishRun("Changed captions applied", false);
    } catch (err) {
      finishRun("Changed apply failed", true);
      throw err;
    }
  }

  async function handleTranscribe() {
    beginRun("Retiming captions...");
    try {
      backgroundTranscribeState = "running";
      backgroundTranscribePromise = null;
      transcriptReviewHasFreshPayload = false;
      renderTranscriptReview();
      updateRunProgress(10, "Refreshing active comp sources...");
      var scan = await scanSourcesFromAe({ autoStart: false, silent: true });
      if (!scan || !scan.ok) {
        throw new Error("Open the target composition before running subtitles.");
      }
      setStatus("Recalculating transcript timings from current audio and model...");
      var result = await runTranscribePipeline(updateRunProgress);
      annotateCurrentSubtitlesTranscriptionModel();
      applyTextCorrectionsToCurrentSubtitles();
      transcriptTimingSignature = getTranscriptTimingSignature();
      backgroundTranscribeState = "done";
      transcriptReviewHasFreshPayload = true;
      renderTranscriptReview();
      updateStylePreview();
      updateRunProgress(96, "Done");
      setStatus("Retiming complete with current audio/model.\n" + (result.stdout || result.stderr || "ok"));
      finishRun("Retiming complete", false);
    } catch (err) {
      backgroundTranscribeState = "error";
      finishRun("Retiming failed", true);
      throw err;
    }
  }

  async function handleCreate() {
    var subsPath = getDefaultSubtitlesPath();
    beginRun("Creating subtitle layers...");
    try {
      updateRunProgress(10, "Refreshing target comp...");
      var scan = await scanSourcesFromAe({ autoStart: false, silent: true });
      if (!scan || !scan.ok) {
        throw new Error("Open the target composition before creating subtitles.");
      }
      applyTextCorrectionsToCurrentSubtitles();
      updateRunProgress(30, "Applying subtitles in AE...");
      setStatus("Creating/updating subtitle layers in AE...");
      await waitForUiPaint();
      var aeResult = await createInAe(
        subsPath,
        getValue("preset") || DEFAULT_PRESET_NAME,
        getValue("marginY") || "180",
        "rebuild",
        activeCompName,
        activeCompId,
        getValue("outputMode") || "layers",
        getSelectedFontOverride(),
        JSON.stringify(getStyleOverridesPayload())
      );

      if (isAeErrorResult(aeResult)) {
        setStatus(aeResult, true);
        finishRun("Create failed", true);
        return;
      }
      updateRunProgress(100, "Done");
      setStatus(aeResult || "Create done.");
      finishRun("Create done", false);
    } catch (err) {
      finishRun("Create failed", true);
      throw err;
    }
  }

  async function handleNativeQa() {
    beginRun("Native QA started...");
    try {
      updateRunProgress(8, "Starting Native QA...");
      setStatus("Native QA is running. It will create a temporary AE comp, inspect real subtitle layers, then clean it up.");
      await waitForUiPaint();
      var qaResult = await runRepoPythonScript("scripts/native_qa.py", [], updateRunProgress);
      updateRunProgress(100, "Native QA passed");
      setStatus("Native QA passed.\n" + (qaResult.stdout || "ok"));
      finishRun("Native QA passed", false);
    } catch (err) {
      finishRun("Native QA failed", true);
      setStatus("Native QA failed.\n" + String(err && err.message ? err.message : err), true);
      throw err;
    }
  }

  async function handleFullRun() {
    var snapshot = getCreateSettingsSnapshot();
    if (backgroundTranscribeState === "running" && backgroundTranscribePromise) {
      beginRun("Queued. Waiting for background Whisper...");
      try {
        setStatus("Run queued with current style settings. Waiting for background Whisper to finish...");
        await backgroundTranscribePromise;
      } catch (err) {
        finishRun("Whisper failed", true);
        throw err;
      }
      await applySubtitlesWithSnapshot(snapshot, "Applying queued subtitles...");
      return;
    }

    if (backgroundTranscribeState === "done" && readSubtitlesItemsCount(snapshot.subtitlesPath) > 0) {
      await applySubtitlesWithSnapshot(snapshot, "Applying subtitles...");
      return;
    }

    beginRun("Run started...");
    try {
      updateRunProgress(10, "Refreshing active comp...");
      var scan = await scanSourcesFromAe({ autoStart: false, silent: true });
      if (!scan || !scan.ok) {
        throw new Error("Open the target composition before running subtitles.");
      }
      setStatus("Running full pipeline from timeline sources...");

      var result = await runTranscribePipeline(updateRunProgress);
      annotateCurrentSubtitlesTranscriptionModel();
      applyTextCorrectionsToCurrentSubtitles();
      transcriptReviewHasFreshPayload = true;
      renderTranscriptReview();
      updateStylePreview();
      var freshSnapshot = getCreateSettingsSnapshot();

      updateRunProgress(90, "Creating layers in AE...");
      await waitForUiPaint();
      var aeResult = await createInAe(
        freshSnapshot.subtitlesPath,
        freshSnapshot.preset,
        freshSnapshot.marginY,
        freshSnapshot.updateMode,
        freshSnapshot.targetCompName,
        freshSnapshot.targetCompId,
        freshSnapshot.outputMode,
        freshSnapshot.fontOverride,
        freshSnapshot.styleOverrides
      );

      if (isAeErrorResult(aeResult)) {
        setStatus("Backend OK, AE failed:\n" + aeResult, true);
        finishRun("AE step failed", true);
        return;
      }

      updateRunProgress(100, "Done");
      setStatus("Run complete.\n" + (result.stdout || "") + "\n" + (aeResult || ""));
      finishRun("Run complete", false);
    } catch (err) {
      finishRun("Run failed", true);
      throw err;
    }
  }

  function bind(id, fn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", function () {
      Promise.resolve()
        .then(fn)
        .catch(function (err) {
          setRunOverlayVisible(false);
          setStatus(String(err && err.message ? err.message : err), true);
        });
    });
  }

  if (!cep) {
    setStatus("Preview mode. Open inside After Effects to scan, generate and apply captions.");
  } else if (!hasNodeBridge) {
    setStatus("Node runtime unavailable. Using AE system bridge.");
  } else {
    setStatus("Ready. Press Scan to load timeline sources.");
  }

  bind("btnScanSources", handleScanSources);
  bind("btnScanSourcesHero", handleScanSources);
  bind("btnRefreshTimings", handleTranscribe);
  bind("btnApplyChangedCaptions", handleApplyChangedCaptions);
  bind("btnTranscribe", handleTranscribe);
  bind("btnCreate", handleCreate);
  bind("btnFullRun", handleFullRun);
  bind("btnNativeQa", handleNativeQa);
  bind("btnCopyLog", copyLogToClipboard);
  bind("btnCopyCaptions", copyTranscriptReviewToClipboard);
  bind("btnExportSrt", function () { exportSubtitleFile("srt"); });
  bind("btnExportVtt", function () { exportSubtitleFile("vtt"); });
  bind("btnShufflePreview", function () {
    updateStylePreview({ randomize: true, manualRandomize: true });
  });
  bind("btnResetStyleColor", function () {
    var preset = getPresetPreviewConfig(getValue("preset") || DEFAULT_PRESET_NAME);
    styleOverrideState[activeStyleColorToken] = null;
    setStyleColorEditor(getPresetColorByToken(preset, activeStyleColorToken), activeStyleColorToken);
    updateStylePreview();
  });
  bind("btnResetReadability", function () {
    syncStyleControlsFromPreset({ resetOverrides: true });
    updateStylePreview();
  });

  if (fontPickerButtonEl) {
    fontPickerButtonEl.addEventListener("click", function (event) {
      event.preventDefault();
      pulsePickerButton(fontPickerButtonEl, { openingMs: fontCatalogReady ? 260 : 520 });
      var shouldOpen = !fontPickerMenuEl || fontPickerMenuEl.classList.contains("hidden");
      if (shouldOpen) {
        setPresetPickerOpen(false);
        setOutputModePickerOpen(false);
        setLanguagePickerOpen(false);
      }
      var needsFontLoadWindow = shouldOpen && (!fontCatalogReady || !fontCatalogVerifiedThisSession || isFontCatalogLoading);
      if (needsFontLoadWindow) {
        setFontPickerLoading(true, fontPickerPreviewEl && fontPickerPreviewEl.dataset.loadingMessage || "Loading fonts from AE...");
        renderFontPickerLoadingState(fontPickerPreviewEl && fontPickerPreviewEl.dataset.loadingMessage);
      }
      setFontPickerOpen(shouldOpen);
      if (needsFontLoadWindow) {
        setTimeout(function () {
          ensureFontsLoaded({ forceRefresh: !fontCatalogVerifiedThisSession, showMenuLoading: true }).catch(function () {
            setFontPickerLoading(false);
            updateFontPickerDisplay();
          });
        }, 16);
      }
    });
  }

  if (presetPickerButtonEl) {
    presetPickerButtonEl.addEventListener("click", function (event) {
      event.preventDefault();
      pulsePickerButton(presetPickerButtonEl, { openingMs: 240 });
      var shouldOpen = !presetPickerMenuEl || presetPickerMenuEl.classList.contains("hidden");
      if (shouldOpen) {
        setFontPickerOpen(false);
        setOutputModePickerOpen(false);
        setLanguagePickerOpen(false);
      }
      renderPresetPickerMenu();
      setPresetPickerOpen(shouldOpen);
    });
  }

  if (outputModePickerButtonEl) {
    outputModePickerButtonEl.addEventListener("click", function (event) {
      event.preventDefault();
      pulsePickerButton(outputModePickerButtonEl, { openingMs: 240 });
      var shouldOpen = !outputModePickerMenuEl || outputModePickerMenuEl.classList.contains("hidden");
      if (shouldOpen) {
        setFontPickerOpen(false);
        setPresetPickerOpen(false);
        setLanguagePickerOpen(false);
      }
      renderOutputModePickerMenu();
      setOutputModePickerOpen(shouldOpen);
    });
  }

  if (languagePickerButtonEl) {
    languagePickerButtonEl.addEventListener("click", function (event) {
      event.preventDefault();
      pulsePickerButton(languagePickerButtonEl, { openingMs: 240 });
      var shouldOpen = !languagePickerMenuEl || languagePickerMenuEl.classList.contains("hidden");
      if (shouldOpen) {
        setFontPickerOpen(false);
        setPresetPickerOpen(false);
        setOutputModePickerOpen(false);
      }
      renderLanguagePickerMenu();
      setLanguagePickerOpen(shouldOpen);
    });
  }

  if (fontPickerMenuEl) {
    fontPickerMenuEl.addEventListener("click", function (event) {
      var target = event.target;
      while (target && target !== fontPickerMenuEl) {
        if (target.getAttribute && target.getAttribute("data-font-value") !== null) {
          var value = String(target.getAttribute("data-font-value") || "");
          if (fontSelectEl) {
            fontSelectEl.value = value;
            fontSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
          }
          setFontPickerOpen(false);
          return;
        }
        target = target.parentNode;
      }
    });
  }

  if (presetPickerMenuEl) {
    presetPickerMenuEl.addEventListener("click", function (event) {
      var target = event.target;
      while (target && target !== presetPickerMenuEl) {
        if (target.getAttribute && target.getAttribute("data-preset-value") !== null) {
          var value = String(target.getAttribute("data-preset-value") || "");
          if (presetSelectEl) {
            presetSelectEl.value = value;
            presetSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
          }
          setPresetPickerOpen(false);
          return;
        }
        target = target.parentNode;
      }
    });
  }

  if (outputModePickerMenuEl) {
    outputModePickerMenuEl.addEventListener("click", function (event) {
      var target = event.target;
      while (target && target !== outputModePickerMenuEl) {
        if (target.getAttribute && target.getAttribute("data-preset-value") !== null) {
          var value = String(target.getAttribute("data-preset-value") || "");
          if (outputModeSelectEl) {
            outputModeSelectEl.value = value;
            outputModeSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
          }
          setOutputModePickerOpen(false);
          return;
        }
        target = target.parentNode;
      }
    });
  }

  if (languagePickerMenuEl) {
    languagePickerMenuEl.addEventListener("click", function (event) {
      var target = event.target;
      while (target && target !== languagePickerMenuEl) {
        if (target.getAttribute && target.getAttribute("data-preset-value") !== null) {
          var value = String(target.getAttribute("data-preset-value") || "");
          if (languageSelectEl) {
            languageSelectEl.value = value;
            languageSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
          }
          setLanguagePickerOpen(false);
          return;
        }
        target = target.parentNode;
      }
    });
  }

  document.addEventListener("mousedown", function (event) {
    if (fontPickerEl && fontPickerMenuEl && !fontPickerMenuEl.classList.contains("hidden") && !fontPickerEl.contains(event.target)) {
      setFontPickerOpen(false);
    }
    if (presetPickerEl && presetPickerMenuEl && !presetPickerMenuEl.classList.contains("hidden") && !presetPickerEl.contains(event.target)) {
      setPresetPickerOpen(false);
    }
    if (outputModePickerEl && outputModePickerMenuEl && !outputModePickerMenuEl.classList.contains("hidden") && !outputModePickerEl.contains(event.target)) {
      setOutputModePickerOpen(false);
    }
    if (languagePickerEl && languagePickerMenuEl && !languagePickerMenuEl.classList.contains("hidden") && !languagePickerEl.contains(event.target)) {
      setLanguagePickerOpen(false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setFontPickerOpen(false);
      setPresetPickerOpen(false);
      setOutputModePickerOpen(false);
      setLanguagePickerOpen(false);
    }
  });

  window.addEventListener("resize", repositionOpenPickerMenus);
  window.addEventListener("scroll", repositionOpenPickerMenus, true);

  if (stylePaletteEl) {
    stylePaletteEl.addEventListener("click", function (event) {
      var target = event.target;
      while (target && target !== stylePaletteEl) {
        if (target.getAttribute && target.getAttribute("data-style-token")) {
          activeStyleColorToken = String(target.getAttribute("data-style-token"));
          var effectivePreset = getEffectivePresetForPreview();
          setStyleColorEditor(getPresetColorByToken(effectivePreset, activeStyleColorToken), activeStyleColorToken);
          if (styleColorPickerEl && typeof styleColorPickerEl.click === "function") {
            styleColorPickerEl.click();
          }
          return;
        }
        target = target.parentNode;
      }
    });
  }

  ["preset", "fontSelect", "outputMode"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", function () {
      if (id === "preset") {
        renderPresetPickerMenu();
        updatePresetPickerDisplay();
        if (fontSelectEl) {
          fontSelectEl.value = "";
        }
        updateFontSelectOptions();
        syncStyleControlsFromPreset({ resetOverrides: true });
        updateStylePreview({ randomize: true });
        return;
      }
      if (id === "outputMode") {
        renderOutputModePickerMenu();
        updateOutputModePickerDisplay();
        updateStylePreview();
        return;
      }
      updateStylePreview();
    });
  });

  if (languageSelectEl) {
    languageSelectEl.addEventListener("change", function () {
      renderLanguagePickerMenu();
      updateLanguagePickerDisplay();
      markTranscriptTimingStale("Language changed. Press Retiming to recalculate captions before Run.");
      updateStylePreview({ randomize: true });
    });
  }

  if (styleColorPickerEl) {
    styleColorPickerEl.addEventListener("input", function () {
      var parsed = hexToRgbArray(styleColorPickerEl.value);
      if (!parsed) {
        return;
      }
      styleOverrideState[activeStyleColorToken] = parsed;
      setStyleColorEditor(parsed, activeStyleColorToken);
      updateStylePreview();
    });
  }

  if (styleColorHexEl) {
    styleColorHexEl.addEventListener("input", function () {
      var parsed = hexToRgbArray(styleColorHexEl.value);
      if (!parsed) {
        return;
      }
      styleOverrideState[activeStyleColorToken] = parsed;
      setStyleColorEditor(parsed, activeStyleColorToken);
      updateStylePreview();
    });
    styleColorHexEl.addEventListener("blur", function () {
      var parsed = hexToRgbArray(styleColorHexEl.value);
      if (parsed) {
        styleOverrideState[activeStyleColorToken] = parsed;
        setStyleColorEditor(parsed, activeStyleColorToken);
        updateStylePreview();
        return;
      }
      var preset = getPresetPreviewConfig(getValue("preset") || DEFAULT_PRESET_NAME);
      var fallbackColor = styleOverrideState[activeStyleColorToken] || getPresetColorByToken(preset, activeStyleColorToken);
      setStyleColorEditor(fallbackColor, activeStyleColorToken);
      updateStylePreview();
    });
  }

  if (referenceTextEl) {
    referenceTextEl.addEventListener("input", function () {
      if (transcriptReviewHasFreshPayload && applyTextCorrectionsToCurrentSubtitles()) {
        renderTranscriptReview();
        updateStylePreview();
      }
    });
  }

  if (btnAddWordRuleEl) {
    btnAddWordRuleEl.addEventListener("click", function () {
      var row = renderWordRuleRow();
      if (row) {
        var input = row.querySelector("[data-rule-field='phrase']");
        if (input && input.focus) {
          input.focus();
        }
      }
    });
  }

  [
    [fontSizeControlEl, "fontSize", "number"],
    [marginXControlEl, "positionOffsetX", "number"],
    [marginYControlEl, "marginY", "number"],
    [maxLinesControlEl, "maxLines", "number"],
    [blockWidthControlEl, "maxTextWidth", "number"],
    [blockScaleControlEl, "blockScale", "number"],
    [leadingControlEl, "leading", "number"],
    [trackingControlEl, "tracking", "number"],
    [strokeWidthControlEl, "strokeWidth", "number"],
    [lineBoxEnabledControlEl, "lineBoxEnabled", "checkbox"],
    [boxPaddingControlEl, "boxPadding", "number"],
    [boxRoundnessControlEl, "boxRoundness", "number"],
    [boxOpacityControlEl, "boxOpacity", "number"],
    [strokeEnabledControlEl, "strokeEnabled", "checkbox"],
    [italicControlEl, "fauxItalic", "checkbox"],
    [boxEnabledControlEl, "boxEnabled", "checkbox"],
    [boxSmartControlEl, "boxSmart", "checkbox"]
  ].forEach(function (entry) {
    var el = entry[0];
    var key = entry[1];
    var kind = entry[2];
    if (!el) return;
    var handler = function () {
      updateSliderValueDisplay(el);
      if (kind === "checkbox") {
        styleOverrideState[key] = !!el.checked;
      } else {
        var value = Number(el.value);
        if (isNaN(value)) {
          return;
        }
        styleOverrideState[key] = value;
        if (key === "strokeWidth") {
          styleOverrideState.strokeOverFill = false;
          styleOverrideState.lineJoinType = "round";
          if (value > 0) {
            styleOverrideState.strokeEnabled = true;
            if (strokeEnabledControlEl) {
              strokeEnabledControlEl.checked = true;
            }
          }
        }
        if (key === "marginY") {
          styleOverrideState.verticalMarginY = value;
        }
      }
      refreshControlAvailability();
      updateStylePreview();
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });

  ["maxChars"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var syncDisplay = function () {
      updateSliderValueDisplay(el);
      updateStylePreview();
    };
    el.addEventListener("input", syncDisplay);
    el.addEventListener("change", syncDisplay);
    syncDisplay();
  });

  var modelEl = document.getElementById("model");
  if (modelEl) {
    var syncModelPreview = function () {
      markTranscriptTimingStale("Recognition model changed. Press Retiming to recalculate captions before Run.");
      updateStylePreview();
    };
    modelEl.addEventListener("input", syncModelPreview);
    modelEl.addEventListener("change", syncModelPreview);
  }

  [
    fontSizeControlEl,
    marginXControlEl,
    marginYControlEl,
    blockWidthControlEl,
    maxLinesControlEl,
    blockScaleControlEl,
    leadingControlEl,
    trackingControlEl,
    strokeWidthControlEl,
    boxPaddingControlEl,
    boxRoundnessControlEl,
    boxOpacityControlEl
  ].forEach(function (el) {
    updateSliderValueDisplay(el);
  });

  exposeSelfTestHooks();
  renderPresetPickerMenu();
  updatePresetPickerDisplay();
  renderOutputModePickerMenu();
  updateOutputModePickerDisplay();
  renderLanguagePickerMenu();
  updateLanguagePickerDisplay();
  ensureFontsLoaded().catch(function () {
    updateFontSelectOptions();
    syncStyleControlsFromPreset({ resetOverrides: true });
    updateStylePreview({ randomize: true });
  });
  bindPreviewDrag();

  scheduleStartupBackgroundTranscription();

})();
