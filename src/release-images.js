export const releaseImageMap={};
export function resolveReleaseImage(logical,map,baseURL){const base=new URL(baseURL);const key=logical.startsWith(base.href)?logical.slice(base.href.length):null;const selected=key&&map[key];return selected?new URL(typeof selected==='string'?selected:selected.selected,base).href:logical;}
export function releaseImageURL(logical){return resolveReleaseImage(logical,releaseImageMap,new URL('../',import.meta.url).href);}
// Keep original sprite rectangles and texture seam constants after downsampling.
export function restoreReleaseImage(image,info,makeCanvas=()=>document.createElement('canvas')){
 if(!info?.resized)return image;
 if(image.width!==info.publishedWidth||image.height!==info.publishedHeight)throw Error('Unexpected release image dimensions');
 const canvas=makeCanvas();canvas.width=info.width;canvas.height=info.height;
 canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return canvas;
}
export function releaseImageSource(logical,image){
 const base=new URL('../',import.meta.url).href;
 return restoreReleaseImage(image,releaseImageMap[logical.startsWith(base)?logical.slice(base.length):'']);
}
