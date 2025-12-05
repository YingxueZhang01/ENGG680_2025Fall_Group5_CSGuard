import { AnalysisResult } from "../types";

// === 辅助函数：把 Base64 图片转换成 Blob 文件流 ===
const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg') => {
  const byteString = atob(base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""));
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
};

export const analyzeSafetyImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    console.log("正在调用本地 Python 引擎...");

    // 1. 准备数据
    const blob = base64ToBlob(base64Image);
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    // 2. 发送请求给本地 Python 后端
    const response = await fetch("http://localhost:8000/detect", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Local Backend Error: ${response.statusText}`);
    }

    // === 修正点在这里 ===
    // 先把数据包完全拿回来 (解包 JSON)
    const jsonResponse = await response.json();
    const yoloResults = jsonResponse.data; 

    // 3. 数据拿到了，现在开始循环处理格式
    const detections = yoloResults.map((item: any) => {
      return {
        label: item.label,
        confidence: item.score,
        // 因为你的 Python 后端(main.py)已经是最新版，
        // 所以这里直接用后端给出的归一化坐标即可
        box_2d: item.box 
      };
    });

    // 4. 生成违规报告
    const violations: string[] = [];
    detections.forEach((d: any) => {
      const label = d.label.toLowerCase();
      // 根据你的 best.pt 标签调整这里的判断词
      if (label.includes("no") || label.includes("violation")) {
        violations.push(`Detected violation: ${d.label}`);
      }
    });

    console.log("本地检测完成:", detections);

    return {
      detections: detections,
      violations: violations,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error("Local Analysis Error:", error);
    return {
      detections: [],
      violations: ["Error connecting to local detection engine."],
      timestamp: new Date().toISOString(),
    };
  }
};