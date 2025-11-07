// src/components/Dashboard.jsx
import React, { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { calculateMetrics } from '../utils/analytics.js'; // 경로 수정
import { clusterCentroids } from '../data/medicalData.js'; // 경로 수정

// --- 1. 히트맵 색상 계산을 위한 헬퍼 함수 ---
const getHeatmapColor = (value, min, max) => {
  if (max === min) return 'bg-gray-100'; 
  const range = max - min;
  const normalized = (value - min) / range; // 0 (min) ~ 1 (max)
  
  if (normalized < 0.2) return 'bg-blue-200'; // 매우 낮음
  if (normalized < 0.4) return 'bg-blue-100'; // 낮음
  if (normalized < 0.6) return 'bg-yellow-50'; // 보통
  if (normalized < 0.8) return 'bg-red-100';  // 높음
  return 'bg-red-200'; // 매우 높음
};

function Dashboard({ baselineData }) {
    // --- 2. 3개 차트를 위한 Ref (총인구 차트 제거) ---
    const accessChartRef = useRef(null);      // 수정 (10만명당 접근성)
    const pcaChartRef = useRef(null);         // 신규 (PCA 분포)
    const distChartRef = useRef(null);        // 기존 (클러스터 분포)
    
    const chartInstances = useRef({});

    // --- 3. 3개 차트 + 1개 히트맵을 위한 데이터 계산 (useMemo) ---
    const memoizedData = useMemo(() => {
        // --- 3a. (수정) 접근성 차트용 데이터 정렬 ---
        // (IPYNB의 4-Sido-Sort 로직 재현)
        const sortedBaselineData = [...baselineData].sort((a, b) => {
            const metricsA = calculateMetrics(a.pop, a.inst_counts);
            const totalA = metricsA.per_100k_a + metricsA.per_100k_b + metricsA.per_100k_c + metricsA.per_100k_d;
            const metricsB = calculateMetrics(b.pop, b.inst_counts);
            const totalB = metricsB.per_100k_a + metricsB.per_100k_b + metricsB.per_100k_c + metricsB.per_100k_d;
            return totalB - totalA; // 내림차순 정렬
        });

        // --- 3b. 차트 데이터 계산 ---
        const labels = sortedBaselineData.map(d => d.sido); // 정렬된 라벨 사용
        const accessMetrics = sortedBaselineData.map(d => calculateMetrics(d.pop, d.inst_counts)); // 정렬된 데이터 사용
        const clusterColors = { 'A': '#ef4444', 'B': '#eab308', 'C': '#3b82f6' };

        // 1. (수정) 10만명당 접근성 차트 데이터 (정렬된 데이터 사용)
        const accessData = {
            labels, // 정렬됨
            datasets: [
                { label: '권역응급의료센터', data: accessMetrics.map(m => m.per_100k_a), backgroundColor: 'rgba(75, 85, 99, 0.7)' }, // 색상 변경 (IPYNB와 유사하게)
                { label: '지역응급의료센터', data: accessMetrics.map(m => m.per_100k_b), backgroundColor: 'rgba(59, 130, 246, 0.7)' },
                { label: '지역응급의료기관', data: accessMetrics.map(m => m.per_100k_c), backgroundColor: 'rgba(34, 197, 94, 0.7)' },
                { label: '응급의료시설', data: accessMetrics.map(m => m.per_100k_d), backgroundColor: 'rgba(163, 230, 53, 0.7)' }
            ]
        };
        
        // 2. (신규) PCA 스캐터 차트 데이터
        const pcaData = {
            datasets: Object.keys(clusterCentroids).map(id => ({
                label: clusterCentroids[id].name,
                data: baselineData // PCA 플롯은 원본 데이터 순서 사용
                    .filter(d => d.cluster_id === id)
                    .map(d => ({ x: d.pc1, y: d.pc2, sido: d.sido })),
                backgroundColor: clusterColors[id] + 'b3',
                borderColor: clusterColors[id],
                pointRadius: 6,
                pointHoverRadius: 8,
            }))
        };
        
        // 3. (기존) 클러스터 분포 파이 차트 데이터
        const clusterCounts = baselineData.reduce((acc, d) => {
            acc[d.cluster_id] = (acc[d.cluster_id] || 0) + 1;
            return acc;
        }, {});
        const distData = {
            labels: Object.keys(clusterCounts).map(id => clusterCentroids[id].name),
            datasets: [{
                data: Object.values(clusterCounts),
                backgroundColor: Object.keys(clusterCounts).map(id => clusterColors[id] + 'b3'),
                borderColor: Object.keys(clusterCounts).map(id => clusterColors[id]),
            }]
        };

        // 4. (신규) 히트맵 테이블 데이터
        const heatmapFeatures = [
            { key: '고령화율', dataKey: 0 },
            { key: '권역센터', dataKey: 1 },
            { key: '지역센터', dataKey: 2 },
            { key: '지역기관', dataKey: 3 },
            { key: '응급시설', dataKey: 4 },
        ];
        const featureStats = {};
        heatmapFeatures.forEach((feat) => {
            const values = Object.values(clusterCentroids).map(c => c.features[feat.dataKey]);
            featureStats[feat.dataKey] = {
                min: Math.min(...values),
                max: Math.max(...values),
            };
        });
        const heatmapData = {
            headers: heatmapFeatures,
            rows: Object.values(clusterCentroids).map(cluster => ({
                name: cluster.name,
                features: cluster.features,
            })),
            stats: featureStats,
        };

        return { accessData, pcaData, distData, heatmapData }; // popData 제거
    }, [baselineData]);


    // --- 4. Chart.js 인스턴스 생성/파괴 (ESLint 경고 해결) ---
    useEffect(() => {
        // (수정) 경고 해결을 위해 변수에 복사
        const instances = chartInstances.current;

        const createChart = (ref, config) => {
            if (ref.current) {
                const ctx = ref.current.getContext('2d');
                return new Chart(ctx, config);
            }
        };

        const destroyChart = (chartInstance) => {
            if (chartInstance) {
                chartInstance.destroy();
            }
        };

        // 모든 차트 파괴 (변수 사용)
        Object.values(instances).forEach(destroyChart);

        // --- 차트 3개 생성 ---
        instances.accessChart = createChart(accessChartRef, {
            type: 'bar',
            data: memoizedData.accessData,
            options: {
                responsive: true,
                scales: { 
                    x: { 
                        stacked: true,
                        ticks: { // (수정) 라벨 회전 (첨부 이미지와 동일하게)
                            autoSkip: false, 
                            maxRotation: 90, 
                            minRotation: 45
                        }
                    }, 
                    y: { 
                        stacked: true, 
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '10만명당 기관 수 (개)'
                        }
                    } 
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });

        instances.pcaChart = createChart(pcaChartRef, {
            type: 'scatter',
            data: memoizedData.pcaData,
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                const sido = context.raw.sido;
                                if (sido) { label += sido; }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: '주성분 1 (PC1: 구조적 압력)' } },
                    y: { title: { display: true, text: '주성분 2 (PC2: 의료 계층)' } }
                }
            }
        });

        instances.distChart = createChart(distChartRef, {
            type: 'pie',
            data: memoizedData.distData,
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });

        // (수정) 클린업 함수가 변수를 사용하도록 변경
        return () => {
            Object.values(instances).forEach(destroyChart);
        };
    }, [memoizedData]); 

    // --- 5. 최종 JSX 렌더링 (레이아웃 수정) ---
    return (
        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">기준 현황 (Baseline Dashboard)</h2>
            
            {/* --- 1. (수정) 10만명당 접근성 (단독 행) --- */}
            <div className="grid grid-cols-1 gap-8 mb-8">
                <div className="p-4 rounded-lg border border-gray-200 shadow-inner bg-gray-50">
                    <h3 className="text-base font-semibold text-gray-700 text-center mb-3">
                        그림 1: 10만 명당 응급기관 접근성 (결과 지표)
                    </h3>
                    <div>
                        <canvas ref={accessChartRef} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center pt-2 border-t">
                        **논리:** 지역별 10만명당 총 접근성은 큰 편차를 보이며, 특히 전남이 가장 높고 세종이 가장 낮습니다. (IPYNB 분석 기반 정렬)
                    </p>
                </div>
            </div>

            {/* --- 2x2 차트 그리드 (PCA, 분포) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* 2. (신규) PCA 클러스터 분포도 --- (논리 텍스트 추가) */}
                <div className="p-4 rounded-lg border border-gray-200 shadow-inner bg-gray-50">
                    <h3 className="text-base font-semibold text-gray-700 text-center mb-3">
                        그림 2: AI/ML 군집 분석 (PCA 분포도)
                    </h3>
                    <div>
                        <canvas ref={pcaChartRef} />
                    </div>
                    {/* --- (수정) 논리 텍스트 추가 --- */}
                    <div className="text-xs text-gray-500 mt-2 text-center pt-2 border-t">
                        <p className="mb-2"><strong>논리:</strong> AI는 복합 지표를 분석하여 지역을 3개 유형(A, B, C)으로 명확히 분류합니다.</p>
                        <div className="text-left text-gray-600 bg-gray-100 p-2 rounded border">
                            <p><strong>PC1 (X축): 접근성 구조와 인구 압력의 차이</strong></p>
                            <ul className="list-disc list-inside ml-2">
                                <li><strong>양(+):</strong> 높은 고령화율, 높은 지역기관 접근성 (지방 고령화형)</li>
                                <li><strong>음(-):</strong> 낮은 고령화율, 낮은 모든 기관 접근성 (대도시 과밀형)</li>
                            </ul>
                            <p className="mt-1"><strong>PC2 (Y축): 응급 의료 계층 구조의 차이</strong></p>
                            <ul className="list-disc list-inside ml-2">
                                <li><strong>양(+):</strong> 특정 상위 기관(권역/지역센터) 집중 (센터 중심형)</li>
                                <li><strong>음(-):</strong> 특정 하위 기관(지역기관/시설) 집중 (기관 분산형)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 3. (기존) 클러스터 분포 */}
                <div className="p-4 rounded-lg border border-gray-200 shadow-inner bg-gray-50">
                    <h3 className="text-base font-semibold text-gray-700 text-center mb-3">
                        그림 3: 취약성 클러스터 분포 (분류 결과)
                    </h3>
                    <div className="relative h-64 md:h-72 lg:h-[340px]"> {/* PCA 차트와 높이 맞춤 */}
                        <canvas ref={distChartRef} />
                    </div>
                     <p className="text-xs text-gray-500 mt-2 text-center pt-2 border-t">
                        **논리:** 17개 시도는 3개의 고유한 취약성 그룹으로 나뉩니다.
                    </p>
                </div>
            </div>

            {/* --- 4. (신규) 히트맵 테이블 (전체 너비) --- */}
            <div className="p-4 rounded-lg border border-gray-200 shadow-inner bg-gray-50">
                <h3 className="text-base font-semibold text-gray-700 text-center mb-4">
                    그림 4: 클러스터별 특징 비교 (AI/ML 분류 근거)
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">클러스터 유형</th>
                                {memoizedData.heatmapData.headers.map((header) => (
                                    <th key={header.key} className="py-3 px-4 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                                        {header.key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {memoizedData.heatmapData.rows.map((row) => (
                                <tr key={row.name}>
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">{row.name}</td>
                                    {memoizedData.heatmapData.headers.map((header) => {
                                        const value = row.features[header.dataKey];
                                        const stats = memoizedData.heatmapData.stats[header.dataKey];
                                        const colorClass = getHeatmapColor(value, stats.min, stats.max);
                                        
                                        return (
                                            <td key={header.key} className={`py-3 px-4 text-sm text-gray-700 text-center ${colorClass}`}>
                                                {value.toFixed(2)}
                                            </td>
                                        );
                                     })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <p className="text-xs text-gray-500 mt-3 text-center pt-2 border-t">
                    **논리:** 각 클러스터는 고유한 특징(예: A는 고령화율이 높고, C는 접근성이 낮음)을 가지므로, AI 챗봇의 맞춤형 정책 제안이 필요합니다.
                </p>
            </div>
        </section>
    );
}

export default Dashboard;