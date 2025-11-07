// src/data/medicalData.js
// .ipynb 분석 결과를 기반으로 한 정적 데이터입니다. (PCA 좌표 포함)

// (K-Means 클러스터 중심값 - 시뮬레이션 재분류용)
//
// ▼▼▼▼▼ [수정 완료] 이 부분의 'features' 값을 .ipynb의 히트맵 결과와 일치하도록 수정했습니다. ▼▼▼▼▼
export const clusterCentroids = {
    // .ipynb의 5-3, 5-4 셀(df_cluster, df_heatmap)의 평균값(중심값) 기준
    // features: [ '고령화율', '10만명당권역', '10만명당지역', '10만명당기관', '10만명당시설' ]
    'A': { id: 'A', name: '고밀도/고령화 (고부담형)', features: [24.30, 0.35, 0.74, 0.54, 0.22] },
    'B': { id: 'B', name: '중밀도/고령화 (지방중심형)', features: [19.21, 0.30, 0.44, 0.26, 0.09] },
    'C': { id: 'C', name: '저밀도/저고령화 (대도시형)', features: [15.10, 0.15, 0.19, 0.10, 0.05] }
};
// ▲▲▲▲▲ [수정 완료] ▲▲▲▲▲


// 17개 시도별 기준 데이터 + PCA 좌표 추가
//
// 🚨🚨🚨 [경고] 🚨🚨🚨
// 아래 'baselineData'의 'inst_counts' 값이 '그림 1' 막대 차트를 만드는 데 사용됩니다.
// 현재 이 데이터는 '경북'이 가장 높게 나오는 *잘못된 데이터*입니다.
// 
// '그림 1'이 '전남'이 가장 높게 나오도록 올바르게 표시하려면,
// .ipynb의 원본 .xlsx 파일을 기반으로 이 'inst_counts' 값을 직접 수정해야 합니다.
//
export const baselineData = [
    // --- Cluster A ---
    { sido: '전남', cluster_id: 'A', pop: 1800000, elderly_rate: 25.5, inst_counts: { a: 5, b: 12, c: 38, d: 30 }, pc1: 2.65, pc2: -0.15 },
    { sido: '경북', cluster_id: 'A', pop: 2600000, elderly_rate: 24.8, inst_counts: { a: 8, b: 20, c: 50, d: 45 }, pc1: 2.51, pc2: 0.82 },
    { sido: '강원', cluster_id: 'A', pop: 1530000, elderly_rate: 24.0, inst_counts: { a: 5, b: 11, c: 30, d: 25 }, pc1: 1.76, pc2: -0.05 },
    { sido: '충남', cluster_id: 'A', pop: 2120000, elderly_rate: 23.5, inst_counts: { a: 7, b: 16, c: 42, d: 35 }, pc1: 1.75, pc2: 0.60 },
    { sido: '충북', cluster_id: 'A', pop: 1590000, elderly_rate: 23.0, inst_counts: { a: 5, b: 12, c: 32, d: 26 }, pc1: 1.20, pc2: -0.19 },
    { sido: '전북', cluster_id: 'A', pop: 1750000, elderly_rate: 25.0, inst_counts: { a: 6, b: 13, c: 35, d: 28 }, pc1: 2.12, pc2: -0.63 },
    
    // --- Cluster B ---
    { sido: '부산', cluster_id: 'B', pop: 3300000, elderly_rate: 21.0, inst_counts: { a: 11, b: 22, c: 45, d: 18 }, pc1: 0.61, pc2: 1.05 },
    { sido: '대구', cluster_id: 'B', pop: 2370000, elderly_rate: 19.5, inst_counts: { a: 8, b: 15, c: 32, d: 13 }, pc1: 0.05, pc2: 0.50 },
    { sido: '경남', cluster_id: 'B', pop: 3300000, elderly_rate: 20.5, inst_counts: { a: 10, b: 21, c: 44, d: 17 }, pc1: 0.42, pc2: 0.91 },
    { sido: '광주', cluster_id: 'B', pop: 1420000, elderly_rate: 18.0, inst_counts: { a: 5, b: 9, c: 19, d: 8 }, pc1: -0.44, pc2: 0.02 },
    { sido: '울산', cluster_id: 'B', pop: 1100000, elderly_rate: 17.5, inst_counts: { a: 4, b: 7, c: 15, d: 6 }, pc1: -0.84, pc2: -0.21 },
    { sido: '대전', cluster_id: 'B', pop: 1440000, elderly_rate: 18.5, inst_counts: { a: 5, b: 10, c: 20, d: 8 }, pc1: -0.58, pc2: 0.17 },
    { sido: '제주', cluster_id: 'B', pop: 670000, elderly_rate: 20.0, inst_counts: { a: 2, b: 4, c: 9, d: 4 }, pc1: -0.18, pc2: -0.82 },

    // --- Cluster C ---
    { sido: '서울', cluster_id: 'C', pop: 9400000, elderly_rate: 16.0, inst_counts: { a: 26, b: 48, c: 98, d: 24 }, pc1: -2.31, pc2: -0.99 },
    { sido: '경기', cluster_id: 'C', pop: 13600000, elderly_rate: 15.0, inst_counts: { a: 38, b: 70, c: 145, d: 35 }, pc1: -2.99, pc2: -0.32 },
    { sido: '인천', cluster_id: 'C', pop: 2980000, elderly_rate: 16.5, inst_counts: { a: 8, b: 15, c: 31, d: 8 }, pc1: -1.72, pc2: -0.66 },
    { sido: '세종', cluster_id: 'C', pop: 380000, elderly_rate: 13.0, inst_counts: { a: 1, b: 2, c: 4, d: 1 }, pc1: -2.44, pc2: -1.75 }
];