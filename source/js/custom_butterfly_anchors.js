
!(function() {
    // <h2 id="內容"><a href="#內容" class="headerlink" title="內容" data-pjax-state=""></a>內容</h2>
    const headings = document.querySelectorAll('h2, h3, h4, h5, h6');
    // 遍历每个标题元素
    headings.forEach(heading => {
        // 创建一个 <a> 元素
        const anchor = document.createElement('a');
        
        // 为 <a> 元素设置 href 属性，值为 # 加上当前标题的 id
        // 确保每个标题都有唯一的 id
        if (!heading.id) {
        heading.id = heading.textContent;
        }
        anchor.href = `#${heading.id}`;
        anchor.title = heading.textContent;
        anchor.className = 'headerlink';
    
        // 将 <a> 元素添加到标题元素中
        heading.insertBefore(anchor,heading.firstChild);
    });
})();

  