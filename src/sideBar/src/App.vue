<!-- Route extension-host navigation events to the sidebar pages. -->
<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { useHostMessages } from "./composables/events";
import { onMounted } from "vue";
import { vscode } from "./utilities/vscode";
import { useRouter } from "vue-router";

const router = useRouter();
onMounted(() => vscode.postMessage({ command: "ready" }));

useHostMessages( (event: any) => {
  const message = event.data;
  switch (message.command) {
    case "modules":
      router.push("/");
      break;
    case "projectView":
      router.push("/project");
      break;
  }
});
</script>
