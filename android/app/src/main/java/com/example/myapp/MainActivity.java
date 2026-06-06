package com.example.myapp;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String START_URL = "file:///android_asset/www/index.html";
    private WebView webView;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new LocalAssetWebViewClient());
        setContentView(webView);
        webView.loadUrl(START_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    private class LocalAssetWebViewClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return resolveAsset(request.getUrl());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            return resolveAsset(Uri.parse(url));
        }

        private WebResourceResponse resolveAsset(Uri uri) {
            String path = uri.getPath();
            if (path == null || path.isEmpty()) {
                return null;
            }

            if (path.startsWith("/android_asset/www/")) {
                return null;
            }

            String assetPath = toAssetPath(path);
            if (assetPath == null) {
                return null;
            }

            try {
                InputStream stream = getAssets().open(assetPath);
                return new WebResourceResponse(mimeType(assetPath), "UTF-8", stream);
            } catch (IOException ignored) {
                if (!path.contains(".")) {
                    try {
                        InputStream stream = getAssets().open("www/index.html");
                        return new WebResourceResponse("text/html", "UTF-8", stream);
                    } catch (IOException ignoredFallback) {
                        return null;
                    }
                }
                return null;
            }
        }

        private String toAssetPath(String path) {
            if (path.equals("/") || path.equals("/index") || path.equals("/index.html")) {
                return "www/index.html";
            }
            if (path.startsWith("/_next/") || path.startsWith("/images/")) {
                return "www" + path;
            }
            if (path.endsWith(".html") || path.contains(".")) {
                return "www" + path;
            }

            String cleanPath = path.startsWith("/") ? path.substring(1) : path;
            return "www/" + cleanPath + ".html";
        }

        private String mimeType(String path) {
            String lower = path.toLowerCase(Locale.US);
            if (lower.endsWith(".html")) return "text/html";
            if (lower.endsWith(".js")) return "application/javascript";
            if (lower.endsWith(".css")) return "text/css";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".ico")) return "image/x-icon";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".json")) return "application/json";
            if (lower.endsWith(".txt")) return "text/plain";
            if (lower.endsWith(".woff2")) return "font/woff2";
            return "application/octet-stream";
        }
    }
}
