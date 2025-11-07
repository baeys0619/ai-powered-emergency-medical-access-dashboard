import { clusterCentroids } from '../data/medicalData';

export function calculateMetrics(pop, counts) {
    const factor = pop > 0 ? 100000 / pop : 0;
    return {
        per_100k_a: counts.a * factor,
        per_100k_b: counts.b * factor,
        per_100k_c: counts.c * factor,
        per_100k_d: counts.d * factor
    };
}

export function findClosestCluster(metrics, elderly_rate) {
    const currentFeatures = [
        elderly_rate,
        metrics.per_100k_a,
        metrics.per_100k_b,
        metrics.per_100k_c,
        metrics.per_100k_d
    ];

    let minDistance = Infinity;
    let closestClusterId = null;

    for (const clusterId in clusterCentroids) {
        const centroid = clusterCentroids[clusterId].features;
        let distance = 0;
        for (let i = 0; i < currentFeatures.length; i++) {
            distance += Math.pow(currentFeatures[i] - centroid[i], 2);
        }
        distance = Math.sqrt(distance);

        if (distance < minDistance) {
            minDistance = distance;
            closestClusterId = clusterId;
        }
    }
    return clusterCentroids[closestClusterId];
}