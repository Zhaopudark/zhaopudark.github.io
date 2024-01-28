{/* <p>which1.<a href="#fn1" class="footnote-ref" id="fnref1" role="doc-noteref"><sup>1</sup></a></p>
<p>which2.<a href="#fn2" class="footnote-ref" id="fnref2" role="doc-noteref"><sup>2</sup></a></p>
<p>which3.<a href="#fn3" class="footnote-ref" id="fnref3" role="doc-noteref"><sup>3</sup></a></p>

<ol>
<li id="fn1"><p>https://zzz<a href="#fnref1" class="footnote-back" role="doc-backlink">↩︎</a></p></li>
<li id="fn2"><p>https://zzz<a href="#fnref2" class="footnote-back" role="doc-backlink">↩︎</a></p></li>
<li id="fn3"><p>https://zzz<a href="#fnref3" class="footnote-back" role="doc-backlink">↩︎</a></p></li>
</ol> */}


{/* <p>which1.<a href="#fn1" class="footnote-ref" id="fnref1" role="doc-noteref"><sup>1</sup></a></p>
<p>which2.<a href="#fn2" class="footnote-ref" id="fnref2" role="doc-noteref"><sup>2</sup></a></p>
<p>which3.<a href="#fn3" class="footnote-ref" id="fnref3" role="doc-noteref"><sup>3</sup></a></p>

<ol>
<li id="fn1"><p>https://zzz<a href="#fnref1" class="footnote-back" role="doc-backlink">↩︎</a></p></li>
<li id="fn2"><p>https://zzz<a href="#fnref2" class="footnote-back" role="doc-backlink">↩︎</a></p></li>
<li id="fn3"><p>https://zzz<a href="#fnref3" class="footnote-back" role="doc-backlink">↩︎</a></p></li>
</ol> */}

// reference https://www.runoob.com/html/html-links.html
// 由于历史原因，现代浏览器，优先推荐使用id属性来承接href的调整，而不是name属性

!(function() {
    document.addEventListener("DOMContentLoaded", function() {
        // 查找所有带有 "footnote-ref" 类的超链接
        const footnoteRefs  = document.querySelectorAll("a.footnote-ref[role='doc-noteref']")
        let footnote_stamp_content_map = new Map();
        let footnote_stamp_count_map = new Map();
        let footnote_stamp_index_map = new Map();
        //

        function getNewSpanToReplaceLink(link,count,index) {
            let spanElement = document.createElement('span')
            spanElement.appendChild(document.createTextNode(' | '))
            new_link = link.cloneNode(true)
            // new_link.innerHTML = `↩︎<sup>${String.fromCharCode(96 + count)}</sup>`
            // new_link.innerHTML = '↩︎'
            spanElement.appendChild(new_link)
            return spanElement
        }

        footnoteRefs.forEach(ref => {  
            let ref_href_string  = ref.getAttribute('href')

            //剔除开头'#'号
            let ref_bak = document.getElementById(ref_href_string.substring(1))
            
            //getElementsByTagName 返回的是一个类似于python list 的集合
            //querySelector 却可以直接返回一个元素，在这里更方便
            let ref_bak_p = ref_bak.querySelector('p')
            let ref_bak_a = ref_bak_p.querySelector("a.footnote-back[role='doc-backlink']")
            let ref_bak_p_text = ref_bak_a.previousSibling;
            
            
            ref_bak_a.setAttribute('id',ref_bak.getAttribute('id'))
            ref_bak.removeAttribute('id')
            
            let base64_encoded_text = btoa(encodeURIComponent(ref_bak_p_text.textContent)).toString(); // 因为可能会有base64不支持的字符，所以需要先进行编码
            if (!footnote_stamp_content_map.has(base64_encoded_text)){
                footnote_stamp_content_map.set(base64_encoded_text,ref_bak)
                footnote_stamp_count_map.set(base64_encoded_text,1)
                footnote_stamp_index_map.set(base64_encoded_text,footnote_stamp_content_map.size)
                ref_bak_p.replaceChild(getNewSpanToReplaceLink(ref_bak_a,footnote_stamp_count_map.get(base64_encoded_text),footnote_stamp_index_map.get(base64_encoded_text)), ref_bak_a)
            }else{
                let old_ref_bak = footnote_stamp_content_map.get(base64_encoded_text)

                footnote_stamp_count_map.set(base64_encoded_text, footnote_stamp_count_map.get(base64_encoded_text)+ 1);

                old_ref_bak.querySelector('p').appendChild(getNewSpanToReplaceLink(ref_bak_a,footnote_stamp_count_map.get(base64_encoded_text),footnote_stamp_index_map.get(base64_encoded_text)))
                ref_bak.remove()
                let ref_sup = ref.querySelector('sup');
                ref_sup.innerHTML = Array.from(footnote_stamp_content_map.keys()).indexOf(base64_encoded_text)+1
            }
            
            // console.log(base64_encoded_text) 
            // console.log(atob(base64_encoded_text))
            // console.log(decodeURIComponent(atob(base64_encoded_text)))
        })
        console.log(footnote_stamp_count_map)
    })
})();