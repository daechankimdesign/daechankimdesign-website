module.exports = [
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs) <export default as minpath>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "minpath",
    ()=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
}),
"[externals]/node:process [external] (node:process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:process", () => require("node:process"));

module.exports = mod;
}),
"[externals]/node:process [external] (node:process, cjs) <export default as minproc>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "minproc",
    ()=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$process__$5b$external$5d$__$28$node$3a$process$2c$__cjs$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$process__$5b$external$5d$__$28$node$3a$process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:process [external] (node:process, cjs)");
}),
"[externals]/node:url [external] (node:url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:url", () => require("node:url"));

module.exports = mod;
}),
"[externals]/node:url [external] (node:url, cjs) <export fileURLToPath as urlToPath>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "urlToPath",
    ()=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__["fileURLToPath"]
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:url [external] (node:url, cjs)");
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[project]/src/lib/firebase/admin.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "adminAppCheck",
    ()=>adminAppCheck,
    "adminAuth",
    ()=>adminAuth,
    "adminDb",
    ()=>adminDb
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__ = __turbopack_context__.i("[externals]/firebase-admin/app [external] (firebase-admin/app, esm_import, [project]/node_modules/firebase-admin)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__ = __turbopack_context__.i("[externals]/firebase-admin/firestore [external] (firebase-admin/firestore, esm_import, [project]/node_modules/firebase-admin)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$auth__$5b$external$5d$__$28$firebase$2d$admin$2f$auth$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__ = __turbopack_context__.i("[externals]/firebase-admin/auth [external] (firebase-admin/auth, esm_import, [project]/node_modules/firebase-admin)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app$2d$check__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2d$check$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__ = __turbopack_context__.i("[externals]/firebase-admin/app-check [external] (firebase-admin/app-check, esm_import, [project]/node_modules/firebase-admin)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$auth__$5b$external$5d$__$28$firebase$2d$admin$2f$auth$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app$2d$check__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2d$check$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$auth__$5b$external$5d$__$28$firebase$2d$admin$2f$auth$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app$2d$check__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2d$check$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
/**
 * Server-only Firebase Admin singleton. On App Hosting / Cloud Run the runtime
 * provides Application Default Credentials automatically (no key file); for
 * local dev, GOOGLE_APPLICATION_CREDENTIALS points to a service-account JSON.
 * The app is initialized lazily on first use, so English (disk-only) pages
 * never touch Firebase.
 */ function adminApp() {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["getApps"])().length ? (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["getApp"])() : (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["initializeApp"])({
        credential: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["applicationDefault"])()
    });
}
const adminDb = ()=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["getFirestore"])(adminApp());
const adminAuth = ()=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$auth__$5b$external$5d$__$28$firebase$2d$admin$2f$auth$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["getAuth"])(adminApp());
const adminAppCheck = ()=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app$2d$check__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2d$check$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["getAppCheck"])(adminApp());
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/tty [external] (tty, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[project]/src/components/mdx/VideoPlayer.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VideoPlayer",
    ()=>VideoPlayer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function VideoPlayer({ type, src, poster, caption, width = 1600, height = 900 }) {
    let media;
    if (type === "gif") {
        media = // eslint-disable-next-line @next/next/no-img-element -- animated GIFs aren't optimized by next/image
        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
            src: src,
            alt: caption ?? "",
            loading: "lazy",
            className: "h-auto w-full"
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/VideoPlayer.tsx",
            lineNumber: 24,
            columnNumber: 7
        }, this);
    } else if (type === "video") {
        media = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
            src: src,
            poster: poster,
            autoPlay: true,
            loop: true,
            muted: true,
            playsInline: true,
            className: "h-auto w-full"
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/VideoPlayer.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this);
    } else {
        media = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative w-full",
            style: {
                aspectRatio: `${width} / ${height}`
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
                src: src,
                title: caption ?? "Embedded video",
                allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                allowFullScreen: true,
                loading: "lazy",
                className: "absolute inset-0 h-full w-full"
            }, void 0, false, {
                fileName: "[project]/src/components/mdx/VideoPlayer.tsx",
                lineNumber: 44,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/VideoPlayer.tsx",
            lineNumber: 40,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("figure", {
        className: "my-8",
        children: [
            media,
            caption ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("figcaption", {
                className: "text-caption mt-2 text-fg-muted",
                children: caption
            }, void 0, false, {
                fileName: "[project]/src/components/mdx/VideoPlayer.tsx",
                lineNumber: 60,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/mdx/VideoPlayer.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/ProgressiveImage.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProgressiveImage",
    ()=>ProgressiveImage
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ProgressiveImage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ProgressiveImage() from the server but ProgressiveImage is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/ProgressiveImage.tsx <module evaluation>", "ProgressiveImage");
}),
"[project]/src/components/ProgressiveImage.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProgressiveImage",
    ()=>ProgressiveImage
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ProgressiveImage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ProgressiveImage() from the server but ProgressiveImage is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/ProgressiveImage.tsx", "ProgressiveImage");
}),
"[project]/src/components/ProgressiveImage.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/ProgressiveImage.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/components/ProgressiveImage.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/components/mdx/MDXImage.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MDXImage",
    ()=>MDXImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProgressiveImage.tsx [app-rsc] (ecmascript)");
;
;
function MDXImage({ src, alt = "", width = 1600, height = 900, caption }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("figure", {
        className: "my-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ProgressiveImage"], {
                src: src,
                alt: alt,
                width: Number(width),
                height: Number(height),
                sizes: "(max-width: 768px) 100vw, 800px",
                className: "rounded-md"
            }, void 0, false, {
                fileName: "[project]/src/components/mdx/MDXImage.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            caption ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("figcaption", {
                className: "text-caption mt-2 text-fg-muted",
                children: caption
            }, void 0, false, {
                fileName: "[project]/src/components/mdx/MDXImage.tsx",
                lineNumber: 29,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/mdx/MDXImage.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/mdx/ProjectMeta.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProjectMeta",
    ()=>ProjectMeta
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function ProjectMeta({ items }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
        className: "my-8 flex flex-wrap gap-x-12 gap-y-6",
        children: items.map((it)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        className: "text-caption text-fg-muted",
                        children: it.label
                    }, void 0, false, {
                        fileName: "[project]/src/components/mdx/ProjectMeta.tsx",
                        lineNumber: 12,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        className: "text-body text-fg",
                        children: it.value
                    }, void 0, false, {
                        fileName: "[project]/src/components/mdx/ProjectMeta.tsx",
                        lineNumber: 13,
                        columnNumber: 11
                    }, this)
                ]
            }, it.label, true, {
                fileName: "[project]/src/components/mdx/ProjectMeta.tsx",
                lineNumber: 11,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/mdx/ProjectMeta.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/mdx/Gallery.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Gallery",
    ()=>Gallery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProgressiveImage.tsx [app-rsc] (ecmascript)");
;
;
function Gallery({ images = [] }) {
    if (!images.length) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "my-8 grid grid-cols-2 gap-3 sm:grid-cols-3",
        children: images.map((img, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ProgressiveImage"], {
                src: img.src,
                alt: img.alt ?? "",
                width: 800,
                height: 800,
                sizes: "(max-width: 640px) 50vw, 33vw",
                className: "rounded-md"
            }, `${img.src}-${i}`, false, {
                fileName: "[project]/src/components/mdx/Gallery.tsx",
                lineNumber: 14,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/mdx/Gallery.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/mdx/RevealBlock.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RevealBlock",
    ()=>RevealBlock
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const RevealBlock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call RevealBlock() from the server but RevealBlock is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/mdx/RevealBlock.tsx <module evaluation>", "RevealBlock");
}),
"[project]/src/components/mdx/RevealBlock.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RevealBlock",
    ()=>RevealBlock
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const RevealBlock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call RevealBlock() from the server but RevealBlock is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/mdx/RevealBlock.tsx", "RevealBlock");
}),
"[project]/src/components/mdx/RevealBlock.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/mdx/RevealBlock.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/components/mdx/RevealBlock.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/components/mdx/index.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mdxComponents",
    ()=>mdxComponents
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$VideoPlayer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/mdx/VideoPlayer.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$MDXImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/mdx/MDXImage.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$ProjectMeta$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/mdx/ProjectMeta.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$Gallery$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/mdx/Gallery.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/mdx/RevealBlock.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
const mdxComponents = {
    VideoPlayer: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "div",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$VideoPlayer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["VideoPlayer"], {
                ...props
            }, void 0, false, {
                fileName: "[project]/src/components/mdx/index.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 16,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0)),
    MDXImage: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "div",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$MDXImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MDXImage"], {
                ...props
            }, void 0, false, {
                fileName: "[project]/src/components/mdx/index.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 21,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0)),
    ProjectMeta: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "div",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$ProjectMeta$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ProjectMeta"], {
                ...props
            }, void 0, false, {
                fileName: "[project]/src/components/mdx/index.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 26,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0)),
    Gallery: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "div",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$Gallery$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Gallery"], {
                ...props
            }, void 0, false, {
                fileName: "[project]/src/components/mdx/index.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 31,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0)),
    img: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "div",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$MDXImage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MDXImage"], {
                src: String(props.src ?? ""),
                alt: props.alt ?? ""
            }, void 0, false, {
                fileName: "[project]/src/components/mdx/index.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 36,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0)),
    h1: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "h1",
            className: "text-h1 mt-12 mb-4",
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 40,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)),
    h2: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "h2",
            className: "text-h2 mt-10 mb-3",
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 41,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)),
    h3: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "h3",
            className: "text-h3 mt-8 mb-2",
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 42,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)),
    p: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "p",
            className: "text-body my-4 measure",
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 43,
            columnNumber: 17
        }, ("TURBOPACK compile-time value", void 0)),
    ul: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "ul",
            className: "text-body my-4 list-disc pl-6",
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 45,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0)),
    ol: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "ol",
            className: "text-body my-4 list-decimal pl-6",
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 48,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0)),
    li: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
            className: "my-1",
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 50,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)),
    blockquote: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "blockquote",
            className: "hairline-l text-body my-6 pl-6 text-fg-muted",
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 52,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0)),
    a: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
            className: "link",
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 58,
            columnNumber: 17
        }, ("TURBOPACK compile-time value", void 0)),
    hr: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$RevealBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RevealBlock"], {
            as: "hr",
            className: "hairline-b my-12 border-0"
        }, void 0, false, {
            fileName: "[project]/src/components/mdx/index.tsx",
            lineNumber: 59,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
};
}),
"[project]/src/lib/mdx-validate.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PRESERVED_KEYS",
    ()=>PRESERVED_KEYS,
    "TRANSLATED_KEYS",
    ()=>TRANSLATED_KEYS,
    "checkComponentTags",
    ()=>checkComponentTags,
    "checkPreservedFrontmatter",
    ()=>checkPreservedFrontmatter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/utils/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$getFrontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/utils/getFrontmatter.js [app-rsc] (ecmascript)");
