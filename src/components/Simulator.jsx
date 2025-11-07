import React, { useState } from 'react';
import { calculateMetrics, findClosestCluster } from '../utils/analytics';
import { clusterCentroids } from '../data/medicalData';

function Simulator({ baselineData, onSimulate }) {
    const [region, setRegion] = useState('');
    const [vals, setVals] = useState({ a: 0, b: 0, c: 0, d: 0 });
    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setVals(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!region) return alert("지역을 선택해주세요.");

        const base = baselineData.find(d => d.sido === region);
        const sim = JSON.parse(JSON.stringify(base));
        
        sim.inst_counts.a = Math.max(0, sim.inst_counts.a + vals.a);
        sim.inst_counts.b = Math.max(0, sim.inst_counts.b + vals.b);
        sim.inst_counts.c = Math.max(0, sim.inst_counts.c + vals.c);
        sim.inst_counts.d = Math.max(0, sim.inst_counts.d + vals.d);

        const metrics = calculateMetrics(sim.pop, sim.inst_counts);
        const newCluster = findClosestCluster(metrics, sim.elderly_rate);

        const res = { base, sim, metrics, newCluster, changes: vals };
        setResult(res);
        onSimulate(res);
    };

    return (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">정책 시뮬레이터</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <select value={region} onChange={e => setRegion(e.target.value)} 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">대상 지역 선택</option>
                    {baselineData.map(d => <option key={d.sido} value={d.sido}>{d.sido}</option>)}
                </select>
                <div className="grid grid-cols-4 gap-2">
                    {['a', 'b', 'c', 'd'].map((key, i) => (
                        <div key={key}>
                            <label className="block text-xs text-gray-500 mb-1">
                                {['권역센터', '지역센터', '지역기관', '응급시설'][i]}
                            </label>
                            <input type="number" name={key} value={vals[key]} onChange={handleChange}
                                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    ))}
                </div>
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium">
                    시뮬레이션 실행
                </button>
            </form>

            {result && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-center mb-4">{result.base.sido} 시뮬레이션 결과</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-white rounded border">
                            <div className="font-semibold text-gray-500 mb-2">변경 전</div>
                            <div className="text-blue-600 font-bold mb-2">{clusterCentroids[result.base.cluster_id].name}</div>
                        </div>
                        <div className="p-3 bg-white rounded border">
                            <div className="font-semibold text-gray-500 mb-2">변경 후</div>
                            <div className="text-blue-600 font-bold mb-2">{result.newCluster.name}</div>
                             <ul className="text-xs space-y-1 text-gray-600">
                                <li>권역/10만: {result.metrics.per_100k_a.toFixed(2)}</li>
                                <li>지역/10만: {result.metrics.per_100k_b.toFixed(2)}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Simulator;