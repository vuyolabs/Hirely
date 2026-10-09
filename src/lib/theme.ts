export const THEME_STORAGE_KEY = "hirely-theme";

/*
 * Runs in <head> before the first paint so the page never flashes
 * light while in dark mode. Must stay in sync with ThemeProvider.
 */
export const themeInitScript = `(function(){try{
var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(t!=="light"&&t!=="dark")t="system";
var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
var r=document.documentElement;
r.classList.toggle("dark",d);
r.style.colorScheme=d?"dark":"light";
}catch(e){}})();`;
