function _jsxReadTextFile(path) {
    var file = new File(path);
    if (!file.exists) {
        throw new Error("File not found: " + path);
    }
    file.encoding = "UTF-8";
    if (!file.open("r")) {
        throw new Error("Cannot open file: " + path);
    }
    var text = file.read();
    file.close();
    return text;
}

function _jsxParseJSON(text) {
    var raw = String(text || "");
    if (raw.length && raw.charCodeAt(0) === 0xFEFF) {
        raw = raw.substring(1);
    }

    if (typeof JSON !== "undefined" && JSON.parse) {
        try {
            return JSON.parse(raw);
        } catch (_jsonErr) {
            // ExtendScript JSON.parse fails on values like NaN/Infinity.
            // Fallback parser keeps compatibility with backend output.
            try {
                return eval("(" + raw + ")");
            } catch (_evalErr) {
                throw _jsonErr;
            }
        }
    }

    return eval("(" + raw + ")");
}

function readJsonFile(path) {
    var text = _jsxReadTextFile(path);
    try {
        return _jsxParseJSON(text);
    } catch (e) {
        throw new Error("JSON parse failed for " + path + ": " + e.toString());
    }
}

function _jsonEscapeText(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, "\\\"")
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
}

function _writeApplyStatus(stage, detail) {
    try {
        var statusPath = $.global.AEAS_APPLY_STATUS_PATH || "";
        if (!statusPath) {
            return;
        }
        var file = new File(statusPath);
        var parent = file.parent;
        if (parent && !parent.exists) {
            parent.create();
        }
        file.encoding = "UTF-8";
        if (!file.open("w")) {
            return;
        }
        file.write(
            "{\"stage\":\"" + _jsonEscapeText(stage) +
            "\",\"detail\":\"" + _jsonEscapeText(detail || "") +
            "\",\"time\":" + (new Date()).getTime() + "}"
        );
        file.close();
    } catch (_statusErr) {}
}

function loadPresets(path) {
    return readJsonFile(path);
}

function _cloneObject(obj) {
    if (!obj) {
        return {};
    }
    if (typeof JSON !== "undefined" && JSON.stringify && JSON.parse) {
        return JSON.parse(JSON.stringify(obj));
    }
    var copy = {};
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            copy[k] = obj[k];
        }
    }
    return copy;
}

function resolvePreset(presets, presetName, marginY) {
    var base = presets[presetName] || presets.classic_clean || presets.minimal || presets.box || {};
    var preset = _cloneObject(base);
    if (marginY !== null && marginY !== undefined && marginY !== "" && !isNaN(Number(marginY))) {
        preset.marginY = Number(marginY);
    }
    if (preset.marginY === undefined || preset.marginY === null) {
        preset.marginY = 180;
    }
    return preset;
}

function _isBoxDisabledPresetName(presetName) {
    var key = String(presetName || "classic_clean");
    return key === "classic_clean" ||
        key === "clean_paragraph" ||
        key === "modern_yellow" ||
        key === "bold_yellow_shadow" ||
        key === "bold_two_words";
}

function _disableBoxFeaturesForPreset(preset) {
    if (!preset) {
        return preset;
    }
    preset.boxEnabled = false;
    preset.boxSmart = false;
    preset.wordBoxEnabled = false;
    return preset;
}

function _disableLegacyBoxWhenLineBoxIsEnabled(preset) {
    if (!preset || !(preset.lineBoxEnabled || preset.backplateEnabled)) {
        return preset;
    }
    preset.boxEnabled = false;
    preset.boxSmart = false;
    preset.wordBoxEnabled = false;
    return preset;
}

function _isBackplateEnabled(preset) {
    return !!(preset && (preset.backplateEnabled || preset.lineBoxEnabled));
}

function _normalizeBackplatePreset(preset) {
    if (!preset) {
        return preset;
    }
    if (preset.lineBoxEnabled && !preset.backplateEnabled) {
        preset.backplateEnabled = true;
    }
    if (preset.backplateEnabled) {
        preset.backplateRenderMode = "precomp";
        if (!preset.backplateColor && preset.lineBoxColor) {
            preset.backplateColor = preset.lineBoxColor;
        }
        if (preset.backplateOpacity === undefined && preset.lineBoxOpacity !== undefined) {
            preset.backplateOpacity = preset.lineBoxOpacity;
        }
        if (preset.backplatePaddingX === undefined && preset.lineBoxPaddingX !== undefined) {
            preset.backplatePaddingX = preset.lineBoxPaddingX;
        }
        if (preset.backplatePaddingY === undefined && preset.lineBoxPaddingY !== undefined) {
            preset.backplatePaddingY = preset.lineBoxPaddingY;
        }
        if (preset.backplateRoundness === undefined && preset.lineBoxRoundness !== undefined) {
            preset.backplateRoundness = preset.lineBoxRoundness;
        }
        preset.lineBoxEnabled = false;
    }
    _disableLegacyBoxWhenLineBoxIsEnabled(preset);
    return preset;
}

function _scalePresetNumber(preset, key, scale) {
    if (!preset || preset[key] === undefined || preset[key] === null) {
        return;
    }
    var value = Number(preset[key]);
    if (isNaN(value)) {
        return;
    }
    preset[key] = value * scale;
}

function _getDesignScaleForComp(comp) {
    var width = _toNumber(comp && comp.width, 0);
    var height = _toNumber(comp && comp.height, 0);
    if (!(width > 0) || !(height > 0)) {
        return 1;
    }

    var vertical = height >= width;
    var designWidth = vertical ? 1080 : 1920;
    var designHeight = vertical ? 1920 : 1080;
    return _clamp(Math.min(width / designWidth, height / designHeight), 0.1, 4);
}

function _scalePresetToComp(preset, comp) {
    var scale = _getDesignScaleForComp(comp);
    if (!preset || Math.abs(scale - 1) < 0.001) {
        return preset;
    }

    var keys = [
        "fontSize",
        "leading",
        "tracking",
        "strokeWidth",
        "maxTextWidth",
        "marginY",
        "verticalMarginY",
        "positionOffsetX",
        "boxPadding",
        "boxPaddingX",
        "boxPaddingY",
        "boxRoundness",
        "boxMinWidth",
        "boxMinHeight",
        "boxOffsetX",
        "boxOffsetY",
        "boxStrokeWidth",
        "wordBoxPadding",
        "wordBoxPaddingX",
        "wordBoxPaddingY",
        "wordBoxRoundness",
        "wordStrokeWidth",
        "backplatePaddingX",
        "backplatePaddingY",
        "backplateRoundness",
        "lineBoxPaddingX",
        "lineBoxPaddingY",
        "lineBoxRoundness",
        "shadowDistance",
        "shadowBlur",
        "shadowSpread",
        "animYOffset"
    ];
    for (var i = 0; i < keys.length; i++) {
        _scalePresetNumber(preset, keys[i], scale);
    }
    preset.__designScale = scale;
    return preset;
}

function applyFontOverrideToPreset(preset, fontOverride) {
    var value = String(fontOverride || "");
    if (!value) {
        return preset;
    }
    preset.font = value;
    return preset;
}

function applyStyleOverridesToPreset(preset, styleOverridesJson) {
    var raw = String(styleOverridesJson || "");
    if (!raw) {
        return preset;
    }
    var overrides = null;
    try {
        overrides = _jsxParseJSON(raw);
    } catch (_parseErr) {
        return preset;
    }
    if (!overrides || typeof overrides !== "object") {
        return preset;
    }
    if (overrides.font) {
        preset.font = String(overrides.font);
    }
    if (overrides.accentColor && overrides.accentColor.length === 3) {
        preset.accentColor = [
            Number(overrides.accentColor[0]),
            Number(overrides.accentColor[1]),
            Number(overrides.accentColor[2])
        ];
    }
    if (overrides.fillColor && overrides.fillColor.length === 3) {
        preset.fillColor = [
            Number(overrides.fillColor[0]),
            Number(overrides.fillColor[1]),
            Number(overrides.fillColor[2])
        ];
    }
    if (overrides.strokeColor && overrides.strokeColor.length === 3) {
        preset.strokeColor = [
            Number(overrides.strokeColor[0]),
            Number(overrides.strokeColor[1]),
            Number(overrides.strokeColor[2])
        ];
    }
    if (overrides.boxColor && overrides.boxColor.length === 3) {
        preset.boxColor = [
            Number(overrides.boxColor[0]),
            Number(overrides.boxColor[1]),
            Number(overrides.boxColor[2])
        ];
        if (preset.wordBoxEnabled) {
            preset.wordBoxColor = [
                Number(overrides.boxColor[0]),
                Number(overrides.boxColor[1]),
                Number(overrides.boxColor[2])
            ];
        }
    }
    if (overrides.shadowColor && overrides.shadowColor.length === 3) {
        preset.shadowColor = [
            Number(overrides.shadowColor[0]),
            Number(overrides.shadowColor[1]),
            Number(overrides.shadowColor[2])
        ];
    }
    if (overrides.strokeEnabled !== undefined) {
        preset.strokeEnabled = !!overrides.strokeEnabled;
    }
    if (overrides.strokeWidth !== undefined && !isNaN(Number(overrides.strokeWidth))) {
        preset.strokeWidth = Number(overrides.strokeWidth);
    }
    if (overrides.fontSize !== undefined && !isNaN(Number(overrides.fontSize))) {
        preset.fontSize = Number(overrides.fontSize);
    }
    if (overrides.maxLines !== undefined && !isNaN(Number(overrides.maxLines))) {
        preset.maxLines = Math.max(1, Math.min(4, Math.round(Number(overrides.maxLines))));
    }
    if (overrides.maxTextWidth !== undefined && !isNaN(Number(overrides.maxTextWidth))) {
        preset.maxTextWidth = Number(overrides.maxTextWidth);
    }
    if (overrides.blockScale !== undefined && !isNaN(Number(overrides.blockScale))) {
        preset.blockScale = _clamp(Number(overrides.blockScale), 40, 180);
    }
    if (overrides.marginY !== undefined && !isNaN(Number(overrides.marginY))) {
        preset.marginY = Number(overrides.marginY);
    }
    if (overrides.verticalMarginY !== undefined && !isNaN(Number(overrides.verticalMarginY))) {
        preset.verticalMarginY = Number(overrides.verticalMarginY);
    } else if (overrides.marginY !== undefined && !isNaN(Number(overrides.marginY))) {
        preset.verticalMarginY = Number(overrides.marginY);
    }
    if (overrides.leading !== undefined && !isNaN(Number(overrides.leading))) {
        preset.leading = Number(overrides.leading);
    }
    if (overrides.tracking !== undefined && !isNaN(Number(overrides.tracking))) {
        preset.tracking = Number(overrides.tracking);
    }
    if (overrides.fauxItalic !== undefined) {
        preset.fauxItalic = !!overrides.fauxItalic;
    }
    if (overrides.boxEnabled !== undefined) {
        preset.boxEnabled = !!overrides.boxEnabled;
    }
    if (overrides.wordBoxEnabled !== undefined) {
        preset.wordBoxEnabled = !!overrides.wordBoxEnabled;
    }
    if (overrides.backplateEnabled !== undefined) {
        preset.backplateEnabled = !!overrides.backplateEnabled;
        preset.backplateRenderMode = "precomp";
        preset.lineBoxEnabled = false;
    }
    if (overrides.lineBoxEnabled !== undefined && overrides.backplateEnabled === undefined) {
        preset.backplateEnabled = !!overrides.lineBoxEnabled;
        preset.backplateRenderMode = "precomp";
        preset.lineBoxEnabled = false;
    }
    _normalizeBackplatePreset(preset);
    if (overrides.backplateColor && overrides.backplateColor.length === 3) {
        preset.backplateColor = [
            Number(overrides.backplateColor[0]),
            Number(overrides.backplateColor[1]),
            Number(overrides.backplateColor[2])
        ];
    }
    if (overrides.lineBoxColor && overrides.lineBoxColor.length === 3) {
        preset.backplateColor = [
            Number(overrides.lineBoxColor[0]),
            Number(overrides.lineBoxColor[1]),
            Number(overrides.lineBoxColor[2])
        ];
    }
    if (overrides.backplatePaddingX !== undefined && !isNaN(Number(overrides.backplatePaddingX))) {
        preset.backplatePaddingX = Number(overrides.backplatePaddingX);
    }
    if (overrides.backplatePaddingY !== undefined && !isNaN(Number(overrides.backplatePaddingY))) {
        preset.backplatePaddingY = Number(overrides.backplatePaddingY);
    }
    if (overrides.backplateRoundness !== undefined && !isNaN(Number(overrides.backplateRoundness))) {
        preset.backplateRoundness = Number(overrides.backplateRoundness);
    }
    if (overrides.backplateOpacity !== undefined && !isNaN(Number(overrides.backplateOpacity))) {
        preset.backplateOpacity = Number(overrides.backplateOpacity);
    }
    if (overrides.lineBoxPaddingX !== undefined && !isNaN(Number(overrides.lineBoxPaddingX))) {
        preset.backplatePaddingX = Number(overrides.lineBoxPaddingX);
    }
    if (overrides.lineBoxPaddingY !== undefined && !isNaN(Number(overrides.lineBoxPaddingY))) {
        preset.backplatePaddingY = Number(overrides.lineBoxPaddingY);
    }
    if (overrides.lineBoxRoundness !== undefined && !isNaN(Number(overrides.lineBoxRoundness))) {
        preset.backplateRoundness = Number(overrides.lineBoxRoundness);
    }
    if (overrides.lineBoxOpacity !== undefined && !isNaN(Number(overrides.lineBoxOpacity))) {
        preset.backplateOpacity = Number(overrides.lineBoxOpacity);
    }
    if (overrides.positionOffsetX !== undefined && !isNaN(Number(overrides.positionOffsetX))) {
        preset.positionOffsetX = Number(overrides.positionOffsetX);
    }
    if (overrides.boxSmart !== undefined) {
        preset.boxSmart = !!overrides.boxSmart;
    }
    if (overrides.boxPadding !== undefined && !isNaN(Number(overrides.boxPadding))) {
        preset.boxPadding = Number(overrides.boxPadding);
        preset.boxPaddingX = preset.boxPadding;
        preset.boxPaddingY = preset.boxPadding;
        if (_isBackplateEnabled(preset)) {
            preset.backplatePaddingX = preset.boxPadding;
            preset.backplatePaddingY = Math.max(0, Math.round(preset.boxPadding * 0.5));
        }
        if (preset.wordBoxEnabled) {
            preset.wordBoxPadding = preset.boxPadding;
            preset.wordBoxPaddingX = preset.boxPadding;
            preset.wordBoxPaddingY = preset.boxPadding;
        }
    }
    if (overrides.boxRoundness !== undefined && !isNaN(Number(overrides.boxRoundness))) {
        preset.boxRoundness = Number(overrides.boxRoundness);
        if (_isBackplateEnabled(preset)) {
            preset.backplateRoundness = preset.boxRoundness;
        }
        if (preset.wordBoxEnabled) {
            preset.wordBoxRoundness = preset.boxRoundness;
        }
    }
    if (overrides.boxOpacity !== undefined && !isNaN(Number(overrides.boxOpacity))) {
        preset.boxOpacity = Number(overrides.boxOpacity);
        if (_isBackplateEnabled(preset)) {
            preset.backplateOpacity = preset.boxOpacity;
        }
        if (preset.wordBoxEnabled) {
            preset.wordBoxOpacity = preset.boxOpacity;
        }
    }
    _normalizeBackplatePreset(preset);
    return preset;
}

function findLayerByName(comp, name) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (layer.name === name) {
            return layer;
        }
    }
    return null;
}

function findCompByName(name) {
    if (!app.project) {
        return null;
    }
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === name) {
            return item;
        }
    }
    return null;
}

function findCompById(compId) {
    var wanted = Number(compId);
    if (!wanted || isNaN(wanted) || !app.project) {
        return null;
    }
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        try {
            if (item instanceof CompItem && Number(item.id) === wanted) {
                return item;
            }
        } catch (_ignored) {}
    }
    return null;
}

function resolveTargetComp(target, compName, compId) {
    if (!app.project) {
        throw new Error("No active project.");
    }

    if (target === "comp_id") {
        var byId = findCompById(compId || "");
        if (byId) {
            return byId;
        }
        var byNameFallback = findCompByName(compName || "");
        if (byNameFallback) {
            return byNameFallback;
        }
        throw new Error("Comp not found by id/name: id=" + compId + " name=" + compName);
    }

    if (target === "comp_name") {
        var named = findCompByName(compName || "");
        if (named) {
            return named;
        }
        throw new Error("Comp not found: " + compName);
    }

    if (target === "selected_footage") {
        if (app.project.selection && app.project.selection.length > 0) {
            var selected = app.project.selection[0];
            if (selected instanceof FootageItem) {
                var fps = selected.mainSource && selected.mainSource.conformFrameRate ? selected.mainSource.conformFrameRate : 25;
                if (!fps || fps <= 0) {
                    fps = 25;
                }
                var duration = selected.duration > 0 ? selected.duration : 10;
                return app.project.items.addComp(selected.name + "_SUBS", selected.width, selected.height, selected.pixelAspect, duration, fps);
            }
            if (selected instanceof CompItem) {
                return selected;
            }
        }
    }

    if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
        return app.project.activeItem;
    }

    throw new Error("No target comp: open a comp or choose comp_id/comp_name/selected_footage.");
}

function _focusTargetCompViewer(comp) {
    if (!comp) {
        return;
    }
    try {
        if (comp.openInViewer) {
            comp.openInViewer();
        }
    } catch (_viewerErr) {}
}

function ensureSubtitlesContainer(comp) {
    var container = findLayerByName(comp, "SUBTITLES__AUTO");
    if (container) {
        var wasLocked = false;
        try {
            wasLocked = !!container.locked;
            if (wasLocked) {
                container.locked = false;
            }
            container.guideLayer = false;
            container.enabled = true;
        } finally {
            if (wasLocked) {
                container.locked = true;
            }
        }
        return container;
    }

    container = comp.layers.addNull();
    container.name = "SUBTITLES__AUTO";
    container.guideLayer = false;
    container.enabled = true;
    container.shy = true;
    container.locked = true;
    container.inPoint = 0;
    container.outPoint = comp.duration;
    return container;
}

function _compPointToLayerParentSpace(layer, point) {
    var x = Number(point && point[0]);
    var y = Number(point && point[1]);
    if (isNaN(x)) {
        x = 0;
    }
    if (isNaN(y)) {
        y = 0;
    }
    try {
        var parentLayer = layer ? layer.parent : null;
        if (parentLayer && parentLayer.fromComp) {
            var local = parentLayer.fromComp([x, y, 0]);
            return [Number(local[0]), Number(local[1])];
        }
    } catch (_fromCompErr) {}
    return [x, y];
}

