import requests
import typeguard
import urllib.parse
import logging

@typeguard.typechecked
def push_bing_index_now(site:str,token:str,urls:list[str]):
    # 定义请求头
    headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Host': 'api.indexnow.org'
    }
    # 定义要发送的数据
    data = {
        "host": site,
        "key": token,
        "keyLocation": f"https://{site}/{token}.txt",
        "urlList": urls
    }
    # 发送POST请求
    response = requests.post('https://api.indexnow.org/IndexNow', headers=headers, json=data)
    # 打印响应内容
    logging.info(response.status_code)  # 打印响应状态码
    logging.info(response.text)  # 打印响应内容

if __name__ == "__main__":
    
    import sys
    
    # 检查命令行参数是否包含文件名
    if len(sys.argv) != 3:
        print("Usage: python push_bing_index_now.py sitemap_txt_path token")
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

    push_bing_index_now(site=site,token=token,urls=urls)