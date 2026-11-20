package com.jobsquad.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Dialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private static final String APP_HOST =
            "ais-pre-azkh2mfnufrlj2cmihgtle-1013138806688.europe-west2.run.app";
    private static final String APP_URL = "https://" + APP_HOST + "/";
    private static final String ALLOWED_HOST_SUFFIX = "europe-west2.run.app";
    private static final String WWW_ROOT = "www";
    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1002;

    private WebView webView;
    private Dialog popupDialog;
    private ValueCallback<Uri[]> filePathCallback;
    private String pendingGeoOrigin;
    private GeolocationPermissions.Callback pendingGeoCallback;
    private volatile boolean preferLiveRemoteServer = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#071121"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#071121"));
        root.addView(
                webView,
                new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                )
        );
        setContentView(root);

        configureWebSettings(webView.getSettings());

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view,
                    WebResourceRequest request
            ) {
                WebResourceResponse local = tryServeBundledAsset(request);
                if (local != null) {
                    return local;
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return handleExternalOrSchemeUri(uri);
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error
            ) {
                if (request != null && request.isForMainFrame()) {
                    Uri u = request.getUrl();
                    if (u != null && APP_HOST.equalsIgnoreCase(u.getHost())) {
                        return;
                    }
                    view.loadUrl("file:///android_asset/offline.html");
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams fileChooserParams
            ) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                try {
                    Intent intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    Intent fallback = new Intent(Intent.ACTION_GET_CONTENT);
                    fallback.addCategory(Intent.CATEGORY_OPENABLE);
                    fallback.setType("image/*");
                    startActivityForResult(
                            Intent.createChooser(fallback, "Select Image"),
                            FILE_CHOOSER_REQUEST_CODE
                    );
                }
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(
                    String origin,
                    GeolocationPermissions.Callback callback
            ) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                        checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                                != PackageManager.PERMISSION_GRANTED) {
                    pendingGeoOrigin = origin;
                    pendingGeoCallback = callback;
                    requestPermissions(
                            new String[]{
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION
                            },
                            LOCATION_PERMISSION_REQUEST_CODE
                    );
                } else {
                    callback.invoke(origin, true, false);
                }
            }

            @SuppressLint("SetJavaScriptEnabled")
            @Override
            public boolean onCreateWindow(
                    WebView view,
                    boolean isDialog,
                    boolean isUserGesture,
                    Message resultMsg
            ) {
                WebView popupWebView = new WebView(MainActivity.this);
                configureWebSettings(popupWebView.getSettings());
                CookieManager.getInstance().setAcceptThirdPartyCookies(popupWebView, true);

                popupDialog = new Dialog(MainActivity.this, android.R.style.Theme_DeviceDefault_NoActionBar);
                popupDialog.setContentView(popupWebView);
                Window win = popupDialog.getWindow();
                if (win != null) {
                    win.setLayout(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                    );
                }
                popupDialog.setOnDismissListener(d -> {
                    try {
                        popupWebView.destroy();
                    } catch (Exception ignored) {
                    }
                    popupDialog = null;
                });

                popupWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(
                            WebView v,
                            WebResourceRequest req
                    ) {
                        WebResourceResponse local = tryServeBundledAsset(req);
                        if (local != null) {
                            return local;
                        }
                        return super.shouldInterceptRequest(v, req);
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                        Uri u = req.getUrl();
                        String host = u.getHost() != null ? u.getHost().toLowerCase(Locale.ROOT) : "";
                        if (!"http".equalsIgnoreCase(u.getScheme()) &&
                                !"https".equalsIgnoreCase(u.getScheme())) {
                            return handleExternalOrSchemeUri(u);
                        }
                        if (!host.endsWith(ALLOWED_HOST_SUFFIX) &&
                                !host.contains("google.") &&
                                !host.contains("gstatic.com") &&
                                !host.contains("googleapis.com") &&
                                !host.contains("googleusercontent.com") &&
                                !host.contains("firebaseapp.com")) {
                            openInExternalBrowser(u);
                            if (popupDialog != null && popupDialog.isShowing()) {
                                popupDialog.dismiss();
                            }
                            return true;
                        }
                        return false;
                    }
                });

                popupWebView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onCloseWindow(WebView window) {
                        if (popupDialog != null && popupDialog.isShowing()) {
                            popupDialog.dismiss();
                        }
                    }
                });

                popupDialog.show();
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(popupWebView);
                resultMsg.sendToTarget();
                return true;
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
                openInExternalBrowser(Uri.parse(url))
        );

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            loadInitialWithLiveServerProbe();
        }
    }

    private void loadInitialWithLiveServerProbe() {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            boolean remoteHealthy = false;
            HttpURLConnection conn = null;
            try {
                URL healthUrl = new URL(APP_URL + "api/health");
                conn = (HttpURLConnection) healthUrl.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(1500);
                conn.setReadTimeout(1500);
                conn.setInstanceFollowRedirects(false);
                if (conn.getResponseCode() == 200) {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                        StringBuilder body = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            body.append(line);
                        }
                        if (body.toString().contains("\"status\":\"ok\"")) {
                            remoteHealthy = true;
                        }
                    }
                }
            } catch (Exception ignored) {
                remoteHealthy = false;
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
                executor.shutdown();
            }
            preferLiveRemoteServer = remoteHealthy;
            runOnUiThread(() -> {
                if (webView != null) {
                    webView.loadUrl(APP_URL);
                }
            });
        });
    }

    private WebResourceResponse tryServeBundledAsset(WebResourceRequest request) {
        if (request == null || request.getUrl() == null) return null;
        if (!"GET".equalsIgnoreCase(request.getMethod())) return null;
        if (preferLiveRemoteServer) return null;

        Uri uri = request.getUrl();
        String host = uri.getHost();
        if (host == null || !host.equalsIgnoreCase(APP_HOST)) {
            return null;
        }

        String path = uri.getPath();
        if (path == null || path.isEmpty() || "/".equals(path)) {
            return openBundledAssetResponse("index.html", "text/html");
        }

        // Let backend API calls and APK downloads hit the real network
        if (path.startsWith("/api/") || path.startsWith("/downloads/")) {
            return null;
        }

        // Disable Service Worker inside native APK so bundled assets stay authoritative
        if ("/sw.js".equals(path) || path.startsWith("/workbox-")) {
            byte[] noopSw = (
                    "self.addEventListener('install',function(){self.skipWaiting();});" +
                    "self.addEventListener('activate',function(e){e.waitUntil(self.registration.unregister());});"
            ).getBytes(StandardCharsets.UTF_8);
            return buildResponse("application/javascript", "utf-8", new ByteArrayInputStream(noopSw));
        }

        String relPath = path.startsWith("/") ? path.substring(1) : path;
        if (relPath.contains("..")) {
            return null;
        }

        WebResourceResponse exact = openBundledAssetResponse(relPath, guessMimeType(relPath));
        if (exact != null) {
            return exact;
        }

        // SPA history fallback for routes without a file extension
        if (!relPath.contains(".")) {
            return openBundledAssetResponse("index.html", "text/html");
        }
        return null;
    }

    private WebResourceResponse openBundledAssetResponse(String relPath, String mimeType) {
        AssetManager assets = getAssets();
        try {
            InputStream stream = assets.open(WWW_ROOT + "/" + relPath);
            String encoding = mimeType.startsWith("text/")
                    || mimeType.contains("javascript")
                    || mimeType.contains("json")
                    || mimeType.contains("svg")
                    ? "utf-8"
                    : null;
            return buildResponse(mimeType, encoding, stream);
        } catch (IOException e) {
            return null;
        }
    }

    private WebResourceResponse buildResponse(String mimeType, String encoding, InputStream data) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        headers.put("Access-Control-Allow-Origin", "*");
        return new WebResourceResponse(mimeType, encoding, 200, "OK", headers, data);
    }

    private String guessMimeType(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".webmanifest")) return "application/manifest+json";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebSettings(WebSettings settings) {
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(true);
        settings.setGeolocationEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        String defaultUa = settings.getUserAgentString();
        if (defaultUa != null) {
            String cleanUa = defaultUa
                    .replace("; wv", "")
                    .replace("Version/4.0 ", "");
            settings.setUserAgentString(cleanUa);
        }
    }

    private boolean handleExternalOrSchemeUri(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase(Locale.ROOT) : "";
        String host = uri.getHost() != null ? uri.getHost().toLowerCase(Locale.ROOT) : "";

        if ("tel".equals(scheme) || "mailto".equals(scheme) || "sms".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (Exception ignored) {
            }
            return true;
        }

        if (!"http".equals(scheme) && !"https".equals(scheme) && !"file".equals(scheme)) {
            openInExternalBrowser(uri);
            return true;
        }

        if ("file".equals(scheme)) {
            return false;
        }

        boolean isInternal = host.endsWith(ALLOWED_HOST_SUFFIX)
                || host.contains("accounts.google.com")
                || host.contains("firebaseapp.com");

        if (!isInternal) {
            openInExternalBrowser(uri);
            return true;
        }
        return false;
    }

    private void openInExternalBrowser(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (Exception ignored) {
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback != null) {
                Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE && pendingGeoCallback != null) {
            boolean granted = grantResults.length > 0 &&
                    grantResults[0] == PackageManager.PERMISSION_GRANTED;
            pendingGeoCallback.invoke(pendingGeoOrigin, granted, false);
            pendingGeoCallback = null;
            pendingGeoOrigin = null;
            return;
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    protected void onPause() {
        try {
            CookieManager.getInstance().flush();
        } catch (Exception ignored) {
        }
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    public void onBackPressed() {
        if (popupDialog != null && popupDialog.isShowing()) {
            popupDialog.dismiss();
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }
}
