
!(function() {
    const allTabButtons = document.querySelectorAll ('div.tabs > ul.nav-tabs > button.tab');
    const buttonFnTemp = e => {
        // console.log('按钮被点击了！');
        allTabButtons.forEach(button => {
            button.removeEventListener('click', buttonFnTemp);
        });
        let currentTab = e.target
        let currentNavTab = currentTab.parentElement
        document.querySelectorAll('div.tabs > ul.nav-tabs').forEach(navTab => {
            if (navTab!=currentNavTab){
                let targetTab; 
                for (let tab of navTab.querySelectorAll('button.tab:not(.active)')){
                    if(tab.textContent == e.target.textContent){
                        targetTab = tab;
                        break;
                    }   
                }
                if (targetTab != undefined ){
                    should_refresh_button = false;
                    targetTab.click();
                }    
            }
        });
        document.querySelectorAll('div.tabs > ul.nav-tabs').forEach(navTab => {
            if (navTab!=currentNavTab){
                navTab.querySelectorAll('button.tab:not(.active)').forEach(tab => {
                    tab.addEventListener('click', buttonFnTemp)
                });
            }else{
                navTab.querySelectorAll('button.tab').forEach(tab => {
                    if (tab!=currentTab){
                        tab.addEventListener('click', buttonFnTemp)
                    }
                });
            }
        });
    }
    let inactiveButtons = document.querySelectorAll ('div.tabs > ul.nav-tabs > button.tab:not(.active)');
    inactiveButtons.forEach(button => {
    // console.log(button.innerText);
    button.addEventListener('click', buttonFnTemp);
    });
})();

  