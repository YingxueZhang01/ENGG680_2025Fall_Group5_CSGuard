# main.py - 修正坐标版
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np

app = FastAPI()

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载模型
print("正在加载模型...")
model = YOLO("best.pt") 
print("模型加载完成！")

@app.post("/detect")
async def detect(image: UploadFile = File(...)):
    # 1. 读取图片
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_cv2 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 2. 获取图片原始尺寸（这步很关键！）
    height, width, _ = img_cv2.shape

    # 3. 推理
    results = model(img_cv2)
    
    detections = []
    for result in results:
        for box in result.boxes:
            # 获取 YOLO 的原始坐标 [x1, y1, x2, y2]
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            # === 核心修复 ===
            # 将绝对像素坐标 转换为 0-1000 的相对坐标
            # 并且按照 Gemini 的格式 [y, x, y, x] 进行排列
            ymin = int((y1 / height) * 1000)
            xmin = int((x1 / width) * 1000)
            ymax = int((y2 / height) * 1000)
            xmax = int((x2 / width) * 1000)

            # 边界保护（防止稍微超出一点导致报错）
            ymin, xmin = max(0, ymin), max(0, xmin)
            ymax, xmax = min(1000, ymax), min(1000, xmax)

            # 获取类别和置信度
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            conf = float(box.conf[0])
            
            detections.append({
                "box": [ymin, xmin, ymax, xmax], # 现在的格式完美符合前端要求
                "label": class_name,
                "score": conf
            })

    return {"status": "success", "data": detections}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)