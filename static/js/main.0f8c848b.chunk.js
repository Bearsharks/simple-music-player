(this["webpackJsonpsimple-music-player"]=this["webpackJsonpsimple-music-player"]||[]).push([[0],{21:function(e,t,i){e.exports={spinnerWrapper:"Spinner_spinnerWrapper__1sjWi",spinner:"Spinner_spinner__3jVAw",rotate:"Spinner_rotate__1hbt0"}},27:function(e,t,i){},28:function(e,t,i){},35:function(e,t,i){"use strict";i.r(t);var s=i(0),n=i.n(s),c=i(9),r=i.n(c),u=(i(27),i(2)),o=(i(28),i(21)),a=i.n(o),d=i(3);var l=function(){return Object(d.jsxs)("div",{className:a.a.spinnerWrapper,children:[Object(d.jsx)("div",{className:a.a.spinner,children:Object(d.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",height:"40px",viewBox:"0 0 24 24",width:"40px",fill:"#000000",children:[Object(d.jsx)("path",{d:"M0 0h24v24H0V0z",fill:"none"}),Object(d.jsx)("path",{d:"M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"})]})}),Object(d.jsx)("div",{children:"\ubd88\ub7ec\uc624\ub294 \uc911..."})]})},h=i(13),f=i(11),p=i(1),b=i(5),j=i(8),M=i(4),x=i(7),v={idx:-1,id:null,key:null},w=Object(x.b)({key:"musicListState",default:[]}),g=Object(x.b)({key:"curMusicIndexState",default:v.idx}),O=Object(x.c)({key:"curMusicInfoState",get:function(e){var t=e.get,i=t(w),s=t(g);return s===v.idx||0===i.length?v:Object(M.a)({idx:s},i[s])},set:function(e,t){var i=e.set,s=Object(u.a)(t,2),n=s[0],c=s[1];n&&i(g,n),c&&i(w,c)}}),m=0;var y=function(){function e(){Object(b.a)(this,e),this._storage=new Map,this._storage_cnt=new Map,this.store=this.store.bind(this),this.delete=this.delete.bind(this),this.get=this.get.bind(this),this.set=this.set.bind(this)}return Object(j.a)(e,[{key:"get",value:function(e){if(!e)throw new Error("store state error : invalid key");var t=this._storage.get(e);return t||((t=JSON.parse(localStorage.getItem(e)))?(this._storage.set(e,t),t):void 0)}},{key:"set",value:function(e,t){if(!e)throw new Error("store state error : invalid key");if(0!==t&&!t)throw new Error("store state error : invalid item");this._storage.set(e,t),localStorage.setItem(e,JSON.stringify(t)),this._storage_cnt.get(e)||this._storage_cnt.set(e,1)}},{key:"store",value:function(e){if(!e)throw new Error("store state error : invalid key");var t=this._storage_cnt.get(e);this._storage_cnt.set(t?t+1:1)}},{key:"delete",value:function(e){if(!e)throw new Error("store state error : invalid key");var t=this._storage_cnt.get(e);t>1?this._storage_cnt.set(e,t-1):1===t&&(this._storage_cnt.delete(e),this._storage.delete(e),localStorage.removeItem(e))}}]),e}();var I=function(){function e(t,i){Object(b.a)(this,e),this.musicList=t[0],this.setMusicList=t[1],this.curMusicIndex=i[0],this.setCurMusicIndex=i[1],this.goNextMusic=this.goNextMusic.bind(this),this.goPrevMusic=this.goPrevMusic.bind(this),this.reorderMusicList=this.reorderMusicList.bind(this),this.deleteMusic=this.deleteMusic.bind(this),this.appendMusicList=this.appendMusicList.bind(this),this.modMusicList=this.modMusicList.bind(this),this.initMusicInfo=this.initMusicInfo.bind(this),this.updateMusicList=this.updateMusicList.bind(this),this.selectMusic=this.selectMusic.bind(this)}return Object(j.a)(e,[{key:"goNextMusic",value:function(){this.curMusicIndex+1<this.musicList.length&&this.setCurMusicIndex(this.curMusicIndex+1)}},{key:"goPrevMusic",value:function(){this.curMusicIndex-1>=0&&this.setCurMusicIndex(this.curMusicIndex-1)}},{key:"reorderMusicList",value:function(e,t){if(t!==e){var i=Array.from(this.musicList),s=i.splice(e,1),n=Object(u.a)(s,1)[0];i.splice(t,0,n),this.updateMusicList(i),this.curMusicIndex===e&&this.setCurMusicIndex(t)}}},{key:"deleteMusic",value:function(e){var t=Object(M.a)(Object(M.a)({},this.musicList[e]),{},{idx:e}),i=1===this.musicList.length;if(window.storeManager.delete(t.q),i)return this.updateMusicList([]),void this.setCurMusicIndex(v.idx);var s=t.idx===this.musicList.length-1,n=this.curMusicIndex>t.idx,c=this.curMusicIndex===t.idx,r=this.musicList.filter((function(e,i){return i!==t.idx}));this.updateMusicList(r),(c&&s||n)&&this.setCurMusicIndex(this.curMusicIndex-1)}},{key:"appendMusicList",value:function(e){if(!((e=e.filter((function(e){return""!==e}))).length<1)){var t,i=function(e){if(e){var t=Date.now();return new Array(e).fill(null).map((function(e,i){return t+"_"+m++}))}return Date.now()+"_"+m++}(e.length),s=e.map((function(e,t){return{q:e,id:null,key:i[t]}})),n=Object(p.a)(s);try{for(n.s();!(t=n.n()).done;){var c=t.value;window.storeManager.store(c.q)}}catch(o){n.e(o)}finally{n.f()}var r=this.musicList.length,u=[].concat(Object(f.a)(this.musicList),Object(f.a)(s));this.updateMusicList(u),this.curMusicIndex===v.idx&&this.setCurMusicIndex(r)}}},{key:"updateMusicList",value:function(e){this.setMusicList(e),window.storeManager.set("musicList",e)}},{key:"modMusicList",value:function(e,t){var i=Object(M.a)(Object(M.a)({},this.musicList[e]),{},{id:t.id.videoId}),s=this.musicList.map((function(t,s){return e===s?i:t}));this.updateMusicList(s)}},{key:"initMusicInfo",value:function(e,t,i,s){s||(s=0),this.modMusicList(e,i[s]),window.storeManager.set(t,i)}},{key:"selectMusic",value:function(e){this.setCurMusicIndex(e)}}]),e}(),k=i(6),L=i.n(k),_=i(18);function C(e){var t={part:"snippet",maxResults:5,type:"video",topic:"/m/04rlf",q:"".concat(e," official audio")},i=Object.keys(t).map((function(e){return encodeURIComponent(e)+"="+encodeURIComponent(t[e])})).join("&"),s="https://www.googleapis.com/youtube/v3/search?key=".concat("AIzaSyBJwDMPWPGnzeDUqogskimWlGHLbqTQjcM","&fields=").concat("items(id,snippet(title,description,thumbnails))","&").concat(i);return fetch(s,{method:"GET"})}function S(e){var t=e.query,i=e.selectQuery,n=e.curItemId,c=(e.hide,Object(s.useState)(null)),r=Object(u.a)(c,2),o=r[0],a=r[1],l=Object(s.useState)(0),h=Object(u.a)(l,2),f=h[0],p=h[1];Object(s.useEffect)((function(){if(!o){var e=window.storeManager.get(t);e?a(e):function(e){i.apply(this,arguments)}(t)}function i(){return(i=Object(_.a)(L.a.mark((function e(t){var i,s;return L.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,C(t);case 2:if(200===(i=e.sent).status){e.next=5;break}throw new Error("request fail");case 5:return e.next=7,i.json();case 7:s=e.sent,window.storeManager.set(t,s.items),a(s.items);case 10:case"end":return e.stop()}}),e)})))).apply(this,arguments)}}),[]),Object(s.useEffect)((function(){for(var e in o)if(o[e].id.videoId===n){p(parseInt(e));break}}),[o,n]);return Object(d.jsx)(d.Fragment,{children:o&&Object(d.jsx)("ul",{children:o.map((function(e,t){return Object(d.jsxs)("li",{onClick:function(e){return function(e,t){e.stopPropagation(),i(o[t])}(e,t)},style:f===t?{color:"blue"}:{},children:[Object(d.jsx)("img",{src:e.snippet.thumbnails.default.url,alt:e.snippet.title}),e.snippet.title]},e.id.videoId)}))})})}function E(e){var t=Object(s.useState)(!1),i=Object(u.a)(t,2),n=i[0],c=i[1];return Object(d.jsxs)("div",{children:[e.ele.q," ",Object(d.jsx)("button",{onClick:function(t){return function(t,i){t.stopPropagation(),t.preventDefault(),e.deleteMusic(i)}(t,e.index)},children:" X "}),Object(d.jsx)("button",{onClick:function(e){e.stopPropagation(),c(!n)},children:"\ud3bc\uce58\uae30 "}),n&&Object(d.jsx)(S,{query:e.ele.q,selectQuery:function(t){e.modMusicList(e.index,t)},curItemId:e.ele.id})]})}var q=Object(s.memo)((function(e){return Object(d.jsx)(h.b,{draggableId:e.ele.key,index:e.index,children:function(t,i){return Object(d.jsx)("li",Object(M.a)(Object(M.a)(Object(M.a)({ref:t.innerRef},t.draggableProps),t.dragHandleProps),{},{onClick:function(t){e.selectMusic(e.index)},style:e.isCurMusic?{border:"1px solid black"}:{},children:Object(d.jsx)(E,{ele:e.ele,index:e.index,deleteMusic:e.deleteMusic,modMusicList:e.modMusicList})}))}})}));function N(){var e=Object(s.useState)(""),t=Object(u.a)(e,2),i=t[0],n=t[1],c=Object(s.useState)(!1),r=Object(u.a)(c,2),o=r[0],a=r[1],f=Object(x.d)(w),p=f[0],b=Object(x.d)(g),j=b[0],m=new I(f,b);!function(e,t){var i=Object(x.d)(O),n=Object(u.a)(i,2),c=n[0],r=n[1],o=Object(s.useRef)(v.key);Object(s.useEffect)((function(){if(c.key&&c.key+c.id!==o.current)if(window.storeManager.set("curMusicIndex",c.idx),c.key!==v.key){o.current=c.key+c.id;var i=c;if(!c.id){var s=window.storeManager.get(c.q);s&&(i=Object(M.a)(Object(M.a)({},i),{},{id:s[0].id.videoId}))}e(i)}else t()}),[c]),Object(s.useEffect)((function(){window.storeManager||(window.storeManager=new y);var e=window.storeManager.get("curMusicIndex"),t=window.storeManager.get("musicList");r([e,t])}),[])}((function(e){window.player&&(e.id?window.player.loadVideoById({videoId:e.id}):C(e.q).then((function(e){if(200===e.status)return e.json();throw new Error("request fail")})).then((function(t){var i=t.items[0].id.videoId;window.player.loadVideoById({videoId:i}),m.initMusicInfo(e.idx,e.q,t.items)})).catch())}),(function(){window.player&&window.player.stopVideo&&window.player.stopVideo()}));var k=Object(s.useRef)();k.current=m.goNextMusic,Object(s.useEffect)((function(){if(!window.YT){var e=document.createElement("script");e.src="https://www.youtube.com/iframe_api";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t),window.player=null,window.onYouTubeIframeAPIReady=function(){window.player=new window.YT.Player("player",{height:"480",width:"640",events:{onStateChange:function(e){0===e.data&&k.current()}}}),a(!0)}}}),[]);var L=function(e){m.deleteMusic(e)};return Object(d.jsx)("div",{className:"App",children:Object(d.jsxs)("main",{children:[!o&&Object(d.jsx)(l,{}),Object(d.jsx)("div",{className:"playerwrapper",id:"player"}),Object(d.jsxs)("div",{className:"side",children:[Object(d.jsx)("textarea",{value:i,onChange:function(e){n(e.target.value)}}),Object(d.jsx)("button",{onClick:function(){if(""!==i){var e=i.split("\n").filter((function(e){return""!==e}));e.length<1||(m.appendMusicList(e),n(""))}},children:"append"}),Object(d.jsx)("button",{onClick:m.goPrevMusic,children:"\uc774\uc804 "})," ",Object(d.jsx)("button",{onClick:m.goNextMusic,children:"\ub2e4\uc74c "}),Object(d.jsx)(h.a,{onDragEnd:function(e){e.destination&&m.reorderMusicList(e.source.index,e.destination.index)},onDragStart:function(e){},children:Object(d.jsx)(h.c,{droppableId:"droppable",children:function(e,t){return Object(d.jsxs)("ul",{ref:e.innerRef,children:[p.map((function(e,t){return Object(d.jsx)(q,{ele:e,index:t,selectMusic:m.selectMusic,deleteMusic:L,modMusicList:m.modMusicList,isCurMusic:j==t},e.key)})),e.placeholder]})}})})]})]})})}var P=Object(s.memo)(N);r.a.render(Object(d.jsx)(n.a.StrictMode,{children:Object(d.jsx)(x.a,{children:Object(d.jsx)(P,{})})}),document.getElementById("root"))}},[[35,1,2]]]);
//# sourceMappingURL=main.0f8c848b.chunk.js.map