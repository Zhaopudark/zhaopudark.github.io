!(function() {
    // https://hexo.fluid-dev.com/posts/fluid-footer-custom/
    /** 计时起始时间，自行修改 **/
    const footer =  document.getElementById('footer-wrap')
    let container = document.createElement('div');
    let span1 = document.createElement('span');
    span1.id = 'time_date';
    span1.textContent = '载入天数...';
    let span2 = document.createElement('span');
    span2.id = 'times';
    span2.textContent = '载入时分秒...';

    container.appendChild(span1);
    container.appendChild(span2);

    footer.appendChild(container);

    let start = new Date("2022/06/01 00:00:00");
  
    function update() {
        let now = new Date();
        now.setTime(now.getTime()+250);
        let days = (now - start) / 1000 / 60 / 60 / 24;
        let dnum = Math.floor(days);
        let hours = (now - start) / 1000 / 60 / 60 - (24 * dnum);
        let hnum = Math.floor(hours);
        if(String(hnum).length === 1 ){
            hnum = "0" + hnum;
        }
        let minutes = (now - start) / 1000 /60 - (24 * 60 * dnum) - (60 * hnum);
        let mnum = Math.floor(minutes);
        if(String(mnum).length === 1 ){
            mnum = "0" + mnum;
        }
        let seconds = (now - start) / 1000 - (24 * 60 * 60 * dnum) - (60 * 60 * hnum) - (60 * mnum);
        let snum = Math.round(seconds);
        if(String(snum).length === 1 ){
            snum = "0" + snum;
        }
        document.getElementById("time_date").innerHTML = "本站安全运行&nbsp"+dnum+"&nbsp天";
        document.getElementById("times").innerHTML = hnum + "&nbsp小时&nbsp" + mnum + "&nbsp分&nbsp" + snum + "&nbsp秒";
    }
    update();
    setInterval(update, 1000);
})();