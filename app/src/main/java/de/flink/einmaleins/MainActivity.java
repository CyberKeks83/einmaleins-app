package de.flink.einmaleins;

import android.app.Activity;
import android.app.AlertDialog;
import android.widget.FrameLayout;
import android.webkit.CookieManager;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;

public class MainActivity extends Activity {
 private WebView webView;
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  getWindow().setStatusBarColor(Color.rgb(247,248,242));
  getWindow().setNavigationBarColor(Color.rgb(247,248,242));
  getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
  webView = new WebView(this);
  webView.setBackgroundColor(Color.rgb(247,248,242));
  FrameLayout root = new FrameLayout(this);
  root.setBackgroundColor(Color.rgb(247,248,242));
  root.addView(webView,new FrameLayout.LayoutParams(-1,-1));
  root.setOnApplyWindowInsetsListener((view,insets)->{
   view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
   return insets;
  });
  setContentView(root);
  WebView.setWebContentsDebuggingEnabled(false);
  CookieManager.getInstance().setAcceptCookie(false);
  CookieManager.getInstance().setAcceptThirdPartyCookies(webView,false);
  WebSettings settings = webView.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false);
  settings.setAllowContentAccess(false);
  settings.setAllowFileAccessFromFileURLs(false);
  settings.setAllowUniversalAccessFromFileURLs(false);
  settings.setJavaScriptCanOpenWindowsAutomatically(false);
  settings.setSupportMultipleWindows(false);
  settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
   .addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  webView.setWebViewClient(new WebViewClient() {
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request) {
    if(!isLocalAsset(request.getUrl()))return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",null,new ByteArrayInputStream(new byte[0]));
    WebResourceResponse response = loader.shouldInterceptRequest(request.getUrl());
    return response != null ? response : new WebResourceResponse("text/plain","UTF-8",404,"Not Found",null,new ByteArrayInputStream(new byte[0]));
   }
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request) {
    return !isLocalAsset(request.getUrl());
   }
  });
  webView.setWebChromeClient(new WebChromeClient() {
   @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result) {
    new AlertDialog.Builder(MainActivity.this).setMessage(message)
     .setPositiveButton("Beenden",(dialog,which)->result.confirm())
     .setNegativeButton("Weiterrechnen",(dialog,which)->result.cancel())
     .setOnCancelListener(dialog->result.cancel()).show();
    return true;
   }
  });
  webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
 }
 private boolean isLocalAsset(android.net.Uri uri){
  return "https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost()) && uri.getPath()!=null && uri.getPath().startsWith("/assets/") && !uri.getPath().contains("..");
 }
 @Override public void onBackPressed() {
  new AlertDialog.Builder(this).setMessage("App schließen? Eine laufende Runde wird nicht gespeichert.")
   .setPositiveButton("Schließen",(dialog,which)->finish())
   .setNegativeButton("Weiterrechnen",null).show();
 }
 @Override protected void onPause(){
  if(webView!=null){webView.evaluateJavascript("if(window.FlinkAudio) window.FlinkAudio.background();",null);webView.onPause();}
  super.onPause();
 }
 @Override protected void onResume(){
  super.onResume();
  if(webView!=null){webView.onResume();webView.evaluateJavascript("if(window.FlinkAudio) window.FlinkAudio.foreground();",null);}
 }
 @Override public void onDestroy(){if(webView!=null)webView.destroy();super.onDestroy();}
}
