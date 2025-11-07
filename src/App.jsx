import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import Chatbot from './components/Chatbot';
import { baselineData } from './data/medicalData';
import './styles.css';

function App() {
    const [simResult, setSimResult] = useState(null);

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">AI 기반 응급 의료 접근성 대시보드</h1>
                    <p className="text-gray-600 mt-2">데이터 기반 정책 시뮬레이션 및 AI 분석</p>
                </header>
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Dashboard baselineData={baselineData} />
                        <Simulator baselineData={baselineData} onSimulate={setSimResult} />
                    </div>
                    <div className="lg:col-span-1">
                        <Chatbot baselineData={baselineData} lastSimulationResult={simResult} />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;