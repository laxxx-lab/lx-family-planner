package com.lxfamily.planner;

import android.content.Context;
import android.content.SharedPreferences;
import android.app.Dialog;
import android.net.Uri;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Keeps the selected self-hosted LX server outside WebView storage.
 *
 * WebView local storage is convenient for the web app but may be cleared by
 * Android WebView repairs or browser-data migration. SharedPreferences belongs
 * to the installed app and is retained by normal signed APK updates.
 */
@CapacitorPlugin(name = "LXServerPreferences")
public class LXServerPreferencesPlugin extends Plugin {
    private static final String PREFS_NAME = "lx_server_preferences";
    private static final String KEY_SERVER_URL = "server_url";
    private static final int MAX_SERVER_URL_LENGTH = 2048;
    private Dialog authenticationDialog;

    @PluginMethod
    public void authenticate(PluginCall call) {
        String url = call.getString("url", "").trim();
        Uri uri = Uri.parse(url);
        if (url.length() > MAX_SERVER_URL_LENGTH || uri.getHost() == null ||
            uri.getUserInfo() != null ||
            !("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
            call.reject("Invalid server address.", "INVALID_SERVER_URL");
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (authenticationDialog != null) {
                call.reject("A proxy login is already open.");
                return;
            }
            Dialog dialog = new Dialog(getActivity());
            dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
            LinearLayout layout = new LinearLayout(getActivity());
            layout.setOrientation(LinearLayout.VERTICAL);
            TextView heading = new TextView(getActivity());
            heading.setText(call.getString("title", "Server login"));
            heading.setPadding(24, 16, 24, 16);
            layout.addView(heading);
            WebView webView = new WebView(getActivity());
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setAllowFileAccess(false);
            webView.getSettings().setAllowContentAccess(false);
            // Isolated WebView: proxy pages never receive the Capacitor bridge.
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String scheme = request.getUrl().getScheme();
                    return !("http".equals(scheme) || "https".equals(scheme));
                }
            });
            CookieManager.getInstance().setAcceptCookie(true);
            layout.addView(webView, new LinearLayout.LayoutParams(-1, 0, 1));
            Button close = new Button(getActivity());
            close.setText(call.getString("closeLabel", "Return to LX"));
            close.setOnClickListener(view -> dialog.dismiss());
            layout.addView(close);
            dialog.setContentView(layout);
            dialog.setOnDismissListener(ignored -> {
                CookieManager.getInstance().flush();
                webView.stopLoading();
                webView.destroy();
                authenticationDialog = null;
                call.resolve();
            });
            authenticationDialog = dialog;
            dialog.show();
            dialog.getWindow().setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT);
            webView.loadUrl(url);
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (authenticationDialog != null) authenticationDialog.dismiss();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void getServerUrl(PluginCall call) {
        JSObject result = new JSObject();
        result.put(
            "url",
            preferences(getContext()).getString(KEY_SERVER_URL, "")
        );
        call.resolve(result);
    }

    @PluginMethod
    public void setServerUrl(PluginCall call) {
        String url = call.getString("url", "").trim();
        if (url.length() > MAX_SERVER_URL_LENGTH) {
            call.reject("Die Server-Adresse ist zu lang.", "SERVER_URL_TOO_LONG");
            return;
        }
        preferences(getContext()).edit()
            .putString(KEY_SERVER_URL, url)
            .apply();
        call.resolve();
    }

    private static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}
