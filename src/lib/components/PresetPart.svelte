<script lang="ts">
	import IconX from "@lucide/svelte/icons/x";
	import { Popover } from "@skeletonlabs/skeleton-svelte";
	import { store, PRESET_CHARACTERS, PRESET_COMMANDS } from "$lib/store.svelte";

	let open = $state(false);

	const loadSample1 = () => {
		if (confirm("サンプルストーリー「モモイとミドリのVN開発」を読み込みますか？（※現在のデータは上書きされます）")) {
			store.reset(PRESET_CHARACTERS, PRESET_COMMANDS);
			store.sceneSettings.title = "モモイとミドリのVN開発";
			store.sceneSettings.id = "sample_vn_dev";
			open = false;
		}
	};

	const loadSample2 = () => {
		if (confirm("サンプルストーリー「アクション動作テスト」を読み込みますか？（※現在のデータは上書きされます）")) {
			const chars = [...PRESET_CHARACTERS];
			const cmds = [
				{
					id: "sample2-1",
					type: "character_action",
					charId: 1,
					action: "fadeIn",
					emotion: "通常"
				},
				{
					id: "sample2-2",
					type: "message",
					speaker: "モモイ",
					text: "ジャンプアクションのテストを始めるわよ！いくわよ！"
				},
				{
					id: "sample2-3",
					type: "character_action",
					charId: 1,
					action: "jump1",
					emotion: "笑顔"
				},
				{
					id: "sample2-4",
					type: "message",
					speaker: "モモイ",
					text: "これがジャンプ1（1回）！"
				},
				{
					id: "sample2-5",
					type: "character_action",
					charId: 1,
					action: "jump2",
					emotion: "怒り"
				},
				{
					id: "sample2-6",
					type: "message",
					speaker: "モモイ",
					text: "そしてこれがジャンプ2（2回連続）よ！怒涛の勢いね！"
				},
				{
					id: "sample2-7",
					type: "character_action",
					charId: 2,
					action: "fadeIn",
					emotion: "通常"
				},
				{
					id: "sample2-8",
					type: "message",
					speaker: "ミドリ",
					text: "すごいねモモイ。でも私の出番も作ってよ。"
				},
				{
					id: "sample2-9",
					type: "character_action",
					charId: 2,
					action: "jump1",
					emotion: "笑顔"
				},
				{
					id: "sample2-10",
					type: "message",
					speaker: "ミドリ",
					text: "ほら、私もジャンプできるんだよ。"
				}
			];
			store.reset(chars, cmds as any);
			store.sceneSettings.title = "アクション動作テスト";
			store.sceneSettings.id = "action_test";
			open = false;
		}
	};

	const clearAll = () => {
		if (confirm("シーンを初期化して新規作成しますか？（※現在のデータは削除されます）")) {
			store.reset([], []);
			store.sceneSettings.title = "新規シーン";
			store.sceneSettings.id = "new_scene";
			open = false;
		}
	};
</script>

<Popover
	{open}
	onOpenChange={(e) => (open = e.open)}
	positioning={{ placement: "top" }}
	triggerBase="btn preset-tonal"
	contentBase="card bg-surface-300 dark:bg-surface-800 p-4 space-y-4 max-w-[320px]"
	arrow
	arrowBackground="!bg-surface-300 dark:!bg-surface-800"
>
	{#snippet trigger()}サンプル/初期化{/snippet}
	{#snippet content()}
		<header class="flex justify-between items-center border-b pb-2 border-surface-400">
			<p class="font-bold text-xl">サンプルと初期化</p>
			<button
				class="btn-icon hover:preset-tonal"
				onclick={() => {
					open = false;
				}}><IconX /></button
			>
		</header>
		<article class="space-y-4">
			<div class="space-y-2">
				<p class="text-sm opacity-80">プリセットストーリーをロードします。</p>
				<button
					type="button"
					class="w-full px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition text-sm font-medium"
					onclick={loadSample1}
				>
					サンプル1: VN開発ストーリー
				</button>
				<button
					type="button"
					class="w-full px-4 py-2 rounded-lg bg-secondary-500 text-white hover:bg-secondary-600 transition text-sm font-medium"
					onclick={loadSample2}
				>
					サンプル2: アクションテスト
				</button>
			</div>
			
			<div class="border-t border-surface-400 pt-3">
				<p class="text-sm opacity-80 mb-2">現在のすべてのデータを消去します。</p>
				<button
					type="button"
					class="w-full px-4 py-2 rounded-lg bg-error-600 text-white hover:bg-error-700 transition text-sm font-medium"
					onclick={clearAll}
				>
					シーンをクリアして新規作成
				</button>
			</div>
		</article>
	{/snippet}
</Popover>
