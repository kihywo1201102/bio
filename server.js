import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

// 렌더에서는 환경변수가 바로 시스템에 적용되므로 dotenv import를 제거하거나 
// 환경에 따라 안전하게 처리합니다.
import 'dotenv/config'; 

const app = express();
// 렌더는 포트번호를 자동으로 할당하므로 process.env.PORT를 우선 사용합니다.
const PORT = process.env.PORT || 3000;

// 1. 키를 불러올 때 로그를 남겨 서버가 키를 찾았는지 눈으로 확인합니다.
const apiKey = process.env.GEMINI_API_KEY;
console.log("확인: 환경 변수 GEMINI_API_KEY 존재 여부 👉", !!apiKey);

if (!apiKey) {
    console.error("🚨 치명적 에러: GEMINI_API_KEY가 설정되지 않았습니다!");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const express = require('express');
const cors = require('cors'); // 👈 [추가 1] 파일 맨 위쪽 쯤에 이 줄을 추가하세요!
// (나머지 const 모듈들...)

const app = express();

app.use(cors()); // 👈 [추가 2] 방금 찾으신 두 줄 바로 위에 추가하세요!
app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/analyze', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        res.json({ text: response.text });
    } catch (error) {
        console.error("서버 내부 연산 중 에러 발생:", error);
        // 에러를 클라이언트에게도 자세히 보냅니다.
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 BIOCLOCK 서버가 가동되었습니다: http://localhost:${PORT}`);
});