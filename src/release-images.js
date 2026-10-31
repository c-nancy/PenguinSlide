export const releaseImageMap={};
export function resolveReleaseImage(logical,map,baseURL){const base=new URL(baseURL);const key=logical.startsWith(base.href)?logical.slice(base.href.length):null;const selected=key&&map[key];return selected?new URL(typeof selected==='string'?selected:selected.selected,base).href:logical;}
export function releaseImageURL(logical){return resolveReleaseImage(logical,releaseImageMap,new URL('../',import.meta.url).href);}
