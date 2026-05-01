"""
预置文档建索引脚本 — 在部署前本地运行一次即可。

用法：
    cd backend
    python index_documents.py path/to/doc1.pdf path/to/doc2.pdf ...

或者把文件都放在 docs/ 目录，直接运行：
    python index_documents.py

脚本会把文档解析、分块、生成 embedding，写入 Qdrant Cloud。
之后线上服务只做查询，不做写入。
"""

import sys
import os

# 把 app 目录加到 path，让 service/* 的 import 能找到
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from service.core.file_parse import execute_insert_process
from service.core.rag.utils.qdrant_conn import QdrantConnection

DOCS_DIR = os.path.join(os.path.dirname(__file__), "docs")

SUPPORTED_EXT = {".pdf", ".docx", ".txt", ".md", ".xlsx", ".html"}


def collect_files(paths: list[str]) -> list[tuple[str, str]]:
    """返回 (file_path, file_name) 列表"""
    result = []
    for p in paths:
        if os.path.isfile(p):
            ext = os.path.splitext(p)[1].lower()
            if ext in SUPPORTED_EXT:
                result.append((p, os.path.basename(p)))
            else:
                print(f"[skip] 不支持的格式: {p}")
        elif os.path.isdir(p):
            for fname in os.listdir(p):
                ext = os.path.splitext(fname)[1].lower()
                if ext in SUPPORTED_EXT:
                    result.append((os.path.join(p, fname), fname))
    return result


def main():
    # 没有传参数时，默认读 docs/ 目录
    paths = sys.argv[1:] if len(sys.argv) > 1 else [DOCS_DIR]

    files = collect_files(paths)
    if not files:
        print(f"没有找到可处理的文档，请把文件放到 docs/ 目录或作为参数传入。")
        return

    # 确保 Qdrant collection 存在
    qdrant = QdrantConnection()
    qdrant.ensure_collection()
    print(f"Qdrant collection: {qdrant.collection}")

    print(f"\n共 {len(files)} 个文件待处理：")
    for fp, fn in files:
        print(f"  {fn}")

    print()
    for fp, fn in files:
        print(f"→ 处理: {fn}")
        try:
            execute_insert_process(fp, fn)
        except Exception as e:
            print(f"  [ERROR] {fn}: {e}")

    print("\n全部完成！")


if __name__ == "__main__":
    main()
