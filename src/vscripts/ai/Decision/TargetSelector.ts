import { IBotUnit } from "../core/IBotUnit";
import { WorldState } from "../adapter/WorldState";
import { Blackboard } from "../core/Blackboard";

export class TargetSelector {

    /**
     * 获取最佳攻击目标
     * @param unit 我方AI
     * @param range 搜索范围
     */
    public static getBestTarget(unit: IBotUnit, range: number): IBotUnit | null {
        // 1. 获取范围内的敌人
        const enemies = WorldState.GetVisibleEnemies(unit, range);
        if (enemies.length === 0) return null;

        let bestTarget: IBotUnit | null = null;
        let maxScore = -Infinity;

        // 获取指挥官的集火目标 (作为加分项)
        const teamFocus = Blackboard.Instance.sharedFocusTarget;

        for (const enemy of enemies) {
            const score = this.calculateScore(unit, enemy, teamFocus);
            if (score > maxScore) {
                maxScore = score;
                bestTarget = enemy;
            }
        }

        return bestTarget;
    }

    private static calculateScore(me: IBotUnit, enemy: IBotUnit, focusTarget: IBotUnit | null): number {
        let score = 0;
        const dist = me.getRangeTo(enemy);
        const hpPct = enemy.getHealthPercent();

        // === 1. 血量分 (斩杀优先) ===
        // 血越少分越高，(1 - 0.2) * 100 = 80分
        score += (1.0 - hpPct) * 100;

        // === 2. 距离分 (就近原则) ===
        // 避免近战跨越地形去追人，减分项
        score -= (dist / 100) * 5;

        // === 3. 职业权重 (打核心) ===
        // 这里需要读取单位名称配置，简化处理：假设名字带 core 的优先级高
        // 实际项目中应读取 Config 表
        // if (Config.isCore(enemy.getName())) score += 50;

        // === 4. 控制状态 (打木桩) ===
        if (enemy.isStunned()) {
            score += 30; // 趁他病要他命
        }

        // === 5. 团队集火 (响应指挥官) ===
        if (focusTarget && enemy.getHandle() === focusTarget.getHandle()) {
            score += 200; // 极高权重，绝对服从指挥
        }

        return score;
    }
}
