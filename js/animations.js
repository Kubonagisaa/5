/* ==========================================================================
   NEURAL CHAIN — Shared Animation & Interaction Layer
   Thư viện dùng qua CDN: GSAP 3.12.5 + ScrollTrigger
   Không phụ thuộc jQuery / framework nào khác — Vanilla JS thuần.
   ========================================================================== */

(function () {
    "use strict";

    var isDesktop = window.matchMedia("(min-width: 768px)").matches;

    /* ---------------------------------------------------------------------
     * NHIỆM VỤ 2 — SMOOTH PAGE TRANSITION (Fade-in / Fade-out chuyển trang)
     * ------------------------------------------------------------------- */
    function initPageTransition() {
        var body = document.body;

        // Đảm bảo body có transition mượt (song song với inline opacity ban đầu)
        body.style.transition = "opacity 0.5s ease";

        function fadeIn() {
            requestAnimationFrame(function () {
                body.style.opacity = "1";
            });
        }

        // Fade-in khi DOM sẵn sàng
        fadeIn();

        // Bắt sự kiện click mọi thẻ <a> nội bộ để fade-out trước khi chuyển trang
        document.addEventListener("click", function (e) {
            var link = e.target.closest("a");
            if (!link) return;

            var href = link.getAttribute("href");
            if (!href) return;

            // Bỏ qua: link ngoài (target=_blank), hash link (#...), mailto/tel, hoặc domain khác
            if (
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                link.target === "_blank" ||
                link.hasAttribute("download")
            ) {
                return;
            }

            var isExternal = /^https?:\/\//i.test(href) && link.hostname !== window.location.hostname;
            if (isExternal) return;

            e.preventDefault();
            body.style.opacity = "0";
            setTimeout(function () {
                window.location.href = href;
            }, 500);
        });

        // Khi quay lại trang bằng bfcache (nút back), đảm bảo hiện lại
        window.addEventListener("pageshow", function (event) {
            if (event.persisted) fadeIn();
        });
    }

    /* ---------------------------------------------------------------------
     * NHIỆM VỤ 1 — MOBILE MENU (fullscreen overlay, class "hidden" toggle)
     *   Toggle bằng classList (không dùng opacity/pointer-events riêng lẻ)
     *   để tránh trạng thái bị "đơ" khi bấm liên tục / tween chồng nhau.
     * ------------------------------------------------------------------- */
    function initMobileMenu() {
        var btn = document.getElementById("hamburger-btn");
        var menu = document.getElementById("mobile-menu");
        var icon = document.getElementById("hamburger-icon");
        if (!btn || !menu || !icon) return;

        var open = false;
        var links = menu.querySelectorAll("a");

        function openMenu() {
            if (open) return; // Guard: tránh gọi lặp khi đang mở
            open = true;

            menu.classList.remove("hidden");
            document.documentElement.style.overflow = "hidden";
            btn.setAttribute("aria-expanded", "true");
            icon.textContent = "close";

            if (typeof gsap !== "undefined") {
                gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out", overwrite: true });
                gsap.fromTo(
                    links,
                    { opacity: 0, y: 16 },
                    { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, delay: 0.05, ease: "power2.out", overwrite: true }
                );
            }
        }

        function closeMenu() {
            if (!open) return; // Guard: tránh gọi lặp khi đang đóng
            open = false;

            document.documentElement.style.overflow = "";
            btn.setAttribute("aria-expanded", "false");
            icon.textContent = "menu";
            menu.classList.add("hidden");
        }

        btn.addEventListener("click", function () {
            open ? closeMenu() : openMenu();
        });

        links.forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth >= 768 && open) closeMenu();
        });
    }

    /* ---------------------------------------------------------------------
     * NHIỆM VỤ 3 — WEB3 CUSTOM CURSOR (Desktop) / TOUCH RIPPLE (Mobile)
     * ------------------------------------------------------------------- */
    function initCustomCursor() {
        if (!isDesktop) return; // Desktop only

        var dot = document.getElementById("cursor-dot");
        var ring = document.getElementById("cursor-ring");
        if (!dot || !ring) return;

        var mouseX = window.innerWidth / 2;
        var mouseY = window.innerHeight / 2;
        var ringX = mouseX;
        var ringY = mouseY;

        window.addEventListener("mousemove", function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            // Chấm sáng đi theo chuột gần như tức thời
            dot.style.transform = "translate(" + mouseX + "px," + mouseY + "px) translate(-50%,-50%)";
        });

        // Vòng tròn viền đi theo với độ trễ nhẹ (lerp) qua requestAnimationFrame
        function lerp(a, b, n) {
            return (1 - n) * a + n * b;
        }

        function renderRing() {
            ringX = lerp(ringX, mouseX, 0.15);
            ringY = lerp(ringY, mouseY, 0.15);
            ring.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
            requestAnimationFrame(renderRing);
        }
        requestAnimationFrame(renderRing);

        // Hiệu ứng phóng to khi hover vào link/button
        var hoverTargets = document.querySelectorAll("a, button");
        hoverTargets.forEach(function (el) {
            el.addEventListener("mouseenter", function () {
                ring.classList.add("cursor-ring--active");
            });
            el.addEventListener("mouseleave", function () {
                ring.classList.remove("cursor-ring--active");
            });
        });

        // Ẩn cursor khi rời khỏi cửa sổ trình duyệt
        document.addEventListener("mouseleave", function () {
            dot.style.opacity = "0";
            ring.style.opacity = "0";
        });
        document.addEventListener("mouseenter", function () {
            dot.style.opacity = "1";
            ring.style.opacity = "1";
        });
    }

    function initTouchRipple() {
        if (isDesktop) return; // Mobile only

        document.addEventListener(
            "touchstart",
            function (e) {
                var touch = e.touches[0];
                if (!touch) return;

                var ripple = document.createElement("div");
                ripple.className = "touch-ripple";
                ripple.style.left = touch.clientX + "px";
                ripple.style.top = touch.clientY + "px";
                document.body.appendChild(ripple);

                setTimeout(function () {
                    ripple.remove();
                }, 500);
            },
            { passive: true }
        );
    }

    /* ---------------------------------------------------------------------
     * NHIỆM VỤ 4 — CARD/CONTAINER SCROLL REVEAL (GSAP + ScrollTrigger)
     *   .glass-panel / .glass-card: y:40, opacity:0 -> hiện dần khi cuộn tới.
     * ------------------------------------------------------------------- */
    function initCardReveal() {
        if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
        gsap.registerPlugin(ScrollTrigger);

        var targets = document.querySelectorAll(".glass-panel, .glass-card");
        if (!targets.length) return;

        gsap.set(targets, { y: 40, opacity: 0 });

        targets.forEach(function (el) {
            gsap.to(el, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            });
        });
    }

    /* ---------------------------------------------------------------------
     * NHIỆM VỤ MỚI — TYPEWRITER EFFECT cho H1 chính đầu mỗi trang
     *   - Gõ chữ bằng GSAP TextPlugin, song song với Fade-in trang.
     *   - Con trỏ neon cyan nhấp nháy theo sau, giữ nhấp nháy thêm 3s
     *     sau khi gõ xong rồi fade-out.
     *   - Khoá min-height của khối bọc để chống giật layout (CLS).
     * ------------------------------------------------------------------- */
    function initTypewriter() {
        var wrap = document.querySelector("[data-typewriter-wrap]");
        if (!wrap) return;

        var textEl = wrap.querySelector(".typewriter-text");
        var cursorEl = wrap.querySelector(".typewriter-cursor");
        if (!textEl || !cursorEl) return;

        var fullText = textEl.getAttribute("data-typewriter") || textEl.textContent.trim();

        // 1) Khoá chiều cao khối bọc TRƯỚC khi xoá chữ, để tránh giật layout
        //    (đo khi chữ đã có sẵn trong DOM lúc render ban đầu)
        textEl.textContent = fullText;
        var lockedHeight = wrap.getBoundingClientRect().height;
        wrap.style.minHeight = lockedHeight + "px";

        // 2) Reset về rỗng, sẵn sàng gõ
        textEl.textContent = "";
        cursorEl.style.opacity = "1";
        cursorEl.classList.add("typewriter-cursor--blink");

        if (typeof gsap === "undefined" || typeof TextPlugin === "undefined") {
            // Fallback: không có GSAP/TextPlugin thì hiện thẳng text
            textEl.textContent = fullText;
            return;
        }

        gsap.registerPlugin(TextPlugin);

        // Tốc độ gõ: 1.5s - 2s tuỳ độ dài tiêu đề
        var duration = Math.min(2, Math.max(1.5, fullText.length * 0.045));

        gsap.to(textEl, {
            duration: duration,
            text: { value: fullText, delimiter: "" },
            ease: "none",
            onComplete: function () {
                // Nhấp nháy thêm 3s rồi fade-out con trỏ
                setTimeout(function () {
                    cursorEl.classList.remove("typewriter-cursor--blink");
                    cursorEl.style.opacity = "1";
                    gsap.to(cursorEl, {
                        opacity: 0,
                        duration: 0.8,
                        ease: "power1.out"
                    });
                }, 3000);
            }
        });
    }

    /* ---------------------------------------------------------------------
     * NHIỆM VỤ MỚI — UNIVERSAL TEXT ANIMATION (Slide-up Fade-in)
     *   Áp dụng cho TẤT CẢ các thẻ văn bản trong <main>: h1, h2, h3, p,
     *   span (nhãn UI). Trạng thái đầu: opacity:0, y:20. Khi cuộn tới,
     *   dùng ScrollTrigger.batch để chạy theo từng đợt (làn sóng) với
     *   stagger, thay vì hiện cùng lúc.
     * ------------------------------------------------------------------- */
    function initUniversalTextReveal() {
        if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
        gsap.registerPlugin(ScrollTrigger);

        var main = document.querySelector("main");
        if (!main) return;

        var textEls = Array.prototype.slice
            .call(main.querySelectorAll("h1, h2, h3, p, span"))
            .filter(function (el, idx, arr) {
                // Khử trùng lặp
                if (arr.indexOf(el) !== idx) return false;
                // Bỏ qua span con của hiệu ứng Typewriter (đã có animation riêng)
                if (el.classList.contains("typewriter-text") || el.classList.contains("typewriter-cursor")) {
                    return false;
                }
                // Chỉ lấy phần tử có nội dung chữ thực sự
                return el.textContent.trim().length > 0;
            });

        if (!textEls.length) return;

        gsap.set(textEls, { opacity: 0, y: 20 });

        ScrollTrigger.batch(textEls, {
            start: "top 90%",
            once: false,
            onEnter: function (batch) {
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    stagger: 0.1,
                    overwrite: true
                });
            },
            onLeaveBack: function (batch) {
                gsap.to(batch, {
                    opacity: 0,
                    y: 20,
                    duration: 0.4,
                    ease: "power2.in",
                    stagger: 0.05,
                    overwrite: true
                });
            }
        });
    }

    /* ---------------------------------------------------------------------
     * NHIỆM VỤ MỚI — PROGRESS BAR FILL (GSAP + ScrollTrigger)
     *   Chạy width từ 0% -> % đích (data-width, vd data-width="92%")
     *   khi cuộn tới, duration: 1.5s, ease: power3.out.
     * ------------------------------------------------------------------- */
    function initProgressBars() {
        var bars = document.querySelectorAll(".js-progress-bar");
        if (!bars.length) return;

        if (typeof gsap === "undefined") {
            bars.forEach(function (bar) {
                var fallbackTarget = bar.getAttribute("data-width") || "0%";
                bar.style.width = fallbackTarget;
            });
            return;
        }

        var hasScrollTrigger = typeof ScrollTrigger !== "undefined";
        if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

        bars.forEach(function (bar) {
            var target = bar.getAttribute("data-width") || "0%";

            gsap.set(bar, { width: "0%" });

            var tweenVars = {
                width: target,
                duration: 1.5,
                ease: "power3.out"
            };

            if (hasScrollTrigger) {
                tweenVars.scrollTrigger = {
                    trigger: bar,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                };
            }

            gsap.to(bar, tweenVars);
        });
    }

    /* ---------------------------------------------------------------------
     * NHIỆM VỤ MỚI — GLOBAL NUMBER COUNTER (Auto-detect, Vanilla JS)
     *   Tự động quét TOÀN BỘ phần tử lá (leaf) trong <body> có nội dung
     *   khớp định dạng số liệu lớn: $4.28B, 100K+, 12.8%, 145.2M, 2,500.00...
     *   Tách prefix ($) / core (số) / suffix (%, K, M, B, +), đếm từ 0 lên
     *   giá trị thật trong 2s khi cuộn tới (IntersectionObserver), rồi
     *   ghép lại đúng định dạng ban đầu (dấu phẩy, %, K/M/B...).
     * ------------------------------------------------------------------- */
    function initGlobalNumberCounters() {
        // prefix: $ / € / £ (tuỳ chọn)
        // core: số nguyên có dấu phẩy ngăn cách hàng nghìn, hoặc số thường,
        //       kèm phần thập phân tuỳ chọn
        // suffix: %  |  K/M/B (+ dấu + tuỳ chọn)  |  dấu + đứng riêng
        var NUM_RE = /^([$€£]?)((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(%|[KMB]\+?|\+)?$/;

        function parseValue(text) {
            var m = NUM_RE.exec(text);
            if (!m) return null;
            var prefix = m[1] || "";
            var coreRaw = m[2];
            var suffix = m[3] || "";
            var useThousands = coreRaw.indexOf(",") > -1;
            var decimals = coreRaw.indexOf(".") > -1 ? coreRaw.split(".")[1].length : 0;
            var target = parseFloat(coreRaw.replace(/,/g, ""));
            if (isNaN(target)) return null;
            return { prefix: prefix, target: target, suffix: suffix, decimals: decimals, useThousands: useThousands };
        }

        function formatValue(value, cfg) {
            var fixed = value.toFixed(cfg.decimals);
            if (cfg.useThousands) {
                var parts = fixed.split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                fixed = parts.join(".");
            }
            return cfg.prefix + fixed + cfg.suffix;
        }

        function easeOutExpo(t) {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }

        function animate(el, cfg) {
            var duration = 2000; // 2 giây
            var startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / duration, 1);
                var current = cfg.target * easeOutExpo(progress);
                el.textContent = formatValue(current, cfg);
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = formatValue(cfg.target, cfg);
                }
            }
            requestAnimationFrame(step);
        }

        // Quét toàn bộ phần tử lá (không có element con) trong <body>
        var candidates = Array.prototype.slice
            .call(document.body.querySelectorAll("*"))
            .filter(function (el) {
                if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return false;
                if (el.children.length > 0) return false; // chỉ lấy leaf node
                var text = el.textContent.trim();
                if (!text) return false;
                return NUM_RE.test(text);
            });

        if (!candidates.length) return;

        // Lưu lại config gốc + đưa về "0" ngay để tránh hiện số thật rồi mới chạy lại
        candidates.forEach(function (el) {
            var cfg = parseValue(el.textContent.trim());
            if (!cfg) return;
            el.__counterCfg = cfg;
        });

        if (typeof IntersectionObserver === "undefined") {
            candidates.forEach(function (el) {
                if (el.__counterCfg) animate(el, el.__counterCfg);
            });
            return;
        }

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var el = entry.target;
                    if (el.__counterCfg) animate(el, el.__counterCfg);
                    observer.unobserve(el);
                });
            },
            { threshold: 0.4 }
        );

        candidates.forEach(function (el) {
            if (el.__counterCfg) observer.observe(el);
        });
    }

    /* ---------------------------------------------------------------------
     * INIT ALL
     * ------------------------------------------------------------------- */
    document.addEventListener("DOMContentLoaded", function () {
        initPageTransition();
        initMobileMenu();
        initCustomCursor();
        initTouchRipple();
        initCardReveal();
        initGlobalNumberCounters();
        initUniversalTextReveal();
        initTypewriter();
        initProgressBars();
    });
})();
