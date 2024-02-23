import pathlib
import itertools
import typeguard
import logging
import panflute as pf

import urllib.parse

from bs4 import BeautifulSoup
import datetime

from collections import namedtuple

@typeguard.typechecked
def get_date_with_urls(posts_path:str,site:str)->list[tuple[datetime.datetime,str]]:
    date_with_urls = []
    for file_path in pathlib.Path(posts_path).glob('**/*.md'):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                markdown_content = f.read()
            doc = pf.convert_text(markdown_content,input_format='markdown',output_format='panflute',standalone=True)
            metadata_dict = doc.get_metadata()
            if not (doc.get_metadata(key='hide',default=False)):
                # print(metadata_dict)
                url = f"https://{site}/posts/{metadata_dict['abbrlink']}.html"
                date = datetime.datetime.strptime(metadata_dict['updated'],"%Y-%m-%d %H:%M:%S")
                date_with_urls.append((date,url))
        except Exception as e:
            logging.error(e)
        finally:
            f.close()
    return date_with_urls

@typeguard.typechecked
def dump_site_maps_to_xml(file_path:str, date_with_urls:list[tuple[datetime.datetime,str]]):
    
    date_with_urls.sort(key=lambda x: x[0].strftime("%Y-%m-%d %H:%M:%S"), reverse=True)
    
    # 创建 XML 文档对象
    xml_doc = BeautifulSoup(features="xml")
    
    # 创建urlset
    urlset = xml_doc.new_tag("urlset")
    urlset.attrs["xmlns"] = "http://www.sitemaps.org/schemas/sitemap/0.9"
    for date,url in date_with_urls:

        url_tag = xml_doc.new_tag("url")
        loc = xml_doc.new_tag("loc")
        loc.string = url
        url_tag.append(loc)
        
        lastmod = xml_doc.new_tag("lastmod")
        # validate date format and convert to target date format
        lastmod.string = date.strftime("%Y-%m-%d")
        url_tag.append(lastmod)
        
        changefreq = xml_doc.new_tag("changefreq")
        changefreq.string = "monthly"
        url_tag.append(changefreq)
        
        priority = xml_doc.new_tag("priority")
        priority.string = "0.8"
        url_tag.append(priority)
        
        urlset.append(url_tag)

    # 将根元素添加到 XML 文档对象
    xml_doc.append(urlset)
    # 将 XML 文档写入文件
    with open(file_path, "w", encoding='utf-8') as f:
        f.write(str(xml_doc.prettify()))

@typeguard.typechecked
def dump_site_maps_to_txt(file_path:str, urls_set:set[str]):
    with open(file_path, "w", encoding='utf-8') as f:
        for item in sorted(urls_set):
            f.write(f"{item}\n")

def main(sitemap_all_path,posts_path,sitemap_xml_path,sitemap_txt_path,sitemap_dead_path,robot_txt_path):
    all_set = set()
    with open(sitemap_all_path, 'r', encoding='utf-8') as file:
        for line in file:
            temp = line.strip(' \r\n')
            if temp:
                all_set.add(temp)
    
    site_counts = {}
    for url in all_set:
        parsed_url = urllib.parse.urlparse(url)
        site = parsed_url.netloc
        if site:
            site_counts[site] = site_counts.get(site, 0) + 1
    site = max(site_counts, key=site_counts.get) # default iterator is on keys

    date_with_urls = get_date_with_urls(posts_path,site)
    dump_site_maps_to_xml(sitemap_xml_path, date_with_urls)
    
    new_set = set([url for _,url in date_with_urls])
    dump_site_maps_to_txt(sitemap_txt_path, new_set)
    
    new_set.add(f"https://{site}/sitemap.xml")
    new_set.add(f"https://{site}/atom.xml")
    new_set.add(f"https://{site}/index.html")
    new_set.add(f"https://{site}/sitemaps.dead.txt")
    new_set.add(f"https://{site}/robots.txt")
    new_set.add(f"https://{site}/ddaa8128e40b45f9a08905b37f52607a.txt")
    new_set.add(f"https://{site}/ads.txt")

    all_set.update(new_set)
    dump_site_maps_to_txt(sitemap_all_path, all_set)
    
    dead_set = all_set - new_set
    dump_site_maps_to_txt(sitemap_dead_path, dead_set)

    with open(robot_txt_path, 'w', encoding='utf-8') as file:
        file.write(f"Sitemap: https://{site}/sitemap.xml\n")
        file.write(f"User-agent: *\n")
        for item in sorted(dead_set):
            file.write(f"Disallow: {urllib.parse.urlparse(item).path}\n")
        for item in sorted(new_set):
            file.write(f"Allow: {urllib.parse.urlparse(item).path}\n")
if __name__ == "__main__":
    import sys
    
    # 检查命令行参数是否包含文件名
    if len(sys.argv) != 7:
        print("Usage: python markdown_deployer.py <sitemap_all_path> <posts_path> <sitemap_xml_path> <sitemap_txt_path> <sitemap_dead_path> <robot_txt_path>")
        sys.exit(1)
    print(sys.argv)
    
    # sitemap_all_path = sys.argv[1]
    # posts_path = sys.argv[2]
    # sitemap_xml_path = sys.argv[3]
    # sitemap_txt_path = sys.argv[4]
    # sitemap_dead_path = sys.argv[5]
    # robot_txt_path = sys.argv[6]
    
    main(sitemap_all_path=sys.argv[1],
        posts_path=sys.argv[2],
        sitemap_xml_path=sys.argv[3],
        sitemap_txt_path=sys.argv[4],
        sitemap_dead_path=sys.argv[5],
        robot_txt_path=sys.argv[6])
    
   