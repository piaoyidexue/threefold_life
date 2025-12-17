import { IBotUnit } from "./core/IBotUnit";
import { AIConfig } from "./AIConfig";

export class DebugSystem {

    /**
     * 绘制 AI 的意图
     * @param unit AI单位
     * @param actionName 当前动作名称
     * @param score 当前动作得分
     * @param target 目标单位（可选）
     * @param movePos 移动目标点（可选）
     */
    public static DrawThinking(
        unit: IBotUnit,
        actionName: string,
        score: number,
        target?: IBotUnit,
        movePos?: Vector
    ) {
        if (!AIConfig.DEBUG_MODE) return;

        const startPos = unit.getPosition();
        const color = Vector(255, 255, 255); // 默认白色文字
        const duration = AIConfig.DEBUG_DRAW_DURATION;

        // 1. 头顶文字 (显示动作和分数)
        // 格式: [Action_Attack] 0.85
        const zOffset = Vector(0, 0, 200); // 显示在头顶
        DebugDrawText(
            (startPos + zOffset) as Vector,
            `${actionName} (${score.toFixed(2)})`,
            true,
            duration
        );

        // 2. 攻击/交互连线 (红色)
        if (target && target.isValid()) {
            DebugDrawLine(
                (startPos + Vector(0,0,50)) as Vector,
                (target.getPosition() + Vector(0,0,50)) as Vector,
                255, 0, 0, // 红色
                true,
                duration
            );

            // 在目标脚下画个圈，表示被锁定了
            DebugDrawCircle(
                target.getPosition(),
                Vector(255, 0, 0),
                100,
                50,
                true,
                duration
            );
        }

        // 3. 移动连线 (蓝色)
        if (movePos) {
            DebugDrawLine(
                (startPos + Vector(0,0,50)) as Vector,
                movePos,
                0, 255, 255, // 青色
                true,
                duration
            );
            // 移动终点画个叉
            DebugDrawText(movePos, "X", true, duration);
        }
    }
}
