import uuid
import os
import io
import json
import redis as redis_lib
from fastapi import APIRouter, Body, Query, HTTPException, Request
from fastapi.responses import StreamingResponse, FileResponse, Response
from pypdf import PdfReader, PdfWriter
from dotenv import load_dotenv
from schemas.chat import SessionResponse, ChatRequest
from service.core.retrieval import retrieve_content_with_trace, list_documents
from service.core.chat import get_chat_completion
from utils import logger

load_dotenv()

router = APIRouter()

DAILY_LIMIT = int(os.getenv("DAILY_MESSAGE_LIMIT", "20"))
DOCS_DIR = os.getenv("DOCS_DIR", "/app/docs")


def _redis():
    return redis_lib.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=int(os.getenv("REDIS_DB", 0)),
        decode_responses=True,
    )


def check_rate_limit(guest_id: str) -> None:
    """Redis counter for the daily guest message limit."""
    if not guest_id:
        raise HTTPException(status_code=400, detail="Missing X-Guest-ID header")
    try:
        r = _redis()
        key = f"rate:{guest_id}"
        count = r.get(key)
        if count and int(count) >= DAILY_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=f"You have reached the daily limit of {DAILY_LIMIT} messages. Please try again tomorrow.",
            )
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 86400)
        pipe.execute()
    except HTTPException:
        raise
    except Exception as e:
        # Allow the request if Redis is unavailable so the app stays usable.
        logger.warning(f"Rate limit check failed, allowing request: {e}")


@router.post("/create_session", response_model=SessionResponse)
async def create_session():
    session_id = str(uuid.uuid4()).replace("-", "")[:16]
    return {
        "session_id": session_id,
        "status": "success",
        "message": "Session created successfully",
    }


PREVIEW_MAX_PAGES = 20

@router.get("/preview/{filename:path}")
async def preview_document(filename: str):
    file_path = os.path.join(DOCS_DIR, filename)
    if not os.path.realpath(file_path).startswith(os.path.realpath(DOCS_DIR)):
        raise HTTPException(status_code=400, detail="Invalid path")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    reader = PdfReader(file_path)
    writer = PdfWriter()
    for i, page in enumerate(reader.pages):
        if i >= PREVIEW_MAX_PAGES:
            break
        writer.add_page(page)

    buf = io.BytesIO()
    writer.write(buf)
    buf.seek(0)
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="preview.pdf"'},
    )


@router.get("/documents")
async def get_documents():
    try:
        docs = list_documents()
        return {"documents": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat_on_docs")
async def chat_on_docs(
    request: Request,
    session_id: str = Query(...),
    body: ChatRequest = Body(...),
):
    guest_id = request.headers.get("X-Guest-ID", "")
    check_rate_limit(guest_id)

    question = body.message
    logger.info(f"guest={guest_id[:8]}... session={session_id} q={question[:60]}")

    def event_stream():
        references = []
        try:
            trace = retrieve_content_with_trace(question)
            while True:
                try:
                    step = next(trace)
                    yield f"event: message\ndata: {json.dumps({'rag_trace': step}, ensure_ascii=False)}\n\n"
                except StopIteration as result:
                    references = result.value or []
                    break
            logger.info(f"Retrieved {len(references)} chunks")
        except Exception as e:
            logger.warning(f"Retrieval failed: {e}")
            step = {
                "id": "search",
                "title": "Retrieval",
                "status": "error",
                "description": str(e),
            }
            yield f"event: message\ndata: {json.dumps({'rag_trace': step}, ensure_ascii=False)}\n\n"

        llm_step = {
            "id": "llm",
            "title": "LLM Answer",
            "status": "running",
            "description": "Sending the packed context to Qwen and streaming the answer back.",
            "details": {
                "model": "qwen2.5-72b-instruct",
                "context_chunks": len(references),
            },
        }
        yield f"event: message\ndata: {json.dumps({'rag_trace': llm_step}, ensure_ascii=False)}\n\n"

        yield from get_chat_completion(session_id, question, references)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