;
const PRESERVED_KEYS = [
    "slug",
    "thumbnail",
    "date",
    "tags"
];
const TRANSLATED_KEYS = [
    "title",
    "summary"
];
const normalize = (v)=>JSON.stringify(v ?? null);
function checkPreservedFrontmatter(sourceMdx, translatedMdx) {
    const src = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$getFrontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFrontmatter"])(sourceMdx).frontmatter;
    const out = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$getFrontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFrontmatter"])(translatedMdx).frontmatter;
    for (const key of PRESERVED_KEYS){
        if (normalize(src[key]) !== normalize(out[key])) {
            return {
                ok: false,
                reason: `frontmatter "${key}" was altered (expected ${normalize(src[key])}, got ${normalize(out[key])})`
            };
        }
    }
    for (const key of TRANSLATED_KEYS){
        if (key in src) {
            const val = out[key];
            if (typeof val !== "string" || val.trim() === "") {
                return {
                    ok: false,
                    reason: `translated "${key}" is missing or empty`
                };
            }
        }
    }
    return {
        ok: true,
        frontmatter: out
    };
}
/** Capitalized JSX tag names (components), as a sorted multiset. */ function componentTags(mdx) {
    const tags = [];
    const re = /<\/?([A-Z][A-Za-z0-9.]*)/g;
    let m;
    while((m = re.exec(mdx)) !== null)tags.push(m[1]);
    return tags.sort();
}
function checkComponentTags(sourceMdx, translatedMdx) {
    const src = componentTags(sourceMdx);
    const out = componentTags(translatedMdx);
    if (src.length !== out.length || src.some((t, i)=>t !== out[i])) {
        return {
            ok: false,
            reason: `component tags changed (expected [${src.join(", ")}], got [${out.join(", ")}])`
        };
    }
    return {
        ok: true
    };
}
}),
"[project]/src/lib/translations.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "RATE_LIMITS",
    ()=>RATE_LIMITS,
    "RATE_LIMIT_TTL_MS",
    ()=>RATE_LIMIT_TTL_MS,
    "TRANSLATIONS",
    ()=>TRANSLATIONS,
    "getCachedTranslation",
    ()=>getCachedTranslation,
    "rateLimitDocId",
    ()=>rateLimitDocId,
    "sourceHash",
    ()=>sourceHash,
    "translationDocId",
    ()=>translationDocId,
    "translationTag",
    ()=>translationTag,
    "validateTranslatedMdx",
    ()=>validateTranslatedMdx
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$rsc$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/rsc/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$rsc$2f$evaluate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/rsc/evaluate.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$slug$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/rehype-slug/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$unwrap$2d$images$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/rehype-unwrap-images/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$index$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/mdx/index.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mdx$2d$validate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mdx-validate.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
const RATE_LIMIT_TTL_MS = 24 * 60 * 60 * 1000;
const TRANSLATIONS = "translations";
const RATE_LIMITS = "rateLimits";
const translationDocId = (slug, locale)=>`${slug}_${locale}`;
const rateLimitDocId = (uid, slug, locale)=>`${uid}_${slug}_${locale}`;
const translationTag = (slug, locale)=>`translations:${slug}:${locale}`;
const sourceHash = (source)=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHash"])("sha256").update(source).digest("hex");
function getCachedTranslation(slug, locale) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unstable_cache"])(async ()=>{
        try {
            const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"])().collection(TRANSLATIONS).doc(translationDocId(slug, locale)).get();
            if (!snap.exists) return null;
            const data = snap.data();
            return data.status === "complete" ? {
                mdx: data.mdx
            } : null;
        } catch (err) {
            // No credentials / Firestore unreachable: degrade to the English
            // fallback rather than 500 the page, but log so outages are visible.
            console.error(`getCachedTranslation(${slug}, ${locale}) failed:`, err);
            return null;
        }
    }, [
        "translation",
        slug,
        locale
    ], // `tags` gives same-instance read-your-own-writes via updateTag(); the
    // bounded `revalidate` is the cross-instance safety net (updateTag's manifest
    // is per-process and App Hosting runs up to maxInstances), so a `null` cached
    // before a sibling instance completed the translation self-heals within ~60s.
    {
        tags: [
            translationTag(slug, locale)
        ],
        revalidate: 60
    })();
}
async function validateTranslatedMdx(sourceMdx, translatedMdx) {
    const preserved = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mdx$2d$validate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["checkPreservedFrontmatter"])(sourceMdx, translatedMdx);
    if (!preserved.ok) return preserved;
    // Catches renamed/dropped/invented components, which compile but throw at
    // render (evaluate() only surfaces syntax errors).
    const tags = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mdx$2d$validate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["checkComponentTags"])(sourceMdx, translatedMdx);
    if (!tags.ok) return tags;
    const { error } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$rsc$2f$evaluate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["evaluate"])({
        source: translatedMdx,
        options: {
            parseFrontmatter: true,
            disableImports: true,
            disableExports: true,
            mdxOptions: {
                rehypePlugins: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$unwrap$2d$images$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$slug$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]
                ]
            }
        },
        components: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$index$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mdxComponents"]
    });
    if (error) return {
        ok: false,
        reason: `MDX failed to compile: ${error}`
    };
    return {
        ok: true
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/lib/mdx.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getAllFrontmatter",
    ()=>getAllFrontmatter,
    "getCompiled",
    ()=>getCompiled,
    "getCompiledPage",
    ()=>getCompiledPage,
    "getSlugs",
    ()=>getSlugs,
    "readDiskSource",
    ()=>readDiskSource,
    "readSource",
    ()=>readSource
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$rsc$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/rsc/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$rsc$2f$evaluate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/rsc/evaluate.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/utils/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$getFrontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/utils/getFrontmatter.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$slug$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/rehype-slug/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$unwrap$2d$images$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/rehype-unwrap-images/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$index$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/mdx/index.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/translations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/i18n/routing.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
;
// English source is canonical on disk; non-English locales come from Firestore.
const CONTENT_ROOT = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "src", "content", "en");
const dirFor = (type)=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(CONTENT_ROOT, type);
async function getSlugs(type) {
    try {
        const files = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readdir(dirFor(type));
        return files.filter((f)=>f.endsWith(".mdx")).map((f)=>f.replace(/\.mdx$/, ""));
    } catch  {
        return [];
    }
}
const readDiskSource = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cache"])(async (type, slug)=>{
    try {
        return await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readFile(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(dirFor(type), `${slug}.mdx`), "utf8");
    } catch  {
        return null;
    }
});
const readSource = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cache"])(async (type, slug, locale = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["routing"].defaultLocale)=>{
    if (locale === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["routing"].defaultLocale) {
        const mdx = await readDiskSource(type, slug);
        return mdx === null ? null : {
            mdx,
            translated: false
        };
    }
    const translation = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCachedTranslation"])(slug, locale);
    if (translation) return {
        mdx: translation.mdx,
        translated: true
    };
    const fallback = await readDiskSource(type, slug);
    return fallback === null ? null : {
        mdx: fallback,
        translated: false
    };
});
const getAllFrontmatter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cache"])(async (type, locale = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["routing"].defaultLocale)=>{
    const slugs = await getSlugs(type);
    const items = await Promise.all(slugs.map(async (slug)=>{
        const loaded = await readSource(type, slug, locale);
        if (!loaded) return null;
        const { frontmatter } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$getFrontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFrontmatter"])(loaded.mdx);
        // A curated `cover` (image + .mp4 loop URLs, in order) drives the home
        // preview verbatim; otherwise auto-extract images from the body below.
        const cover = Array.isArray(frontmatter.cover) ? frontmatter.cover.filter((s)=>typeof s === "string" && s.length > 0) : [];
        if (cover.length > 0) {
            return {
                slug,
                frontmatter,
                images: cover.slice(0, 6)
            };
        }
        // Extract images from the MDX source
        const images = [];
        if (frontmatter.thumbnail) {
            images.push(frontmatter.thumbnail);
        }
        const jsxRegex = /<MDXImage\s+[^>]*src=["']([^"']+)["']/g;
        let match;
        while((match = jsxRegex.exec(loaded.mdx)) !== null){
            images.push(match[1]);
        }
        const mdRegex = /!\[.*?\]\((.*?)\)/g;
        while((match = mdRegex.exec(loaded.mdx)) !== null){
            images.push(match[1]);
        }
        const uniqueImages = Array.from(new Set(images));
        // Hide items with no real media — drop them from every listing (home +
        // index). "Real" = a non-placeholder image or a <VideoPlayer>; a curated
        // `cover` (handled above) always counts. No placeholder padding: an item
        // either has its own images or it isn't shown.
        const realImages = uniqueImages.filter((u)=>!u.includes("placehold.co"));
        const hasVideo = /<VideoPlayer[\s/>]/.test(loaded.mdx);
        if (realImages.length === 0 && !hasVideo) return null;
        return {
            slug,
            frontmatter,
            images: realImages.slice(0, 5)
        };
    }));
    return items.filter((x)=>x !== null).sort((a, b)=>String(b.frontmatter.date ?? "").localeCompare(String(a.frontmatter.date ?? "")));
});
const getCompiled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cache"])(async (type, slug, locale = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["routing"].defaultLocale)=>{
    const loaded = await readSource(type, slug, locale);
    if (loaded === null) return null;
    const { content, frontmatter, error } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$rsc$2f$evaluate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["evaluate"])({
        source: loaded.mdx,
        options: {
            parseFrontmatter: true,
            // Untrusted-content hardening (Firestore MDX is untrusted at render time).
            disableImports: true,
            disableExports: true,
            // unwrap-images first: lift a lone markdown image out of its <p> so the
            // <figure> MDXImage renders isn't nested in a <p> (invalid HTML).
            mdxOptions: {
                rehypePlugins: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$unwrap$2d$images$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$slug$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]
                ]
            }
        },
        components: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$index$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mdxComponents"]
    });
    return {
        content,
        frontmatter,
        error,
        translated: loaded.translated
    };
});
const getCompiledPage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cache"])(async (name)=>{
    let source;
    try {
        source = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readFile(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(CONTENT_ROOT, `${name}.mdx`), "utf8");
    } catch  {
        return null;
    }
    const { content, frontmatter, error } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$rsc$2f$evaluate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["evaluate"])({
        source,
        options: {
            parseFrontmatter: true,
            disableImports: true,
            disableExports: true,
            mdxOptions: {
                rehypePlugins: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$unwrap$2d$images$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$slug$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]
                ]
            }
        },
        components: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$mdx$2f$index$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mdxComponents"]
    });
    return {
        content,
        frontmatter,
        error
    };
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/querystring [external] (querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}),
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/node:stream/promises [external] (node:stream/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:stream/promises", () => require("node:stream/promises"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/src/lib/gemini.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "translateMdx",
    ()=>translateMdx
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$genai$2f$dist$2f$node$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/genai/dist/node/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/i18n/routing.ts [app-rsc] (ecmascript)");
;
;
// Pinned (not a floating alias) for reproducible output. Flash gives near-Pro
// translation quality at a fraction of the cost — right for a low-traffic site
// that caches each page permanently after one translation.
const MODEL = "gemini-2.5-flash";
const SYSTEM_INSTRUCTION = `You are a professional localizer for a product designer's portfolio. You translate MDX documents (Markdown + JSX).

Translate ONLY:
- natural-language prose, and
- the VALUES of the frontmatter keys "title" and "summary".

NEVER translate or alter:
- frontmatter keys themselves, or the values of "slug", "thumbnail", "date", "tags";
- URLs, file paths, email addresses;
- code inside fenced code blocks or inline backticks;
- JSX/HTML tag names, attribute/prop names, attribute/prop values, and {expressions}.

Preserve the document structure exactly: the same --- frontmatter fence, the same headings, the same components with the same props, the same Markdown syntax. Keep proper nouns and brand names as-is unless a well-established localized form exists.

Output ONLY the raw translated MDX document — no explanations and no surrounding code fences.`;
async function translateMdx(source, locale) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    const ai = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$genai$2f$dist$2f$node$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["GoogleGenAI"]({
        apiKey
    });
    const target = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["localeNames"][locale];
    const res = await ai.models.generateContent({
        model: MODEL,
        contents: `Translate the following MDX document into ${target} (locale "${locale}").\n\n${source}`,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2
        }
    });
    const text = res.text;
    if (!text || !text.trim()) throw new Error("Gemini returned empty output");
    return stripCodeFences(text.trim());
}
/**
 * Models occasionally wrap output in a ```mdx fence despite instructions. Only
 * unwrap when the inner content is a real MDX document (starts with the `---`
 * frontmatter fence), so a document that legitimately opens with a code fence
 * isn't corrupted.
 */ function stripCodeFences(s) {
    const m = s.match(/^```(?:mdx|markdown|md)?\s*\n([\s\S]*?)\n```\s*$/);
    return m && m[1].trimStart().startsWith("---") ? m[1] : s;
}
}),
"[project]/src/app/actions/translate.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"409eafe19369f774c18a9100b06425b6f02dcd3291":{"name":"translatePage"}},"src/app/actions/translate.ts",""] */ __turbopack_context__.s([
    "translatePage",
    ()=>translatePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/utils/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$getFrontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-mdx-remote-client/dist/utils/getFrontmatter.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mdx$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mdx.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gemini$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/gemini.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/translations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/i18n/routing.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mdx$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mdx$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
