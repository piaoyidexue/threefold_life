import { IBotUnit } from "../core/IBotUnit";
import { HeroConfig } from "../AIConfig"; // 确保引入了配置接口
export abstract class ActionBase {
    protected owner: IBotUnit;
    protected config: HeroConfig; // 新增：保存配置
    public name: string;

    // 调试辅助：用于DebugSystem绘制连线和圆圈
    public targetUnit: IBotUnit | null = null;
    public targetLocation: Vector | null = null;
    constructor(owner: IBotUnit, name: string, config: HeroConfig) {
        this.owner = owner;
        this.name = name;
        this.config = config; // 注入配置
    }

    /**
     * 0.0 到 1.0 的评分
     */
    abstract evaluate(): number;

    /**
     * 执行具体操作
     */
    abstract execute(): void;
}
