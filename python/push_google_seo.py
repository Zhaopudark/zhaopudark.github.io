import typeguard
from oauth2client.service_account import ServiceAccountCredentials
import httplib2
import json

@typeguard.typechecked
def push_google_seo(sitemap_txt_path:str,sitemap_dead_txt_path:str,json_key_path:str):
    SCOPES = [ "https://www.googleapis.com/auth/indexing" ]
    ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"
    credentials = ServiceAccountCredentials.from_json_keyfile_name(json_key_path, scopes=SCOPES)
    http = credentials.authorize(httplib2.Http())

    with open(sitemap_txt_path, 'r', encoding='utf-8') as file:
        for line in file:
            temp = line.strip(' \r\n')
            if temp:
                content = {
                    "url": temp,
                    "type": "URL_DELETED"
                }
                # logger.info(json.dumps(content))
                response, content = http.request(ENDPOINT, method="POST", body=json.dumps(content))
                print(f"response: {response}")

    with open(sitemap_dead_txt_path, 'r', encoding='utf-8') as file:
        for line in file:
            temp = line.strip(' \r\n')
            if temp:
                content = {
                    "url": temp,
                    "type": "URL_UPDATED"
                }
                # logger.info(json.dumps(content))
                response, content = http.request(ENDPOINT, method="POST", body=json.dumps(content))
                print(f"response: {response}")

if __name__ == "__main__":
    
    import sys
    
    # 检查命令行参数是否包含文件名
    if len(sys.argv) != 4:
        print("Usage: python push_google_seo.py sitemap_txt_path sitemap_dead_txt_path json_key_path")
        sys.exit(1)

    sitemap_txt_path = sys.argv[1]
    sitemap_dead_txt_path = sys.argv[2]
    json_key_path = sys.argv[3]
    
    push_google_seo(
        sitemap_txt_path=sitemap_txt_path,
        sitemap_dead_txt_path=sitemap_dead_txt_path,
        json_key_path=json_key_path)
    
    



