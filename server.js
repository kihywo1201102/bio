import 'dotenv/config'; // 👈 추가된 디테일: 비밀 금고(.env)를 열어주는 마스터키
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// 🔒 하드코딩된 키를 지우고, 안전하게 환경 변수에서 꺼내오도록 수정했습니다!
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname));

// 🔄 app.js와 구글 제미나이 서버를 잇는 안전한 파이프라인
app.post('/api/analyze', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // 최신형 규격인 gemini-2.5-flash 모델 가동
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        res.json({ text: response.text });
    } catch (error) {
        console.error("서버 내부 연산 중 에러 발생:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 BIOCLOCK 서버가 가동되었습니다: http://localhost:${PORT}`);
});