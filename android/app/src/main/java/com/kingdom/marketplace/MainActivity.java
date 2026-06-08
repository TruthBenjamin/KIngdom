package com.kingdom.marketplace;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient.FileChooserParams;
import android.webkit.ValueCallback;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST_CODE = 7210;
    private static final String LOCAL_HOST = "kingdom.local";
    private static final String LOCAL_ORIGIN = "https://" + LOCAL_HOST;
    private static final String START_URL = LOCAL_ORIGIN + "/";
    private static final Set<String> LOCAL_ROUTES = new HashSet<>(Arrays.asList(
            "/",
            "/about",
            "/admin-login",
            "/auth/callback",
            "/auth/update-password",
            "/contact",
            "/dashboard/admin",
            "/dashboard/buyer",
            "/dashboard/buyer/saved",
            "/dashboard/buyer/settings",
            "/dashboard/messages",
            "/dashboard/payments",
            "/dashboard/profile",
            "/dashboard/seller",
            "/how-it-works",
            "/privacy",
            "/terms"
    ));
    private static final Set<String> LIVE_ROUTES = new HashSet<>(Arrays.asList(
            "/admin-login",
            "/auth/callback",
            "/auth/update-password",
            "/dashboard/admin",
            "/dashboard/buyer",
            "/dashboard/buyer/saved",
            "/dashboard/buyer/settings",
            "/dashboard/messages",
            "/dashboard/payments",
            "/dashboard/profile",
            "/dashboard/seller",
            "/login",
            "/marketplace",
            "/onboarding/role",
            "/signup"
    ));
    private static final Set<String> LIVE_ROUTE_PREFIXES = new HashSet<>(Arrays.asList(
            "/auth/",
            "/checkout/",
            "/dashboard/",
            "/listing/",
            "/marketplace/",
            "/profile/",
            "/u/"
    ));

    private FrameLayout root;
    private WebView webView;
    private ProgressBar progressBar;
    private View errorView;
    private String lastRequestedUrl = START_URL;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureWindow();

        root = new FrameLayout(this);
        webView = new WebView(this);
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);

        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                dp(3),
                Gravity.TOP
        );
        root.addView(progressBar, progressParams);
        setContentView(root);

        configureWebView();
        webView.clearCache(false);
        loadUrl(START_URL);
    }

    private void configureWindow() {
        Window window = getWindow();
        window.setStatusBarColor(0xffffffff);
        window.setNavigationBarColor(0xffffffff);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }
        CookieManager.getInstance().setAcceptCookie(true);

        webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        webView.setWebChromeClient(new AppChromeClient());
        webView.setWebViewClient(new LocalAssetWebViewClient());
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> openExternal(Uri.parse(url)));
    }

    private void loadUrl(String url) {
        lastRequestedUrl = url;
        hideError();
        webView.loadUrl(url);
    }

    @Override
    public void onBackPressed() {
        if (errorView != null && errorView.getVisibility() == View.VISIBLE) {
            hideError();
            loadUrl(START_URL);
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    private class AppChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            progressBar.setProgress(newProgress);
            progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
        }

        @Override
        public boolean onShowFileChooser(
                WebView webView,
                ValueCallback<Uri[]> filePathCallback,
                FileChooserParams fileChooserParams
        ) {
            if (MainActivity.this.filePathCallback != null) {
                MainActivity.this.filePathCallback.onReceiveValue(null);
            }

            MainActivity.this.filePathCallback = filePathCallback;

            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            String[] acceptTypes = normalizeAcceptTypes(fileChooserParams.getAcceptTypes());
            intent.setType(acceptTypes.length == 1 ? acceptTypes[0] : "*/*");
            if (acceptTypes.length > 1) {
                intent.putExtra(Intent.EXTRA_MIME_TYPES, acceptTypes);
            }
            intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, fileChooserParams.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);

            try {
                startActivityForResult(Intent.createChooser(intent, "Select attachment"), FILE_CHOOSER_REQUEST_CODE);
            } catch (ActivityNotFoundException error) {
                MainActivity.this.filePathCallback = null;
                filePathCallback.onReceiveValue(null);
                Toast.makeText(MainActivity.this, "No file picker is available.", Toast.LENGTH_SHORT).show();
                return false;
            }

            return true;
        }
    }

    private String[] normalizeAcceptTypes(String[] acceptTypes) {
        if (acceptTypes == null || acceptTypes.length == 0) {
            return new String[]{"*/*"};
        }

        Set<String> cleanTypes = new HashSet<>();
        for (String type : acceptTypes) {
            if (type == null) continue;
            String cleanType = type.trim();
            if (!cleanType.isEmpty()) {
                cleanTypes.add(cleanType);
            }
        }

        return cleanTypes.isEmpty() ? new String[]{"*/*"} : cleanTypes.toArray(new String[0]);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            ValueCallback<Uri[]> callback = filePathCallback;
            filePathCallback = null;

            if (callback == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }

            if (resultCode != Activity.RESULT_OK || data == null) {
                callback.onReceiveValue(null);
                return;
            }

            callback.onReceiveValue(selectedUris(data));
            return;
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    private Uri[] selectedUris(Intent data) {
        ClipData clipData = data.getClipData();
        if (clipData != null && clipData.getItemCount() > 0) {
            Uri[] uris = new Uri[clipData.getItemCount()];
            for (int index = 0; index < clipData.getItemCount(); index++) {
                uris[index] = clipData.getItemAt(index).getUri();
            }
            return uris;
        }

        Uri uri = data.getData();
        return uri == null ? null : new Uri[]{uri};
    }

    @Override
    protected void onDestroy() {
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
            filePathCallback = null;
        }
        super.onDestroy();
    }

    private class LocalAssetWebViewClient extends WebViewClient {
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            lastRequestedUrl = url;
            hideError();
            super.onPageStarted(view, url, favicon);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return handleNavigation(request.getUrl(), request.isForMainFrame());
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleNavigation(Uri.parse(url), true);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return resolveAsset(request.getUrl());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            return resolveAsset(Uri.parse(url));
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && request.isForMainFrame()) {
                showError();
            }
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            showError();
        }

        private boolean handleNavigation(Uri uri, boolean mainFrame) {
            if (!mainFrame || uri == null) return false;

            String scheme = uri.getScheme();
            if (scheme == null) return false;

            if (scheme.equals("mailto") || scheme.equals("tel") || scheme.equals("sms")) {
                openExternal(uri);
                return true;
            }

            if ((scheme.equals("http") || scheme.equals("https")) && LOCAL_HOST.equalsIgnoreCase(uri.getHost())) {
                String route = routeFromLocalUri(uri);
                if (isMarketplaceCategoryRoute(route)) {
                    loadUrl(remoteMarketplaceUrlForCategory(route, uri));
                    return true;
                }
                if (isLiveRoute(route)) {
                    loadUrl(remoteUrlForRoute(route, uri));
                    return true;
                }
                if (LOCAL_ROUTES.contains(route)) {
                    String localUrl = localUrlForRoute(route, uri);
                    if (!localUrl.equals(uri.toString())) {
                        loadUrl(localUrl);
                        return true;
                    }
                    return false;
                }

                loadUrl(remoteUrlForRoute(route, uri));
                return true;
            }

            if (scheme.equals("http") || scheme.equals("https")) {
                String liveHost = Uri.parse(getString(R.string.web_origin)).getHost();
                if (liveHost != null && liveHost.equalsIgnoreCase(uri.getHost())) {
                    return false;
                }
                openExternal(uri);
                return true;
            }

            if (!scheme.equals("file")) return false;

            String route = routeFromLocalUri(uri);
            if (isMarketplaceCategoryRoute(route)) {
                loadUrl(remoteMarketplaceUrlForCategory(route, uri));
                return true;
            }
            if (isLiveRoute(route)) {
                loadUrl(remoteUrlForRoute(route, uri));
                return true;
            }
            if (LOCAL_ROUTES.contains(route)) {
                String localUrl = localUrlForRoute(route, uri);
                if (!localUrl.equals(uri.toString())) {
                    loadUrl(localUrl);
                    return true;
                }
                return false;
            }

            loadUrl(remoteUrlForRoute(route, uri));
            return true;
        }

        private WebResourceResponse resolveAsset(Uri uri) {
            if (uri == null) {
                return null;
            }

            String scheme = uri.getScheme();
            if (scheme == null) {
                return null;
            }

            if ((scheme.equals("http") || scheme.equals("https")) && !LOCAL_HOST.equalsIgnoreCase(uri.getHost())) {
                return null;
            }

            String path = uri.getPath();
            if (path == null || path.isEmpty()) {
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
            if (path.equals("/favicon.ico") || path.equals("/icon.png") || path.equals("/apple-icon.png")) {
                return "www" + path;
            }
            if (path.endsWith(".html") || path.contains(".")) {
                return "www" + path;
            }
            if (LOCAL_ROUTES.contains(path)) {
                return "www" + path + ".html";
            }
            if (isMarketplaceCategoryRoute(path)) {
                return "www/marketplace.html";
            }

            if (path.startsWith("/android_asset/www/")) {
                String cleanAssetPath = path.substring("/android_asset/".length());
                if (cleanAssetPath.equals("www/") || cleanAssetPath.equals("www/index") || cleanAssetPath.equals("www/index.html")) {
                    return "www/index.html";
                }
                if (cleanAssetPath.endsWith(".html") || cleanAssetPath.contains(".")) {
                    return cleanAssetPath;
                }
                String route = "/" + cleanAssetPath.substring("www/".length());
                if (isMarketplaceCategoryRoute(route)) {
                    return "www/marketplace.html";
                }
                return LOCAL_ROUTES.contains(route) ? cleanAssetPath + ".html" : null;
            }
            return null;
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

    private String routeFromLocalUri(Uri uri) {
        String path = uri.getPath();
        if (path == null || path.isEmpty() || path.equals("/android_asset/www/")) return "/";
        String prefix = "/android_asset/www";
        String route = path.startsWith(prefix) ? path.substring(prefix.length()) : path;
        if (route.endsWith(".html")) route = route.substring(0, route.length() - ".html".length());
        if (route.equals("/index")) return "/";
        return route.isEmpty() ? "/" : route;
    }

    private boolean isLiveRoute(String route) {
        if (LIVE_ROUTES.contains(route)) return true;
        for (String prefix : LIVE_ROUTE_PREFIXES) {
            if (route.startsWith(prefix)) return true;
        }
        return false;
    }

    private boolean isMarketplaceCategoryRoute(String route) {
        return route != null && route.startsWith("/marketplace/") && route.length() > "/marketplace/".length();
    }

    private String localUrlForRoute(String route, Uri source) {
        String path = route.equals("/") ? "/" : route;
        Uri.Builder builder = Uri.parse(LOCAL_ORIGIN + path).buildUpon();
        if (source.getQuery() != null) builder.encodedQuery(source.getEncodedQuery());
        if (source.getFragment() != null) builder.encodedFragment(source.getEncodedFragment());
        return builder.build().toString();
    }

    private String remoteMarketplaceUrlForCategory(String route, Uri source) {
        String category = route.substring("/marketplace/".length());
        Uri.Builder builder = Uri.parse(getString(R.string.web_origin)).buildUpon().encodedPath("/marketplace");
        builder.appendQueryParameter("category", category);

        Set<String> copiedKeys = source.getQueryParameterNames();
        for (String key : copiedKeys) {
            if (key.equals("category")) continue;
            String value = source.getQueryParameter(key);
            if (value != null) builder.appendQueryParameter(key, value);
        }

        if (source.getFragment() != null) builder.encodedFragment(source.getEncodedFragment());
        return builder.build().toString();
    }

    private String remoteUrlForRoute(String route, Uri source) {
        Uri.Builder builder = Uri.parse(getString(R.string.web_origin)).buildUpon().encodedPath(route);
        if (source.getQuery() != null) builder.encodedQuery(source.getEncodedQuery());
        if (source.getFragment() != null) builder.encodedFragment(source.getEncodedFragment());
        return builder.build().toString();
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
            Toast.makeText(this, "No app can open this link.", Toast.LENGTH_SHORT).show();
        }
    }

    private void showError() {
        progressBar.setVisibility(View.GONE);
        if (errorView == null) {
            errorView = buildErrorView();
            root.addView(errorView, new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
            ));
        }
        errorView.setVisibility(View.VISIBLE);
    }

    private void hideError() {
        if (errorView != null) errorView.setVisibility(View.GONE);
    }

    private View buildErrorView() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setPadding(dp(28), dp(28), dp(28), dp(28));
        layout.setBackgroundColor(0xffffffff);

        TextView title = new TextView(this);
        title.setText("Connection needed");
        title.setTextColor(0xff101828);
        title.setTextSize(22);
        title.setGravity(Gravity.CENTER);
        title.setTypeface(title.getTypeface(), android.graphics.Typeface.BOLD);

        TextView message = new TextView(this);
        message.setText("Some marketplace, checkout, and profile screens need the live Kingdom service. Check your connection and try again.");
        message.setTextColor(0xff475467);
        message.setTextSize(15);
        message.setGravity(Gravity.CENTER);
        message.setPadding(0, dp(12), 0, dp(20));

        Button retry = new Button(this);
        retry.setText("Try again");
        retry.setAllCaps(false);
        retry.setOnClickListener(view -> loadUrl(lastRequestedUrl));

        layout.addView(title, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        layout.addView(message, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        layout.addView(retry, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        return layout;
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }
}
