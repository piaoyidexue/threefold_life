export class MathUtils {
    /**
     * 线性映射：将 val 从 [min, max] 映射到 [0, 1]
     */
    static Normalize(val: number, min: number, max: number): number {
        return Math.max(0, Math.min(1, (val - min) / (max - min)));
    }

    /**
     * 逻辑斯蒂曲线：用于产生平滑的 0-1 评分
     * @param x 输入值
     * @param k 陡峭程度 (正数上升，负数下降)
     * @param x0 中点
     */
    static Sigmoid(x: number, k: number, x0: number): number {
        return 1 / (1 + Math.exp(-k * (x - x0)));
    }

    static GetDistance(p1: Vector, p2: Vector): number {
        return ((p1 - p2) as Vector).Length2D();
    }
}
