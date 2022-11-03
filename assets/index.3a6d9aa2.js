(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))a(t);new MutationObserver(t=>{for(const e of t)if(e.type==="childList")for(const s of e.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&a(s)}).observe(document,{childList:!0,subtree:!0});function i(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerpolicy&&(e.referrerPolicy=t.referrerpolicy),t.crossorigin==="use-credentials"?e.credentials="include":t.crossorigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function a(t){if(t.ep)return;t.ep=!0;const e=i(t);fetch(t.href,e)}})();document.querySelector("#app").innerHTML=`
<nav>
    <ul>
      <li>
      <a href="https://twitter.com/yourclxrity" target="_blank" class="fa fa-twitter"></a>
      </li>
      <li>
      <a href="https://instagram.com/mjxnglin" target="_blank" class="fa fa-instagram"></a>
      </li>
      <li>
      <a href="https://soundcloud.com/clxrityy" target="_blank" class="fa fa-soundcloud"></a>
      </li>
      <li>
      <a href="https://open.spotify.com/user/mjanglin" target="_blank" class="fa fa-spotify"></a>
      </li>
    </ul>
  </nav>
<div id='app-body'>
  <div>
    <a href="https://clxrity.xyz" target="_blank">
      <img src="/assets/clxrity.png" class="logo" alt="clxrity" />
    </a>
    <h1 class="title">clxrity</h1>
    <p class="name">
      mj anglin
    </p>
    </div>
    <div class="proj-b">
    <div class="projects-p">
    <p class="proj">stuff</p>
    </div>
    <div class="projects">
      <a href="https://collabrity.xyz" target="_blank">
        <img src="/assets/collabrity.png" class="collabrity" alt="collabrity" />
      </a>
      <a href="https://github.com/clxrityy" target="_blank">
        <img src="/assets/github-logo.gif" class="github" alt="github" />
      </a>
      </div>
      <a href="https://discord.gg/6G87pRmBG8" target="_blank">
        <img src='/assets/discord-logo.gif' class="discord" alt="discord" />
      </a>
    </div>
</div>
`;
