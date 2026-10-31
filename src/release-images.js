export const releaseImageMap={};
export function releaseImageURL(logical){const base=new URL("../",import.meta.url);const key=logical.startsWith(base.href)?logical.slice(base.href.length):null;return key&&releaseImageMap[key]?new URL(releaseImageMap[key].selected,base).href:logical;}
