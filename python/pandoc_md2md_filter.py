#!/usr/bin/env python
import pathlib
import logging
import threading
import asyncio
import functools
import datetime
import typeguard
import zlib
import panflute as pf
import pandoc_filter

@typeguard.typechecked
def finalize(doc:pf.Doc=None,**kwargs):
    # metadata_dict =  doc.get_metadata() # See http://scorreia.com/software/panflute/code.html#:~:text=add%20attributes%20freely-,get_metadata,-(%5Bkey
    # doc.metadata = pf.MetaMap(**metadata_dict)

    runtime_dict:dict = doc.runtime_dict
    if runtime_dict.get('math'):
        doc.metadata['math'] = doc.runtime_dict['math']
        doc.metadata['mathjax'] = doc.runtime_dict['math']

    doc.metadata['date'] = datetime.datetime.fromtimestamp(kwargs['doc_path'].stat().st_ctime).strftime('%Y-%m-%d %H:%M:%S')
    doc.metadata['updated'] = datetime.datetime.fromtimestamp(kwargs['doc_path'].stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
    current_abbrlink = hex(zlib.crc32(bytes(doc.get_metadata(key='title',default='').encode('utf-8'))))[2::] # eliminate the '0x' prefix
    # global_abbrlink_file_recoder = kwargs['global_abbrlink_file_recoder']
    # if current_abbrlink in global_abbrlink_file_recoder:
    #     raise Exception(f"The abbrlink `{current_abbrlink}` has already been used for file {global_abbrlink_file_recoder[current_abbrlink]}, but the file {kwargs['doc_path']} also want to use the same abbrlink.")
    # else:
    #     global_abbrlink_file_recoder[current_abbrlink] = kwargs['doc_path']
    doc.metadata['abbrlink'] = current_abbrlink

# def main(doc=None,**kwargs):
#     check_pandoc_version(required_version='3.1.0')
#     _finalize = functools.partial(finalize,**kwargs)
    
#     return pf.run_filters(actions= [math_filter,figure_filter,footnote_filter,internal_link_filter],finalize=_finalize,doc=doc,**kwargs)


def convert_md2md(markdown_content:str,file_path:pathlib.Path,target_dir:str):
    doc = pf.convert_text(markdown_content,input_format='markdown',output_format='panflute',standalone=True)
    if doc.get_metadata():
        output_path = pathlib.Path(f"{target_dir}/{file_path.stem}.md")
        pandoc_filter.run_filters_pyio(
            file_path,
            output_path,
            'markdown',
            'gfm',
            [pandoc_filter.filters.md2md.convert_github_style_alert_to_hexo_style_alert.run_filter,
            pandoc_filter.filters.md2md.enhance_equation.run_filter,
            # pandoc_filter.filters.md2md.upload_figure_to_aliyun.run_filter,
            pandoc_filter.filters.md2md.move_figure_to_new_place.run_filter,
            pandoc_filter.filters.md2md.norm_footnote.run_filter,
            pandoc_filter.filters.md2md.norm_internal_link.run_filter],
            doc_path=file_path,
            finalize=finalize)
    
def main(notes_dir,target_dir):
    for file_path in pathlib.Path(notes_dir).glob('**/*.md'):
        with open(file_path, "r", encoding="utf-8") as f:
            markdown_content = f.read()
        convert_md2md(markdown_content,file_path,target_dir)

if __name__ == "__main__":
    
    import sys
    # 检查命令行参数是否包含文件名
    if len(sys.argv) != 3:
        print("Usage: python markdown_deployer.py <notes_dir> <target_dir>")
        sys.exit(1)
    print(sys.argv)
    
    main(notes_dir=sys.argv[1],target_dir=sys.argv[2])

    
        