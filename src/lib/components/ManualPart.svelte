<script lang="ts">
	import IconX from "@lucide/svelte/icons/x";
	import { Popover } from "@skeletonlabs/skeleton-svelte";

	let open = $state(false);
</script>

<Popover
	{open}
	onOpenChange={(e) => (open = e.open)}
	positioning={{ placement: "top" }}
	triggerBase="btn preset-tonal"
	contentBase="card bg-surface-300 dark:bg-surface-800 p-4 space-y-4 max-w-[360px] max-h-[500px] overflow-y-auto"
	arrow
	arrowBackground="!bg-surface-300 dark:!bg-surface-800"
>
	{#snippet trigger()}説明書{/snippet}
	{#snippet content()}
		<header class="flex justify-between items-center border-b pb-2 border-surface-400">
			<p class="font-bold text-xl">VNメモ帳の使い方</p>
			<button
				class="btn-icon hover:preset-tonal"
				onclick={() => {
					open = false;
				}}><IconX /></button
			>
		</header>
		<article class="space-y-3 text-sm">
			<div>
				<h3 class="font-bold text-primary-600 dark:text-primary-400">概要</h3>
				<p class="opacity-80">
					RPGEN（ロールプレイングゲームエンジン）でビジュアルノベルゲームを構築するための、イベントコマンド作成ツールです。
				</p>
			</div>

			<div>
				<h3 class="font-bold text-primary-600 dark:text-primary-400">基本的な手順</h3>
				<ol class="list-decimal pl-4 space-y-1 opacity-80">
					<li><strong>キャラクター定義:</strong> 左メニューでキャラクターの名前やImgur画像URL、表情を設定します。</li>
					<li><strong>タイムライン構築:</strong> 下部のタイムラインに、メッセージ表示やキャラのアニメーション、選択肢分岐などのコマンドを追加します。</li>
					<li><strong>動作チェック:</strong> 中央上のプレビューエリアで「再生」を押し、実際のゲーム中での動きをシミュレートできます。</li>
					<li><strong>エクスポート:</strong> 右メニューに生成されるRPGENコードをコピーし、RPGENのマップイベントに貼り付けます。</li>
				</ol>
			</div>

			<div>
				<h3 class="font-bold text-primary-600 dark:text-primary-400">コマンドの種類</h3>
				<ul class="list-disc pl-4 space-y-1 opacity-80">
					<li><strong>メッセージ:</strong> 会話ダイアログを表示します。話者（キャラクター）を選択可能。</li>
					<li><strong>ウェイト:</strong> 指定ミリ秒だけ処理を一時停止します。</li>
					<li><strong>登場/退場:</strong> 座標とイージングを元に、キャラをフェードイン/アウトします。</li>
					<li><strong>表情変更/ジャンプ:</strong> キャラクターの立ち絵を変更し、ジャンプ演出を行います。</li>
					<li><strong>選択肢:</strong> プレイヤーの回答によってストーリーを分岐します（ネスト対応）。</li>
				</ul>
			</div>

			<div>
				<h3 class="font-bold text-primary-600 dark:text-primary-400">RPGENへの導入方法</h3>
				<p class="opacity-80">
					右メニューで出力されたテキスト全体をコピーし、RPGENのイベントエディタに直接貼り付けて保存するだけで動作します。イベントポイントの位置（TX, TY）も指定できます。
				</p>
			</div>
		</article>
	{/snippet}
</Popover>
