const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';
// 주의: 실제 배포 시 API 키는 서버에서 관리해야 합니다.
const API_KEY = "AIzaSyCoCKbexBEhlk7FQY7uVR97l7C3SWqNMOk"; 

export async function callGeminiAPI(payload) {
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API 호출 실패');
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        
        if (!candidate?.content?.parts?.[0]?.text) {
            throw new Error('응답 데이터가 올바르지 않습니다.');
        }

        const text = candidate.content.parts[0].text;
        let sources = [];
        
        if (candidate.groundingMetadata?.groundingAttributions) {
            sources = candidate.groundingMetadata.groundingAttributions
                .map(attr => attr.web)
                .filter(web => web?.uri && web?.title);
        }

        return { text, sources };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}