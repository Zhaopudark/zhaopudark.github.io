!(function() {
    // https://hexo.fluid-dev.com/posts/hexo-injector/
    let times = document.getElementsByTagName('time');
    if (times.length === 0) { return; }

    let posts = document.getElementsByClassName('post-content');
    if (posts.length === 0) { return; }
    let post = posts[0];

    let pubTime = new Date(times[0].dateTime);  /* 文章发布时间戳 */
    let now = Date.now()  /* 当前时间戳 */
    let interval = parseInt((now - pubTime)/3600/24/1000)  /* 转换为天 */

    /* 发布时间超过指定时间（毫秒） */
    if (interval > 30){
        // div 
        //  p1
        //   div # h6
        //   p2
        let postWarn = document.createElement('div');
        // postWarn.className = 'note note-warning'
        postWarn.className = 'note warning flat'
        // fluid主题采用`note note-info` `note note-warning`等类名来实现不同的提示框样式，这里借用warning 样式来美化过期提醒
        // butterfly主题采用`note info flat` note warning flat`等类名来实现不同的提示框样式，这里借用warning 样式来美化过期提醒
        // https://butterfly.js.org/posts/4aa8abbe/#Note-Bootstrap-Callout
        postWarn.style = 'font-size:0.9rem';
        
        p1 = document.createElement('p');
        div = document.createElement('div')
        div.className = 'h6'
        div.textContent = '文章时效性提示'
        p1.appendChild(div)
        p2 = document.createElement('p');
        p2.textContent = '这是一篇发布于 ' + interval + ' 天前的文章，部分信息可能已发生改变，请注意甄别。';
        p1.appendChild(p2);
        postWarn.appendChild(p1);
      
        if (post.firstChild) {
            post.insertBefore(postWarn, post.firstChild);
        } else {
            post.appendChild(postWarn); // 如果<div>没有子元素，直接添加
        }
    }
})();
  