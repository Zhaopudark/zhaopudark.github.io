import pathlib
import itertools
import panflute as pf

import urllib.parse

if __name__ == "__main__":
    import sys
    
    # 检查命令行参数是否包含文件名
    if len(sys.argv) != 5:
        print("Usage: python markdown_deployer.py <all_sitmap_path> <new_sitmap_path> <dead_sitmap_path> <robot_txt_path>")
        sys.exit(1)
    print(sys.argv)
    
    all_sitmap_path = sys.argv[1]
    new_sitmap_path = sys.argv[2]
    dead_sitmap_path = sys.argv[3]
    robot_txt_path = sys.argv[4]
    

    all_set = set()
    new_set = set()
    scheme_set = set()
    netloc_set = set()
    with open(all_sitmap_path, 'r', encoding='utf-8') as file:
        for line in file:
            temp = line.strip(' \r\n')
            if temp:
                all_set.add(temp)
    with open(new_sitmap_path, 'r', encoding='utf-8') as file:
        for line in file:
            temp = line.strip(' \r\n')
            if temp:
                new_set.add(temp)
                scheme_set.add(urllib.parse.urlparse(temp).scheme)
                netloc_set.add(urllib.parse.urlparse(temp).netloc)
    site_counts = {}
    for url in new_set:
        parsed_url = urllib.parse.urlparse(url)
        site = parsed_url.netloc
        if site:
            site_counts[site] = site_counts.get(site, 0) + 1
    site = max(site_counts, key=site_counts.get) # default iterator is on keys
    new_set.add(f"https://{site}/sitemap.xml")
    new_set.add(f"https://{site}/sitemap.txt")
    new_set.add(f"https://{site}/atom.xml")
    new_set.add(f"https://{site}/index.html")
    all_set.update(new_set)
    
    with open(all_sitmap_path, 'w', encoding='utf-8') as file:
        for item in sorted(all_set):
            file.write(f"{item}\n")
    
    dead_set = all_set - new_set

    with open(dead_sitmap_path, 'w', encoding='utf-8') as file:
        for item in sorted(dead_set):
            file.write(f"{item}\n")
    # print(dead_set)
    with open(robot_txt_path, 'w', encoding='utf-8') as file:
        for scheme,netloc in itertools.product(sorted(scheme_set),sorted(netloc_set)):
            file.write(f"Sitemap: {scheme}://{netloc}/sitemap.xml\n")
            file.write(f"Sitemap: {scheme}://{netloc}/sitemap.txt\n")
        file.write(f"User-agent: *\n")
        for item in sorted(dead_set):
            file.write(f"Disallow: {urllib.parse.urlparse(item).path}\n")