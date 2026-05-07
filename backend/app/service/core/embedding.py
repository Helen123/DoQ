import os
from typing import List

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def generate_embedding(
    text: str | List[str],
    api_key: str | None = None,
    base_url: str | None = None,
    model_name: str = "text-embedding-v3",
    dimensions: int = 1024,
    encoding_format: str = "float",
    max_batch_size: int = 10,
):
    api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
    base_url = base_url or os.getenv("DASHSCOPE_BASE_URL")

    client = OpenAI(api_key=api_key, base_url=base_url)

    if isinstance(text, str):
        try:
            completion = client.embeddings.create(
                model=model_name,
                input=text,
                dimensions=dimensions,
                encoding_format=encoding_format,
            )
            return completion.data[0].embedding
        except Exception as e:
            print(f"OpenAI API 请求失败: {e}")
            return None

    if isinstance(text, list):
        all_embeddings = []
        for i in range(0, len(text), max_batch_size):
            batch = text[i:i + max_batch_size]
            try:
                completion = client.embeddings.create(
                    model=model_name,
                    input=batch,
                    dimensions=dimensions,
                    encoding_format=encoding_format,
                )
                all_embeddings.extend(item.embedding for item in completion.data)
            except Exception as e:
                print(f"OpenAI API 批量请求失败 (batch {i // max_batch_size + 1}): {e}")
                all_embeddings.extend([None] * len(batch))
        return all_embeddings

    return None
