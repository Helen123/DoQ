# 智能文档问答系统

基于 RAG（检索增强生成）技术的智能文档问答系统，支持知识库管理与多格式文档解析。

## 环境要求

- Docker & Docker Compose
- Node.js 18+
- Python 3.9+（仅用于 xgboost 模型转换，见常见问题）
- 至少 4GB 可用内存，10GB 可用磁盘空间

---

## 启动步骤

### 第一步：配置环境变量

进入 `backend` 目录，编辑 `.env` 文件，填入你的 API Key：

```
DASHSCOPE_API_KEY="your-api-key"
```

### 第二步：修改 nltk 挂载路径

打开 `backend/docker-compose.yml`，找到以下这行，改成你本机 `nltk_data` 的实际路径：

```yaml
- /your/path/to/nltk_data:/usr/local/nltk_data
```

如果本机还没有 nltk_data，先执行：

```bash
python3 -c "import nltk; nltk.download('punkt_tab'); nltk.download('punkt'); nltk.download('averaged_perceptron_tagger_eng')"
```

### 第三步：启动后端服务

```bash
cd backend
docker compose up -d --build
```

首次启动会拉取镜像并构建，需要几分钟。确认所有服务正常运行：

```bash
docker compose ps
```

四个服务都应为 `running` 状态：`swxy_api`、`gsk_pg`、`es01`、`redis`

查看后端日志：

```bash
docker logs -f swxy_api
```

### 第四步：启动前端

```bash
cd frontend
npm install
npm run dev
```

### 第五步：访问服务

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5181 |
| 后端 API 文档 | http://localhost:8000/docs |

---

## 停止服务

```bash
cd backend

# 停止但保留数据
docker compose down

# 停止并清除所有数据（慎用）
docker compose down -v
```

---

## 常见问题

### 1. 文件解析失败：缺少 nltk 资源包

进入容器内部手动下载：

```bash
docker exec -it swxy_api bash
python3 -c "import nltk; nltk.download('punkt_tab'); nltk.download('punkt'); nltk.download('averaged_perceptron_tagger_eng'); nltk.download('wordnet')"
exit
```

### 2. 文件解析失败：xgboost 模型格式不兼容

容器内 xgboost 版本为 3.x，不支持旧版二进制模型格式，需要先在本机转换模型文件。

在本机执行（需要 Python 3.9）：

```bash
python3 -m venv /tmp/xgb_convert
source /tmp/xgb_convert/bin/activate
pip install "xgboost==2.1.4"

python3 -c "
import xgboost as xgb
path='backend/app/service/core/rag/res/deepdoc/updown_concat_xgb.model'
model=xgb.Booster()
model.load_model(path)
model.save_model(path)
print('转换完成')
"

deactivate
```

然后将转换好的文件复制进容器：

```bash
docker cp backend/app/service/core/rag/res/deepdoc/updown_concat_xgb.model swxy_api:/app/service/core/rag/res/deepdoc/updown_concat_xgb.model
```

### 3. 端口被占用

确保以下端口未被其他程序占用：`8000`（后端）、`5181`（前端）、`5432`（PostgreSQL）、`9200`（Elasticsearch）、`6379`（Redis）

### 4. Elasticsearch 启动慢

ES 初始化较慢，启动后等待约 1 分钟再上传文档。可用以下命令确认 ES 是否就绪：

```bash
curl http://localhost:9200
```

---

## 文档上传限制

| 接口 | 用途 | 格式 | 限制 |
|------|------|------|------|
| `/upload_files` | 知识库（永久存储） | pdf / docx / txt / xlsx | 无页数限制，同名文件不可重复上传 |
| `/quick_parse` | 快速解析（临时） | pdf / docx / txt | PDF 最多 4 页，DOCX/TXT 最多 4000 字符，每个 session 只能上传 1 个，2 小时过期 |
