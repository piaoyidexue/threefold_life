// 监听 NetTable 变化更新碎片数
import {NetTableClient} from "./utils/NetTableClient";


NetTableClient.Listen("player_data", (key, value)=>{
    if (  key === "traitor_data") {
        const shards=value.traitor_data.shards;
        ($("#ShardLabel") as LabelPanel).text  = shards.toString();
    }
});
// 监听被动技能来决定是否显示界面
GameEvents.Subscribe("dota_player_update_selected_unit", CheckTraitorStatus);

function CheckTraitorStatus() {
    const localHero = Players.GetPlayerHeroEntityIndex(Players.GetLocalPlayer());
    if (localHero !== -1) {
        // 检测是否有内奸被动 modifier
        const hasPassive = Entities.HasModifier(localHero, "modifier_traitor_passive");
        const panel = $("#ShadowBagRoot");

        if (hasPassive) {
            panel.RemoveClass("Hidden");
        } else {
            panel.AddClass("Hidden");
        }
    }
}



// 按钮回调
($.GetContextPanel() as any).BuyItem = function(itemId: string) {
    GameEvents.SendCustomGameEventToServer("c2s_buy_shadow_item", { item_id: itemId });
    Game.EmitSound("General.Buy");
};

// 初始化检查一次
CheckTraitorStatus();
