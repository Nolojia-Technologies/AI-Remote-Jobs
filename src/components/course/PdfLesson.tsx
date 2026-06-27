import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { FileText } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../theme";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
// pdf.js (UMD build) rendered inside the WebView — exposes window.pdfjsLib.
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/**
 * Renders a native PDF lesson page-by-page with pdf.js inside a WebView — the
 * real document (diagrams, images, layout, fonts) exactly as authored. Bytes are
 * streamed from the auth-gated pdf-proxy Edge Function; the storage path is never
 * exposed and there's no download. Works in Expo Go (no native module).
 */
export function PdfLesson({
  lessonId,
  resumePage,
  onPages,
  onInteraction,
}: {
  lessonId: string;
  resumePage: number;
  onPages: (current: number, total: number) => void;
  onInteraction?: () => void;
}) {
  const { isDark: dark } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [authFailed, setAuthFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session?.access_token) setToken(data.session.access_token);
        else setAuthFailed(true);
      })
      .catch(() => setAuthFailed(true));
  }, []);

  const html = useMemo(() => {
    if (!token) return null;
    const url = `${SUPABASE_URL}/functions/v1/pdf-proxy?lessonId=${encodeURIComponent(lessonId)}`;
    return buildViewerHtml({ url, token, resume: resumePage > 0 ? resumePage : 0, dark });
  }, [token, lessonId, resumePage, dark]);

  if (authFailed) return <Fallback message="Please sign in again to view this lesson." />;
  if (error) return <Fallback message={error} />;
  if (!html) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      scalesPageToFit={false}
      setBuiltInZoomControls
      setDisplayZoomControls={false}
      showsVerticalScrollIndicator
      style={{ flex: 1, backgroundColor: dark ? "#0B1220" : "#525659" }}
      onMessage={(e) => {
        try {
          const m = JSON.parse(e.nativeEvent.data);
          if (m.type === "pages") {
            onInteraction?.();
            onPages(Number(m.current) || 1, Number(m.total) || 1);
          } else if (m.type === "error") {
            setError(m.message || "Could not load the PDF.");
          }
        } catch {
          /* ignore non-JSON messages */
        }
      }}
    />
  );
}

function Fallback({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <FileText size={40} color="#9CA3AF" />
      <Text className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">{message}</Text>
    </View>
  );
}

/** HTML document that fetches the PDF (auth header) and renders all pages to canvas. */
function buildViewerHtml({ url, token, resume, dark }: { url: string; token: string; resume: number; dark: boolean }): string {
  const bg = dark ? "#0B1220" : "#525659";
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"/>
<style>
  html,body{margin:0;padding:0;background:${bg};-webkit-text-size-adjust:100%;}
  #c{display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0 28px;}
  .pg{background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.45);max-width:100%;border-radius:2px;}
  #msg{color:#e5e7eb;font-family:-apple-system,Roboto,sans-serif;text-align:center;padding:40px 24px;font-size:15px;}
</style>
<script src="${PDFJS}"></script>
</head><body>
<div id="msg">Loading PDF…</div>
<div id="c"></div>
<script>
  var TOKEN = ${JSON.stringify(token)};
  var URL_ = ${JSON.stringify(url)};
  var RESUME = ${resume};
  function post(o){ try { window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }
  function currentPage(){
    var cs = document.querySelectorAll('.pg');
    var mid = window.scrollY + window.innerHeight/2, p = 1;
    for (var i=0;i<cs.length;i++){ if (cs[i].offsetTop <= mid) p = i+1; }
    return p;
  }
  (function(){
    if (!window.pdfjsLib){ document.getElementById('msg').textContent='Viewer failed to load. Check your connection.'; post({type:'error',message:'pdf.js failed to load'}); return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc = ${JSON.stringify(PDFJS_WORKER)};
    fetch(URL_, { headers: { Authorization: 'Bearer ' + TOKEN } })
      .then(function(r){ if(!r.ok){ throw new Error('HTTP ' + r.status); } return r.arrayBuffer(); })
      .then(function(buf){ return pdfjsLib.getDocument({ data: buf }).promise; })
      .then(function(pdf){
        document.getElementById('msg').style.display='none';
        var cont = document.getElementById('c');
        var dpr = Math.min(window.devicePixelRatio || 1, 3);
        var targetW = Math.min(window.innerWidth - 16, 1600);
        var chain = Promise.resolve();
        for (var i=1;i<=pdf.numPages;i++){
          (function(n){
            chain = chain.then(function(){
              return pdf.getPage(n).then(function(page){
                var base = page.getViewport({ scale: 1 });
                var cssScale = targetW / base.width;
                var vp = page.getViewport({ scale: cssScale * dpr });
                var canvas = document.createElement('canvas');
                canvas.className = 'pg';
                canvas.width = Math.floor(vp.width);
                canvas.height = Math.floor(vp.height);
                canvas.style.width = Math.floor(vp.width/dpr) + 'px';
                canvas.style.height = Math.floor(vp.height/dpr) + 'px';
                cont.appendChild(canvas);
                return page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise.then(function(){
                  post({ type:'pages', current: currentPage(), total: pdf.numPages });
                });
              });
            });
          })(i);
        }
        chain.then(function(){
          post({ type:'pages', current: Math.min(Math.max(1,RESUME||1), pdf.numPages), total: pdf.numPages });
          if (RESUME > 1){ var cs=document.querySelectorAll('.pg'); if (cs[RESUME-1]) window.scrollTo(0, cs[RESUME-1].offsetTop); }
          var t=null;
          window.addEventListener('scroll', function(){
            if (t) return;
            t = setTimeout(function(){ t=null; post({ type:'pages', current: currentPage(), total: pdf.numPages }); }, 180);
          });
        });
      })
      .catch(function(e){
        document.getElementById('msg').textContent = 'Could not load the PDF.';
        post({ type:'error', message: String((e && e.message) || e) });
      });
  })();
</script>
</body></html>`;
}
