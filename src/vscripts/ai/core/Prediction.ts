import {IBotUnit} from "./IBotUnit";

export class Prediction {
    /**
     * 计算预判位置
     * @param source 施法者
     * @param target 目标
     * @param speed 弹道速度
     * @param delay 施法前摇
     */
    public static PredictPosition(source: IBotUnit, target: IBotUnit, speed: number, delay: number): Vector {
        const targetPos = target.getPosition();
        // 获取目标当前速度向量 (需要 Adapter 支持 GetForwardVector * GetCurrentSpeed)
        // 假设 Adapter 提供了 getVelocity()
        const targetVelocity = (target as any).getVelocity();

        const dist = ((targetPos - source.getPosition()) as Vector).Length2D();
        const timeToHit = delay + (dist / speed);

        // 基础预判：假设目标做匀速直线运动
        let predictedPos = (targetPos + targetVelocity * timeToHit) as Vector;

        // === 拟人化：加入随机误差 (Fuzziness) ===
        // 即使是职业选手也不可能像素级完美
        const errorMargin = 50; // 50码误差
        const randomOffset = Vector(RandomFloat(-1,1), RandomFloat(-1,1), 0) * errorMargin;

        return (predictedPos + randomOffset) as Vector;
    }
}
