import { IBotUnit } from "../core/IBotUnit";
import { ActionBase } from "./ActionBase";

export class Evaluator {
    private unit: IBotUnit;
    private actions: ActionBase[] = [];
    private currentAction: ActionBase | null = null;

    constructor(unit: IBotUnit) {
        this.unit = unit;
    }

    public addAction(action: ActionBase) {
        this.actions.push(action);
    }

    public update() {
        if (!this.unit.isValid() || !this.unit.isAlive()) return;

        // 如果正在持续施法，不要打断自己
        if (this.unit.isChanneling()) return;

        let bestAction: ActionBase | null = null;
        let bestScore = -0.1;

        // 遍历打分
        for (const action of this.actions) {
            const score = action.evaluate();
            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }
        }

        // 只有当分数有意义时执行
        if (bestAction && bestScore > 0) {
            // 简单的防止抖动优化：如果动作没变，不重复调用execute
            // 但对于Attack/Move这类需要持续更新的，需要重复调用
            bestAction.execute();

            // Debug
            // const pos = this.unit.getPosition();
            // DebugDrawText(pos, `${bestAction.name} (${bestScore.toFixed(2)})`, true, 0.1);
        } else {
            this.unit.stop(); // 无事可做
        }
    }
}
