import { IBotUnit } from "../core/IBotUnit";

export class NavSystem {
    /**
     * 检查某个点是否可行走 (封装 GridNav)
     */
    public static IsTraversable(position: Vector): boolean {
        return GridNav.IsTraversable(position) && !GridNav.IsBlocked(position);
    }

    /**
     * 获取远离敌人的位置 (用于风筝/逃跑)
     * @param me 自身
     * @param threatSource 威胁源(通常是最近的敌人)
     * @param distance 撤退距离
     */
    public static GetKitePosition(me: IBotUnit, threatSource: IBotUnit, distance: number): Vector {
        const myPos = me.getPosition();
        const threatPos = threatSource.getPosition();

        // 向量：威胁源 -> 我 (即远离方向)
        const direction = ((myPos - threatPos) as Vector).Normalized();

        // 目标点
        const targetPos = (myPos + direction * distance) as Vector;

        // 如果目标点不可行走（比如是墙），则尝试旋转向量寻找可行点
        if (!this.IsTraversable(targetPos)) {
            // 简单尝试：旋转 45 度
            // 实际商业项目这里需要更复杂的 Raycast 采样
            return myPos; // 暂时原地不动，避免卡死
        }

        return targetPos;
    }

    /**
     * 获取团战后的安全站位 (后排逻辑)
     * 计算公式：团队中心 + (团队中心 - 敌人中心).Normalized * 安全距离
     */
    public static GetBacklinePosition(teamCenter: Vector, enemyCenter: Vector, safeDist: number): Vector {
        const dir = ((teamCenter - enemyCenter) as Vector).Normalized();
        return (teamCenter + dir * safeDist) as Vector;
    }
}