function _setLayerPositionInCompSpace(layer, point) {
    if (!_isValidAeObject(layer)) {
        return null;
    }
    var local = _compPointToLayerParentSpace(layer, point);
    try {
        var prop = layer.property("ADBE Transform Group").property("ADBE Position");
        var current = prop.value;
        if (current && current.length >= 3) {
            prop.setValue([local[0], local[1], Number(current[2]) || 0]);
        } else {
            prop.setValue([local[0], local[1]]);
        }
    } catch (_setCompPosErr) {}
    return local;
}

function _setLayerPositionAtTimeInCompSpace(layer, timeValue, point) {
    if (!_isValidAeObject(layer)) {
        return null;
    }
    var local = _compPointToLayerParentSpace(layer, point);
    try {
        var prop = layer.property("ADBE Transform Group").property("ADBE Position");
        var current = prop.value;
        if (current && current.length >= 3) {
            prop.setValueAtTime(timeValue, [local[0], local[1], Number(current[2]) || 0]);
        } else {
            prop.setValueAtTime(timeValue, [local[0], local[1]]);
        }
    } catch (_setCompPosTimeErr) {}
    return local;
}

function _getLayerPositionInCompSpace(layer) {
    if (!_isValidAeObject(layer)) {
        return null;
    }
    try {
        var prop = layer.property("ADBE Transform Group").property("ADBE Position");
        var value = prop.value;
        if (!value || value.length < 2) {
            return null;
        }
        var x = Number(value[0]);
        var y = Number(value[1]);
        var parentLayer = layer.parent;
        if (parentLayer && parentLayer.toComp) {
            var compPoint = parentLayer.toComp([x, y, value.length >= 3 ? Number(value[2]) || 0 : 0]);
            return [Number(compPoint[0]), Number(compPoint[1])];
        }
        return [x, y];
    } catch (_getCompPosErr) {}
    return null;
}

function _resolvePositionControlPoint(comp, preset) {
    return [
        _resolveSubtitleBaseX(comp, preset || {}),
        _resolveSubtitleBaseY(comp, preset || {}, 1)
    ];
}

function _shouldAutoParentSubtitles(preset) {
    return !!(preset && preset.autoParentToPosition === true);
}

function ensureSubtitlesPositionControl(comp, preset) {
    var control = findLayerByName(comp, "Position");
    var isNew = false;
    if (control && !_isValidAeObject(control)) {
        control = null;
    }
    if (!control) {
        control = comp.layers.addNull();
        control.name = "Position";
        isNew = true;
    }
    if (!_isValidAeObject(control)) {
        return null;
    }
    try { control.enabled = true; } catch (_enableErr) {}
    try { control.shy = false; } catch (_shyErr) {}
    try { control.guideLayer = false; } catch (_guideErr) {}
    try { control.locked = false; } catch (_lockErr) {}
    try { control.inPoint = 0; } catch (_inErr) {}
    try { control.outPoint = comp.duration; } catch (_outErr) {}
    _setLayerPositionInCompSpace(control, _resolvePositionControlPoint(comp, preset || {}));
    if (isNew) {
        try { control.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]); } catch (_scaleErr) {}
    }
    try { control.moveToBeginning(); } catch (_moveErr) {}
    return control;
}

function _isSubtitleAutoLayerName(name) {
    var value = String(name || "");
    return value.indexOf("SUB__") === 0 ||
        value.indexOf("SUBUNIT__") === 0 ||
        value.indexOf("SUBLINE__") === 0 ||
        value.indexOf("SUBWORD__") === 0 ||
        value.indexOf("BOX__") === 0 ||
        value.indexOf("LINEBOX__") === 0;
}

function parentSubtitleLayersToPositionControl(comp, preset) {
    if (!_shouldAutoParentSubtitles(preset)) {
        return null;
    }
    var control = ensureSubtitlesPositionControl(comp, preset || {});
    if (!control) {
        return null;
    }
    for (var i = comp.numLayers; i >= 1; i--) {
        var layer = comp.layer(i);
        if (!_isValidAeObject(layer) || layer === control) {
            continue;
        }
        var name = "";
        try { name = String(layer.name || ""); } catch (_nameErr) {}
        if (!_isSubtitleAutoLayerName(name)) {
            continue;
        }
        var existingParent = null;
        try { existingParent = layer.parent; } catch (_parentReadErr) {}
        if (existingParent && existingParent === control) {
            var worldPosition = _getLayerPositionInCompSpace(layer);
            try { layer.parent = null; } catch (_detachErr) {}
            if (worldPosition && worldPosition.length >= 2) {
                _setLayerPositionInCompSpace(layer, worldPosition);
            }
            continue;
        }
        if (existingParent && _isSubtitleAutoLayerName(existingParent.name)) {
            continue;
        }
    }
    try { control.moveToBeginning(); } catch (_moveTopErr) {}
    return control;
}

function _parentLayerToPositionControlBeforeLayout(layer, comp, preset) {
    if (!_isValidAeObject(layer)) {
        return null;
    }
    if (!_shouldAutoParentSubtitles(preset)) {
        return null;
    }
    var control = ensureSubtitlesPositionControl(comp, preset || {});
    if (!_isValidAeObject(control) || layer === control) {
        return control;
    }
    try {
        var existingParent = layer.parent;
        if (existingParent && existingParent === control) {
            var worldPosition = _getLayerPositionInCompSpace(layer);
            try { layer.parent = null; } catch (_detachPositionParentErr) {}
            if (worldPosition && worldPosition.length >= 2) {
                _setLayerPositionInCompSpace(layer, worldPosition);
            }
            return control;
        }
    } catch (_existingParentErr) {}
    // Do not auto-parent subtitle layers to Position unless the preset opts in.
    // Text layers stay in comp space to avoid AE converting centered comp
    // coordinates into offset child coordinates.
    return control;
}

function _safeSet(obj, prop, value) {
    try {
        obj[prop] = value;
        return true;
    } catch (_ignored) {
        return false;
    }
}

function _isValidAeObject(obj) {
    if (!obj) {
        return false;
    }
    try {
        var _name = obj.name;
        return true;
    } catch (_ignored) {
        return false;
    }
}

function _trySetAllCaps(doc, enabled) {
    if (_safeSet(doc, "allCaps", !!enabled)) {
        return;
    }

    try {
        if (typeof FontCapsOption !== "undefined") {
            var capsValue = enabled ? FontCapsOption.FONT_ALL_CAPS : FontCapsOption.FONT_NORMAL_CAPS;
            _safeSet(doc, "fontCapsOption", capsValue);
        }
    } catch (_ignored2) {}
}

function _applyStrokeRenderDefaults(styleTarget) {
    if (!styleTarget) {
        return;
    }
    try {
        styleTarget.strokeOverFill = false;
    } catch (_eStrokeOrder) {}
    try {
        if (typeof LineJoinType !== "undefined" && LineJoinType.LINE_JOIN_ROUND !== undefined) {
            styleTarget.lineJoinType = LineJoinType.LINE_JOIN_ROUND;
        }
    } catch (_eLineJoin) {}
}

function _isStrokeEffectivelyEnabled(preset) {
    return !!(preset && preset.strokeEnabled && _toNumber(preset.strokeWidth, 0) > 0);
}

function _applyTextLayerStrokeRenderOptions(textLayer, preset) {
    if (!textLayer || !_isStrokeEffectivelyEnabled(preset)) {
        return;
    }
    var allFillsOverAllStrokes = 2;
    try {
        var moreOptions = textLayer.text("ADBE Text More Options");
        var renderOrder = moreOptions ? moreOptions("ADBE Text Render Order") : null;
        if (renderOrder) {
            renderOrder.setValue(allFillsOverAllStrokes);
        }
    } catch (_eRenderOrder) {}
    try {
        if (textLayer.text && textLayer.text.moreOption && textLayer.text.moreOption.fillANdStroke) {
            textLayer.text.moreOption.fillANdStroke.setValue(allFillsOverAllStrokes);
        }
    } catch (_eLegacyRenderOrder) {}
}

function setTextStyle(doc, preset) {
    if (preset.font) {
        _safeSet(doc, "font", preset.font);
    }
    if (preset.fauxItalic !== undefined) {
        _safeSet(doc, "fauxItalic", !!preset.fauxItalic);
    }
    if (preset.fontSize) {
        _safeSet(doc, "fontSize", Number(preset.fontSize));
    }
    if (preset.fillColor && preset.fillColor.length === 3) {
        _safeSet(doc, "fillColor", [Number(preset.fillColor[0]), Number(preset.fillColor[1]), Number(preset.fillColor[2])]);
    }
    _safeSet(doc, "applyFill", true);

    if (_isStrokeEffectivelyEnabled(preset)) {
        _safeSet(doc, "applyStroke", true);
        if (preset.strokeColor && preset.strokeColor.length === 3) {
            _safeSet(doc, "strokeColor", [Number(preset.strokeColor[0]), Number(preset.strokeColor[1]), Number(preset.strokeColor[2])]);
        }
        if (preset.strokeWidth !== undefined) {
            _safeSet(doc, "strokeWidth", Number(preset.strokeWidth));
        }
        _applyStrokeRenderDefaults(doc);
    } else {
        _safeSet(doc, "applyStroke", false);
    }

    if (preset.tracking !== undefined) {
        _safeSet(doc, "tracking", Number(preset.tracking));
    }
    if (preset.leading !== undefined) {
        _safeSet(doc, "leading", Number(preset.leading));
        _safeSet(doc, "autoLeading", false);
    }
    if (preset.strokeOverFill !== undefined && !_isStrokeEffectivelyEnabled(preset)) {
        _safeSet(doc, "strokeOverFill", !!preset.strokeOverFill);
    }
    if (preset.allCaps !== undefined) {
        _trySetAllCaps(doc, !!preset.allCaps);
    }

    try {
        var justification = ParagraphJustification.CENTER_JUSTIFY;
        if (preset && preset.justification === "left") {
            justification = ParagraphJustification.LEFT_JUSTIFY;
        } else if (preset && preset.justification === "right") {
            justification = ParagraphJustification.RIGHT_JUSTIFY;
        }
        _safeSet(doc, "justification", justification);
    } catch (_ignored3) {}
}

function _findAccentTailRange(text) {
    var value = String(text || "");
    if (!value) {
        return null;
    }

    var end = value.length;
    while (end > 0 && /\s/.test(value.charAt(end - 1))) {
        end--;
    }
    if (end <= 0) {
        return null;
    }

    var start = end - 1;
    while (start > 0 && !/\s/.test(value.charAt(start - 1))) {
        start--;
    }

    if (start >= end) {
        return null;
    }

    return {
        start: start,
        length: end - start
    };
}

function _applyAccentCharRange(doc, preset, start, length) {
    if (!doc || !preset || !preset.accentColor || preset.accentColor.length !== 3) {
        return;
    }
    if (typeof doc.characterRange !== "function") {
        return;
    }
    if (start === undefined || length === undefined || length <= 0) {
        return;
    }

    try {
        var from = Number(start);
        var to = from + Number(length);
        if (!(to > from)) {
            return;
        }
        var accent = doc.characterRange(from, to);
        accent.fillColor = [
            Number(preset.accentColor[0]),
            Number(preset.accentColor[1]),
            Number(preset.accentColor[2])
        ];
    } catch (_ignored) {}
}

function _applyWordRuleHighlights(doc, highlights) {
    if (!doc || typeof doc.characterRange !== "function" || !highlights || !highlights.length) {
        return;
    }
    var textLength = 0;
    try { textLength = String(doc.text || "").length; } catch (_ignored0) {}
    for (var i = 0; i < highlights.length; i++) {
        var item = highlights[i] || {};
        var start = Math.max(0, Number(item.start) || 0);
        var length = Math.max(0, Number(item.length) || 0);
        var end = Math.min(textLength, start + length);
        if (!(end > start)) {
            continue;
        }
        try {
            var range = doc.characterRange(start, end);
            if (item.fillColor && item.fillColor.length === 3) {
                range.applyFill = true;
                range.fillColor = [
                    Number(item.fillColor[0]),
                    Number(item.fillColor[1]),
                    Number(item.fillColor[2])
                ];
            }
            if (item.strokeColor && item.strokeColor.length === 3 && Number(item.strokeWidth || 0) > 0) {
                range.applyStroke = true;
                range.strokeColor = [
                    Number(item.strokeColor[0]),
                    Number(item.strokeColor[1]),
                    Number(item.strokeColor[2])
                ];
                range.strokeWidth = Number(item.strokeWidth || 4);
                _applyStrokeRenderDefaults(range);
            }
        } catch (_ignored1) {}
    }
}

function _resetDocumentStyles(doc) {
    if (!doc) {
        return;
    }
    try {
        if (typeof doc.resetCharStyle === "function") {
            doc.resetCharStyle();
        }
    } catch (_ignored1) {}
    try {
        if (typeof doc.resetParagraphStyle === "function") {
            doc.resetParagraphStyle();
        }
    } catch (_ignored2) {}
}

function _applyBaseStyleToAllCharacters(doc, preset, textValue) {
    if (!doc || !preset || typeof doc.characterRange !== "function") {
        return;
    }

    var value = String(textValue !== undefined ? textValue : doc.text || "");
    if (!value.length) {
        return;
    }

    try {
        var all = doc.characterRange(0, value.length);
        if (preset.font) {
            try { all.font = preset.font; } catch (_eFont) {}
        }
        if (preset.fauxItalic !== undefined) {
            try { all.fauxItalic = !!preset.fauxItalic; } catch (_eItalic) {}
        }
        if (preset.fontSize) {
            try { all.fontSize = Number(preset.fontSize); } catch (_eSize) {}
        }
        try { all.applyFill = true; } catch (_eFill) {}
        if (preset.fillColor && preset.fillColor.length === 3) {
            try {
                all.fillColor = [
                    Number(preset.fillColor[0]),
                    Number(preset.fillColor[1]),
                    Number(preset.fillColor[2])
                ];
            } catch (_eFillColor) {}
        }
        if (_isStrokeEffectivelyEnabled(preset)) {
            try { all.applyStroke = true; } catch (_eApplyStroke) {}
            if (preset.strokeColor && preset.strokeColor.length === 3) {
                try {
                    all.strokeColor = [
                        Number(preset.strokeColor[0]),
                        Number(preset.strokeColor[1]),
                        Number(preset.strokeColor[2])
                    ];
                } catch (_eStrokeColor) {}
            }
            if (preset.strokeWidth !== undefined) {
                try { all.strokeWidth = Number(preset.strokeWidth); } catch (_eStrokeWidth) {}
            }
            _applyStrokeRenderDefaults(all);
        } else {
            try { all.applyStroke = false; } catch (_eDisableStroke) {}
        }
        if (preset.strokeOverFill !== undefined && !_isStrokeEffectivelyEnabled(preset)) {
            try { all.strokeOverFill = !!preset.strokeOverFill; } catch (_eStrokeOverFill) {}
        }
    } catch (_ignored3) {}
}

function _getLayerStylesGroup(layer) {
    if (!layer) {
        return null;
    }
    try {
        return layer.property("ADBE Layer Styles");
    } catch (_ignored) {}
    return null;
}

function _ensureLayerStyleProperty(styles, matchName) {
    if (!styles || !matchName) {
        return null;
    }
    var prop = null;
    try {
        prop = styles.property(matchName);
    } catch (_ignored0) {}
    if (prop) {
        return prop;
    }
    try {
        prop = styles.addProperty(matchName);
    } catch (_ignored1) {}
    return prop;
}

function _setLayerStyleValue(styles, matchName, value) {
    if (!styles || !matchName) {
        return false;
    }
    var prop = null;
    try {
        prop = styles.property(matchName);
    } catch (_ignored0) {}
    if (!prop && matchName.indexOf("dropShadow/") === 0) {
        _ensureLayerStyleProperty(styles, "dropShadow/enabled");
        try {
            prop = styles.property(matchName);
        } catch (_ignored1) {}
    }
    if (!prop) {
        return false;
    }
    try {
        prop.setValue(value);
        return true;
    } catch (_ignored2) {}
    return false;
}

function applyShadowStyleToLayer(layer, preset) {
    if (!layer) {
        return;
    }

    var styles = _getLayerStylesGroup(layer);
    if (!styles) {
        return;
    }

    var enabled = !!(preset && preset.shadowEnabled);
    _ensureLayerStyleProperty(styles, "dropShadow/enabled");
    _setLayerStyleValue(styles, "dropShadow/enabled", enabled ? 1 : 0);
    if (!enabled) {
        return;
    }

    var shadowColor = preset.shadowColor || [0, 0, 0];
    _setLayerStyleValue(styles, "dropShadow/color", [
        Number(shadowColor[0]),
        Number(shadowColor[1]),
        Number(shadowColor[2])
    ]);
    _setLayerStyleValue(styles, "dropShadow/opacity", Number(preset.shadowOpacity !== undefined ? preset.shadowOpacity : 60));
    _setLayerStyleValue(styles, "dropShadow/useGlobalAngle", 0);
    _setLayerStyleValue(styles, "dropShadow/localLightingAngle", Number(preset.shadowAngle !== undefined ? preset.shadowAngle : 90));
    _setLayerStyleValue(styles, "dropShadow/distance", Number(preset.shadowDistance !== undefined ? preset.shadowDistance : 4));
    _setLayerStyleValue(styles, "dropShadow/chokeMatte", Number(preset.shadowSpread !== undefined ? preset.shadowSpread : 0));
    _setLayerStyleValue(styles, "dropShadow/blur", Number(preset.shadowBlur !== undefined ? preset.shadowBlur : 8));
    _setLayerStyleValue(styles, "dropShadow/noise", 0);
}

function applyAccentRangeToDocument(doc, preset, textValue) {
    if (!doc || !preset || !preset.accentLastWord || !preset.accentColor || preset.accentColor.length !== 3) {
        return;
    }

    if (typeof doc.characterRange !== "function") {
        return;
    }

    var range = _findAccentTailRange(textValue !== undefined ? textValue : doc.text);
    if (!range || range.length <= 0) {
        return;
    }

    _applyAccentCharRange(doc, preset, range.start, range.length);
}

