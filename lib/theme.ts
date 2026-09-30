/** The localStorage key holding the viewer's chosen theme, "light" or "dark". */
export const THEME_KEY = "theme";

/** Runs before first paint: applies the saved theme, or the system's, so there is never a flash of the wrong one. */
export const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
