(function() {
    function readTextFile(path) {
        var file = new File(path);
        if (!file.exists || !file.open("r")) {
            return "";
        }
        file.encoding = "UTF-8";
        var text = file.read();
        file.close();
        return text;
    }

    function parseJson(text) {
        var raw = String(text || "");
        if (raw.length && raw.charCodeAt(0) === 0xFEFF) {
            raw = raw.substring(1);
        }
        if (typeof JSON !== "undefined" && JSON.parse) {
            return JSON.parse(raw);
        }
        return eval("(" + raw + ")");
    }

    function escapeJson(value) {
        return String(value === undefined || value === null ? "" : value)
            .replace(/\\/g, "\\\\")
            .replace(/"/g, "\\\"")
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n");
    }

    function stringifyJson(value) {
        if (typeof JSON !== "undefined" && JSON.stringify) {
            return JSON.stringify(value);
        }
        if (value === null || value === undefined) {
            return "null";
        }
        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }
        if (typeof value === "string") {
            return "\"" + escapeJson(value) + "\"";
        }
        if (value instanceof Array) {
            var items = [];
            for (var i = 0; i < value.length; i++) {
                items.push(stringifyJson(value[i]));
            }
            return "[" + items.join(",") + "]";
        }
        var pairs = [];
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                pairs.push("\"" + escapeJson(key) + "\":" + stringifyJson(value[key]));
            }
        }
        return "{" + pairs.join(",") + "}";
    }

    function readArgs() {
        var text = readTextFile("/tmp/ae-assistant-args.json");
        return text ? parseJson(text) : {};
    }

    function writeResult(obj) {
        var outFile = new File("/tmp/ae-assistant-result.json");
        outFile.encoding = "UTF-8";
        outFile.open("w");
        outFile.write(stringifyJson(obj));
        outFile.close();
    }

    var args = readArgs();
    var result = {
        ok: false,
        applyResult: "",
        compName: "",
        layers: [],
        measureHelpers: [],
        backgroundHelpers: [],
        error: ""
    };
    var comp = null;

    function safeString(value) {
        return String(value === undefined || value === null ? "" : value);
    }

    function collectTextLayer(layer) {
        var text = "";
        var rect = null;
        var position = null;
        try {
            var sourceText = layer.property("Source Text");
            var doc = sourceText ? sourceText.value : null;
            text = doc && doc.text !== undefined ? safeString(doc.text) : "";
        } catch (_textErr) {}
        try {
            var pos = layer.property("Position").value;
            position = [Number(pos[0]), Number(pos[1])];
        } catch (_posErr) {}
        try {
            var r = layer.sourceRectAtTime(Math.max(0, layer.inPoint), false);
            rect = {
                left: Number(r.left),
                top: Number(r.top),
                width: Number(r.width),
                height: Number(r.height)
            };
        } catch (_rectErr) {}
        return {
            index: layer.index,
            name: safeString(layer.name),
            inPoint: Number(layer.inPoint),
            outPoint: Number(layer.outPoint),
            text: text,
            position: position,
            rect: rect
        };
    }

    try {
        if (!app.project) {
            app.newProject();
        }

        var repoRoot = safeString(args.repoRoot);
        var rendererPath = safeString(args.rendererPath || (repoRoot + "/scripts/create_subtitles.jsx"));
        var subtitlesPath = safeString(args.subtitlesPath || (repoRoot + "/tmp/ae_layout_selftest_subtitles.json"));
        var presetsPath = safeString(args.presetsPath || (repoRoot + "/config/presets.json"));
        var presetName = safeString(args.presetName || "classic_clean");
        var marginY = safeString(args.marginY || "224");
        var outputMode = safeString(args.outputMode || "layers");
        var styleOverrides = safeString(args.styleOverridesJson || "{}");
        var compName = "__AEAS_SELFTEST_LAYOUT__" + (new Date()).getTime();

        $.global.AE_AUTOSUB_DISABLE_AUTO_RUN = true;
        $.evalFile(new File(rendererPath));

        comp = app.project.items.addComp(compName, 1080, 1920, 1, 8, 30);
        result.compName = compName;
        result.applyResult = createSubtitlesFromJson(
            subtitlesPath,
            presetName,
            marginY,
            "rebuild",
            "comp_name",
            compName,
            "",
            presetsPath,
            outputMode,
            "",
            styleOverrides
        );

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            var name = safeString(layer.name);
            if (name.indexOf("SUB__") === 0) {
                result.layers.push(collectTextLayer(layer));
            }
            if (name.indexOf("AEAS__LAYERS_MEASURE") === 0 || name.indexOf("AEAS__SINGLE_KEYS_MEASURE") === 0) {
                result.measureHelpers.push(name);
            }
            if (
                name.indexOf("SUBUNIT__") === 0 ||
                name.indexOf("SUBLINE__") === 0 ||
                name.indexOf("LINEBOX__") === 0 ||
                name.indexOf("BOX__") === 0 ||
                name.indexOf("SUBWORD__") === 0 ||
                name.indexOf("BACKPLATE__") === 0
            ) {
                result.backgroundHelpers.push(name);
            }
        }

        result.ok = result.applyResult.indexOf("OK:") === 0 && result.layers.length > 0 && result.measureHelpers.length === 0;
    } catch (e) {
        result.error = e.toString();
        try {
            result.errorLine = e.line;
        } catch (_lineErr) {}
    }

    if (comp && args.cleanup !== false) {
        try {
            comp.remove();
        } catch (_cleanupErr) {
            result.cleanupError = _cleanupErr.toString();
        }
    }

    writeResult(result);
})();
