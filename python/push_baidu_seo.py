import requests
import typeguard
import urllib.parse

@typeguard.typechecked
def push_baidu_seo(site:str,token:str,urls:str):
    # 定义请求头
    headers = {
        'Content-Type': 'text/plain',
    }
    # 定义请求参数
    params = {
        'site': site,
        'token': token,
    }
    # 发送POST请求
    response = requests.post('http://data.zz.baidu.com/urls', headers=headers, params=params, data=urls)
    # 打印响应内容
    print(response.text)

if __name__ == "__main__":
    
    import sys
    
    # 检查命令行参数是否包含文件名
    if len(sys.argv) != 3:
        print("Usage: python push_baidu_seo.py sitemap_txt_path token")
        sys.exit(1)

    sitemap_txt_path = sys.argv[1]
    token = sys.argv[2]
    
    with open(sitemap_txt_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    site_counts = {}
    urls = []
    for line in lines:
        url = line.strip(' \r\n')
        parsed_url = urllib.parse.urlparse(url)
        site = parsed_url.netloc
        urls.append(parsed_url.netloc + parsed_url.path)
        if site:
            site_counts[site] = site_counts.get(site, 0) + 1
    site = max(site_counts, key=site_counts.get) # default iterator is on keys

    push_baidu_seo(site=site,token=token,urls="\r\n".join(urls))
    
    



