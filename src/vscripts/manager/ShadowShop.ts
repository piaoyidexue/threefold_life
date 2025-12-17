import { RoleManager } from "./RoleManager";
import { Spawner } from "./Spawner"; // 需要修改 Spawner 来支持强化

export class ShadowShop {
    public static Init() {
        CustomGameEventManager.RegisterListener("c2s_buy_shadow_item", (_, args) => this.OnPurchase(args));
    }

    private static OnPurchase(args: { PlayerID: PlayerID; item_id: string }) {
        const player = PlayerResource.GetPlayer(args.PlayerID);
        const hero = PlayerResource.GetSelectedHeroEntity(args.PlayerID);

        // 校验身份
        if (!hero || !RoleManager.IsTraitor(hero)) {
            return;
        }

        const cost = this.GetItemCost(args.item_id);
        if (RoleManager.GetShards() < cost) {
            CustomGameEventManager.Send_ServerToPlayer(player as CDOTAPlayerController,  "create_error_message", { message: "暗影碎片不足！" });
            return;
        }

        // 扣费
        RoleManager.ModifyShards(-cost);

        // 执行效果
        this.ExecuteItemEffect(args.item_id, hero);
    }

    private static GetItemCost(itemId: string): number {
        switch (itemId) {
            case "item_buff_crit": return 500;
            case "item_buff_speed": return 500;
            case "item_shadow_ward": return 200;
            case "item_blood_contract": return 3000;
            default: return 99999;
        }
    }

    private static ExecuteItemEffect(itemId: string, caster: CDOTA_BaseNPC_Hero) {
        switch (itemId) {
            case "item_buff_crit":
                // 通知 Spawner 下一波怪带暴击
                Spawner.AddNextWaveBuff("modifier_item_daedalus_crit");
                GameRules.SendCustomMessageToTeam("暗影在涌动... 下一波怪物变得狂暴了！", DotaTeam.BADGUYS, 0, 0);
                break;

            case "item_buff_speed":
                Spawner.AddNextWaveBuff("modifier_item_phase_boots_active");
                break;

            case "item_shadow_ward":
                // 在脚下插个眼
                const ward = CreateUnitByName("npc_dota_observer_wards", caster.GetAbsOrigin(), true, caster, caster, caster.GetTeamNumber());
                ward.AddNewModifier(caster, undefined, "modifier_item_buff_ward", { duration: 300 });
                ward.SetControllableByPlayer(caster.GetPlayerID(), true);
                break;

            case "item_blood_contract":
                // 终极挑战逻辑：广播位置，强制显形，锁定光辉
                // GameLoop.StartBloodMoon();
                GameRules.SendCustomMessage("叛徒签订了血月契约！阻止他！", 0, 0);
                break;
        }
    }
}
