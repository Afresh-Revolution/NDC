export function ThemeScript() {
  const js = `try{var t=localStorage.getItem('ndc-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.setAttribute('data-theme','dark')}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