function _cleanWordToken(value) {
    return String(value || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}

function _normalizeWordCompare(value) {
    return _cleanWordToken(value)
        .toLowerCase()
        .replace(/^[^a-z0-9а-яіїєґñáéíóúü]+|[^a-z0-9а-яіїєґñáéíóúü]+$/g, "");
}

function _extractTextWordRanges(textValue) {
    var text = String(textValue || "");
    var ranges = [];
    var rx = /\S+/g;
    var match = null;
    while ((match = rx.exec(text)) !== null) {
        ranges.push({
            start: match.index,
            length: match[0].length,
            text: match[0],
            normalized: _normalizeWordCompare(match[0])
        });
    }
    return ranges;
}

function _buildWordHighlightRanges(textValue, words) {
    var text = String(textValue || "");
    var inputWords = words || [];
    var ranges = [];
    var spans = _extractTextWordRanges(text);
    var spanIndex = 0;

    for (var i = 0; i < inputWords.length; i++) {
        var word = inputWords[i] || {};
        var token = _cleanWordToken(word.text);
        var normalizedToken = _normalizeWordCompare(token);
        if (!token || !spans.length) {
            continue;
        }

        var chosen = null;
        while (spanIndex < spans.length) {
            var span = spans[spanIndex];
            spanIndex++;
            if (!normalizedToken || !span.normalized || span.normalized === normalizedToken) {
                chosen = span;
                break;
            }
            if (span.text.toLowerCase() === token.toLowerCase()) {
                chosen = span;
                break;
            }
        }

        if (!chosen) {
            continue;
        }

        ranges.push({
            start: chosen.start,
            length: chosen.length,
            timeStart: _toNumber(word.start, 0),
            timeEnd: _toNumber(word.end, _toNumber(word.start, 0) + 0.01)
        });
    }

    return ranges;
}

function _makeStyledDocument(sourceText, textValue, preset, highlightRange, wordRuleHighlights) {
    var doc = sourceText.value;
    _resetDocumentStyles(doc);
    doc.text = textValue;
    setTextStyle(doc, preset);
    _applyBaseStyleToAllCharacters(doc, preset, textValue);
    if (highlightRange && highlightRange.length > 0) {
        _applyAccentCharRange(doc, preset, highlightRange.start, highlightRange.length);
    } else {
        applyAccentRangeToDocument(doc, preset, textValue);
    }
    _applyWordRuleHighlights(doc, wordRuleHighlights);
    return doc;
}

function applyKaraokeWordHighlights(textLayer, item, preset) {
    if (!preset || !preset.karaokeEnabled) {
        return false;
    }

    var sourceText = null;
    try {
        sourceText = textLayer.property("Source Text");
    } catch (_e0) {}
    if (!sourceText) {
        return false;
    }

    var textValue = _joinItemText(item);
    if (!textValue) {
        return false;
    }

    var words = _getItemWordEntries(item, textValue);
    var ranges = _buildWordHighlightRanges(textValue, words);
    if (!ranges.length) {
        return false;
    }

    _clearPropertyKeys(sourceText);

    var itemStart = Math.max(0, _toNumber(item.start, 0));
    var baseDoc = _makeStyledDocument(sourceText, textValue, preset, null, item.wordRuleHighlights);
    sourceText.setValue(baseDoc);

    if (ranges[0].timeStart > itemStart + 0.001) {
        sourceText.setValueAtTime(itemStart, baseDoc);
    }

    for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];
        var keyTime = Math.max(itemStart, _toNumber(range.timeStart, itemStart));
        sourceText.setValueAtTime(keyTime, _makeStyledDocument(sourceText, textValue, preset, range, item.wordRuleHighlights));
    }

    _setHoldInterpolation(sourceText);
    return true;
}

function applyPresetToTextLayer(textLayer, preset, comp, linesCount) {
    var sourceText = textLayer.property("Source Text");
    var doc = sourceText.value;
    setTextStyle(doc, preset);
    applyAccentRangeToDocument(doc, preset, doc.text);
    sourceText.setValue(doc);
    _applyTextLayerStrokeRenderOptions(textLayer, preset);
    applyShadowStyleToLayer(textLayer, preset);

    var x = _resolveSubtitleBaseX(comp, preset);
    var y = _resolveSubtitleBaseY(comp, preset, linesCount);
    _setLayerPositionInCompSpace(textLayer, [x, y]);
}

function _clamp(value, minValue, maxValue) {
    var n = Number(value);
    if (isNaN(n)) {
        n = minValue;
    }
    if (n < minValue) {
        return minValue;
    }
    if (n > maxValue) {
        return maxValue;
    }
    return n;
}

function _resolveOffsetY(comp, preset) {
    var useVertical = false;
    try {
        useVertical = Number(comp.height) > Number(comp.width);
    } catch (_ignored0) {}
    var defaultOffset = Number(
        useVertical && preset.verticalMarginY !== undefined
            ? preset.verticalMarginY
            : (preset.marginY !== undefined ? preset.marginY : 180)
    );
    if (isNaN(defaultOffset)) {
        defaultOffset = 180;
    }

    var compHeight = 0;
    try {
        compHeight = Number(comp.height) || 0;
    } catch (_ignored) {}

    if (compHeight > 0) {
        return _clamp(defaultOffset, -Math.round(compHeight * 0.45), Math.round(compHeight * 0.45));
    }
    return _clamp(defaultOffset, -720, 720);
}

function _resolveSubtitleBaseY(comp, preset, linesCount) {
    var offsetY = _resolveOffsetY(comp, preset);
    var y = (Number(comp.height) / 2) + offsetY;
    if (linesCount > 1) {
        var leading = Number(preset.leading !== undefined ? preset.leading : preset.fontSize || 60);
        if (isNaN(leading) || leading <= 0) {
            leading = 60;
        }
        y -= ((linesCount - 1) * leading * 0.42);
    }
    return y;
}

function _resolveSubtitleBaseX(comp, preset) {
    var offsetX = Number(preset.positionOffsetX !== undefined ? preset.positionOffsetX : 0);
    if (isNaN(offsetX)) {
        offsetX = 0;
    }
    var compWidth = Number(comp.width) || 0;
    if (compWidth > 0) {
        offsetX = _clamp(offsetX, -Math.round(compWidth * 0.5), Math.round(compWidth * 0.5));
    }
    return (compWidth / 2) + offsetX;
}

function _clearKeys(prop) {
    if (!prop) {
        return;
    }
    try {
        while (prop.numKeys > 0) {
            prop.removeKey(prop.numKeys);
        }
    } catch (_ignored) {}
}

function _buildScaleArray(scaleProp, xy) {
    try {
        var current = scaleProp.value;
        if (current && current.length >= 3) {
            return [Number(xy), Number(xy), Number(current[2])];
        }
    } catch (_ignored) {}
    return [Number(xy), Number(xy)];
}

function _getBlockScalePercent(preset) {
    return _clamp(preset && preset.blockScale !== undefined ? preset.blockScale : 100, 40, 180);
}

function _combineBlockScale(preset, animPercent) {
    return _getBlockScalePercent(preset) * (_clamp(animPercent, 1, 300) / 100);
}

function _applyStaticBlockScale(layer, preset) {
    if (!_isValidAeObject(layer)) {
        return;
    }
    try {
        var scale = layer.property("ADBE Transform Group").property("ADBE Scale");
        _clearPropertyKeys(scale);
        scale.setValue(_buildScaleArray(scale, _getBlockScalePercent(preset)));
    } catch (_ignored) {}
}

function _makeEaseArray(prop, influence, speed) {
    var dims = 1;
    try {
        var value = prop.value;
        if (value && value.length && typeof value !== "string") {
            dims = value.length;
        }
    } catch (_ignored) {}

    var out = [];
    var inf = _clamp(influence !== undefined ? influence : 84, 0.1, 100);
    var spd = Number(speed !== undefined ? speed : 0);
    if (isNaN(spd)) {
        spd = 0;
    }
    for (var i = 0; i < dims; i++) {
        out.push(new KeyframeEase(spd, inf));
    }
    return out;
}

function _applyBezierCurve(prop, preset) {
    if (!prop) {
        return;
    }

    var inInf = Number(preset && preset.animEaseInInfluence !== undefined ? preset.animEaseInInfluence : 84);
    var outInf = Number(preset && preset.animEaseOutInfluence !== undefined ? preset.animEaseOutInfluence : 84);
    var inSpeed = Number(preset && preset.animEaseInSpeed !== undefined ? preset.animEaseInSpeed : 0);
    var outSpeed = Number(preset && preset.animEaseOutSpeed !== undefined ? preset.animEaseOutSpeed : 0);

    try {
        for (var i = 1; i <= prop.numKeys; i++) {
            prop.setInterpolationTypeAtKey(
                i,
                KeyframeInterpolationType.BEZIER,
                KeyframeInterpolationType.BEZIER
            );
            prop.setTemporalEaseAtKey(
                i,
                _makeEaseArray(prop, inInf, inSpeed),
                _makeEaseArray(prop, outInf, outSpeed)
            );
            try { prop.setTemporalContinuousAtKey(i, true); } catch (_eCont) {}
            try { prop.setTemporalAutoBezierAtKey(i, true); } catch (_eAuto) {}
            try {
                if (prop.isSpatial) {
                    prop.setSpatialContinuousAtKey(i, true);
                    prop.setSpatialAutoBezierAtKey(i, true);
                }
            } catch (_eSpatial) {}
        }
    } catch (_ignored) {}
}

function _enableLayerMotionBlur(layer, preset) {
    if (!layer || (preset && preset.motionBlurEnabled === false)) {
        return;
    }

    try { layer.motionBlur = true; } catch (_eLayer) {}

    try {
        var comp = layer.containingComp;
        if (comp) {
            try { comp.motionBlur = true; } catch (_eComp) {}

            var shutterAngle = Number(preset && preset.motionBlurShutterAngle !== undefined ? preset.motionBlurShutterAngle : 180);
            if (!isNaN(shutterAngle) && shutterAngle > 0) {
                try { comp.shutterAngle = shutterAngle; } catch (_eAngle) {}
            }

            var shutterPhase = Number(preset && preset.motionBlurShutterPhase !== undefined ? preset.motionBlurShutterPhase : -90);
            if (!isNaN(shutterPhase)) {
                try { comp.shutterPhase = shutterPhase; } catch (_ePhase) {}
            }
        }
    } catch (_ignored2) {}
}

function applyLayerAnimation(layer, start, end, preset, isBoxLayer) {
    if (!_isValidAeObject(layer)) {
        return;
    }

    _enableLayerMotionBlur(layer, preset);

    var transform = null;
    try {
        transform = layer.property("ADBE Transform Group");
    } catch (_ignored0) {}
    if (!transform) {
        return;
    }

    var opacity = null;
    var position = null;
    var scale = null;
    try { opacity = transform.property("ADBE Opacity"); } catch (_ignored1) {}
    try { position = transform.property("ADBE Position"); } catch (_ignored2) {}
    try { scale = transform.property("ADBE Scale"); } catch (_ignored3) {}

    _clearKeys(opacity);
    if (!isBoxLayer) {
        _clearKeys(position);
    }
    _clearKeys(scale);

    if (!preset.animEnabled) {
        try {
            if (opacity) {
                opacity.setValue(100);
            }
        } catch (_ignored4) {}
        try {
            if (scale) {
                scale.setValue(_buildScaleArray(scale, _getBlockScalePercent(preset)));
            }
        } catch (_ignored5) {}
        return;
    }

    var inDur = _clamp(preset.animIn !== undefined ? preset.animIn : 0.1, 0.03, 0.8);
    var outDur = _clamp(preset.animOut !== undefined ? preset.animOut : 0.08, 0.03, 0.8);
    var yOffset = Number(preset.animYOffset !== undefined ? preset.animYOffset : 18);
    if (isNaN(yOffset)) {
        yOffset = 18;
    }
    if (isBoxLayer) {
        yOffset = yOffset * 0.45;
    }

    var scaleFrom = _clamp(preset.animScaleFrom !== undefined ? preset.animScaleFrom : 98, 85, 100);
    var entryEnd = Math.min(end, start + inDur);
    var exitStart = Math.max(entryEnd, end - outDur);

    try {
        if (opacity) {
            opacity.setValueAtTime(start, 0);
            opacity.setValueAtTime(entryEnd, 100);
            if (exitStart > entryEnd) {
                opacity.setValueAtTime(exitStart, 100);
            }
            opacity.setValueAtTime(end, 0);
        }
    } catch (_ignored6) {}
    _applyBezierCurve(opacity, preset);

    if (!isBoxLayer && position) {
        try {
            var basePos = position.value;
            if (basePos && basePos.length >= 2) {
                var x = Number(basePos[0]);
                var y = Number(basePos[1]);
                position.setValueAtTime(start, [x, y + yOffset]);
                position.setValueAtTime(entryEnd, [x, y]);
                if (exitStart > entryEnd) {
                    position.setValueAtTime(exitStart, [x, y]);
                }
                position.setValueAtTime(end, [x, y - (yOffset * 0.35)]);
            }
        } catch (_ignored7) {}
    }
    if (!isBoxLayer) {
        _applyBezierCurve(position, preset);
    }

    try {
        if (scale) {
            var scaleStart = _buildScaleArray(scale, _combineBlockScale(preset, scaleFrom));
            var scaleMid = _buildScaleArray(scale, _getBlockScalePercent(preset));
            var scaleEnd = _buildScaleArray(scale, _combineBlockScale(preset, Math.max(90, scaleFrom + 1)));
            scale.setValueAtTime(start, scaleStart);
            scale.setValueAtTime(entryEnd, scaleMid);
            if (exitStart > entryEnd) {
                scale.setValueAtTime(exitStart, scaleMid);
            }
            scale.setValueAtTime(end, scaleEnd);
        }
    } catch (_ignored8) {}
    _applyBezierCurve(scale, preset);
}

function applyLayerOpacityAnimation(layer, start, end, preset) {
    if (!_isValidAeObject(layer)) {
        return;
    }

    _enableLayerMotionBlur(layer, preset);

    var transform = null;
    try {
        transform = layer.property("ADBE Transform Group");
    } catch (_ignored0) {}
    if (!transform) {
        return;
    }

    var opacity = null;
    var scale = null;
    try { opacity = transform.property("ADBE Opacity"); } catch (_ignored1) {}
    try { scale = transform.property("ADBE Scale"); } catch (_ignored2) {}

    _clearKeys(opacity);
    _clearKeys(scale);
    try {
        if (scale) {
            scale.setValue(_buildScaleArray(scale, 100));
        }
    } catch (_ignored3) {}

    if (!preset.animEnabled) {
        try {
            if (opacity) {
                opacity.setValue(100);
            }
        } catch (_ignored4) {}
        return;
    }

    var inDur = _clamp(preset.animIn !== undefined ? preset.animIn : 0.1, 0.03, 0.8);
    var outDur = _clamp(preset.animOut !== undefined ? preset.animOut : 0.08, 0.03, 0.8);
    var entryEnd = Math.min(end, start + inDur);
    var exitStart = Math.max(entryEnd, end - outDur);

    try {
        if (opacity) {
            opacity.setValueAtTime(start, 0);
            opacity.setValueAtTime(entryEnd, 100);
            if (exitStart > entryEnd) {
                opacity.setValueAtTime(exitStart, 100);
            }
            opacity.setValueAtTime(end, 0);
        }
    } catch (_ignored5) {}
    _applyBezierCurve(opacity, preset);
}

function _escapeForExpression(str) {
    return String(str).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function ensureBoxLayer(comp, id, textLayer, preset) {
    var boxName = "BOX__" + id;
    var box = findLayerByName(comp, boxName);
    if (box && !_isValidAeObject(box)) {
        box = null;
    }
    if (!box) {
        box = comp.layers.addShape();
        box.name = boxName;
    }

    try { box.inPoint = textLayer.inPoint; } catch (_eIn) {}
    try { box.outPoint = textLayer.outPoint; } catch (_eOut) {}
    try { box.enabled = true; } catch (_eEnabled) {}

    var contents = null;
    try {
        contents = box.property("ADBE Root Vectors Group");
    } catch (_eContents) {}
    if (!contents) {
        return box;
    }

    while (contents.numProperties > 0) {
        try {
            contents.property(1).remove();
        } catch (_eRemove) {
            break;
        }
    }

    var group = null;
    try {
        group = contents.addProperty("ADBE Vector Group");
    } catch (_eGroup) {}
    if (!group) {
        return box;
    }
    group.name = "BG";
    try { box.threeDLayer = false; } catch (_eBox3d) {}
    try { box.parent = null; } catch (_eBoxUnparent) {}
    _setShapeLayerOrigin(box);
    var g = group.property("ADBE Vectors Group");
    if (!g) {
        return box;
    }

    var rect = null;
    var fill = null;
    var stroke = null;
    try { rect = g.addProperty("ADBE Vector Shape - Rect"); } catch (_eRect) {}
    try { if (rect) { rect.name = "Rect"; } } catch (_eRectName) {}
    try { fill = g.addProperty("ADBE Vector Graphic - Fill"); } catch (_eFill) {}
    if (preset.boxStrokeEnabled) {
        try { stroke = g.addProperty("ADBE Vector Graphic - Stroke"); } catch (_eStroke) {}
    }
    if (!rect || !fill) {
        return box;
    }

    var color = preset.boxColor || [0, 0, 0];
    try {
        fill.property("ADBE Vector Fill Color").setValue([Number(color[0]), Number(color[1]), Number(color[2])]);
        fill.property("ADBE Vector Fill Opacity").setValue(Number(preset.boxOpacity !== undefined ? preset.boxOpacity : 80));
    } catch (_eFillSet) {}

    if (stroke) {
        var strokeColor = preset.boxStrokeColor || [0.38, 0.33, 0.36];
        try {
            stroke.property("ADBE Vector Stroke Color").setValue([
                Number(strokeColor[0]),
                Number(strokeColor[1]),
                Number(strokeColor[2])
            ]);
            stroke.property("ADBE Vector Stroke Opacity").setValue(
                Number(preset.boxStrokeOpacity !== undefined ? preset.boxStrokeOpacity : 100)
            );
            stroke.property("ADBE Vector Stroke Width").setValue(
                Number(preset.boxStrokeWidth !== undefined ? preset.boxStrokeWidth : 2)
            );
        } catch (_eStrokeSet) {}
    }

    var pad = Number(preset.boxPadding !== undefined ? preset.boxPadding : 16);
    var padX = Number(preset.boxPaddingX !== undefined ? preset.boxPaddingX : pad);
    var padY = Number(preset.boxPaddingY !== undefined ? preset.boxPaddingY : pad);
    var minWidth = Number(preset.boxMinWidth !== undefined ? preset.boxMinWidth : 0);
    var minHeight = Number(preset.boxMinHeight !== undefined ? preset.boxMinHeight : 0);
    var roundness = Number(preset.boxRoundness !== undefined ? preset.boxRoundness : 0);
    var smartBox = !!preset.boxSmart;
    var offsetX = Number(preset.boxOffsetX !== undefined ? preset.boxOffsetX : 0);
    var offsetY = Number(preset.boxOffsetY !== undefined ? preset.boxOffsetY : 0);
    var layerNameEsc = _escapeForExpression(textLayer.name);

    if (smartBox) {
        minWidth = 0;
        minHeight = 0;
        if (!(roundness > 0)) {
            roundness = 999;
        }
    }

    try {
        rect.property("ADBE Vector Rect Size").expression =
            "var t=thisComp.layer(\"" + layerNameEsc + "\");\\n" +
            "var r=t.sourceRectAtTime(time,false);\\n" +
            "var w=Math.max(r.width+" + (padX * 2) + "," + minWidth + ");\\n" +
            "var h=Math.max(r.height+" + (padY * 2) + "," + minHeight + ");\\n" +
            "[w,h];";
    } catch (_eRectExpr) {}

    try {
        rect.property("ADBE Vector Rect Roundness").setValue(roundness);
    } catch (_eRoundness) {}

    try {
        group.property("ADBE Vector Transform Group").property("ADBE Vector Position").expression =
            "var t=thisComp.layer(\"" + layerNameEsc + "\");\\n" +
            "var r=t.sourceRectAtTime(time,false);\\n" +
            "[r.left + r.width/2, r.top + r.height/2];";
    } catch (_eGroupExpr) {}

    try {
        box.property("ADBE Transform Group").property("ADBE Position").expression =
            "var p=thisComp.layer(\"" + layerNameEsc + "\").toComp([0,0,0]);\\n" +
            "if (thisLayer.parent) { p=thisLayer.parent.fromComp(p); }\\n" +
            "[p[0]+" + offsetX + ", p[1]+" + offsetY + "];";
    } catch (_ePosExpr) {}

    try {
        box.moveAfter(textLayer);
    } catch (_eMove) {}
    return box;
}

function _setShapeLayerOrigin(layer) {
    try { layer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]); } catch (_ignored1) {}
    try { layer.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]); } catch (_ignored2) {}
}

