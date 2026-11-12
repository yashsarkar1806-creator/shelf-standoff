(function () {
  "use strict";

  var S = window.ShelfStandoff;
  if (!S) return;

  var form = document.getElementById("pack-form");
  var preview = document.getElementById("pack-preview");
  var bayBlurb = document.getElementById("bay-blurb");
  var dropBtn = document.getElementById("drop-btn");
  var remixBtn = document.getElementById("remix-btn");
  var cardBtn = document.getElementById("card-btn");
  var timer = document.getElementById("timer");
  var shelfPacks = document.getElementById("shelf-packs");
  var shelfLabel = document.getElementById("shelf-label");
  var walkway = document.getElementById("walkway");
  var results = document.getElementById("results");
  var lastRun = null;
  var walkSeed = 0;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) { return document.getElementById(id); }

  function escapeXml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function wrapText(text, max, maxLines) {
    var words = String(text || "").trim().split(/\s+/).filter(Boolean);
    var lines = [];
    var current = "";
    for (var i = 0; i < words.length; i++) {
      var next = current ? current + " " + words[i] : words[i];
      if (next.length > max && current) {
        lines.push(current);
        current = words[i];
        if (lines.length === maxLines) break;
      } else {
        current = next;
      }
    }
    if (lines.length < maxLines && current) lines.push(current);
    return lines;
  }

  function packSvg(pack, opts) {
    var o = opts || {};
    var w = o.width || 200;
    var h = o.height || 260;
    var p = pack;
    var compact = !!o.compact;
    var name = escapeXml(p.name);
    var flavour = escapeXml(p.flavour);
    var claimLines = compact ? [] : wrapText(p.claim, 16, 2).map(escapeXml);
    var price = "₹" + p.price;
    var nameSize = p.name.length > 16 ? 13 : p.name.length > 11 ? 16 : 20;
    if (compact) nameSize = p.name.length > 12 ? 13 : 16;
    var primary = p.primary;
    var accent = p.accent;
    var text = p.text;
    var shape = p.shape;

    var body;
    if (shape === "can") {
      body = [
        '<ellipse cx="100" cy="46" rx="58" ry="16" fill="rgba(255,255,255,0.35)" stroke="', accent, '" stroke-width="3"/>',
        '<rect x="42" y="46" width="116" height="170" fill="', primary, '"/>',
        '<ellipse cx="100" cy="216" rx="58" ry="16" fill="', primary, '" stroke="', accent, '" stroke-width="3"/>',
        '<ellipse cx="100" cy="46" rx="58" ry="16" fill="rgba(255,255,255,0.22)"/>',
        '<rect x="42" y="78" width="116" height="100" fill="', accent, '" opacity="0.16"/>'
      ].join("");
    } else if (shape === "bottle") {
      body = [
        '<rect x="86" y="18" width="28" height="36" rx="6" fill="', accent, '"/>',
        '<rect x="90" y="10" width="20" height="14" rx="4" fill="', text, '"/>',
        '<path d="M70 70 C70 52, 130 52, 130 70 L142 210 Q100 240 58 210 Z" fill="', primary, '" stroke="', accent, '" stroke-width="3"/>',
        '<rect x="70" y="96" width="60" height="86" rx="8" fill="', accent, '" opacity="0.18"/>'
      ].join("");
    } else if (shape === "carton") {
      body = [
        '<path d="M46 70 L100 36 L154 70 L154 230 L46 230 Z" fill="', primary, '" stroke="', accent, '" stroke-width="3"/>',
        '<path d="M46 70 L100 96 L154 70 L100 36 Z" fill="', accent, '" opacity="0.85"/>',
        '<path d="M100 96 L100 230" stroke="', accent, '" stroke-width="2" opacity="0.4"/>'
      ].join("");
    } else if (shape === "bar") {
      body = [
        '<path d="M28 86 L48 70 L172 70 L192 86 L186 200 L14 200 Z" fill="', primary, '" stroke="', accent, '" stroke-width="3"/>',
        '<path d="M48 70 L48 200" stroke="', accent, '" stroke-width="2" opacity="0.5"/>',
        '<path d="M172 70 L172 200" stroke="', accent, '" stroke-width="2" opacity="0.5"/>',
        '<rect x="62" y="96" width="76" height="78" rx="6" fill="', accent, '" opacity="0.16"/>'
      ].join("");
    } else {
      body = [
        '<path d="M58 36 C58 22, 142 22, 142 36 L162 70 L168 210 Q100 248 32 210 L38 70 Z" fill="', primary, '" stroke="', accent, '" stroke-width="3"/>',
        '<ellipse cx="100" cy="34" rx="28" ry="10" fill="', accent, '"/>',
        compact ? "" : '<circle cx="148" cy="86" r="22" fill="' + accent + '"/>',
        compact ? "" : '<text x="148" y="90" text-anchor="middle" font-size="9" font-family="Outfit, sans-serif" font-weight="800" fill="' + text + '">NEW</text>'
      ].join("");
    }

    var claimTspans = claimLines.map(function (line, i) {
      return '<tspan x="100" dy="' + (i === 0 ? 0 : 13) + '">' + line + "</tspan>";
    }).join("");

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="', w, '" height="', h, '" role="img" aria-label="', name, ' pack">',
      '<rect width="200" height="260" fill="transparent"/>',
      body,
      '<text x="100" y="', compact ? 132 : 128, '" text-anchor="middle" font-family="Lilita One, Impact, sans-serif" font-size="', nameSize, '" fill="', text, '">', name, "</text>",
      '<text x="100" y="', compact ? 154 : 150, '" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="', compact ? 10 : 11, '" fill="', text, '">', flavour, "</text>",
      compact ? "" : '<text x="100" y="172" text-anchor="middle" font-family="Outfit, sans-serif" font-size="10" font-weight="700" fill="' + text + '">' + (claimTspans || "") + "</text>",
      compact ? "" : '<text x="100" y="228" text-anchor="middle" font-family="Outfit, sans-serif" font-size="11" font-weight="800" fill="' + text + '">' + price + "</text>",
      "</svg>"
    ].join("");
  }

  function readPack() {
    return S.normalizePack({
      name: $("f-name").value,
      flavour: $("f-flavour").value,
      claim: $("f-claim").value,
      category: $("f-category").value,
      shape: $("f-shape").value,
      primary: $("f-primary").value,
      accent: $("f-accent").value,
      text: $("f-text").value,
      price: $("f-price").value,
      bay: $("f-bay").value,
    });
  }

  function writePack(pack) {
    $("f-name").value = pack.name;
    $("f-flavour").value = pack.flavour;
    $("f-claim").value = pack.claim;
    $("f-category").value = pack.category;
    syncShapes(pack.category, pack.shape);
    $("f-primary").value = pack.primary;
    $("f-accent").value = pack.accent;
    $("f-text").value = pack.text;
    $("f-price").value = pack.price;
    $("f-bay").value = pack.bay;
    refreshPreview();
  }

  function syncShapes(category, preferred) {
    var cat = S.CATEGORIES[category] || S.CATEGORIES.crisps;
    var sel = $("f-shape");
    var current = preferred || sel.value;
    sel.innerHTML = S.SHAPES.map(function (sh) {
      var rec = cat.shapes.indexOf(sh) >= 0 ? " · fits" : "";
      return '<option value="' + sh + '">' + sh[0].toUpperCase() + sh.slice(1) + rec + "</option>";
    }).join("");
    sel.value = S.SHAPES.indexOf(current) >= 0 ? current : cat.shapes[0];
  }

  function refreshPreview() {
    var pack = readPack();
    preview.innerHTML = packSvg(pack);
    var bay = S.BAYS[pack.bay];
    bayBlurb.textContent = bay.blurb + " Habit price about ₹" + bay.price.habit + ".";
    shelfLabel.textContent = bay.name;
  }

  function fillSelects() {
    $("f-category").innerHTML = Object.keys(S.CATEGORIES).map(function (id) {
      return '<option value="' + id + '">' + S.CATEGORIES[id].label + "</option>";
    }).join("");
    $("f-bay").innerHTML = Object.keys(S.BAYS).map(function (id) {
      return '<option value="' + id + '">' + S.BAYS[id].name + "</option>";
    }).join("");
    syncShapes("crisps", "pouch");
  }

  function shelfOrder(run) {
    var items = run.rivals.slice();
    var slot = Math.max(0, Math.min(run.slot, items.length));
    items.splice(slot, 0, Object.assign({}, run.pack, { isYours: true }));
    return items;
  }

  function renderShelf(run) {
    var items = shelfOrder(run);
    shelfLabel.textContent = run.bay.name;
    shelfPacks.innerHTML = items.map(function (pack) {
      var yours = pack.isYours ? " is-yours" : "";
      var flag = pack.isYours ? '<div class="you-flag">Your pack</div>' : "";
      return (
        '<div class="shelf-slot' + yours + '" data-yours="' + (pack.isYours ? "1" : "0") + '">' +
        flag + packSvg(pack, { width: '100%', height: 190, compact: true }) +
        '<div class="price-dot">₹' + pack.price + "</div></div>"
      );
    }).join("");
  }

  function shopperEmoji(action) {
    if (action === "picked") return "🛒";
    if (action === "lingered") return "👀";
    if (action === "noticed") return "!";
    return "";
  }

  function colourForType(type) {
    return { rushed: "#f2c14e", hunter: "#c8f542", checker: "#7dd3fc", loyalist: "#f9a8d4", curious: "#fb7185" }[type] || "#f2c14e";
  }

  function clearWalkway() {
    walkway.classList.remove("is-done");
    walkway.innerHTML = "";
  }

  function playWalk(run) {
    clearWalkway();
    var duration = reduceMotion ? 0 : 3000;
    timer.classList.add("is-live");
    var started = Date.now();

    run.shoppers.forEach(function (shopper, i) {
      var el = document.createElement("div");
      el.className = "shopper";
      el.style.setProperty("--body", colourForType(shopper.type));
      var startDelay = reduceMotion ? 0 : 180 + i * 220;
      var travel = reduceMotion ? 0 : 2800;
      el.style.animationDelay = startDelay + "ms";
      el.style.animationDuration = travel + "ms";
      if (reduceMotion) {
        el.style.position = "relative";
        el.style.left = "auto";
        el.style.display = "inline-block";
        el.style.margin = "8px";
      }
      el.innerHTML = '<div class="bubble"></div><div class="body"></div><div class="tag">' + shopper.label + "</div>";
      walkway.appendChild(el);

      window.setTimeout(function () {
        if (shopper.action !== "ignored") {
          el.classList.add("is-notice");
          el.querySelector(".bubble").textContent = shopperEmoji(shopper.action) || "!";
        }
        if (shopper.action === "lingered" || shopper.action === "picked") {
          el.classList.add("is-linger");
          window.setTimeout(function () {
            el.classList.remove("is-linger");
            if (shopper.action === "picked") {
              el.classList.add("is-picked");
              var yours = shelfPacks.querySelector('.shelf-slot[data-yours="1"]');
              if (yours) yours.classList.add("is-picked");
            }
          }, reduceMotion ? 0 : 320);
        }
      }, startDelay + (reduceMotion ? 0 : 900));
    });

    function park() {
      walkway.classList.add("is-done");
      Array.prototype.forEach.call(walkway.querySelectorAll(".shopper"), function (el, idx) {
        el.style.animation = "none";
        el.style.transform = "none";
        el.style.left = "auto";
        var shopper = run.shoppers[idx];
        if (shopper) {
          el.classList.add("is-" + (shopper.action === "ignored" ? "notice" : shopper.action === "picked" ? "picked" : shopper.action === "lingered" ? "linger" : "notice"));
          el.querySelector(".bubble").textContent = shopperEmoji(shopper.action) || "–";
          if (shopper.action !== "ignored") el.querySelector(".bubble").style.opacity = "1";
        }
      });
    }

    return new Promise(function (resolve) {
      if (reduceMotion) {
        timer.textContent = "Done";
        timer.classList.remove("is-live");
        park();
        resolve();
        return;
      }
      var tick = window.setInterval(function () {
        var left = Math.max(0, duration - (Date.now() - started));
        timer.textContent = (left / 1000).toFixed(1) + "s";
        if (left <= 0) {
          window.clearInterval(tick);
          timer.textContent = "Time";
          timer.classList.remove("is-live");
          park();
          resolve();
        }
      }, 80);
    });
  }

  function celebrate(run) {
    if (reduceMotion || run.grabRate < 40) return;
    var layer = document.createElement("div");
    layer.className = "confetti";
    var colors = ["#e23c2f", "#f2c14e", "#c8f542", "#fff8ee", "#db2777"];
    for (var i = 0; i < 28; i++) {
      var bit = document.createElement("i");
      bit.style.left = Math.random() * 100 + "%";
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = (Math.random() * 0.4) + "s";
      layer.appendChild(bit);
    }
    document.getElementById("shelf-stage").appendChild(layer);
    window.setTimeout(function () { layer.remove(); }, 2000);
  }

  function renderResults(run) {
    results.hidden = false;
    $("grade-label").textContent = run.readout.gradeLabel;
    $("grade-line").textContent = run.readout.headline;
    $("grab-line").textContent =
      run.totals.picked + " of " + run.shoppers.length + " stylised shoppers picked it up · grab " + run.grabRate + "%";
    $("disclaimer").textContent = run.disclaimer;

    var meters = [
      ["standout", "Standout", run.scores.standout],
      ["clarity", "Clarity", run.scores.clarity],
      ["appeal", "Appeal", run.scores.appeal],
      ["overall", "Grab score", run.scores.overall],
    ];
    $("meters").innerHTML = meters.map(function (m) {
      return '<li><span>' + m[1] + '<strong>' + m[2] + '</strong></span><div class="bar ' + m[0] + '"><b data-w="' + m[2] + '"></b></div></li>';
    }).join("");
    requestAnimationFrame(function () {
      Array.prototype.forEach.call($("meters").querySelectorAll("b"), function (bar) {
        bar.style.width = bar.getAttribute("data-w") + "%";
      });
    });

    $("shopper-list").innerHTML = run.shoppers.map(function (s) {
      return '<li><span><strong>' + s.label + '</strong> · ' + s.note + '</span><span class="action ' + s.action + '">' + s.action + "</span></li>";
    }).join("");

    $("readout-list").innerHTML = run.readout.bullets.map(function (b) {
      return "<li>" + escapeXml(b) + "</li>";
    }).join("");

    $("launch-kit").innerHTML = [
      ["Tagline", run.launchKit.tagline],
      ["Social caption", run.launchKit.caption],
      ["Sampling idea", run.launchKit.sampling],
    ].map(function (row) {
      return "<dt>" + row[0] + "</dt><dd>" + escapeXml(row[1]) + "</dd>";
    }).join("");

    results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }

  function runStandoff(opts) {
    var pack = readPack();
    var options = opts || {};
    if (options.seed != null) walkSeed = options.seed;
    else if (options.fresh) walkSeed = (walkSeed + 17) >>> 0;
    else walkSeed = S.packSeed(pack);
    var run = S.run(pack, { seed: walkSeed });
    lastRun = run;
    dropBtn.disabled = true;
    results.hidden = true;
    renderShelf(run);
    timer.textContent = reduceMotion ? "Go" : "3.0s";
    playWalk(run).then(function () {
      celebrate(run);
      renderResults(run);
      dropBtn.disabled = false;
    });
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCard(run) {
    var canvas = document.getElementById("share-card");
    var ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;
    ctx.fillStyle = "#0f2f2b";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#c8f542";
    ctx.beginPath();
    ctx.arc(120, 120, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1410";
    ctx.font = "700 52px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("3s", 120, 138);

    ctx.fillStyle = "#f2c14e";
    ctx.font = "700 28px Outfit, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SUNDAY SUPER  ·  FICTIONAL SHOP", 220, 100);
    ctx.fillStyle = "#fff8ee";
    ctx.font = "800 72px Outfit, sans-serif";
    ctx.fillText("Shelf Standoff", 220, 174);

    ctx.fillStyle = "#f6efd9";
    roundedRect(ctx, 80, 230, w - 160, 760, 40);
    ctx.fill();

    var svg = packSvg(run.pack, { width: 280, height: 360 });
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 120, 280, 280, 360);
        ctx.fillStyle = "#1a1410";
        ctx.textAlign = "left";
        ctx.font = "800 48px Outfit, sans-serif";
        ctx.fillText(run.pack.name, 430, 350);
        ctx.font = "italic 600 28px Fraunces, Georgia, serif";
        ctx.fillText(run.pack.flavour, 430, 400);
        ctx.font = "600 26px Outfit, sans-serif";
        wrapText(run.pack.claim, 28, 3).forEach(function (line, i) {
          ctx.fillText(line, 430, 450 + i * 36);
        });
        ctx.font = "800 32px Outfit, sans-serif";
        ctx.fillText("₹" + run.pack.price + "  ·  " + run.bay.name, 430, 580);

        ctx.font = "800 56px Outfit, sans-serif";
        ctx.fillText(run.readout.gradeLabel, 120, 700);
        ctx.font = "600 24px Outfit, sans-serif";
        var headline = wrapText(run.readout.headline, 48, 3);
        headline.forEach(function (line, i) {
          ctx.fillText(line, 120, 746 + i * 34);
        });

        var meters = [
          ["Standout", run.scores.standout, "#db2777"],
          ["Clarity", run.scores.clarity, "#1d4ed8"],
          ["Appeal", run.scores.appeal, "#c2410c"],
          ["Grab score", run.scores.overall, "#e23c2f"],
        ];
        meters.forEach(function (m, i) {
          var x = 120 + (i % 2) * 440;
          var y = 880 + Math.floor(i / 2) * 70;
          ctx.font = "700 22px Outfit, sans-serif";
          ctx.fillStyle = "#1a1410";
          ctx.fillText(m[0] + "  " + m[1], x, y);
          ctx.fillStyle = "rgba(26,20,16,0.12)";
          roundedRect(ctx, x, y + 10, 400, 16, 8);
          ctx.fill();
          ctx.fillStyle = m[2];
          roundedRect(ctx, x, y + 10, 400 * (m[1] / 100), 16, 8);
          ctx.fill();
        });

        ctx.fillStyle = "#fff8ee";
        ctx.font = "600 24px Outfit, sans-serif";
        ctx.fillText(run.totals.picked + " of " + run.shoppers.length + " stylised shoppers picked it up.", 80, 1180);
        ctx.font = "500 20px Outfit, sans-serif";
        ctx.fillStyle = "rgba(255,248,238,0.75)";
        ctx.fillText("Illustrative scores. Fictional packs. yashsarkar1806-creator.github.io/shelf-standoff", 80, 1224);
        resolve(canvas);
      };
      img.onerror = function () { resolve(canvas); };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
  }

  function downloadCard() {
    if (!lastRun) return;
    drawCard(lastRun).then(function (canvas) {
      var link = document.createElement("a");
      var slug = lastRun.pack.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pack";
      link.download = "shelf-standoff-" + slug + ".png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }

  function loadDemo(id) {
    var demo = S.DEMOS.filter(function (d) { return d.id === id; })[0];
    if (!demo) return;
    writePack(demo);
    Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (chip) {
      chip.classList.toggle("is-on", chip.getAttribute("data-demo") === id);
    });
  }

  fillSelects();
  loadDemo("bolt-bite");

  form.addEventListener("input", function () {
    if (event && event.target && event.target.id === "f-category") syncShapes($("f-category").value);
    refreshPreview();
  });
  $("f-category").addEventListener("change", function () {
    syncShapes($("f-category").value);
    refreshPreview();
  });

  document.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      loadDemo(chip.getAttribute("data-demo"));
    });
  });

  dropBtn.addEventListener("click", function () { runStandoff(); });
  remixBtn.addEventListener("click", function () { runStandoff({ fresh: true }); });
  cardBtn.addEventListener("click", downloadCard);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    runStandoff();
  });

  var params = new URLSearchParams(window.location.search);
  if (params.get("demo") === "1") {
    loadDemo("bolt-bite");
    window.setTimeout(function () { runStandoff({ seed: 7 }); }, reduceMotion ? 0 : 400);
  }
})();
