<script>
	// get a prop from the parent component
	export let data;
	export let title;
</script>

<div class="sub-container">
	<h2>{title}</h2>
	<div>
		{#each data.data as sub}
			<div class="sub-item">
				<div class="sub-time">{sub.start} - {sub.end}</div>
				<div>{sub.transcription}</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.sub-container {
		background-color: #f0f0f0;
		padding: 20px;
		border-radius: 5px;
	}
	.sub-item {
		background-color: #fff;
		padding: 10px;
		margin: 5px;
		border-radius: 5px;
		& .sub-time {
			font-weight: bold;
			border-radius: 5px;
			background-color: #f0f0f0;
		}
	}
</style>