function ensureLineBoxLayer(comp, id, textLayer, preparedItem, preset, measureLayer, basePosition, updateMode) {
    var boxName = "LINEBOX__" + id;
    if (!(preset && preset.lineBoxEnabled) || !_isValidAeObject(textLayer)) {
        _removeLayerIfExists(comp, boxName);
        return null;
    }

    var sourceText = String(preparedItem && preparedItem.text ? preparedItem.text : "");
    if (!sourceText) {
        _removeLayerIfExists(comp, boxName);
        return null;
    }

    var layer = findLayerByName(comp, boxName);
    if (layer && !_isValidAeObject(layer)) {
        layer = null;
    }
    if (updateMode === "rebuild" && layer) {
        try { layer.remove(); } catch (_removeErr) {}
        layer = null;
    }
    if (!layer) {
        layer = comp.layers.addShape();
        layer.name = boxName;
    }
    if (!_isValidAeObject(layer)) {
        return null;
    }

    try { layer.inPoint = textLayer.inPoint; } catch (_eIn) {}
    try { layer.outPoint = textLayer.outPoint; } catch (_eOut) {}
    try { layer.enabled = true; } catch (_eEnabled) {}
    try { layer.shy = false; } catch (_eShy) {}
    try { layer.guideLayer = false; } catch (_eGuide) {}
    _setShapeLayerOrigin(layer);

    var contents = null;
    try {
        contents = layer.property("ADBE Root Vectors Group");
    } catch (_eContents) {}
    if (!contents) {
        return layer;
    }
    while (contents.numProperties > 0) {
        try {
            contents.property(1).remove();
        } catch (_eRemove) {
            break;
        }
    }

    var padX = _toNumber(preset.lineBoxPaddingX, 26);
    var padY = _toNumber(preset.lineBoxPaddingY, 12);
    var roundness = _toNumber(preset.lineBoxRoundness, 20);
    var opacity = _toNumber(preset.lineBoxOpacity, 100);
    var color = (preset.lineBoxColor && preset.lineBoxColor.length === 3) ? preset.lineBoxColor : [0, 0, 0];
    var sampleTime = _toNumber(preparedItem && preparedItem.start, _toNumber(textLayer.inPoint, 0));
    sampleTime += Math.max(0.001, _toNumber(preset && preset.animIn, 0.05));
    var rectInfo = { left: 0, top: 0, width: 0, height: 0 };
    try {
        rectInfo = textLayer.sourceRectAtTime(sampleTime, false);
    } catch (_eRectInfo) {
        try { rectInfo = textLayer.sourceRectAtTime(_toNumber(textLayer.inPoint, 0), false); } catch (_eRectInfo2) {}
    }
    var rectLeft = _toNumber(rectInfo && rectInfo.left, 0);
    var rectTop = _toNumber(rectInfo && rectInfo.top, 0);
    var rectWidth = Math.max(1, _toNumber(rectInfo && rectInfo.width, 0));
    var rectHeight = Math.max(1, _toNumber(rectInfo && rectInfo.height, 0));

    var group = null;
    var g = null;
    var rect = null;
    var fill = null;
    try { group = contents.addProperty("ADBE Vector Group"); } catch (_eGroup) {}
    if (!group) {
        return layer;
    }
    try { group.name = "Text Block"; } catch (_eName) {}
    try { g = group.property("ADBE Vectors Group"); } catch (_eVectors) {}
    if (!g) {
        return layer;
    }
    try { rect = g.addProperty("ADBE Vector Shape - Rect"); } catch (_eRect) {}
    try { fill = g.addProperty("ADBE Vector Graphic - Fill"); } catch (_eFill) {}
    if (!rect || !fill) {
        return layer;
    }

    try {
        rect.property("ADBE Vector Rect Size").expression = "";
    } catch (_eClearSizeExpr) {}
    try {
        rect.property("ADBE Vector Rect Size").setValue([
            Math.max(1, rectWidth + (padX * 2)),
            Math.max(1, rectHeight + (padY * 2))
        ]);
    } catch (_eSize) {}
    try { rect.property("ADBE Vector Rect Roundness").setValue(roundness); } catch (_eRoundness) {}
    try {
        group.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([
            rectLeft + (rectWidth / 2),
            rectTop + (rectHeight / 2)
        ]);
    } catch (_eGroupPos) {}
    try {
        fill.property("ADBE Vector Fill Color").setValue([Number(color[0]), Number(color[1]), Number(color[2])]);
        fill.property("ADBE Vector Fill Opacity").setValue(opacity);
    } catch (_eFillSet) {}

    try {
        layer.parent = textLayer;
    } catch (_eParent) {}
    try {
        var transform = layer.property("ADBE Transform Group");
        var position = transform.property("ADBE Position");
        var scale = transform.property("ADBE Scale");
        var anchor = transform.property("ADBE Anchor Point");
        try { position.expression = ""; } catch (_ePositionExpr) {}
        try { scale.expression = ""; } catch (_eScaleExpr) {}
        try { anchor.expression = ""; } catch (_eAnchorExpr) {}
        try { anchor.setValue([0, 0]); } catch (_eAnchorSet) {}
        try { position.setValue([0, 0]); } catch (_ePositionSet) {}
        try { scale.setValue(_buildScaleArray(scale, 100)); } catch (_eScaleSet) {}
    } catch (_eLayerPos) {}

    try { layer.moveAfter(textLayer); } catch (_eMove) {}
    _enableLayerMotionBlur(layer, preset);
    return layer;
}

function _removeLineLayerCaption(comp, id) {
    var textPrefix = "SUBLINE__" + id + "__";
    var boxPrefix = "LINEBOX__" + id + "__";
    for (var i = comp.numLayers; i >= 1; i--) {
        var layer = comp.layer(i);
        var name = "";
        try { name = String(layer.name || ""); } catch (_ignored0) {}
        if (name.indexOf(textPrefix) === 0 || name.indexOf(boxPrefix) === 0) {
            try { layer.locked = false; } catch (_unlockErr) {}
            try { layer.remove(); } catch (_ignored1) {}
        }
    }
}

function _removeLayersByPrefix(comp, prefix) {
    var wanted = String(prefix || "");
    if (!comp || !wanted) {
        return;
    }
    for (var i = comp.numLayers; i >= 1; i--) {
        var layer = comp.layer(i);
        var name = "";
        try { name = String(layer.name || ""); } catch (_nameErr) {}
        if (name.indexOf(wanted) === 0) {
            try { layer.locked = false; } catch (_unlockErr) {}
            try { layer.remove(); } catch (_removeErr) {}
        }
    }
}

function _removeGeneratedBackgroundLayersForId(comp, id) {
    var key = String(id || "");
    if (!key) {
        return;
    }
    _removeLayersByPrefix(comp, "SUBUNIT__" + key);
    _removeLayersByPrefix(comp, "SUBLINE__" + key + "__");
    _removeLayersByPrefix(comp, "LINEBOX__" + key);
    _removeLayersByPrefix(comp, "BOX__WORD__" + key);
    _removeLayersByPrefix(comp, "BOX__" + key);
    _removeLayersByPrefix(comp, "SUBWORD__" + key);
}

function _removeAllGeneratedBackgroundLayers(comp) {
    _removeLayersByPrefix(comp, "SUBUNIT__");
    _removeLayersByPrefix(comp, "SUBLINE__");
    _removeLayersByPrefix(comp, "LINEBOX__");
    _removeLayersByPrefix(comp, "BOX__");
    _removeLayersByPrefix(comp, "SUBWORD__");
}

function _hasGeneratedBackgroundFeatureEnabled(preset) {
    return !!(preset && (_isBackplateEnabled(preset) || preset.boxEnabled || preset.wordBoxEnabled));
}

function _makeLineLayerItem(preparedItem, lineText) {
    var item = _copyItem(preparedItem || {});
    item.text = String(lineText || "");
    item.lines = [item.text];
    item.words = _approximateItemWords(item.start, item.end, item.text);
    return item;
}

function createOrUpdateLineLayerCaption(comp, id, baseTextLayer, preparedItem, preset, updateMode, start, end) {
    if (!(preset && preset.lineBoxEnabled && preset.lineBoxRenderMode === "line_layers")) {
        _removeLineLayerCaption(comp, id);
        return null;
    }

    var lines = (preparedItem && preparedItem.lines && preparedItem.lines.length)
        ? preparedItem.lines
        : [String(preparedItem && preparedItem.text ? preparedItem.text : "")];
    if (!lines.length) {
        _removeLineLayerCaption(comp, id);
        return null;
    }

    var x = _resolveSubtitleBaseX(comp, preset);
    var baseY = _resolveSubtitleBaseY(comp, preset, lines.length);
    var leading = _toNumber(preset.leading, _toNumber(preset.fontSize, 80));
    if (!(leading > 0)) {
        leading = _toNumber(preset.fontSize, 80);
    }
    var blockScale = _getBlockScalePercent(preset) / 100;
    var lineStep = leading * blockScale;
    var firstLayer = null;

    for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        var lineText = String(lines[lineIndex] || "");
        if (!lineText) {
            continue;
        }

        var lineId = id + "__" + (lineIndex + 1);
        var layerName = "SUBLINE__" + lineId;
        var lineLayer = findLayerByName(comp, layerName);
        if (lineLayer && !_isValidAeObject(lineLayer)) {
            lineLayer = null;
        }
        if (updateMode === "rebuild" && lineLayer) {
            try { lineLayer.remove(); } catch (_removeLineErr) {}
            lineLayer = null;
        }
        if (!lineLayer) {
            lineLayer = comp.layers.addText("");
            lineLayer.name = layerName;
        }
        if (!_isValidAeObject(lineLayer)) {
            continue;
        }
        _parentLayerToPositionControlBeforeLayout(lineLayer, comp, preset);

        try { lineLayer.enabled = true; } catch (_lineEnableErr) {}
        try { lineLayer.shy = false; } catch (_lineShyErr) {}
        try { lineLayer.guideLayer = false; } catch (_lineGuideErr) {}
        try { lineLayer.startTime = 0; } catch (_lineStartErr) {}
        try { lineLayer.inPoint = start; } catch (_lineInErr) {}
        try { lineLayer.outPoint = end; } catch (_lineOutErr) {}

        var lineItem = _makeLineLayerItem(preparedItem, lineText);
        try {
            _setLayerText(lineLayer, lineText, preset, lineItem.wordRuleHighlights);
        } catch (_lineTextErr) {
            try { lineLayer.property("Source Text").setValue(lineText); } catch (_lineTextFallbackErr) {}
        }
        try {
            applyPresetToTextLayer(lineLayer, preset, comp, 1);
            _setLayerPositionInCompSpace(lineLayer, [
                x,
                baseY + (lineIndex * lineStep)
            ]);
        } catch (_linePresetErr) {}
        try {
            applyLayerAnimation(lineLayer, start, end, preset, false);
        } catch (_lineAnimErr) {}

        if (!firstLayer) {
            firstLayer = lineLayer;
        }

        try {
            var lineBox = ensureLineBoxLayer(comp, lineId, lineLayer, lineItem, preset, lineLayer, null, updateMode);
            if (lineBox && _isValidAeObject(lineBox)) {
                applyLayerOpacityAnimation(lineBox, start, end, preset);
            }
        } catch (_lineBoxErr) {
            _removeLayerIfExists(comp, "LINEBOX__" + lineId);
        }
    }

    var expectedPrefix = "SUBLINE__" + id + "__";
    var expectedBoxPrefix = "LINEBOX__" + id + "__";
    for (var cleanupIndex = comp.numLayers; cleanupIndex >= 1; cleanupIndex--) {
        var cleanupLayer = comp.layer(cleanupIndex);
        var cleanupName = "";
        try { cleanupName = String(cleanupLayer.name || ""); } catch (_cleanupNameErr) {}
        if (cleanupName.indexOf(expectedPrefix) === 0 || cleanupName.indexOf(expectedBoxPrefix) === 0) {
            var suffix = cleanupName.indexOf(expectedPrefix) === 0
                ? cleanupName.substring(expectedPrefix.length)
                : cleanupName.substring(expectedBoxPrefix.length);
            var lineNumber = parseInt(suffix, 10);
            if (!(lineNumber >= 1 && lineNumber <= lines.length)) {
                try { cleanupLayer.remove(); } catch (_cleanupRemoveErr) {}
            }
        }
    }

    try { baseTextLayer.enabled = false; } catch (_baseDisableErr) {}
    try { baseTextLayer.shy = true; } catch (_baseShyErr) {}
    _removeLayerIfExists(comp, "LINEBOX__" + id);
    return firstLayer;
}

function _getBackplateUnitCompName(parentComp, id) {
    var parentKey = "";
    try { parentKey = String(parentComp.id || ""); } catch (_idErr) {}
    if (!parentKey) {
        try { parentKey = String(parentComp.name || "comp").replace(/[^A-Za-z0-9_]+/g, "_"); } catch (_nameErr) { parentKey = "comp"; }
    }
    return "AEAS_BACKPLATE_UNIT__" + parentKey + "__" + String(id || "0");
}

function _findProjectCompByName(name) {
    if (!app.project) {
        return null;
    }
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && String(item.name || "") === String(name || "")) {
            return item;
        }
    }
    return null;
}

function _clearCompLayers(unitComp) {
    if (!unitComp) {
        return;
    }
    for (var i = unitComp.numLayers; i >= 1; i--) {
        try { unitComp.layer(i).remove(); } catch (_removeErr) {}
    }
}

function _ensureBackplateUnitComp(parentComp, id) {
    var compName = _getBackplateUnitCompName(parentComp, id);
    var unitComp = _findProjectCompByName(compName);
    if (!unitComp) {
        unitComp = app.project.items.addComp(
            compName,
            Math.max(1, Number(parentComp.width) || 1080),
            Math.max(1, Number(parentComp.height) || 1920),
            Number(parentComp.pixelAspect) || 1,
            Math.max(0.1, Number(parentComp.duration) || 10),
            Math.max(1, Number(parentComp.frameRate) || 30)
        );
    }
    try { unitComp.duration = Math.max(0.1, Number(parentComp.duration) || unitComp.duration); } catch (_durErr) {}
    try { unitComp.frameRate = Math.max(1, Number(parentComp.frameRate) || unitComp.frameRate); } catch (_fpsErr) {}
    _clearCompLayers(unitComp);
    return unitComp;
}

function _getBackplateColor(preset) {
    if (preset && preset.backplateColor && preset.backplateColor.length === 3) {
        return preset.backplateColor;
    }
    if (preset && preset.lineBoxColor && preset.lineBoxColor.length === 3) {
        return preset.lineBoxColor;
    }
    if (preset && preset.boxColor && preset.boxColor.length === 3) {
        return preset.boxColor;
    }
    return [0, 0, 0];
}

function _createBackplateShape(unitComp, lineLayer, lineId, preset, sampleTime) {
    if (!_isValidAeObject(lineLayer)) {
        return null;
    }

    var rectInfo = { left: 0, top: 0, width: 1, height: 1 };
    try {
        rectInfo = lineLayer.sourceRectAtTime(sampleTime, false);
    } catch (_rectErr) {
        try { rectInfo = lineLayer.sourceRectAtTime(lineLayer.inPoint || 0, false); } catch (_rectFallbackErr) {}
    }
    var rectLeft = _toNumber(rectInfo && rectInfo.left, 0);
    var rectTop = _toNumber(rectInfo && rectInfo.top, 0);
    var rectWidth = Math.max(1, _toNumber(rectInfo && rectInfo.width, 1));
    var rectHeight = Math.max(1, _toNumber(rectInfo && rectInfo.height, 1));
    var padX = _toNumber(preset && preset.backplatePaddingX, _toNumber(preset && preset.lineBoxPaddingX, 28));
    var padY = _toNumber(preset && preset.backplatePaddingY, _toNumber(preset && preset.lineBoxPaddingY, 14));
    var roundness = _toNumber(preset && preset.backplateRoundness, _toNumber(preset && preset.lineBoxRoundness, 22));
    var opacity = _toNumber(preset && preset.backplateOpacity, _toNumber(preset && preset.lineBoxOpacity, 100));
    var color = _getBackplateColor(preset);

    var layer = unitComp.layers.addShape();
    layer.name = "BACKPLATE__" + lineId;
    try { layer.startTime = 0; } catch (_startErr) {}
    try { layer.inPoint = lineLayer.inPoint; } catch (_inErr) {}
    try { layer.outPoint = lineLayer.outPoint; } catch (_outErr) {}
    try { layer.enabled = true; } catch (_enabledErr) {}
    try { layer.shy = false; } catch (_shyErr) {}
    try { layer.guideLayer = false; } catch (_guideErr) {}
    _setShapeLayerOrigin(layer);

    var contents = null;
    try { contents = layer.property("ADBE Root Vectors Group"); } catch (_contentsErr) {}
    if (!contents) {
        return layer;
    }
    var group = null;
    try { group = contents.addProperty("ADBE Vector Group"); } catch (_groupErr) {}
    if (!group) {
        return layer;
    }
    try { group.name = "Backplate"; } catch (_nameErr) {}
    var vectors = null;
    try { vectors = group.property("ADBE Vectors Group"); } catch (_vectorsErr) {}
    if (!vectors) {
        return layer;
    }
    var rect = null;
    var fill = null;
    try { rect = vectors.addProperty("ADBE Vector Shape - Rect"); } catch (_rectShapeErr) {}
    try { fill = vectors.addProperty("ADBE Vector Graphic - Fill"); } catch (_fillErr) {}
    if (rect) {
        try {
            rect.property("ADBE Vector Rect Size").setValue([
                Math.max(1, rectWidth + (padX * 2)),
                Math.max(1, rectHeight + (padY * 2))
            ]);
        } catch (_sizeErr) {}
        try { rect.property("ADBE Vector Rect Roundness").setValue(roundness); } catch (_roundErr) {}
    }
    try {
        group.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([
            rectLeft + (rectWidth / 2),
            rectTop + (rectHeight / 2)
        ]);
    } catch (_posErr) {}
    if (fill) {
        try {
            fill.property("ADBE Vector Fill Color").setValue([Number(color[0]), Number(color[1]), Number(color[2])]);
            fill.property("ADBE Vector Fill Opacity").setValue(opacity);
        } catch (_fillSetErr) {}
    }

    try { layer.parent = lineLayer; } catch (_parentErr) {}
    try {
        var transform = layer.property("ADBE Transform Group");
        try { transform.property("ADBE Anchor Point").setValue([0, 0]); } catch (_anchorErr) {}
        try { transform.property("ADBE Position").setValue([0, 0]); } catch (_positionErr) {}
        try { transform.property("ADBE Scale").setValue(_buildScaleArray(transform.property("ADBE Scale"), 100)); } catch (_scaleErr) {}
    } catch (_transformErr) {}
    try { layer.moveToEnd(); } catch (_moveEndErr) {}
    _enableLayerMotionBlur(layer, preset);
    return layer;
}

