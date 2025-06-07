<script lang="ts">
    import { base } from "$app/paths";

    const isMobile = globalThis.innerWidth < 768;
</script>

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-surface-100 shadow flex flex-wrap items-center gap-3">
        <!-- タイトルは左寄せ、固定幅 -->
        <div
            class="flex-none px-8 bg-primary rounded select-none text-left font-bold text-error-700 flex items-center gap-2"
            style="min-width: 180px;"
        >
            <img
                src="{base}/momoi.png"
                alt="Momoi Icon"
                class="w-16 h-16 object-contain"
            />
            <!-- PCやタブレット幅で表示 -->
            <span class="hidden sm:inline">
                VNメモ帳（ビジュアルノベルメモ帳）
            </span>
            <!-- スマホ幅で表示 -->
            <span class="sm:hidden flex flex-col">
                <span>VNメモ帳</span>
                <span>（ビジュアルノベルメモ帳）</span>
            </span>
        </div>

        <!-- タイトル以降の要素を包むコンテナ、中央寄せ -->
        <div class="flex flex-1 flex-wrap justify-center items-center gap-3">
            てすと
        </div>
    </header>

    <!-- Content Area -->
    <div class="grid grid-cols-1 md:grid-cols-[auto_1fr_auto]">
        <!-- Left Sidebar -->
        <aside class="bg-surface-200 p-4 space-y-4">てすと</aside>

        <!-- Main Canvas Area -->
        <main class="bg-white flex items-center justify-center gap-4">
            てすと
        </main>

        <!-- Right Sidebar -->
        <aside class="bg-surface-200 p-4 space-y-4">てすと</aside>
    </div>

    <!-- Footer Tool Selector -->
    <footer
        class="bg-surface-100 shadow p-2 flex flex-wrap items-center justify-center gap-2"
    >
        てすと
    </footer>
</div>

<style>
    :global(.color-picker-wrapper label) {
        border-radius: 50%;
        box-shadow:
            0 0 0 2px black,
            0 0 0 4px white;
    }
    :global(.hg-paint-grid-mode .upper-canvas) {
        opacity: 0.4;
        background-image: linear-gradient(to right, gray 1px, transparent 1px),
            linear-gradient(to bottom, gray 1px, transparent 1px);
        background-size: var(--grid-cell-size) var(--grid-cell-size);
    }
</style>
