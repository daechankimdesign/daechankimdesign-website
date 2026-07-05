module.exports = [
"[externals]/crypto [external] (crypto, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[externals]/crypto [external] (crypto, cjs)");
    });
});
}),
"[project]/node_modules/https-proxy-agent/dist/index.js [app-rsc] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/[root-of-the-server]__11eu-68._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/https-proxy-agent/dist/index.js [app-rsc] (ecmascript)");
    });
});
}),
"[project]/node_modules/google-auth-library/node_modules/node-fetch/src/index.js [app-rsc] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/0oat_node-fetch_src_utils_multipart-parser_0qwa_8x.js",
  "server/chunks/ssr/node_modules_0xpbd3f._.js",
  "server/chunks/ssr/[externals]__0_f925b._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/google-auth-library/node_modules/node-fetch/src/index.js [app-rsc] (ecmascript)");
    });
});
}),
"[project]/node_modules/gcp-metadata/node_modules/node-fetch/src/index.js [app-rsc] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/02nj_node-fetch_src_utils_multipart-parser_0yg460b.js",
  "server/chunks/ssr/node_modules_1j0n_e2._.js",
  "server/chunks/ssr/[externals]__0_f925b._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/gcp-metadata/node_modules/node-fetch/src/index.js [app-rsc] (ecmascript)");
    });
});
}),
];