function _removeBackplateUnitCaption(comp, id) {
    _removeLayersByPrefix(comp, "SUBUNIT__" + id);
}

function createOrUpdateBackplateUnitCaption(comp, id, baseTextLayer, preparedItem, preset, updateMode, start, end) {
    if (!_isBackplateEnabled(preset)) {
        _removeBackplateUnitCaption(comp, id);
        return null;
    }

    var lines = (preparedItem && preparedItem.lines && preparedItem.lines.length)
        ? preparedItem.lines
        : [String(preparedItem && preparedItem.text ? preparedItem.text : "")];
    if (!lines.length) {
        _removeBackplateUnitCaption(comp, id);
        return null;
    }

    var unitComp = _ensureBackplateUnitComp(comp, id);
    var textLayers = [];
    var x = _resolveSubtitleBaseX(comp, preset);
    var baseY = _resolveSubtitleBaseY(comp, preset, lines.length);
    var leading = _toNumber(preset.leading, _toNumber(preset.fontSize, 80));
    if (!(leading > 0)) {
        leading = _toNumber(preset.fontSize, 80);
    }
    var blockScale = _getBlockScalePercent(preset) / 100;
    var lineStep = leading * blockScale;
    var sampleTime = Math.max(0, _toNumber(start, 0)) + Math.max(0.001, _toNumber(preset && preset.animIn, 0.05));

    for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        var lineText = String(lines[lineIndex] || "");
        if (!lineText) {
            continue;
        }
        var lineId = id + "__" + (lineIndex + 1);
        var lineLayer = unitComp.layers.addText("");
        lineLayer.name = "SUBUNIT_TEXT__" + lineId;
        try { lineLayer.startTime = 0; } catch (_lineStartErr) {}
        try { lineLayer.inPoint = start; } catch (_lineInErr) {}
        try { lineLayer.outPoint = end; } catch (_lineOutErr) {}
        try { lineLayer.enabled = true; } catch (_lineEnableErr) {}
        try { lineLayer.shy = false; } catch (_lineShyErr) {}
        try { lineLayer.guideLayer = false; } catch (_lineGuideErr) {}

        var lineItem = _makeLineLayerItem(preparedItem, lineText);
        try {
            _setLayerText(lineLayer, lineText, preset, lineItem.wordRuleHighlights);
        } catch (_setTextErr) {
            try { lineLayer.property("Source Text").setValue(lineText); } catch (_fallbackTextErr) {}
        }
        try {
            applyPresetToTextLayer(lineLayer, preset, unitComp, 1);
            _setLayerPositionInCompSpace(lineLayer, [
                x,
                baseY + (lineIndex * lineStep)
            ]);
            _applyStaticBlockScale(lineLayer, preset);
        } catch (_styleErr) {}
        try { applyKaraokeWordHighlights(lineLayer, lineItem, preset); } catch (_karaokeErr) {}
        textLayers.push(lineLayer);
    }

    for (var bgIndex = 0; bgIndex < textLayers.length; bgIndex++) {
        _createBackplateShape(unitComp, textLayers[bgIndex], id + "__" + (bgIndex + 1), preset, sampleTime);
    }
    for (var topIndex = textLayers.length - 1; topIndex >= 0; topIndex--) {
        try { textLayers[topIndex].moveToBeginning(); } catch (_moveTextErr) {}
    }

    var unitName = "SUBUNIT__" + id;
    var unitLayer = findLayerByName(comp, unitName);
    if (unitLayer && !_isValidAeObject(unitLayer)) {
        unitLayer = null;
    }
    if (unitLayer) {
        var sameSource = false;
        try { sameSource = unitLayer.source && unitLayer.source === unitComp; } catch (_sourceErr) {}
        if (updateMode === "rebuild" || !sameSource) {
            try { unitLayer.remove(); } catch (_removeUnitErr) {}
            unitLayer = null;
        }
    }
    if (!unitLayer) {
        unitLayer = comp.layers.add(unitComp);
        unitLayer.name = unitName;
    }
    try { unitLayer.startTime = 0; } catch (_unitStartErr) {}
    try { unitLayer.inPoint = start; } catch (_unitInErr) {}
    try { unitLayer.outPoint = end; } catch (_unitOutErr) {}
    try { unitLayer.enabled = true; } catch (_unitEnabledErr) {}
    try { unitLayer.shy = false; } catch (_unitShyErr) {}
    try { unitLayer.guideLayer = false; } catch (_unitGuideErr) {}
    try { unitLayer.locked = false; } catch (_unitLockErr) {}
    try {
        unitLayer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([
            Number(comp.width) / 2,
            Number(comp.height) / 2
        ]);
        unitLayer.property("ADBE Transform Group").property("ADBE Position").setValue([
            Number(comp.width) / 2,
            Number(comp.height) / 2
        ]);
        unitLayer.property("ADBE Transform Group").property("ADBE Scale").setValue(
            _buildScaleArray(unitLayer.property("ADBE Transform Group").property("ADBE Scale"), 100)
        );
    } catch (_unitTransformErr) {}
    try { applyLayerOpacityAnimation(unitLayer, start, end, preset); } catch (_unitOpacityErr) {}
    try { unitLayer.moveToBeginning(); } catch (_unitMoveErr) {}
    try { baseTextLayer.enabled = false; } catch (_baseDisableErr) {}
    try { baseTextLayer.shy = true; } catch (_baseShyErr) {}
    _enableLayerMotionBlur(unitLayer, preset);
    return unitLayer;
}

function _isPartialUpdateMode(updateMode) {
    var mode = String(updateMode || "").toLowerCase();
    return mode === "patch_changed" || mode === "partial_update";
}

function cleanupUnusedAutoLayers(comp, expectedIds, updateMode) {
    if (_isPartialUpdateMode(updateMode)) {
        return;
    }

    for (var i = comp.numLayers; i >= 1; i--) {
        var layer = comp.layer(i);
        var name = layer.name;
        var id = null;

        if (name.indexOf("SUBUNIT__") === 0) {
            id = name.substring(9);
        } else if (name.indexOf("SUB__") === 0) {
            id = name.substring(5);
        } else if (name.indexOf("SUBLINE__") === 0) {
            id = name.substring(9);
        } else if (name.indexOf("SUBWORD__") === 0) {
            id = name.substring(9);
        } else if (name.indexOf("BOX__") === 0) {
            id = name.substring(5);
            if (id.indexOf("WORD__") === 0) {
                id = id.substring(6);
            }
        } else if (name.indexOf("LINEBOX__") === 0) {
            id = name.substring(9);
        }

        if (!id) {
            continue;
        }

        if (!_isExpectedAutoLayerId(expectedIds, id)) {
            if (updateMode === "rebuild") {
                layer.remove();
            } else {
                layer.enabled = false;
            }
        }
    }

    if (updateMode === "rebuild" && app.project) {
        var parentKey = "";
        try { parentKey = String(comp.id || ""); } catch (_) {}
        if (!parentKey) {
            try { parentKey = String(comp.name || "comp").replace(/[^A-Za-z0-9_]+/g, "_"); } catch (_) { parentKey = "comp"; }
        }
        var prefix = "AEAS_BACKPLATE_UNIT__" + parentKey + "__";
        for (var j = app.project.numItems; j >= 1; j--) {
            var item = app.project.item(j);
            if (item instanceof CompItem && item.name.indexOf(prefix) === 0) {
                var itemId = item.name.substring(prefix.length);
                if (!_isExpectedAutoLayerId(expectedIds, itemId)) {
                    try { item.remove(); } catch (_) {}
                }
            }
        }
    }
}

function _markExpectedAutoLayerId(expectedIds, id) {
    if (!expectedIds || id === null || id === undefined) {
        return;
    }
    var key = String(id);
    if (!key) {
        return;
    }
    expectedIds[key] = true;
}

function _isExpectedAutoLayerId(expectedIds, id) {
    if (!expectedIds || id === null || id === undefined) {
        return false;
    }
    var key = String(id);
    if (!key) {
        return false;
    }
    return !!expectedIds[key];
}

function _toNumber(value, fallback) {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    var n = Number(value);
    if (isNaN(n)) {
        return fallback;
    }
    return n;
}

function _joinItemText(item) {
    if (item.lines && item.lines.length) {
        return item.lines.join("\r");
    }
    return String(item.text || "");
}

function _cloneWordEntries(words, uppercase) {
    var out = [];
    var list = words || [];
    for (var i = 0; i < list.length; i++) {
        var word = list[i] || {};
        var text = String(word.text || "");
        out.push({
            start: _toNumber(word.start, 0),
            end: _toNumber(word.end, _toNumber(word.start, 0) + 0.01),
            text: uppercase ? text.toUpperCase() : text
        });
    }
    return out;
}

function _approximateWordsForItem(item, uppercase) {
    var text = String(item.text || _joinItemText(item) || "").replace(/\r/g, " ").replace(/\n/g, " ");
    var parts = text.split(/\s+/);
    var words = [];
    var cleanParts = [];
    for (var i = 0; i < parts.length; i++) {
        if (parts[i]) {
            cleanParts.push(parts[i]);
        }
    }
    if (!cleanParts.length) {
        return words;
    }

    var start = _toNumber(item.start, 0);
    var end = _toNumber(item.end, start + 0.01);
    var duration = Math.max(0.01, end - start);
    for (var idx = 0; idx < cleanParts.length; idx++) {
        var wordStart = start + (duration * idx / cleanParts.length);
        var wordEnd = (idx === cleanParts.length - 1) ? end : (start + (duration * (idx + 1) / cleanParts.length));
        words.push({
            start: wordStart,
            end: wordEnd,
            text: uppercase ? cleanParts[idx].toUpperCase() : cleanParts[idx]
        });
    }
    return words;
}

function _joinWordTexts(words) {
    var out = [];
    for (var i = 0; i < words.length; i++) {
        var value = String(words[i].text || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        if (value) {
            out.push(value);
        }
    }
    return out.join(" ");
}

function _visualTimingWeightForWord(word) {
    var text = String(word && word.text ? word.text : "").replace(/^\s+|\s+$/g, "");
    var clean = text.replace(/[^A-Za-z0-9\u0900-\u097Fа-яіїєґñáéíóúü]/g, "");
    var weight = Math.max(1, clean.length || text.length || 1);
    if (/[,.!?;:]$/.test(text)) {
        weight += /[.!?]$/.test(text) ? 1.6 : 0.8;
    }
    return weight;
}

function _buildVisualTimingWordsForChunks(item, words) {
    if (!words || !words.length) {
        return [];
    }

    var itemStart = _toNumber(item && item.start, _toNumber(words[0].start, 0));
    var itemEnd = _toNumber(
        item && item.end,
        _toNumber(words[words.length - 1].end, itemStart + 0.01)
    );
    if (!(itemEnd > itemStart)) {
        itemEnd = itemStart + Math.max(0.01, words.length * 0.12);
    }

    var duration = Math.max(0.01, itemEnd - itemStart);
    var totalWeight = 0;
    for (var i = 0; i < words.length; i++) {
        totalWeight += _visualTimingWeightForWord(words[i]);
    }
    totalWeight = Math.max(0.01, totalWeight);

    var out = [];
    var cursor = itemStart;
    var consumedWeight = 0;
    for (var idx = 0; idx < words.length; idx++) {
        var word = words[idx] || {};
        var weight = _visualTimingWeightForWord(word);
        consumedWeight += weight;
        var wordStart = cursor;
        var wordEnd = idx === words.length - 1
            ? itemEnd
            : itemStart + (duration * consumedWeight / totalWeight);
        if (!(wordEnd > wordStart)) {
            wordEnd = wordStart + 0.01;
        }
        out.push({
            start: wordStart,
            end: wordEnd,
            text: word.text
        });
        cursor = wordEnd;
    }

    return out;
}

function _normalizeChunkTimingWords(item, words) {
    if (!words || !words.length) {
        return [];
    }

    var itemStart = _toNumber(item && item.start, _toNumber(words[0] && words[0].start, 0));
    var itemEnd = _toNumber(
        item && item.end,
        _toNumber(words[words.length - 1] && words[words.length - 1].end, itemStart + 0.01)
    );
    if (!(itemEnd > itemStart)) {
        itemEnd = itemStart + Math.max(0.01, words.length * 0.05);
    }

    var out = [];
    var cursor = itemStart;
    for (var i = 0; i < words.length; i++) {
        var word = words[i] || {};
        var text = word.text;
        var start = _toNumber(word.start, cursor);
        var end = _toNumber(word.end, start + 0.01);

        start = Math.max(itemStart, Math.min(itemEnd - 0.01, start));
        if (start < cursor && end <= cursor) {
            start = Math.min(itemEnd - 0.01, cursor);
        }
        end = Math.max(start + 0.01, Math.min(itemEnd, end));

        out.push({
            start: start,
            end: end,
            text: text
        });
        cursor = Math.max(cursor, end);
    }
    return out;
}

function _buildChunkSizes(totalWords, preset) {
    var memo = {};
    var maxLines = Math.max(1, Math.min(4, Math.round(_toNumber(preset && preset.maxLines, 2))));
    var visualMaxWords = Math.max(maxLines, Math.min(12, maxLines * 3));
    var minWords = _toNumber(preset && preset.chunkMinWords, 4);
    var maxWords = _toNumber(preset && preset.chunkMaxWords, 6);
    var targetWords = _toNumber(preset && preset.chunkTargetWords, maxWords);
    if (minWords < 1) minWords = 1;
    maxWords = Math.min(maxWords, visualMaxWords);
    if (maxWords < minWords) maxWords = minWords;
    if (targetWords < minWords) targetWords = minWords;
    if (targetWords > maxWords) targetWords = maxWords;

    function solve(remaining) {
        if (remaining <= 0) {
            return { score: 0, parts: [] };
        }
        if (memo[remaining]) {
            return memo[remaining];
        }

        var best = null;
        for (var size = maxWords; size >= 1; size--) {
            if (size > remaining) {
                continue;
            }
            var tail = solve(remaining - size);
            var penalty = 0;
            if (size < minWords || size > maxWords) {
                penalty += 100;
            }
            penalty += Math.abs(size - targetWords) * 3;
            if (remaining - size === 1) {
                penalty += 50;
            }
            var score = penalty + tail.score + 0.01;
            if (!best || score < best.score) {
                best = {
                    score: score,
                    parts: [size].concat(tail.parts)
                };
            }
        }

        memo[remaining] = best || { score: 9999, parts: [remaining] };
        return memo[remaining];
    }

    return solve(totalWords).parts;
}

function _buildCaptionLinesFromWords(words, preset) {
    var count = words.length;
    if (count <= 0) {
        return [];
    }

    if (preset && preset.chunkWordsEnabled && count >= 3 && count <= 6) {
        var pairMaxLines = Math.max(1, Math.min(4, Math.round(_toNumber(preset && preset.maxLines, 2))));
        var pairLines = [];
        for (var pairIdx = 0; pairIdx < count; pairIdx += 2) {
            pairLines.push(_joinWordTexts(words.slice(pairIdx, pairIdx + 2)));
        }
        if (pairLines.length <= pairMaxLines) {
            return pairLines;
        }
    }

    if (!(preset && preset.forceTwoLines)) {
        return [_joinWordTexts(words)];
    }

    if (count === 1) {
        return ["", _joinWordTexts(words)];
    }

    var splitAt = 2;
    if (count === 2) {
        splitAt = 1;
    } else if (count === 3) {
        splitAt = 1;
    } else if (count >= 6) {
        splitAt = 3;
    } else if (count === 5) {
        splitAt = 2;
    } else if (count === 4) {
        splitAt = 2;
    }

    return [
        _joinWordTexts(words.slice(0, splitAt)),
        _joinWordTexts(words.slice(splitAt))
    ];
}

function _copyItem(item) {
    var copy = {};
    for (var key in item) {
        if (item.hasOwnProperty(key)) {
            copy[key] = item[key];
        }
    }
    return copy;
}

function _getNextSubtitleStart(items, index, fallback) {
    for (var nextIndex = index + 1; nextIndex < items.length; nextIndex++) {
        var nextItem = items[nextIndex];
        if (!nextItem) {
            continue;
        }
        var nextStart = _toNumber(nextItem.start, fallback);
        if (nextStart >= fallback) {
            return nextStart;
        }
    }
    return null;
}

function _expandItemsForPreset(items, preset) {
    var expanded = [];
    var forceUppercase = !!(preset && preset.forceUppercase);
    var chunkWords = !!(preset && preset.chunkWordsEnabled);
    var maxLines = Math.max(1, Math.min(4, Math.round(_toNumber(preset && preset.maxLines, 2))));
    var visualMaxWords = Math.max(maxLines, Math.min(12, maxLines * 3));
    var safetyMaxWords = Math.min(visualMaxWords, Math.max(2, _toNumber(preset && preset.aeMaxWordsPerLayer, 18)));
    var safetyMaxDur = Math.max(3, _toNumber(preset && preset.aeMaxSecondsPerLayer, 6));

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var baseWords = (item && item.words && item.words.length)
            ? _cloneWordEntries(item.words, forceUppercase)
            : _approximateWordsForItem(item, forceUppercase);
        var itemStart = _toNumber(item && item.start, baseWords.length ? _toNumber(baseWords[0].start, 0) : 0);
        var itemEnd = _toNumber(item && item.end, baseWords.length ? _toNumber(baseWords[baseWords.length - 1].end, itemStart + 0.01) : itemStart + 0.01);
        var itemDur = Math.max(0, itemEnd - itemStart);
        var forceAeSafetyChunk = !!(baseWords.length && (baseWords.length > safetyMaxWords || itemDur > safetyMaxDur));

        if ((chunkWords || forceAeSafetyChunk) && baseWords.length) {
            if (preset && preset.redistributeChunkTimings === true) {
                baseWords = _buildVisualTimingWordsForChunks(item, baseWords);
            } else {
                baseWords = _normalizeChunkTimingWords(item, baseWords);
            }
            var chunkSizes = _buildChunkSizes(baseWords.length, preset);
            var cursor = 0;
            for (var chunkIndex = 0; chunkIndex < chunkSizes.length; chunkIndex++) {
                var chunkSize = chunkSizes[chunkIndex];
                var chunkWordsList = baseWords.slice(cursor, cursor + chunkSize);
                if (!chunkWordsList.length) {
                    continue;
                }
                cursor += chunkSize;

                var lines = _buildCaptionLinesFromWords(chunkWordsList, preset);
                var prepared = _copyItem(item);
                prepared.id = String(item.id !== undefined ? item.id : (i + 1)) + "__" + ("0" + (chunkIndex + 1)).slice(-2);
                prepared.start = _toNumber(chunkWordsList[0].start, _toNumber(item.start, 0));
                prepared.end = _toNumber(chunkWordsList[chunkWordsList.length - 1].end, _toNumber(item.end, prepared.start + 0.01));
                prepared.words = chunkWordsList;
                prepared.lines = lines;
                prepared.text = lines.join(" ");
                if (forceAeSafetyChunk) {
                    prepared.aeSafetySplit = true;
                }
                expanded.push(prepared);
            }
            continue;
        }

        var preparedItem = _copyItem(item);
        preparedItem.words = baseWords;
        if (forceUppercase) {
            preparedItem.text = String(preparedItem.text || _joinItemText(preparedItem)).toUpperCase();
            if (preparedItem.lines && preparedItem.lines.length) {
                var nextLines = [];
                for (var lineIdx = 0; lineIdx < preparedItem.lines.length; lineIdx++) {
                    nextLines.push(String(preparedItem.lines[lineIdx] || "").toUpperCase());
                }
                preparedItem.lines = nextLines;
            }
        }
        expanded.push(preparedItem);
    }

    return expanded;
}

