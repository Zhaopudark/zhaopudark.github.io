// Tabs
hexo.extend.injector.register('body_end', '<script src="/js/custom_butterfly_tabs.js"></script>', 'default');

// 脚注优化
hexo.extend.injector.register('body_end', '<script src="/js/custom_any_theme_footnotes.js"></script>', 'default');

// Mermaid 支持 
// fluid 主题已经支持 
// 使用Butterfly主题时，需要 highlight.js 中排除 mermaid 语言
// https://mermaid.js.org/config/usage.html
hexo.extend.injector.register('head_begin',`
<script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
    mermaid.initialize({ startOnLoad: true });
</script>`, 'default');


// 文章过期提醒 fluid 主题已经支持, butterfly 主题也已经支持
// hexo.extend.injector.register('body_end', '<script src="/js/custom_butterfly_effectiveness.js"></script>', 'default');

// 网站验证
hexo.extend.injector.register('head_begin', '<meta name="google-site-verification" content="KMaXxrtGJ9Xt5cfCUVmMkw_yx9H-FbT1QTHRnFgbgs4" />', 'default');
hexo.extend.injector.register('head_begin', '<meta name="msvalidate.01" content="583ECF6709822452DAE4B2FB14C2C186" />', 'default');
hexo.extend.injector.register('head_begin', '<meta name="baidu-site-verification" content="codeva-fNj6vfIb7O" />', 'default');
hexo.extend.injector.register('head_begin', '<meta name="sogou_site_verification" content="eX0jGNDgtW" />', 'default');
hexo.extend.injector.register('head_begin', '<meta name="360-site-verification" content="8c1cafbcf1d9463041934de7f3a579e6" />', 'default');

// 谷歌分析 https://analytics.google.com/analytics/web/#/a237937210p409837382/admin/streams/table/6248848966
hexo.extend.injector.register('head_end',
`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2L7NJECPKS"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-2L7NJECPKS');
</script>
`, 'default');


//  插入谷歌广告 google adsense
// https://www.google.com/adsense/new/u/0/pub-6860412394338824/myads/sites
hexo.extend.injector.register('head_begin', '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6860412394338824" crossorigin="anonymous"></script>', 'default');

//  ICP 与 公安联网备案
hexo.extend.injector.register('body_end', '<script src="/js/custom_butterfly_beian.js"></script>', 'default');

// 本站安全运行周期  butterfly 主题已经支持
// hexo.extend.injector.register('body_end', '<script src="/js/custom_butterfly_duration.js"></script>', 'default');






// CSS 隐藏 liveRe 广告
hexo.extend.injector.register('head_begin', '<link rel="stylesheet" href="/css/custom_any_theme_hide-livere-ads.css"></link>', 'default');

// CSS 自定义图标颜色
// hexo.extend.injector.register('head_begin', '<link rel="stylesheet" href="/css/custom_fluid_icon.css"></link>', 'default');

// CSS 规范化 pandoc 渲染后的的图片的 caption fluid 主题已经支持, butterfly 主题虽然支持，但是会导致重复加载，所以这里仍然需要注入
hexo.extend.injector.register('head_begin', '<link rel="stylesheet" href="/css/custom_butterfly_norm-pandoc-figure-caption.css"></link>', 'default');

