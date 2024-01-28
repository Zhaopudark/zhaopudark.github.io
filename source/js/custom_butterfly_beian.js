
!(function() {
    // https://hexo.io/zh-cn/api/injector.html
    // div
    //  span1
    //   link1
    //  span2
    //   link2
    //    span3
    //    img
    //    span4
    let div = document.createElement('div')
    div.className = 'beian'

    let span1 = document.createElement('span')
    let link1 = document.createElement('a')
    link1.href = 'https://beian.miit.gov.cn/'
    link1.target = '_blank'
    link1.rel = 'noopener'
    link1.textContent = '苏ICP备2023011734号-1'
    span1.appendChild(link1)
    div.appendChild(span1)

    let span2 = document.createElement('span')
    let link2 = document.createElement('a')
    link2.href = 'https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=32011502011823'; // 修改链接地址
    link2.target = '_blank'
    link2.rel = 'noopener'
    link2.className = 'beian-police'
    let span3 = document.createElement('span')
    span3.textContent = '|'
    span3.style = 'visibility: hidden; width: 0'
    let img = document.createElement('img');
    img.src = 'https://raw.little-train.com/a20583c81805fe64f7fa210851ce29754af9d25fd6aa5a3225a9557529602513.png'
    // img.style = 'vertical-align: middle; width: 20px; height: 20px; margin-left: 5px'
    img.alt = 'police-icon'
    let span4 = document.createElement('span')
    span4.textContent = '苏公网安备32011502011823号'
    link2.appendChild(span3)
    link2.appendChild(img)
    link2.appendChild(span4)
    span2.appendChild(link2)
    div.appendChild(span2)
    
    // 获取页面的<footer>元素
    const footer = document.getElementById('footer-wrap')
    // 将容器<div>元素插入到<footer>元素中
    footer.appendChild(div)
})();

  