function _timingBaseId(item) {
    var id = String(item && item.id !== undefined ? item.id : "");
    var splitAt = id.indexOf("__");
    if (splitAt >= 0) {
        return id.substring(0, splitAt);
    }
    return id;
}

function _stabilizeExpandedItemTimings(items, comp) {
    var frame = Math.max(0.001, 1 / Math.max(1, comp && comp.frameRate ? comp.frameRate : 24));
    var minVisualDuration = Math.max(0.18, frame * 4);
    var tinyGapBridge = Math.max(0.12, frame * 3);
    var sameBaseGapBridge = Math.max(0.22, frame * 6);

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item) {
            continue;
        }
        var start = Math.max(0, _toNumber(item.start, 0));
        var end = _toNumber(item.end, start + minVisualDuration);
        if (!(end > start)) {
            end = start + minVisualDuration;
        }

        var next = i + 1 < items.length ? items[i + 1] : null;
        if (next) {
            var nextStart = Math.max(0, _toNumber(next.start, end));
            var sameBase = _timingBaseId(item) && _timingBaseId(item) === _timingBaseId(next);
            var gap = nextStart - end;
            if (nextStart > start + frame && end > nextStart) {
                end = Math.max(start + frame, nextStart - frame);
            } else if (sameBase && gap > 0 && gap <= sameBaseGapBridge && nextStart > start + frame) {
                end = Math.max(start + frame, nextStart - frame);
            } else if (gap > 0 && gap <= tinyGapBridge && nextStart > start + frame) {
                end = Math.max(start + frame, nextStart - frame);
            }
            if ((end - start) < minVisualDuration && nextStart > start + frame) {
                end = Math.min(Math.max(start + minVisualDuration, end), nextStart - frame);
            }
        } else if ((end - start) < minVisualDuration) {
            end = start + minVisualDuration;
        }

        item.start = start;
        item.end = Math.max(start + frame, end);
    }

    return items;
}

function _setLayerText(layer, value, preset, wordRuleHighlights) {
    var sourceText = layer.property("Source Text");
    _clearPropertyKeys(sourceText);
    var doc = sourceText.value;
    _resetDocumentStyles(doc);
    doc.text = value;
    if (preset) {
        setTextStyle(doc, preset);
        _applyBaseStyleToAllCharacters(doc, preset, value);
        applyAccentRangeToDocument(doc, preset, value);
        _applyWordRuleHighlights(doc, wordRuleHighlights);
    }
    sourceText.setValue(doc);
}

function _setLayerTextAtTime(layer, timeSec, value, preset, wordRuleHighlights) {
    var sourceText = layer.property("Source Text");
    var doc = sourceText.value;
    _resetDocumentStyles(doc);
    doc.text = value;
    if (preset) {
        setTextStyle(doc, preset);
        _applyBaseStyleToAllCharacters(doc, preset, value);
        applyAccentRangeToDocument(doc, preset, value);
        _applyWordRuleHighlights(doc, wordRuleHighlights);
    }
    sourceText.setValueAtTime(timeSec, doc);
}

function _clearPropertyKeys(prop) {
    if (!prop) {
        return;
    }
    try {
        while (prop.numKeys > 0) {
            prop.removeKey(prop.numKeys);
        }
    } catch (_ignored) {}
}

function _setHoldInterpolation(prop) {
    if (!prop) {
        return;
    }
    try {
        for (var i = 1; i <= prop.numKeys; i++) {
            prop.setInterpolationTypeAtKey(
                i,
                KeyframeInterpolationType.HOLD,
                KeyframeInterpolationType.HOLD
            );
        }
    } catch (_ignored) {}
}

function _composeLines(lines) {
    var clean = [];
    for (var i = 0; i < lines.length; i++) {
        clean.push(String(lines[i] || ""));
    }
    return clean.join("\r");
}

function _measureLayerTextWidth(textLayer, preset, lines) {
    var sourceText = textLayer.property("Source Text");
    var doc = sourceText.value;
    doc.text = _composeLines(lines);
    setTextStyle(doc, preset);
    sourceText.setValue(doc);
    var rect = textLayer.sourceRectAtTime(textLayer.inPoint || 0, false);
    var width = Number(rect && rect.width ? rect.width : 0);
    if (_isStrokeEffectivelyEnabled(preset)) {
        width += Math.max(6, _toNumber(preset.strokeWidth, 0) * 3);
    }
    return width;
}

function _resolveEffectiveMaxTextWidth(textLayer, preset) {
    var presetMax = _toNumber(preset && preset.maxTextWidth, 0);
    var comp = null;
    try {
        comp = textLayer ? textLayer.containingComp : null;
    } catch (_ignoredComp) {}

    var compWidth = _toNumber(comp && comp.width, 0);
    var compHeight = _toNumber(comp && comp.height, 0);
    var isVertical = compHeight > compWidth && compWidth > 0;
    var ratio = _toNumber(
        preset && (isVertical ? preset.maxTextWidthRatioVertical : preset.maxTextWidthRatio),
        isVertical ? 0.84 : 0.88
    );
    var compMax = compWidth > 0 ? Math.max(140, compWidth * ratio) : 0;

    if (presetMax > 0 && compMax > 0) {
        return Math.min(presetMax, compMax);
    }
    if (presetMax > 0) {
        return presetMax;
    }
    if (compMax > 0) {
        return compMax;
    }
    return 0;
}

function _enumerateLineLayouts(words, lineCount) {
    var out = [];
    var total = words.length;
    if (!total || lineCount <= 0) {
        return out;
    }

    function walk(start, remaining, parts) {
        if (remaining === 1) {
            out.push(parts.concat([_joinWordTexts(words.slice(start))]));
            return;
        }
        var maxSplit = total - (remaining - 1);
        for (var i = start + 1; i <= maxSplit; i++) {
            walk(i, remaining - 1, parts.concat([_joinWordTexts(words.slice(start, i))]));
        }
    }

    walk(0, lineCount, []);
    return out;
}

