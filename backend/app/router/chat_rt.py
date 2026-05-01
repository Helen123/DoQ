import uuid
import os
import io
import redis as redis_lib
from fastapi import APIRouter, Body, Query, HTTPException, Request
from fastapi.responses import StreamingResponse, FileResponse, Response
from pypdf import PdfReader, PdfWriter
from dotenv import load_dotenv
from schemas.chat import SessionResponse, ChatRequest
from service.core.retrieval import retrieve_content, list_documents
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
    """Redis 计数器，每个 guest_id 每天限制 DAILY_LIMIT 条消息。"""
    if not guest_id:
        raise HTTPException(status_code=400, detail="Missing X-Guest-ID header")
    try:
        r = _redis()
        key = f"rate:{guest_id}"
        count = r.get(key)
        if count and int(count) >= DAILY_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=f"每日 {DAILY_LIMIT} 条消息的限额已用完，明天再来吧！",
            )
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 86400)
        pipe.execute()
    except HTTPException:
        raise
    except Exception as e:
        # Redis 故障时放行，避免服务不可用
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

    try:
        references = retrieve_content(question)
        logger.info(f"Retrieved {len(references)} chunks")
    except Exception as e:
        logger.warning(f"Retrieval failed: {e}")
        references = []

    return StreamingResponse(
        get_chat_completion(session_id, question, references),
        media_type="text/event-stream",
    )
