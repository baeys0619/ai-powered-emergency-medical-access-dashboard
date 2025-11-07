// src/components/Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
// --- 1. 경로 수정: 상위 폴더(src/)로 이동(..) 후 하위 폴더로 접근 ---
import { callGeminiAPI } from '../services/geminiService.js';
import { calculateMetrics } from '../utils/analytics.js';
import { clusterCentroids } from '../data/medicalData.js';

// --- 2. 페르소나별 시스템 프롬프트 (첨부 이미지 기반 + 마크다운 제거) ---
const PERSONA_PROMPTS = {
  policyExpert: `당신은 한국 응급 의료 정책 분석 전문가이자 AI/ML 기반의 현장 정책 지원 AI입니다. 제공된 데이터를 기반으로, 사용자가 요청한 지역의 AI/ML 클러스터 유형을 즉시 식별하고, 해당 유형의 구조적 취약점을 근거로 가장 실현 가능한 정책 목표를 명확히 제시하십시오. 
  **[중요] 답변은 반드시 일반 텍스트와 줄바꿈(\n)만을 사용해야 합니다. ###, * 등 마크다운 형식을 절대 사용하지 마십시오.**`,
  realLifeUser: `당신은 한국 응급 의료 상황을 분석하는 실생활 컨설턴트 AI입니다. 사용자의 지역과 상황만을 바탕으로, 내부의 AI/ML 클러스터 분석 결과를 활용하여 가장 실용적이고 구체적인 응급 상황 대처 비책 및 최적의 응급기관 선택 지침을 제시하십시오. 
  **[중요] 답변은 반드시 일반 텍스트와 줄바꿈(\n)만을 사용해야 합니다. ###, * 등 마크다운 형식을 절대 사용하지 마십시오.**`
};

// --- formatMarkdown 함수 제거 ---

function Chatbot({ baselineData, lastSimulationResult }) {
    const [messages, setMessages] = useState([{ role: 'bot', text: '안녕하세요! 대화 스타일을 선택한 후 질문해주세요.' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [persona, setPersona] = useState('policyExpert'); 
    const scrollRef = useRef(null);

    // --- 3. 챗봇 대화 내역(API용) 오타 수정: item.message -> item.text ---
    const chatHistoryForAPI = messages.map(item => ({
        role: item.role === 'bot' ? 'model' : 'user',
        parts: [{ text: item.text }] // 'item.message'가 아닌 'item.text'를 참조
    }));

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const buildContext = () => {
        let ctx = "--- 현재 데이터 (17개 시도) ---\n";
        baselineData.forEach(d => {
            const metrics = calculateMetrics(d.pop, d.inst_counts);
            ctx += `${d.sido}: (클러스터 ${d.cluster_id}), 고령화율 ${d.elderly_rate.toFixed(1)}%, 10만명당 [권역:${metrics.per_100k_a.toFixed(2)}, 지역:${metrics.per_100k_b.toFixed(2)}, 기관:${metrics.per_100k_c.toFixed(2)}, 시설:${metrics.per_100k_d.toFixed(2)}]\n`;
        });
        ctx += "\n--- 클러스터 특징 (평균값) ---\n";
        for (const id in clusterCentroids) {
            const c = clusterCentroids[id];
            const f = c.features;
            ctx += `${c.name}: 고령화율 ${f[0]}%, 10만명당 [권역:${f[1]}, 지역:${f[2]}, 기관:${f[3]}, 시설:${f[4]}]\n`;
        }
        if (lastSimulationResult) {
            const { base, newCluster, changes } = lastSimulationResult;
            ctx += "\n--- 방금 실행한 시뮬레이션 결과 ---\n";
            ctx += `지역: ${base.sido}\n`;
            ctx += `변경 사항: 권역+${changes.a}, 지역+${changes.b}, 기관+${changes.c}, 시설+${changes.d}\n`;
            ctx += `변경 전: ${clusterCentroids[base.cluster_id].name}\n`;
            ctx += `변경 후: ${newCluster.name}\n`;
        }
        ctx += "---";
        return ctx;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        const userMsg = input.trim();
        if (!userMsg || loading) return;

        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        // --- 4. 오타 수정: setQuery -> setInput ---
        setInput(''); // 'setQuery' is not defined 오류 해결

        // 선택된 페르소나에 따라 시스템 프롬프트를 동적으로 설정
        const systemPrompt = PERSONA_PROMPTS[persona];
        
        const fullQuery = `[컨텍스트]\n${buildContext()}\n\n[사용자 질문]\n${userMsg}`;
        
        const requestPayload = {
            contents: [
                ...chatHistoryForAPI.slice(1).slice(-5), 
                { role: "user", parts: [{ text: fullQuery }] } 
            ],
            tools: [{ "google_search": {} }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        try {
            const { text, sources } = await callGeminiAPI(requestPayload);
            setMessages(prev => [...prev, { role: 'bot', text: text, sources: sources }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: `오류가 발생했습니다: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <aside className="sticky top-6 md:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col max-h-[90vh]">
            <h2 className="text-2xl font-semibold text-gray-800 p-6 border-b">데이터 분석 챗봇 (AI)</h2>
            
            <div className="p-4 border-b bg-gray-50">
              <label htmlFor="persona-select" className="block text-sm font-medium text-gray-700 mb-2">
                챗봇 버전 선택:
              </label>
              <select
                id="persona-select"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="policyExpert">정책 전문가 챗봇 (가치 입증용)</option>
                <option value="realLifeUser">실생활 사용자 챗봇 (실용성 극대화용)</option>
              </select>
            </div>
            
            <div ref={scrollRef} className="flex-1 p-6 space-y-4 overflow-y-auto flex flex-col">
                {messages.map((item, index) => (
                    <div key={index} className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`chat-bubble ${item.role === 'user' ? 'chat-user' : 'chat-bot'}`}>
                            {/* --- 5. 렌더링 방식 수정 ---
                              formatMarkdown 함수를 제거하고, 텍스트를 <pre> 태그로 감싸서
                              줄바꿈(\n)과 공백이 그대로 표시되도록 함 
                            */}
                            <pre className="whitespace-pre-wrap font-sans">
                              {item.text}
                            </pre>
                            
                            {item.role === 'bot' && item.sources && item.sources.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-gray-200 text-xs">
                                    <strong className="block mb-1 text-gray-600">참고 자료 (Google 검색):</strong>
                                    <ul className="list-disc list-inside space-y-1">
                                        {item.sources.map((source, sIdx) => (
                                            <li key={sIdx}>
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                                    {source.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            
                {loading && (
                    <div className="flex items-center space-x-2 px-1 py-2">
                        <div className="loader"></div>
                        <p className="text-sm text-gray-500">AI가 답변을 생성 중입니다...</p>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-xl">
                <div className="flex space-x-3">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="여기에 질문을 입력하세요..." 
                        className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                        autoComplete="off"
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-lg hover:bg-blue-700 transition duration-150 disabled:bg-gray-400"
                        disabled={loading}
                    >
                        전송
                    </button>
                </div>
            </form>
        </aside>
    );
}

export default Chatbot;