(this["webpackJsonpsimple-music-player"]=this["webpackJsonpsimple-music-player"]||[]).push([[0],{21:function(e,t,i){e.exports={spinnerWrapper:"Spinner_spinnerWrapper__1sjWi",spinner:"Spinner_spinner__3jVAw",rotate:"Spinner_rotate__1hbt0"}},27:function(e,t,i){},28:function(e,t,i){},35:function(e,t,i){"use strict";i.r(t);var n=i(0),s=i.n(n),r=i(11),a=i.n(r),c=(i(27),i(3)),u=(i(28),i(21)),o=i.n(u),d=i(1);var l=function(){return Object(d.jsxs)("div",{className:o.a.spinnerWrapper,children:[Object(d.jsx)("div",{className:o.a.spinner,children:Object(d.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",height:"40px",viewBox:"0 0 24 24",width:"40px",fill:"#000000",children:[Object(d.jsx)("path",{d:"M0 0h24v24H0V0z",fill:"none"}),Object(d.jsx)("path",{d:"M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"})]})}),Object(d.jsx)("div",{children:"\ubd88\ub7ec\uc624\ub294 \uc911..."})]})},p=i(10),h=i(2),f=i(7),b=i(4),j={idx:-1,id:-1,key:-1},w="My playlist",v="curPlayListName",g=function(e){return"https://i.ytimg.com/vi/".concat(e,"/default.jpg")},y=Object(f.b)({key:"musicListState",default:[]}),x=Object(f.b)({key:"curMusicIndexState",default:j.idx}),M=Object(f.c)({key:"curMusicInfoState",get:function(e){var t=e.get,i=t(y),n=t(x);return n===j.idx||0===i.length?j:Object(b.a)({idx:n},i[n])},set:function(e,t){var i=e.set,n=Object(c.a)(t,2),s=n[0],r=n[1];(0===s||s)&&i(x,s),r&&i(y,r)}}),O=i(6),m=i(9),k=function(){function e(){Object(O.a)(this,e),this._storage=new Map,this._storage_cnt=new Map,this.store=this.store.bind(this),this.delete=this.delete.bind(this),this.get=this.get.bind(this),this.set=this.set.bind(this)}return Object(m.a)(e,[{key:"get",value:function(e,t){if(!e)throw new Error("store state error : invalid key");t&&(e=t+"_"+e);var i=this._storage.get(e);return i||(0===(i=JSON.parse(localStorage.getItem(e)))||i?(this._storage.set(e,i),i):void 0)}},{key:"set",value:function(e,t,i){if(!e)throw new Error("store state error : invalid key");i&&(e=i+"_"+e),this._storage.set(e,t),localStorage.setItem(e,JSON.stringify(t)),this._storage_cnt.get(e)||this._storage_cnt.set(e,1)}},{key:"store",value:function(e,t){if(!e)throw new Error("store state error : invalid key");t&&(e=t+"_"+e);var i=this._storage_cnt.get(e);this._storage_cnt.set(e,i?i+1:1)}},{key:"delete",value:function(e,t){if(!e)throw new Error("store state error : invalid key");t&&(e=t+"_"+e);var i=this._storage_cnt.get(e);i>1?this._storage_cnt.set(e,i-1):1===i&&(this._storage_cnt.delete(e),this._storage.delete(e),localStorage.removeItem(e))}}]),e}();function I(){var e=Object(n.useState)([w]),t=Object(c.a)(e,2),i=t[0],s=t[1],r=Object(f.d)(M),a=Object(c.a)(r,2),u=(a[0],a[1]),o=Object(n.useRef)();Object(n.useEffect)((function(){window.storeManager||(window.storeManager=new k);var e=window.storeManager.get("playlists");e?s(e):window.storeManager.set("playlists",i)}),[]);var l=function(e){var t=window.storeManager.get(e,"list"),i=window.storeManager.get(e,"idx");u([i,t]),window.storeManager.set(v,e)};return Object(d.jsxs)("ul",{children:["\uc7ac\uc0dd\ubaa9\ub85d",Object(d.jsx)("br",{}),Object(d.jsx)("input",{ref:o,type:"text"}),Object(d.jsx)("button",{onClick:function(){var e=o.current.value;if(e){var t,n=Object(h.a)(i);try{for(n.s();!(t=n.n()).done;){if(t.value===e)return alert("\uc774\ubbf8 \uc874\uc7ac\ud558\ub294 \ud50c\ub808\uc774\ub9ac\uc2a4\ud2b8")}}catch(a){n.e(a)}finally{n.f()}var r=[].concat(Object(p.a)(i),[e]);window.storeManager.set(e,[],"list"),window.storeManager.set(e,j.id,"idx"),window.storeManager.set("playlists",r),s(r),o.current.value=""}},children:"\uc0c8\ub85c\uc6b4 \uc7ac\uc0dd\ubaa9\ub85d \ucd94\uac00"}),i.map((function(e,t){return Object(d.jsxs)("li",{onClick:function(){l(e)},children:[e,e!==w&&Object(d.jsx)("button",{onClick:function(){!function(e){var t=window.storeManager.get(e,"list");window.storeManager.delete(e,"list"),window.storeManager.delete(e,"idx");for(var n=0;n<t.length;n++)"query"===t[n].type&&window.storeManager.delete(t[n].q,"query");for(var r=i.slice(),a=0;a<i.length;a++)if(i[a]===e){r.splice(a,1);break}s(r),window.storeManager.set("playlists",r),l(w)}(e)},children:"X"})]},e)}))]})}var L=i(5),_=i.n(L),q=i(8),C=i(14),S=0;function P(e){if(e){var t=Date.now();return new Array(e).fill(null).map((function(e,i){return t+"_"+S++}))}return Date.now()+"_"+S++}function N(e,t){var i={};return"list"===t?(i.videoId=e.snippet.resourceId.videoId,i.thumbnail=g(i.videoId),i.title=e.snippet.title,i.description=e.snippet.description):"music"===t?(i.videoId=e.id,i.thumbnail=g(i.videoId),i.title=e.snippet.title,i.description=e.snippet.description):(i.videoId=e.id.videoId,i.thumbnail=g(e.id.videoId),i.title=e.snippet.title,i.description=e.snippet.description),i.type=t,i}function E(e,t,i){return R.apply(this,arguments)}function R(){return(R=Object(q.a)(_.a.mark((function e(t,i,n){var s,r,a,c,u,o,d,l,p;return _.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return s={key:localStorage.getItem("youtubeKey"),part:"snippet"},"list"===i?(s=Object(b.a)(Object(b.a)({},s),{},{playlistId:t,maxResults:50,fields:"nextPageToken,pageInfo,items(snippet(title,description,resourceId))"}),n&&(s.pageToken=n)):s="music"===i?Object(b.a)(Object(b.a)({},s),{},{id:t,fields:"items(id,snippet(title,description))"}):Object(b.a)(Object(b.a)({},s),{},{maxResults:5,type:"video",topic:"/m/04rlf",q:"".concat(t," audio"),fields:"items(id,snippet(title,description))"}),r=Object.keys(s).map((function(e){return encodeURIComponent(e)+"="+encodeURIComponent(s[e])})).join("&"),a=function(e,t){return"https://www.googleapis.com/youtube/v3/".concat("list"===e?"playlistItems":"music"===e?"videos":"search","?").concat(t)},e.next=6,fetch(a(i,r),{method:"GET"});case 6:if(200!==(c=e.sent).status){e.next=23;break}return e.next=10,c.json();case 10:u=e.sent,o=[],d=Object(h.a)(u.items);try{for(d.s();!(l=d.n()).done;)p=l.value,o.push(N(p,i))}catch(f){d.e(f)}finally{d.f()}if("list"!==i||!u.nextPageToken){e.next=20;break}return e.t0=o,e.next=18,E(t,i,u.nextPageToken);case 18:e.t1=e.sent,o=e.t0.concat.call(e.t0,e.t1);case 20:return e.abrupt("return",o);case 23:400===c.status&&alert("\uc798\ubabb\ub41c \ud0a4\uc774\uac70\ub098 \ud574\ub2f9\ud0a4\uc758 api \ud560\ub2f9\ub7c9\uc744 \ucd08\uacfc\ud588\uc2b5\ub2c8\ub2e4.");case 24:throw new Error("request fail");case 25:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function T(e){window.storeManager||(window.storeManager=new k);var t=window.storeManager.get(e,"list");if(0!==t.length){var i,n=Object(h.a)(t);try{for(n.s();!(i=n.n()).done;){var s=i.value;window.storeManager.store(s.q,"query")}}catch(r){n.e(r)}finally{n.f()}}}function V(e,t){var i=Object(f.d)(M),s=Object(c.a)(i,2),r=s[0],a=s[1],u=Object(n.useRef)(j);Object(n.useEffect)((function(){var e,t=function(){window.storeManager||(window.storeManager=new k);var e=window.storeManager.get("playlists");e||(e=[w],window.storeManager.set("playlists",e));var t,i=Object(h.a)(e);try{for(i.s();!(t=i.n()).done;){var n=t.value,s=window.storeManager.get(n,"list");s||(s=[],window.storeManager.set(n,s,"list"))}}catch(r){i.e(r)}finally{i.f()}return e}(),i=Object(h.a)(t);try{for(i.s();!(e=i.n()).done;){T(e.value)}}catch(n){i.e(n)}finally{i.f()}!function(e){window.storeManager||(window.storeManager=new k);var t=window.storeManager.get(v);t||(t=w,window.storeManager.set(v,t));var i=window.storeManager.get(t,"idx"),n=window.storeManager.get(t,"list");0===i||i||(i=j.idx,window.storeManager.set(t,i,"idx")),n||(n=[],window.storeManager.set(t,n,"list")),e([i,n])}(a)}),[a]),Object(n.useEffect)((function(){if(r.key){var i=r.key===u.current.key,n=u.current.id===j.id&&r.id!==j.id,s=u.current.id===r.id;if(!i||!n&&!s){var a=window.storeManager.get(v);if(window.storeManager.set(a,r.idx,"idx"),r.key===j.key)t();else{var c=r;if(!r.id){var o=window.storeManager.get(r.q,"query");o&&(c=Object(b.a)(Object(b.a)({},c),{},{id:o[0].videoId}))}e(c)}u.current=r}}}),[r])}var B=function(){function e(t,i){Object(O.a)(this,e),this.musicList=t[0],this.setMusicList=t[1],this.curMusicIndex=i[0],this.setCurMusicIndex=i[1],window.storeManager||(window.storeManager=new k);var n=window.storeManager.get(v);this.curPlayListName=n||w,this.goNextMusic=this.goNextMusic.bind(this),this.goPrevMusic=this.goPrevMusic.bind(this),this.reorderMusicList=this.reorderMusicList.bind(this),this.deleteMusic=this.deleteMusic.bind(this),this.appendMusicList=this.appendMusicList.bind(this),this.appendPlaylist=this.appendPlaylist.bind(this),this.appendMusic=this.appendMusic.bind(this),this.appendQueryList=this.appendQueryList.bind(this),this.modMusicList=this.modMusicList.bind(this),this.initMusicInfo=this.initMusicInfo.bind(this),this.updateMusicList=this.updateMusicList.bind(this),this.selectMusic=this.selectMusic.bind(this)}return Object(m.a)(e,[{key:"goNextMusic",value:function(){this.curMusicIndex+1<this.musicList.length&&this.setCurMusicIndex(this.curMusicIndex+1)}},{key:"goPrevMusic",value:function(){this.curMusicIndex-1>=0&&this.setCurMusicIndex(this.curMusicIndex-1)}},{key:"reorderMusicList",value:function(e,t){if(t!==e){var i=Array.from(this.musicList),n=i.splice(e,1),s=Object(c.a)(n,1)[0];i.splice(t,0,s),this.updateMusicList(i);var r=this.curMusicIndex===e,a=this.curMusicIndex>e&&this.curMusicIndex<=t,u=this.curMusicIndex<e&&this.curMusicIndex>=t;r?this.selectMusic(t):a?this.goPrevMusic():u&&this.goNextMusic()}}},{key:"deleteMusic",value:function(e){var t=Object(b.a)(Object(b.a)({},this.musicList[e]),{},{idx:e}),i=1===this.musicList.length;if(window.storeManager.delete(t.q,"query"),i)return this.updateMusicList([]),void this.setCurMusicIndex(j.idx);var n=t.idx===this.musicList.length-1,s=this.curMusicIndex>t.idx,r=this.curMusicIndex===t.idx,a=this.musicList.filter((function(e,i){return i!==t.idx}));this.updateMusicList(a),(r&&n||s)&&this.setCurMusicIndex(this.curMusicIndex-1)}},{key:"appendMusicList",value:function(){var e=Object(q.a)(_.a.mark((function e(t){var i,n,s,r,a,c,u,o,d,l,h,f;return _.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:for(i=this.musicList.length,t=t.filter((function(e){return""!==e})),n=[],s=0,r=0,a=0;a<t.length;a++)if("http"===t[a].substr(0,4)){for(r>0&&n.push({type:"query",start:s,end:r}),c={},u=t[a].substring(t[a].indexOf("?")+1).split("&"),o=0;o<u.length;o++)u[o]=u[o].split("="),c[u[o][0]]=u[o][1];c.list?n.push({type:"list",id:c.list}):c.v&&n.push({type:"music",id:c.v}),s=a+1}else r=a+1;s<=r&&n.push({type:"query",start:s,end:r}),console.log(n),d=[],l=0,h=n;case 10:if(!(l<h.length)){e.next=38;break}if("list"!==(f=h[l]).type){e.next=23;break}return e.t0=d.push,e.t1=d,e.t2=p.a,e.next=18,this.appendPlaylist(f.id);case 18:e.t3=e.sent,e.t4=(0,e.t2)(e.t3),e.t0.apply.call(e.t0,e.t1,e.t4),e.next=35;break;case 23:if("music"!==f.type){e.next=34;break}return e.t5=d.push,e.t6=d,e.t7=p.a,e.next=29,this.appendMusic(f.id);case 29:e.t8=e.sent,e.t9=(0,e.t7)(e.t8),e.t5.apply.call(e.t5,e.t6,e.t9),e.next=35;break;case 34:"query"===f.type&&d.push.apply(d,Object(p.a)(this.appendQueryList(t.slice(f.start,f.end))));case 35:l++,e.next=10;break;case 38:this.updateMusicList([].concat(Object(p.a)(this.musicList),d)),this.curMusicIndex===j.idx&&this.setCurMusicIndex(i);case 40:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()},{key:"appendMusic",value:function(){var e=Object(q.a)(_.a.mark((function e(t){var i,n;return _.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,E(t,"music");case 3:return i=e.sent,n=P(i.length),e.abrupt("return",i.map((function(e,t){return{q:e.title,id:e.videoId,key:n[t],type:"music"}})));case 8:e.prev=8,e.t0=e.catch(0);case 10:case"end":return e.stop()}}),e,null,[[0,8]])})));return function(t){return e.apply(this,arguments)}}()},{key:"appendPlaylist",value:function(){var e=Object(q.a)(_.a.mark((function e(t){var i,n;return _.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,E(t,"list");case 3:return i=e.sent,n=P(i.length),e.abrupt("return",i.map((function(e,t){return{q:e.title,id:e.videoId,key:n[t],type:"music"}})));case 8:e.prev=8,e.t0=e.catch(0);case 10:case"end":return e.stop()}}),e,null,[[0,8]])})));return function(t){return e.apply(this,arguments)}}()},{key:"appendQueryList",value:function(e){if(!((e=e.filter((function(e){return""!==e}))).length<1)){var t,i=P(e.length),n=e.map((function(e,t){return{q:e,id:null,key:i[t],type:"query"}})),s=Object(h.a)(n);try{for(s.s();!(t=s.n()).done;){var r=t.value;window.storeManager.store(r.q,"query")}}catch(a){s.e(a)}finally{s.f()}return n}}},{key:"updateMusicList",value:function(e){this.setMusicList(e),window.storeManager.set(this.curPlayListName,e,"list")}},{key:"modMusicList",value:function(e,t){var i=Object(b.a)(Object(b.a)({},this.musicList[e]),{},{id:t.videoId}),n=this.musicList.map((function(t,n){return e===n?i:t}));this.updateMusicList(n)}},{key:"initMusicInfo",value:function(e,t,i,n){n||(n=0),this.modMusicList(e,i[n]),window.storeManager.set(t,i,"query")}},{key:"selectMusic",value:function(e){this.setCurMusicIndex(e)}}]),e}();function Q(e){var t=e.query,i=e.selectQuery,s=e.curItemId,r=(e.hide,Object(n.useState)(null)),a=Object(c.a)(r,2),u=a[0],o=a[1],l=Object(n.useState)(0),p=Object(c.a)(l,2),h=p[0],f=p[1];Object(n.useEffect)((function(){if(!u){var e=window.storeManager.get(t,"query");e?o(e):function(e){i.apply(this,arguments)}(t)}function i(){return(i=Object(q.a)(_.a.mark((function e(t){var i;return _.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,E(t);case 3:i=e.sent,window.storeManager.set(t,i,"query"),o(i),e.next=11;break;case 8:e.prev=8,e.t0=e.catch(0),console.error(e.t0);case 11:case"end":return e.stop()}}),e,null,[[0,8]])})))).apply(this,arguments)}}),[]),Object(n.useEffect)((function(){for(var e in u)if(u[e].videoId===s){f(parseInt(e));break}}),[u,s]);return Object(d.jsx)(d.Fragment,{children:u&&Object(d.jsx)("ul",{children:u.map((function(e,t){return Object(d.jsxs)("li",{onClick:function(e){return function(e,t){e.stopPropagation(),i(u[t])}(e,t)},style:h===t?{color:"blue"}:{},children:[Object(d.jsx)("img",{src:e.thumbnail,alt:e.title}),e.title]},e.videoId)}))})})}function A(e){var t=Object(n.useState)(!1),i=Object(c.a)(t,2),s=i[0],r=i[1];return Object(d.jsxs)("div",{children:[e.ele.q," ",Object(d.jsx)("button",{onClick:function(t){return function(t,i){t.stopPropagation(),t.preventDefault(),e.deleteMusic(i)}(t,e.index)},children:" X "}),"query"===e.ele.type&&Object(d.jsx)("button",{onClick:function(e){e.stopPropagation(),r(!s)},children:"\ud3bc\uce58\uae30 "}),s&&"query"===e.ele.type&&Object(d.jsx)(Q,{query:e.ele.q,selectQuery:function(t){e.modMusicList(e.index,t)},curItemId:e.ele.id})]})}var D=Object(n.memo)((function(e){return Object(d.jsx)(C.b,{draggableId:e.ele.key,index:e.index,children:function(t,i){return Object(d.jsx)("li",Object(b.a)(Object(b.a)(Object(b.a)({ref:t.innerRef},t.draggableProps),t.dragHandleProps),{},{onClick:function(t){e.selectMusic(e.index)},children:Object(d.jsx)("div",{style:e.isCurMusic?{border:"1px solid black"}:{},children:Object(d.jsx)(A,{ele:e.ele,index:e.index,deleteMusic:e.deleteMusic,modMusicList:e.modMusicList})})}))}})}));function W(e){var t=Object(n.useState)(""),i=Object(c.a)(t,2),s=i[0],r=i[1],a=Object(f.d)(y),u=a[0],o=Object(f.d)(x),l=o[0],p=new B(a,o);V((function(e){window.player&&(e.id?window.player.loadVideoById({videoId:e.id}):E(e.q).then((function(t){window.player.loadVideoById({videoId:t[0].videoId}),p.initMusicInfo(e.idx,e.q,t,0)})).catch((function(e){console.error(e)})))}),(function(){window.player&&window.player.stopVideo&&window.player.stopVideo()})),Object(n.useEffect)((function(){e.goNextRef.current=p.goNextMusic}),[p.goNextMusic]);var h=function(){var e=Object(q.a)(_.a.mark((function e(){var t;return _.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(""!==s){e.next=2;break}return e.abrupt("return");case 2:if(!((t=s.split("\n").filter((function(e){return""!==e}))).length<1)){e.next=5;break}return e.abrupt("return");case 5:return r(""),e.next=8,p.appendMusicList(t);case 8:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}(),b=function(e){p.deleteMusic(e)};return Object(d.jsxs)("div",{className:"side",children:[Object(d.jsx)("textarea",{cols:30,rows:5,value:s,onChange:function(e){r(e.target.value)}}),Object(d.jsx)("button",{onClick:h,children:"append"}),Object(d.jsx)("br",{}),Object(d.jsx)("button",{onClick:p.goPrevMusic,children:"\uc774\uc804 "})," ",Object(d.jsx)("button",{onClick:p.goNextMusic,children:"\ub2e4\uc74c "}),Object(d.jsx)(C.a,{onDragEnd:function(e){e.destination&&p.reorderMusicList(e.source.index,e.destination.index)},onDragStart:function(e){},children:Object(d.jsx)(C.c,{droppableId:"droppable",children:function(e,t){return Object(d.jsxs)("ul",{ref:e.innerRef,children:[u.map((function(e,t){return Object(d.jsx)(D,{ele:e,index:t,selectMusic:p.selectMusic,deleteMusic:b,modMusicList:p.modMusicList,isCurMusic:l==t},e.key)})),e.placeholder]})}})})]})}var J=Object(n.memo)(W);var z=function(){var e=Object(n.useState)(!1),t=Object(c.a)(e,2),i=t[0],s=t[1],r=Object(n.useState)(""),a=Object(c.a)(r,2),u=a[0],o=a[1],p=Object(n.useRef)();return Object(n.useEffect)((function(){if(o(localStorage.youtubeKey),!window.YT){var e=document.createElement("script");e.src="https://www.youtube.com/iframe_api";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t),window.player=null;var i=Math.min(640,window.innerWidth);window.onYouTubeIframeAPIReady=function(){window.player=new window.YT.Player("player",{width:i,height:Math.round(10*i/16),events:{onStateChange:function(e){0===e.data&&p.current()},onReady:function(){return s(!0)}}})}}}),[]),Object(d.jsxs)("div",{className:"App",children:[Object(d.jsx)("div",{className:"playerwrapper",id:"player"}),!i&&Object(d.jsx)(l,{}),i&&Object(d.jsxs)("main",{children:[Object(d.jsx)("label",{children:"\uc720\ud29c\ube0c api \ud0a4"}),Object(d.jsx)("input",{type:"text",onChange:function(e){o(e.target.value),localStorage.setItem("youtubeKey",e.target.value)},value:u}),Object(d.jsx)(I,{children:" "}),Object(d.jsx)(J,{goNextRef:p})]})]})};a.a.render(Object(d.jsx)(s.a.StrictMode,{children:Object(d.jsx)(f.a,{children:Object(d.jsx)(z,{})})}),document.getElementById("root"))}},[[35,1,2]]]);
//# sourceMappingURL=main.fb6115c2.chunk.js.map