function _getBalancedLineRange(words, preset) {
    var wordCount = words ? words.length : 0;
    if (!wordCount) {
        return { minLines: 1, maxLines: 1, preferredLines: 1 };
    }
    var hardMaxLines = Math.max(1, Math.min(4, Math.round(_toNumber(preset && preset.maxLines, 2))));
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

function _lineLayoutPenalty(lines, totalWords, preferredLines) {
    var penalty = 0;
    var lineCount = lines ? lines.length : 0;
    if (!lineCount) {
        return 1000000;
    }

    var targetWords = lineCount > 0 ? totalWords / lineCount : totalWords;
    for (var i = 0; i < lineCount; i++) {
        var line = String(lines[i] || "");
        var lineWords = _splitLineWords(line);
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

function _fitItemTextLayout(textLayer, item, preset) {
    var prepared = _copyItem(item || {});
    var words = (prepared.words && prepared.words.length)
        ? prepared.words
        : _approximateWordsForItem(prepared, !!(preset && preset.forceUppercase));

    if (!prepared.lines || !prepared.lines.length) {
        prepared.lines = [_joinWordTexts(words)];
    }
    prepared.text = String(prepared.text || _joinItemText(prepared) || "");

    var maxWidth = _resolveEffectiveMaxTextWidth(textLayer, preset);
    if (!maxWidth || !words.length) {
        return prepared;
    }

    if (preset && preset.forceTwoLines && words.length === 1 && Math.max(1, Math.min(4, Math.round(_toNumber(preset && preset.maxLines, 2)))) >= 2) {
        prepared.lines = ["", _joinWordTexts(words)];
        prepared.text = prepared.lines.join(" ");
        return prepared;
    }

    var comp = null;
    try {
        comp = textLayer ? textLayer.containingComp : null;
    } catch (_ignoredComp2) {}
    var isVertical = _toNumber(comp && comp.height, 0) > _toNumber(comp && comp.width, 0);
    var lineRange = _getBalancedLineRange(words, preset);
    var minLines = lineRange.minLines;
    var maxLines = lineRange.maxLines;
    var preferredLines = lineRange.preferredLines;

    var best = null;
    for (var lineCount = minLines; lineCount <= maxLines; lineCount++) {
        var layouts = _enumerateLineLayouts(words, lineCount);
        if (!layouts.length && lineCount === 1) {
            layouts = [[_joinWordTexts(words)]];
        }
        for (var layoutIdx = 0; layoutIdx < layouts.length; layoutIdx++) {
            var lines = layouts[layoutIdx];
            var width = _measureLayerTextWidth(textLayer, preset, lines);
            var longest = 0;
            var shortest = null;
            for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                var len = String(lines[lineIdx] || "").length;
                if (len > longest) {
                    longest = len;
                }
                if (shortest === null || len < shortest) {
                    shortest = len;
                }
            }
            var balance = shortest === null ? 0 : Math.abs(longest - shortest);
            var overflow = Math.max(0, width - maxWidth);
            var targetWidth = maxWidth * (lineCount >= 4 ? 0.66 : (lineCount >= 3 ? 0.76 : (isVertical ? 0.86 : 0.78)));
            var underfill = Math.max(0, targetWidth - width);
            var widthDelta = Math.abs(width - targetWidth);
            var fillRatio = maxWidth > 0 ? width / maxWidth : 1;
            var columnPenalty = fillRatio < 0.52 && words.length >= 5 ? (0.52 - fillRatio) * 240 : 0;
            var layoutPenalty = _lineLayoutPenalty(lines, words.length, preferredLines);
            var tallPenalty = lineCount > preferredLines ? Math.pow(lineCount - preferredLines, 2) * 48 : 0;
            var shortLinePenalty = 0;
            for (var shortIdx = 0; shortIdx < lines.length; shortIdx++) {
                var lineLength = String(lines[shortIdx] || "").length;
                if (_splitLineWords(lines[shortIdx]).length === 1 && words.length >= 4) {
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
                (underfill * 1.5) +
                (widthDelta * 0.45) +
                (balance * 1.2) +
                (Math.abs(lineCount - preferredLines) * 18) +
                layoutPenalty +
                tallPenalty +
                columnPenalty +
                shortLinePenalty;
            if (!best || score < best.score) {
                best = {
                    score: score,
                    width: width,
                    lines: lines
                };
            }
        }
    }

    if (best && best.lines) {
        prepared.lines = best.lines;
        prepared.text = best.lines.join(" ");
    }

    return prepared;
}

function _splitLineWords(lineText) {
    var text = String(lineText || "");
    var matches = text.match(/\S+/g);
    return matches ? matches : [];
}

function _buildLineWordGroups(item) {
    var groups = [];
    var words = _getItemWordEntries(item, _joinItemText(item));
    var lines = (item && item.lines && item.lines.length) ? item.lines : [_joinWordTexts(words)];
    var cursor = 0;
    for (var i = 0; i < lines.length; i++) {
        var count = _splitLineWords(lines[i]).length;
        groups.push(words.slice(cursor, cursor + count));
        cursor += count;
    }
    return groups;
}

function _approximateItemWords(start, end, textValue) {
    var tokens = _splitLineWords(textValue);
    var words = [];
    if (!tokens.length) {
        return words;
    }
    var safeStart = Math.max(0, _toNumber(start, 0));
    var safeEnd = _toNumber(end, safeStart + 0.01);
    if (safeEnd <= safeStart) {
        safeEnd = safeStart + 0.01;
    }
    var duration = Math.max(0.01, safeEnd - safeStart);
    for (var i = 0; i < tokens.length; i++) {
        var wordStart = safeStart + ((duration * i) / tokens.length);
        var wordEnd = i === tokens.length - 1
            ? safeEnd
            : safeStart + ((duration * (i + 1)) / tokens.length);
        if (wordEnd <= wordStart) {
            wordEnd = wordStart + 0.01;
        }
        words.push({
            start: wordStart,
            end: wordEnd,
            text: tokens[i]
        });
    }
    return words;
}

function _getItemWordEntries(item, textValue) {
    var words = (item && item.words && item.words.length) ? item.words : [];
    if (words && words.length) {
        return words;
    }
    return _approximateItemWords(
        item ? item.start : 0,
        item ? item.end : 0.01,
        textValue !== undefined ? textValue : _joinItemText(item)
    );
}

function _measureTextRect(measureLayer, preset, textValue) {
    if (!measureLayer) {
        return { left: 0, top: 0, width: 0, height: 0 };
    }
    var sourceText = null;
    try {
        sourceText = measureLayer.property("Source Text");
    } catch (_ignored0) {}
    if (!sourceText) {
        return { left: 0, top: 0, width: 0, height: 0 };
    }
    try {
        var doc = sourceText.value;
        doc.text = String(textValue || "");
        setTextStyle(doc, preset);
        sourceText.setValue(doc);
        var rect = measureLayer.sourceRectAtTime(measureLayer.inPoint || 0, false);
        return {
            left: Number(rect && rect.left ? rect.left : 0),
            top: Number(rect && rect.top ? rect.top : 0),
            width: Number(rect && rect.width ? rect.width : 0),
            height: Number(rect && rect.height ? rect.height : 0)
        };
    } catch (_ignored1) {}
    return { left: 0, top: 0, width: 0, height: 0 };
}

function _cloneOverlayPreset(preset) {
    var overlayPreset = _cloneObject(preset || {});
    overlayPreset.boxEnabled = false;
    overlayPreset.shadowEnabled = false;
    overlayPreset.karaokeEnabled = false;
    overlayPreset.accentLastWord = false;
    overlayPreset.justification = "left";
    if (overlayPreset.wordFillColor && overlayPreset.wordFillColor.length === 3) {
        overlayPreset.fillColor = [
            Number(overlayPreset.wordFillColor[0]),
            Number(overlayPreset.wordFillColor[1]),
            Number(overlayPreset.wordFillColor[2])
        ];
    }
    if (overlayPreset.wordStrokeEnabled !== undefined) {
        overlayPreset.strokeEnabled = !!overlayPreset.wordStrokeEnabled;
    }
    if (overlayPreset.wordStrokeColor && overlayPreset.wordStrokeColor.length === 3) {
        overlayPreset.strokeColor = [
            Number(overlayPreset.wordStrokeColor[0]),
            Number(overlayPreset.wordStrokeColor[1]),
            Number(overlayPreset.wordStrokeColor[2])
        ];
    }
    if (overlayPreset.wordStrokeWidth !== undefined) {
        overlayPreset.strokeWidth = Number(overlayPreset.wordStrokeWidth);
    }
    return overlayPreset;
}

function _buildWordBoxPreset(preset) {
    return {
        boxEnabled: true,
        boxColor: (preset.wordBoxColor && preset.wordBoxColor.length === 3) ? [
            Number(preset.wordBoxColor[0]),
            Number(preset.wordBoxColor[1]),
            Number(preset.wordBoxColor[2])
        ] : (preset.accentColor || [0.22, 0.63, 1]),
        boxOpacity: Number(preset.wordBoxOpacity !== undefined ? preset.wordBoxOpacity : 100),
        boxPaddingX: Number(preset.wordBoxPaddingX !== undefined ? preset.wordBoxPaddingX : 12),
        boxPaddingY: Number(preset.wordBoxPaddingY !== undefined ? preset.wordBoxPaddingY : 6),
        boxPadding: Number(preset.wordBoxPadding !== undefined ? preset.wordBoxPadding : 10),
        boxRoundness: Number(preset.wordBoxRoundness !== undefined ? preset.wordBoxRoundness : 8),
        boxStrokeEnabled: !!preset.wordBoxStrokeEnabled,
        boxStrokeColor: preset.wordBoxStrokeColor || [0, 0, 0],
        boxStrokeOpacity: Number(preset.wordBoxStrokeOpacity !== undefined ? preset.wordBoxStrokeOpacity : 100),
        boxStrokeWidth: Number(preset.wordBoxStrokeWidth !== undefined ? preset.wordBoxStrokeWidth : 1),
        boxOffsetX: Number(preset.wordBoxOffsetX !== undefined ? preset.wordBoxOffsetX : 0),
        boxOffsetY: Number(preset.wordBoxOffsetY !== undefined ? preset.wordBoxOffsetY : 0),
        boxSmart: true,
        motionBlurEnabled: preset.motionBlurEnabled
    };
}

function _createMeasureLayer(comp, name) {
    var layer = null;
    try {
        layer = comp.layers.addText("");
        layer.name = name;
        try { layer.enabled = false; } catch (_e0) {}
        try { layer.guideLayer = true; } catch (_e1) {}
        try { layer.shy = true; } catch (_e2) {}
        try { layer.locked = true; } catch (_e3) {}
        try { layer.inPoint = 0; } catch (_e4) {}
        try { layer.outPoint = comp.duration; } catch (_e5) {}
    } catch (_ignored) {
        layer = null;
    }
    return (layer && _isValidAeObject(layer)) ? layer : null;
}

function _buildMaskedWordText(textValue, range) {
    var text = String(textValue || "");
    var start = range ? Number(range.start) : 0;
    var length = range ? Number(range.length) : 0;
    if (!text || !(length > 0)) {
        return "";
    }

    var end = start + length;
    var chars = [];
    for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (ch === "\r" || ch === "\n") {
            chars.push(ch);
        } else if (i >= start && i < end) {
            chars.push(ch);
        } else {
            chars.push(" ");
        }
    }
    return chars.join("");
}

function _buildWordOverlaySpecs(measureLayer, preparedItem, preset, basePos) {
    var specs = [];
    if (!measureLayer || !preparedItem || !preparedItem.words || !preparedItem.words.length || !basePos || basePos.length < 2) {
        return specs;
    }

    var lines = (preparedItem.lines && preparedItem.lines.length) ? preparedItem.lines : [_joinWordTexts(preparedItem.words)];
    var lineGroups = _buildLineWordGroups(preparedItem);
    var measurePreset = _cloneOverlayPreset(preset);
    var lineStep = Number(preset.leading !== undefined ? preset.leading : (preset.fontSize || 60));
    if (isNaN(lineStep) || lineStep <= 0) {
        lineStep = Number(preset.fontSize || 60);
    }

    for (var lineIdx = 0; lineIdx < lineGroups.length; lineIdx++) {
        var lineWords = lineGroups[lineIdx];
        if (!lineWords || !lineWords.length) {
            continue;
        }
        var lineText = String(lines[lineIdx] || _joinWordTexts(lineWords));
        var lineRect = _measureTextRect(measureLayer, measurePreset, lineText);
        var lineLeft = Number(basePos[0]) - (Number(lineRect.width || 0) / 2);
        var lineCenterY = Number(basePos[1]) + Number(lineRect.top) + (Number(lineRect.height) / 2) + (lineIdx * lineStep);

        for (var wordIdx = 0; wordIdx < lineWords.length; wordIdx++) {
            var word = lineWords[wordIdx];
            var wordText = String(word.text || "");
            if (!wordText) {
                continue;
            }
            var prefixWords = lineWords.slice(0, wordIdx);
            var prefixAdvance = 0;
            if (prefixWords.length) {
                var prefixText = _joinWordTexts(prefixWords) + " ";
                var prefixRect = _measureTextRect(measureLayer, measurePreset, prefixText);
                prefixAdvance = Number(prefixRect.width || 0);
            }
            var wordRect = _measureTextRect(measureLayer, measurePreset, wordText);
            var targetLeft = lineLeft + prefixAdvance;

            specs.push({
                text: wordText,
                start: _toNumber(word.start, _toNumber(preparedItem.start, 0)),
                end: _toNumber(word.end, _toNumber(word.start, 0) + 0.04),
                position: [
                    targetLeft - Number(wordRect.left || 0),
                    lineCenterY - Number(wordRect.top || 0) - (Number(wordRect.height || 0) / 2)
                ]
            });
        }
    }

    return specs;
}

function _removeLayerIfExists(comp, name) {
    var layer = findLayerByName(comp, name);
    if (!layer) {
        return;
    }
    try {
        layer.locked = false;
    } catch (_unlockErr) {}
    try {
        layer.remove();
    } catch (_ignored) {}
}

function applyWordBoxOverlay(comp, id, baseTextLayer, preparedItem, preset, measureLayer, updateMode, basePosition) {
    if (!(preset && preset.wordBoxEnabled) || !_isValidAeObject(baseTextLayer)) {
        _removeLayersByPrefix(comp, "SUBWORD__" + id);
        _removeLayersByPrefix(comp, "BOX__WORD__" + id);
        return null;
    }

    var overlayName = "SUBWORD__" + id;
    var overlayLayer = findLayerByName(comp, overlayName);
    if (overlayLayer && !_isValidAeObject(overlayLayer)) {
        overlayLayer = null;
    }
    if (updateMode === "rebuild" && overlayLayer) {
        try { overlayLayer.remove(); } catch (_ignored0) {}
        overlayLayer = null;
    }
    if (!overlayLayer) {
        overlayLayer = comp.layers.addText("");
        overlayLayer.name = overlayName;
    }
    if (!_isValidAeObject(overlayLayer)) {
        return null;
    }

    var overlayPreset = _cloneOverlayPreset(preset);
    var basePos = basePosition || null;
    if (!basePos) {
        try { basePos = _getLayerPositionInCompSpace(baseTextLayer); } catch (_ignored1) {}
    }
    if (!basePos || basePos.length < 2) {
        return overlayLayer;
    }

    var specs = _buildWordOverlaySpecs(measureLayer || baseTextLayer, preparedItem, overlayPreset, basePos);
    if (!specs.length) {
        _removeLayersByPrefix(comp, overlayName);
        _removeLayersByPrefix(comp, "BOX__WORD__" + id);
        return null;
    }

    var frame = 0.04;
    try { frame = Math.max(0.001, Number(comp.frameDuration) || 0.04); } catch (_ignored2) {}

    try { overlayLayer.enabled = true; } catch (_ignored3) {}
    try { overlayLayer.shy = true; } catch (_ignored4) {}
    try { overlayLayer.guideLayer = false; } catch (_ignored5) {}
    try { overlayLayer.startTime = 0; } catch (_ignored6) {}
    try { overlayLayer.inPoint = Math.max(0, _toNumber(preparedItem.start, 0)); } catch (_ignored7) {}
    try { overlayLayer.outPoint = Math.min(comp.duration, _toNumber(preparedItem.end, comp.duration)); } catch (_ignored8) {}
    try { overlayLayer.moveBefore(baseTextLayer); } catch (_ignored8b) {}
    _parentLayerToPositionControlBeforeLayout(overlayLayer, comp, preset);

    applyPresetToTextLayer(
        overlayLayer,
        overlayPreset,
        comp,
        (preparedItem && preparedItem.lines && preparedItem.lines.length) ? preparedItem.lines.length : 1
    );
    _enableLayerMotionBlur(overlayLayer, preset);

    var sourceTextProp = null;
    var positionProp = null;
    var opacityProp = null;
    var scaleProp = null;
    try { sourceTextProp = overlayLayer.property("Source Text"); } catch (_ignored9) {}
    try { positionProp = overlayLayer.property("Transform").property("Position"); } catch (_ignored10) {}
    try { opacityProp = overlayLayer.property("Transform").property("Opacity"); } catch (_ignored11) {}
    try { scaleProp = overlayLayer.property("Transform").property("Scale"); } catch (_ignored11a) {}
    _clearPropertyKeys(sourceTextProp);
    _clearPropertyKeys(positionProp);
    _clearPropertyKeys(opacityProp);
    _clearPropertyKeys(scaleProp);
    if (positionProp) {
        try { _setLayerPositionInCompSpace(overlayLayer, [Number(basePos[0]), Number(basePos[1])]); } catch (_ignored11b) {}
    }
    if (scaleProp) {
        try { scaleProp.setValue(_buildScaleArray(scaleProp, _getBlockScalePercent(preset))); } catch (_ignored11c) {}
    }
    _setLayerText(overlayLayer, "", overlayPreset);

    for (var i = 0; i < specs.length; i++) {
        var spec = specs[i];
        var start = Math.max(0, _toNumber(spec.start, 0));
        var end = _toNumber(spec.end, start + frame);
        if (end <= start) {
            end = start + frame;
        }
        _setLayerTextAtTime(overlayLayer, start, spec.text, overlayPreset);
        if (positionProp) {
            try { _setLayerPositionAtTimeInCompSpace(overlayLayer, start, spec.position); } catch (_ignored12) {}
        }
        if (opacityProp) {
            try {
                opacityProp.setValueAtTime(start, 100);
                opacityProp.setValueAtTime(end, 0);
            } catch (_ignored12b) {}
        }
    }

    if (opacityProp) {
        try { opacityProp.setValueAtTime(Math.max(0, _toNumber(preparedItem.start, 0)), 0); } catch (_ignored13) {}
    }
    var clearAt = Math.min(comp.duration, _toNumber(preparedItem.end, 0) + frame);
    _setLayerTextAtTime(overlayLayer, clearAt, "", overlayPreset);
    _setHoldInterpolation(sourceTextProp);
    _setHoldInterpolation(positionProp);
    _setHoldInterpolation(opacityProp);

    var wordBoxPreset = _buildWordBoxPreset(preset);
    var boxLayer = null;
    try {
        boxLayer = ensureBoxLayer(comp, "WORD__" + id, overlayLayer, wordBoxPreset);
    } catch (_ignored14) {
        boxLayer = null;
    }
    if (boxLayer && _isValidAeObject(boxLayer)) {
        var boxOpacityProp = null;
        var boxScaleProp = null;
        try { boxOpacityProp = boxLayer.property("Transform").property("Opacity"); } catch (_ignored15) {}
        try { boxScaleProp = boxLayer.property("Transform").property("Scale"); } catch (_ignored15a) {}
        _clearPropertyKeys(boxOpacityProp);
        _clearPropertyKeys(boxScaleProp);
        if (boxScaleProp) {
            try { boxScaleProp.setValue(_buildScaleArray(boxScaleProp, _getBlockScalePercent(preset))); } catch (_ignored15b) {}
        }
        if (boxOpacityProp) {
            for (var j = 0; j < specs.length; j++) {
                var boxSpec = specs[j];
                var boxStart = Math.max(0, _toNumber(boxSpec.start, 0));
                var boxEnd = _toNumber(boxSpec.end, boxStart + frame);
                try {
                    boxOpacityProp.setValueAtTime(boxStart, 100);
                    boxOpacityProp.setValueAtTime(boxEnd, 0);
                } catch (_ignored16) {}
            }
            try { boxOpacityProp.setValueAtTime(Math.max(0, _toNumber(preparedItem.start, 0)), 0); } catch (_ignored17) {}
            _setHoldInterpolation(boxOpacityProp);
        }
        _enableLayerMotionBlur(boxLayer, preset);
    }

    return overlayLayer;
}

function _getDefaultPresetsPath() {
    var scriptFile = new File($.fileName);
    var scriptsDir = scriptFile.parent;
    var repoRoot = scriptsDir.parent;
    return repoRoot.fsName + "/config/presets.json";
}

function createOrUpdateSubtitles(comp, subtitles, preset, updateMode) {
    var items = _stabilizeExpandedItemTimings(_expandItemsForPreset(subtitles.items || [], preset), comp);
    var expectedIds = {};
    var firstSubtitleLayer = null;
    var failed = 0;
    var failedItems = [];
    var succeeded = 0;

    var created = 0;
    var updated = 0;
    _removeLayersByPrefix(comp, "AEAS__LAYERS_MEASURE");
    var measureLayer = _createMeasureLayer(comp, "AEAS__LAYERS_MEASURE");
    var usesGeneratedBackground = _hasGeneratedBackgroundFeatureEnabled(preset);

    _writeApplyStatus("layers:start", "items=" + items.length);
    if (!usesGeneratedBackground) {
        _writeApplyStatus("layers:background_cleanup", "all generated background helpers off");
        _removeAllGeneratedBackgroundLayers(comp);
    }
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var id = String(item.id !== undefined ? item.id : (i + 1));
        _markExpectedAutoLayerId(expectedIds, id);
        _writeApplyStatus("layers:item", (i + 1) + "/" + items.length + " id=" + id);

        try {
            var layerName = "SUB__" + id;
            var textLayer = findLayerByName(comp, layerName);
            if (textLayer && !_isValidAeObject(textLayer)) {
                textLayer = null;
            }

            if (updateMode === "rebuild" && textLayer) {
                try {
                    textLayer.remove();
                } catch (_removeErr) {}
                textLayer = null;
            }

            if (!textLayer) {
                textLayer = comp.layers.addText("");
                textLayer.name = layerName;
                created++;
            } else {
                try { textLayer.enabled = true; } catch (_enableErr) {}
                updated++;
            }
            if (!_isValidAeObject(textLayer)) {
                throw new Error("Unable to create/access subtitle layer");
            }
            _parentLayerToPositionControlBeforeLayout(textLayer, comp, preset);
            try { textLayer.shy = false; } catch (_shyErr) {}
            try { textLayer.guideLayer = false; } catch (_guideErr) {}

            var start = Math.max(0, _toNumber(item.start, 0));
            var end = _toNumber(item.end, start + 1);
            if (end <= start) {
                end = start + 0.1;
            }
            var nextStart = _getNextSubtitleStart(items, i, start);
            if (nextStart !== null && end > nextStart) {
                var frameGap = Math.max(0.001, 1 / Math.max(1, comp.frameRate || 24));
                end = Math.max(start + 0.01, nextStart - frameGap);
            }
            if (end > comp.duration) {
                end = comp.duration;
            }
            if (end <= start) {
                end = start + 0.05;
            }

            try { textLayer.startTime = 0; } catch (_startTimeErr) {}
            try { textLayer.inPoint = start; } catch (_inPointErr) {}
            try { textLayer.outPoint = end; } catch (_outPointErr) {}

            var renderItem = _copyItem(item);
            renderItem.start = start;
            renderItem.end = end;
            var preparedItem = _fitItemTextLayout(measureLayer || textLayer, renderItem, preset);
            var textValue = _joinItemText(preparedItem);
            preparedItem.words = _getItemWordEntries(preparedItem, textValue);
            try {
                _setLayerText(textLayer, textValue, preset, preparedItem.wordRuleHighlights);
            } catch (_textSetErr) {
                try {
                    textLayer.property("Source Text").setValue(textValue);
                } catch (_textSetErr2) {
                    throw _textSetErr2;
                }
            }

            var linesCount = preparedItem.lines && preparedItem.lines.length ? preparedItem.lines.length : 1;
            var textBasePos = null;
            try {
                applyPresetToTextLayer(textLayer, preset, comp, linesCount);
                try { textBasePos = _getLayerPositionInCompSpace(textLayer); } catch (_basePosErr0) {}
            } catch (_presetErr) {
                try {
                    var fallbackX = _resolveSubtitleBaseX(comp, preset);
                    var fallbackY = _resolveSubtitleBaseY(comp, preset, linesCount);
                    _setLayerPositionInCompSpace(textLayer, [fallbackX, fallbackY]);
                    textBasePos = [fallbackX, fallbackY];
                } catch (_fallbackPosErr) {}
            }

            if (_isBackplateEnabled(preset)) {
                var unitLayer = createOrUpdateBackplateUnitCaption(comp, id, textLayer, preparedItem, preset, updateMode, start, end);
                if (!firstSubtitleLayer && unitLayer && _isValidAeObject(unitLayer)) {
                    firstSubtitleLayer = unitLayer;
                }
                _removeLineLayerCaption(comp, id);
                _removeLayerIfExists(comp, "LINEBOX__" + id);
                _removeLayerIfExists(comp, "BOX__" + id);
                _removeLayerIfExists(comp, "BOX__WORD__" + id);
                _removeLayerIfExists(comp, "SUBWORD__" + id);
                succeeded++;
                continue;
            } else {
                _removeBackplateUnitCaption(comp, id);
                if (!usesGeneratedBackground) {
                    _removeGeneratedBackgroundLayersForId(comp, id);
                }
            }

            if (preset.lineBoxEnabled && preset.lineBoxRenderMode === "line_layers") {
                var firstLineLayer = createOrUpdateLineLayerCaption(comp, id, textLayer, preparedItem, preset, updateMode, start, end);
                if (!firstSubtitleLayer && firstLineLayer && _isValidAeObject(firstLineLayer)) {
                    firstSubtitleLayer = firstLineLayer;
                }
                _removeLayerIfExists(comp, "BOX__" + id);
                _removeLayerIfExists(comp, "BOX__WORD__" + id);
                _removeLayerIfExists(comp, "SUBWORD__" + id);
                succeeded++;
                continue;
            } else {
                _removeLineLayerCaption(comp, id);
            }

            try {
                applyKaraokeWordHighlights(textLayer, preparedItem, preset);
            } catch (_karaokeErr) {}
            try {
                applyLayerAnimation(textLayer, start, end, preset, false);
            } catch (_animErr) {}

            if (!firstSubtitleLayer) {
                firstSubtitleLayer = textLayer;
            }

            if (preset.lineBoxEnabled) {
                try {
                    var lineBoxLayer = ensureLineBoxLayer(comp, id, textLayer, preparedItem, preset, measureLayer || textLayer, textBasePos, updateMode);
                    if (lineBoxLayer && _isValidAeObject(lineBoxLayer)) {
                        try {
                            applyLayerOpacityAnimation(lineBoxLayer, start, end, preset);
                        } catch (_lineBoxAnimErr) {}
                    }
                } catch (_lineBoxErr) {
                    _removeLayerIfExists(comp, "LINEBOX__" + id);
                }
            } else {
                _removeLayersByPrefix(comp, "LINEBOX__" + id);
            }

            if (preset.boxEnabled) {
                try {
                    var boxLayer = ensureBoxLayer(comp, id, textLayer, preset);
                    try {
                        applyLayerAnimation(boxLayer, start, end, preset, true);
                    } catch (_boxAnimErr) {}
                } catch (_boxErr) {
                    try {
                        var boxFallback = findLayerByName(comp, "BOX__" + id);
                        if (boxFallback) {
                            boxFallback.enabled = false;
                        }
                    } catch (_boxDisableErr) {}
                }
            } else {
                _removeLayersByPrefix(comp, "BOX__WORD__" + id);
                _removeLayersByPrefix(comp, "BOX__" + id);
            }

            try {
                applyWordBoxOverlay(comp, id, textLayer, preparedItem, preset, measureLayer || textLayer, updateMode, textBasePos);
            } catch (_wordBoxErr) {}

            succeeded++;
        } catch (itemErr) {
            failed++;
            failedItems.push("id=" + id + ": " + itemErr.toString());
        }
    }

    try {
        _writeApplyStatus("layers:cleanup", "expected=" + items.length);
        cleanupUnusedAutoLayers(comp, expectedIds, updateMode);
    } catch (_cleanupErr) {}

    if (measureLayer) {
        try { measureLayer.locked = false; } catch (_measureUnlockErr) {}
        try {
            measureLayer.remove();
        } catch (_measureRemoveErr) {}
    }
    try {
        _removeLayersByPrefix(comp, "AEAS__LAYERS_MEASURE");
    } catch (_measureSweepErr) {}

    return {
        created: created,
        updated: updated,
        succeeded: succeeded,
        total: items.length,
        failed: failed,
        failedItems: failedItems
    };
}

function createSingleKeysSubtitleLayer(comp, subtitles, preset, updateMode) {
    var items = _stabilizeExpandedItemTimings(_expandItemsForPreset(subtitles.items || [], preset), comp);
    var expectedIds = { "ALL_KEYS": true };
    var failed = 0;
    var failedItems = [];
    var succeeded = 0;
    var created = 0;
    var updated = 0;

    var layerName = "SUB__ALL_KEYS";
    var textLayer = findLayerByName(comp, layerName);
    if (textLayer && !_isValidAeObject(textLayer)) {
        textLayer = null;
    }

    if (updateMode === "rebuild" && textLayer) {
        try {
            textLayer.remove();
        } catch (_removeErr) {}
        textLayer = null;
    }

    if (!textLayer) {
        textLayer = comp.layers.addText("");
        textLayer.name = layerName;
        created++;
    } else {
        updated++;
    }

    if (!_isValidAeObject(textLayer)) {
        return {
            created: created,
            updated: updated,
            succeeded: 0,
            total: items.length,
            failed: items.length || 1,
            failedItems: ["id=ALL_KEYS: Unable to create/access single subtitle layer"]
        };
    }
    _parentLayerToPositionControlBeforeLayout(textLayer, comp, preset);

    try { textLayer.enabled = true; } catch (_enableErr) {}
    try { textLayer.shy = false; } catch (_shyErr) {}
    try { textLayer.guideLayer = false; } catch (_guideErr) {}
    try { textLayer.locked = false; } catch (_lockErr) {}
    try { textLayer.startTime = 0; } catch (_startErr) {}
    try { textLayer.inPoint = 0; } catch (_inErr) {}
    try { textLayer.outPoint = comp.duration; } catch (_outErr) {}

    try {
        applyPresetToTextLayer(textLayer, preset, comp, 1);
    } catch (_presetErr) {
        try {
            var fallbackX = _resolveSubtitleBaseX(comp, preset);
            var fallbackY = _resolveSubtitleBaseY(comp, preset, 1);
            _setLayerPositionInCompSpace(textLayer, [fallbackX, fallbackY]);
        } catch (_fallbackPosErr) {}
    }

    var measureLayer = null;
    try {
        measureLayer = comp.layers.addText("");
        measureLayer.name = "AEAS__SINGLE_KEYS_MEASURE";
        try { measureLayer.enabled = false; } catch (_measureEnableErr) {}
        try { measureLayer.guideLayer = true; } catch (_measureGuideErr) {}
        try { measureLayer.shy = true; } catch (_measureShyErr) {}
        try { measureLayer.locked = true; } catch (_measureLockErr) {}
        try { measureLayer.inPoint = 0; } catch (_measureInErr) {}
        try { measureLayer.outPoint = comp.duration; } catch (_measureOutErr) {}
    } catch (_measureCreateErr) {
        measureLayer = null;
    }
    if (!measureLayer || !_isValidAeObject(measureLayer)) {
        measureLayer = textLayer;
    }

    var boxLayer = null;
    var boxOpacityProp = null;
    var boxScaleProp = null;
    if (preset.boxEnabled) {
        try {
            boxLayer = ensureBoxLayer(comp, "ALL_KEYS", textLayer, preset);
        } catch (_boxCreateErr) {
            boxLayer = null;
        }
        if (boxLayer && _isValidAeObject(boxLayer)) {
            try { boxLayer.enabled = true; } catch (_boxEnableErr) {}
            try { boxLayer.shy = false; } catch (_boxShyErr) {}
            try { boxLayer.guideLayer = false; } catch (_boxGuideErr) {}
            try { boxLayer.locked = false; } catch (_boxLockErr) {}
            try { boxLayer.startTime = 0; } catch (_boxStartErr) {}
            try { boxLayer.inPoint = 0; } catch (_boxInErr) {}
            try { boxLayer.outPoint = comp.duration; } catch (_boxOutErr) {}
            try {
                boxOpacityProp = boxLayer.property("Transform").property("Opacity");
            } catch (_boxOpacityErr) {}
            try {
                boxScaleProp = boxLayer.property("Transform").property("Scale");
            } catch (_boxScaleErr) {}
            _clearPropertyKeys(boxOpacityProp);
            _clearPropertyKeys(boxScaleProp);
            try {
                if (boxOpacityProp) {
                    boxOpacityProp.setValue(0);
                    boxOpacityProp.setValueAtTime(0, 0);
                }
            } catch (_boxInitOpacityErr) {}
            _enableLayerMotionBlur(boxLayer, preset);
        }
    } else {
        var oldSingleBox = findLayerByName(comp, "BOX__ALL_KEYS");
        if (oldSingleBox) {
            try {
                oldSingleBox.remove();
            } catch (_oldSingleBoxErr) {}
        }
    }

    var sourceTextProp = null;
    var opacityProp = null;
    var positionProp = null;
    var scaleProp = null;
    try {
        sourceTextProp = textLayer.property("Source Text");
    } catch (_stErr) {}
    try {
        opacityProp = textLayer.property("Transform").property("Opacity");
    } catch (_opErr) {}
    try {
        positionProp = textLayer.property("Transform").property("Position");
    } catch (_posErr) {}
    try {
        scaleProp = textLayer.property("Transform").property("Scale");
    } catch (_scaleErr) {}

    _clearPropertyKeys(sourceTextProp);
    _clearPropertyKeys(opacityProp);
    _clearPropertyKeys(positionProp);
    _clearPropertyKeys(scaleProp);

    var frame = 0.04;
    try {
        frame = Math.max(0.001, Number(comp.frameDuration) || 0.04);
    } catch (_frameErr) {}

    _enableLayerMotionBlur(textLayer, preset);

    var inDur = _clamp(preset.animIn !== undefined ? preset.animIn : 0.1, 0.03, 0.8);
    var outDur = _clamp(preset.animOut !== undefined ? preset.animOut : 0.08, 0.03, 0.8);
    var yOffset = Number(preset.animYOffset !== undefined ? preset.animYOffset : 18);
    if (isNaN(yOffset)) {
        yOffset = 18;
    }
    var scaleFrom = _clamp(preset.animScaleFrom !== undefined ? preset.animScaleFrom : 98, 85, 100);
    var basePos = null;
    try { basePos = _getLayerPositionInCompSpace(textLayer); } catch (_basePosErr) {}
    var baseScale = null;
    try { baseScale = scaleProp ? _buildScaleArray(scaleProp, _getBlockScalePercent(preset)) : null; } catch (_baseScaleErr) {}

    try {
        _setLayerText(textLayer, "", preset);
    } catch (_initTextErr) {}
    try {
        if (opacityProp) {
            opacityProp.setValue(0);
            opacityProp.setValueAtTime(0, 0);
        }
    } catch (_initOpacityErr) {}

    _writeApplyStatus("single_keys:start", "items=" + items.length);
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var id = String(item.id !== undefined ? item.id : (i + 1));
        _writeApplyStatus("single_keys:item", (i + 1) + "/" + items.length + " id=" + id);
        try {
            var start = Math.max(0, _toNumber(item.start, 0));
            var end = _toNumber(item.end, start + frame);
            if (end <= start) {
                end = start + frame;
            }
            if (end > comp.duration) {
                end = comp.duration;
            }
            if (end <= start) {
                end = Math.min(comp.duration, start + frame);
            }

            var preparedItem = _fitItemTextLayout(measureLayer, item, preset);
            expectedIds["ALL_KEYS__" + id] = true;
            var textValue = _joinItemText(preparedItem);
            preparedItem.words = _getItemWordEntries(preparedItem, textValue);
            var appliedKaraoke = false;
            if (sourceTextProp && preset && preset.karaokeEnabled) {
                var ranges = _buildWordHighlightRanges(textValue, preparedItem.words || []);
                if (ranges.length) {
                    sourceTextProp.setValueAtTime(start, _makeStyledDocument(sourceTextProp, textValue, preset, null, preparedItem.wordRuleHighlights));
                    for (var r = 0; r < ranges.length; r++) {
                        var range = ranges[r];
                        var keyTime = Math.max(start, _toNumber(range.timeStart, start));
                        sourceTextProp.setValueAtTime(keyTime, _makeStyledDocument(sourceTextProp, textValue, preset, range, preparedItem.wordRuleHighlights));
                    }
                    appliedKaraoke = true;
                }
            }
            if (!appliedKaraoke) {
                _setLayerTextAtTime(textLayer, start, textValue, preset, preparedItem.wordRuleHighlights);
            }

            var entryEnd = Math.min(end, start + inDur);
            var exitStart = Math.max(entryEnd, end - outDur);
            if (opacityProp) {
                opacityProp.setValueAtTime(start, 0);
                opacityProp.setValueAtTime(entryEnd, 100);
                if (exitStart > entryEnd) {
                    opacityProp.setValueAtTime(exitStart, 100);
                }
                opacityProp.setValueAtTime(end, 0);
            }
            if (boxOpacityProp) {
                boxOpacityProp.setValueAtTime(start, 0);
                boxOpacityProp.setValueAtTime(entryEnd, 100);
                if (exitStart > entryEnd) {
                    boxOpacityProp.setValueAtTime(exitStart, 100);
                }
                boxOpacityProp.setValueAtTime(end, 0);
            }
            if (positionProp && basePos && basePos.length >= 2) {
                var x = Number(basePos[0]);
                var y = Number(basePos[1]);
                positionProp.setValueAtTime(start, [x, y + yOffset]);
                positionProp.setValueAtTime(entryEnd, [x, y]);
                if (exitStart > entryEnd) {
                    positionProp.setValueAtTime(exitStart, [x, y]);
                }
                positionProp.setValueAtTime(end, [x, y - (yOffset * 0.35)]);
            }
            if (scaleProp) {
                var scaleStart = _buildScaleArray(scaleProp, _combineBlockScale(preset, scaleFrom));
                var scaleMid = baseScale || _buildScaleArray(scaleProp, _getBlockScalePercent(preset));
                var scaleEnd = _buildScaleArray(scaleProp, _combineBlockScale(preset, Math.max(90, scaleFrom + 1)));
                scaleProp.setValueAtTime(start, scaleStart);
                scaleProp.setValueAtTime(entryEnd, scaleMid);
                if (exitStart > entryEnd) {
                    scaleProp.setValueAtTime(exitStart, scaleMid);
                }
                scaleProp.setValueAtTime(end, scaleEnd);
            }
            if (boxScaleProp) {
                var boxScaleStart = _buildScaleArray(boxScaleProp, _combineBlockScale(preset, Math.max(94, scaleFrom)));
                var boxScaleMid = _buildScaleArray(boxScaleProp, _getBlockScalePercent(preset));
                var boxScaleEnd = _buildScaleArray(boxScaleProp, _combineBlockScale(preset, Math.max(92, scaleFrom + 1)));
                boxScaleProp.setValueAtTime(start, boxScaleStart);
                boxScaleProp.setValueAtTime(entryEnd, boxScaleMid);
                if (exitStart > entryEnd) {
                    boxScaleProp.setValueAtTime(exitStart, boxScaleMid);
                }
                boxScaleProp.setValueAtTime(end, boxScaleEnd);
            }

            var clearAt = Math.min(comp.duration, end + frame);
            _setLayerTextAtTime(textLayer, clearAt, "", preset);
            try {
                applyWordBoxOverlay(
                    comp,
                    "ALL_KEYS__" + id,
                    textLayer,
                    preparedItem,
                    preset,
                    measureLayer,
                    updateMode,
                    basePos
                );
            } catch (_wordBoxErr) {}
            succeeded++;
        } catch (itemErr) {
            failed++;
            failedItems.push("id=" + id + ": " + itemErr.toString());
        }
    }

    _setHoldInterpolation(sourceTextProp);
    _applyBezierCurve(opacityProp, preset);
    _applyBezierCurve(positionProp, preset);
    _applyBezierCurve(scaleProp, preset);
    _applyBezierCurve(boxOpacityProp, preset);
    _applyBezierCurve(boxScaleProp, preset);

    if (measureLayer && measureLayer !== textLayer) {
        try { measureLayer.locked = false; } catch (_measureUnlockErr) {}
        try {
            measureLayer.remove();
        } catch (_measureRemoveErr) {}
    }

    try {
        cleanupUnusedAutoLayers(comp, expectedIds, "rebuild");
    } catch (_cleanupErr) {}

    try {
        textLayer.selected = false;
    } catch (_selectErr) {}

    return {
        created: created,
        updated: updated,
        succeeded: succeeded,
        total: items.length,
        failed: failed,
        failedItems: failedItems
    };
}

function createSubtitlesByMode(comp, subtitles, preset, updateMode, outputMode) {
    var mode = String(outputMode || "layers").toLowerCase();
    if (mode === "single_keys" && !_isBackplateEnabled(preset)) {
        return createSingleKeysSubtitleLayer(comp, subtitles, preset, updateMode);
    }
    return createOrUpdateSubtitles(comp, subtitles, preset, updateMode);
}

function createSubtitlesFromJson(
    subtitlesJsonPath,
    presetName,
    marginY,
    updateMode,
    target,
    targetCompName,
    targetCompId,
    presetsPath,
    outputMode,
    fontOverride,
    styleOverridesJson
) {
    var undoOpened = false;
    try {
        var jsonPath = subtitlesJsonPath;
        if (!jsonPath || jsonPath === "") {
            var picked = File.openDialog("Select subtitles JSON", "*.json");
            if (!picked) {
                return "ERROR: subtitles json not selected";
            }
            jsonPath = picked.fsName;
        }

        var effectivePresetsPath = presetsPath || _getDefaultPresetsPath();
        var presets = loadPresets(effectivePresetsPath);
        var resolvedPresetName = presetName || "classic_clean";
        var preset = resolvePreset(presets, resolvedPresetName, marginY);
        applyFontOverrideToPreset(preset, fontOverride || "");
        applyStyleOverridesToPreset(preset, styleOverridesJson || "");
        _normalizeBackplatePreset(preset);
        if (_isBoxDisabledPresetName(resolvedPresetName)) {
            _disableBoxFeaturesForPreset(preset);
        }

        _writeApplyStatus("resolve", "loading comp");
        var comp = resolveTargetComp(target || "active_comp", targetCompName || "", targetCompId || "");
        _scalePresetToComp(preset, comp);
        _normalizeBackplatePreset(preset);
        if (_shouldAutoParentSubtitles(preset)) {
            _writeApplyStatus("position_control", comp.name);
            ensureSubtitlesPositionControl(comp, preset);
        } else {
            _writeApplyStatus("position_control_skip", "auto parent disabled");
        }

        _writeApplyStatus("read_json", jsonPath);
        var data = readJsonFile(jsonPath);
        if (!data || !data.items || !data.items.length) {
            return "ERROR: no subtitle items in json";
        }

        _writeApplyStatus("undo_begin", "items=" + data.items.length);
        app.beginUndoGroup("AE Auto Subtitles");
        undoOpened = true;

        _writeApplyStatus("create_start", String(outputMode || "layers"));
        var stats = createSubtitlesByMode(
            comp,
            data,
            preset,
            updateMode || "update_existing",
            outputMode || "layers"
        );
        var positionControl = null;
        if (_shouldAutoParentSubtitles(preset)) {
            try {
                _writeApplyStatus("parent_start", "Position");
                positionControl = parentSubtitleLayersToPositionControl(comp, preset);
                _writeApplyStatus("parent_done", positionControl ? "ok" : "none");
            } catch (_parentControlErr) {
                positionControl = null;
                _writeApplyStatus("parent_error", _parentControlErr.toString());
            }
        } else {
            _writeApplyStatus("parent_skip", "auto parent disabled");
        }

        _writeApplyStatus("undo_end", "succeeded=" + stats.succeeded);
        app.endUndoGroup();
        undoOpened = false;

        if (!stats.succeeded || stats.succeeded <= 0) {
            var failSample = "";
            if (stats.failedItems && stats.failedItems.length) {
                failSample = " sample=" + stats.failedItems.slice(0, 2).join(" | ");
            }
            _writeApplyStatus("error", "no subtitle items were applied in AE." + failSample);
            return "ERROR: no subtitle items were applied in AE." + failSample;
        }

        var resultMessage =
            "OK: comp=" + comp.name +
            ", mode=" + (outputMode || "layers") +
            ", created=" + stats.created +
            ", updated=" + stats.updated +
            ", succeeded=" + stats.succeeded +
            ", total=" + stats.total;
        if (positionControl && _isValidAeObject(positionControl)) {
            resultMessage += ", control=Position";
        }
        if (stats.failed && stats.failed > 0) {
            var sample = "";
            if (stats.failedItems && stats.failedItems.length) {
                sample = ", sample=" + stats.failedItems.slice(0, 2).join(" | ");
            }
            resultMessage += ", failed=" + stats.failed + sample;
        }
        _writeApplyStatus("done", resultMessage);
        return resultMessage;
    } catch (e) {
        if (undoOpened) {
            try {
                app.endUndoGroup();
            } catch (_ignored) {}
        }
        _writeApplyStatus("error", e.toString());
        return "ERROR: " + e.toString();
    }
}

function runCreateSubtitlesInteractive() {
    var picked = File.openDialog("Select subtitles JSON", "*.json");
    if (!picked) {
        alert("Canceled.");
        return;
    }

    var preset = prompt("Preset (classic_clean|clean_paragraph|modern_yellow|impact_yellow|bold_yellow_shadow|bold_two_words|karaoke_classic)", "classic_clean");
    var mode = prompt("Mode (update_existing|rebuild)", "update_existing");
    var margin = prompt("offsetY from center in px", "180");
    var outputMode = prompt("Output mode (layers|single_keys)", "layers");

    var result = createSubtitlesFromJson(
        picked.fsName,
        preset || "classic_clean",
        margin || "180",
        mode || "update_existing",
        "active_comp",
        "",
        "",
        "",
        outputMode || "layers",
        "",
        ""
    );
    alert(result);
}

if (!$.global.AE_AUTOSUB_DISABLE_AUTO_RUN) {
    runCreateSubtitlesInteractive();
}

// Test compatibility strings: "layers:item_fit" "layers:item_done"