// `blog` is intentionally out of Phase 5 scope (no real on-disk content yet).
const TRANSLATABLE_TYPES = [
    "projects",
    "sandbox"
];
// Defense-in-depth: slugs are filesystem/doc-id segments, never free text.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
async function translatePage(input) {
    const { type, slug, appCheckToken, idToken } = input;
    const locale = input.locale;
    // 1) Only controlled, non-default, translatable targets, and a real slug that
    //    maps to actual on-disk content (bounds billable Gemini calls to the
    //    finite content × locale set).
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["routing"].locales.includes(locale) || locale === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["routing"].defaultLocale) {
        return {
            status: "error",
            message: "Unsupported locale"
        };
    }
    if (!TRANSLATABLE_TYPES.includes(type) || !SLUG_RE.test(slug)) {
        return {
            status: "error",
            message: "Unsupported content"
        };
    }
    if (!(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mdx$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSlugs"])(type)).includes(slug)) {
        return {
            status: "error",
            message: "Unknown content"
        };
    }
    // 2) App Check is required even to PROBE the cache (no unauthenticated reads).
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminAppCheck"])().verifyToken(appCheckToken);
    } catch  {
        return {
            status: "error",
            message: "Verification failed"
        };
    }
    const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"])();
    const tRef = db.collection(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TRANSLATIONS"]).doc((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["translationDocId"])(slug, locale));
    // 3) Fast path: already complete / in progress — no user identity needed.
    const existing = await tRef.get();
    if (existing.exists) {
        const status = existing.data().status;
        if (status === "complete") return {
            status: "complete"
        };
        if (status === "pending") return {
            status: "pending"
        };
    }
    // 4) Creating a NEW translation also requires a verified anonymous identity.
    //    Never trust a client-supplied uid.
    let uid;
    try {
        uid = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminAuth"])().verifyIdToken(idToken)).uid;
    } catch  {
        return {
            status: "error",
            message: "Verification failed"
        };
    }
    // 5) Acquire the pending-lock AND the rate-limit window in ONE atomic
    //    transaction, so concurrent triggers can neither double-spend the Gemini
    //    call nor bypass "one request per user per page per locale".
    const rRef = db.collection(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RATE_LIMITS"]).doc((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["rateLimitDocId"])(uid, slug, locale));
    const now = Date.now();
    const lockId = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])();
    let outcome;
    try {
        outcome = await db.runTransaction(async (tx)=>{
            const tSnap = await tx.get(tRef);
            if (tSnap.exists) {
                return tSnap.data().status === "complete" ? "complete" : "pending";
            }
            const rSnap = await tx.get(rRef);
            // A still-valid record blocks; an expired one is treated as absent.
            if (rSnap.exists && rSnap.data().expiresAt > now) {
                return "rate_limited";
            }
            tx.set(tRef, {
                slug,
                locale,
                type,
                status: "pending",
                mdx: "",
                frontmatter: {},
                sourceHash: "",
                lockId,
                createdAt: now,
                updatedAt: now
            });
            tx.set(rRef, {
                uid,
                slug,
                locale,
                status: "pending",
                createdAt: now,
                expiresAt: now + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RATE_LIMIT_TTL_MS"]
            });
            return "acquired";
        });
    } catch  {
        // Transaction aborted (likely contention). Re-read once: if the winner
        // already created the doc, follow it instead of surfacing a hard error.
        const snap = await tRef.get();
        if (snap.exists) {
            return snap.data().status === "complete" ? {
                status: "complete"
            } : {
                status: "pending"
            };
        }
        return {
            status: "error",
            message: "Could not start translation"
        };
    }
    if (outcome !== "acquired") {
        return outcome === "complete" ? {
            status: "complete"
        } : outcome === "pending" ? {
            status: "pending"
        } : {
            status: "rate_limited"
        };
    }
    // 6) Lock held: translate → validate → store `complete` → bust the cache.
    try {
        const source = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mdx$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readDiskSource"])(type, slug);
        if (source === null) throw new Error("Source content not found");
        const translated = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gemini$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["translateMdx"])(source, locale);
        const valid = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateTranslatedMdx"])(source, translated);
        if (!valid.ok) throw new Error(valid.reason);
        const { frontmatter } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$mdx$2d$remote$2d$client$2f$dist$2f$utils$2f$getFrontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFrontmatter"])(translated);
        await tRef.set({
            slug,
            locale,
            type,
            status: "complete",
            mdx: translated,
            frontmatter,
            sourceHash: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sourceHash"])(source),
            createdAt: now,
            updatedAt: Date.now()
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateTag"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["translationTag"])(slug, locale));
        return {
            status: "complete"
        };
    } catch (err) {
        // Release the lock so the page falls back to English and a retry is
        // possible — but only OUR lock (ownership-checked, transactional), and KEEP
        // the rate-limit record (marked failed) so a failed paid attempt still
        // counts against the user's window. The TTL eventually clears it.
        try {
            await db.runTransaction(async (tx)=>{
                const snap = await tx.get(tRef);
                const data = snap.data();
                if (snap.exists && data?.status === "pending" && data.lockId === lockId) {
                    tx.delete(tRef);
                }
                tx.set(rRef, {
                    status: "failed"
                }, {
                    merge: true
                });
            });
        } catch  {
        // Best-effort cleanup; the TTL is the backstop.
        }
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Translation failed"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    translatePage
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(translatePage, "409eafe19369f774c18a9100b06425b6f02dcd3291", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/[locale]/project/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions/translate.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/translate.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/[locale]/project/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions/translate.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "409eafe19369f774c18a9100b06425b6f02dcd3291",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["translatePage"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f5b$locale$5d2f$project$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/[locale]/project/page/actions.js { ACTIONS_MODULE0 => "[project]/src/app/actions/translate.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions/translate.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f5b$locale$5d2f$project$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f5b$locale$5d2f$project$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2f$translate$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1_lu6mh._.js.map