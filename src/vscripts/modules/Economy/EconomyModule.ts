import { BaseModule } from "../../core/BaseModule";

export class EconomyModule extends BaseModule {
    private radiance: number = 100;

    constructor() { super("Economy"); }

    public Precache(context: CScriptPrecacheContext) {}

    public Init() {
        // 监听网络事件：购买物品
        CustomGameEventManager.RegisterListener("c2s_buy_shadow_item", (_, args) => this.OnBuyShadowItem(args));

        // 监听杀怪事件，增加光辉
        ListenToGameEvent("entity_killed", (evt) => this.OnUnitKilled(evt), undefined);
    }

    public OnGameStart() {
        // 开启光辉自然衰减循环
    }

    private OnUnitKilled(evt: EntityKilledEvent) {
        // 处理光辉增加逻辑
        // 处理暗影碎片增加逻辑 (如果内奸杀的)
        // this.Log("Resource updated.");
    }

    private OnBuyShadowItem(args: any) {
        // 购买处理
    }
}
