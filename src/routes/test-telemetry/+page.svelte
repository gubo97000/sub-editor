<script lang="ts">
  import { traceApiCall, traceFileOperation, traceLLMOperation, traceSubtitleOperation } from '$lib/telemetry';
  import { onMount } from 'svelte';

  let testResults: string[] = [];
  let isLoading = false;

  onMount(() => {
    console.log('OpenTelemetry Test Page Loaded');
    addResult('✅ Test page loaded successfully');
  });

  function addResult(message: string) {
    testResults = [...testResults, `${new Date().toLocaleTimeString()}: ${message}`];
  }

  async function testAPICall() {
    addResult('🔄 Testing API call tracing...');
    try {
      const result = await traceApiCall(
        'POST',
        '/api/test-trace',
        async () => {
          // Simulate an API call
          const response = await fetch('/api/test-trace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'telemetry' })
          });
          if (response.ok) {
            return await response.json();
          } else {
            return { message: 'API endpoint not found (expected for demo)' };
          }
        }
      );
      addResult('✅ API call traced successfully');
    } catch (error) {
      addResult(`✅ API call error traced: ${error}`);
    }
  }

  async function testLLMTracing() {
    addResult('🔄 Testing LLM operation tracing...');
    try {
      const result = await traceLLMOperation(
        'translation',
        'test-model',
        async () => {
          // Simulate LLM processing
          await new Promise(resolve => setTimeout(resolve, 500));
          return { 
            response: 'This is a simulated LLM response',
            tokens: 25,
            model: 'test-model'
          };
        }
      );
      addResult('✅ LLM operation traced successfully');
    } catch (error) {
      addResult(`❌ LLM tracing failed: ${error}`);
    }
  }

  async function testFileOperations() {
    addResult('🔄 Testing file operation tracing...');
    try {
      const result = await traceFileOperation(
        'upload',
        'test-subtitle.srt',
        async () => {
          // Simulate file processing
          await new Promise(resolve => setTimeout(resolve, 300));
          return { 
            fileName: 'test-subtitle.srt',
            size: 1024,
            processed: true
          };
        }
      );
      addResult('✅ File operation traced successfully');
    } catch (error) {
      addResult(`❌ File operation tracing failed: ${error}`);
    }
  }

  async function testSubtitleProcessing() {
    addResult('🔄 Testing subtitle processing tracing...');
    try {
      const result = await traceSubtitleOperation(
        'translate',
        async () => {
          // Simulate subtitle processing
          await new Promise(resolve => setTimeout(resolve, 400));
          return { 
            processed: 50,
            total: 100,
            format: 'srt'
          };
        }
      );
      addResult('✅ Subtitle processing traced successfully');
    } catch (error) {
      addResult(`❌ Subtitle processing tracing failed: ${error}`);
    }
  }

  async function runAllTests() {
    isLoading = true;
    testResults = [];
    addResult('🚀 Starting OpenTelemetry instrumentation tests...');
    
    try {
      await testAPICall();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await testLLMTracing();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await testFileOperations();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await testSubtitleProcessing();
      
      addResult('🎉 All tests completed!');
      addResult('📊 Check your browser console for OpenTelemetry traces');
    } catch (error) {
      addResult(`❌ Test suite failed: ${error}`);
    } finally {
      isLoading = false;
    }
  }

  function clearResults() {
    testResults = [];
  }
</script>

<svelte:head>
  <title>OpenTelemetry Test - Sub Editor</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">OpenTelemetry Instrumentation Test</h1>
  
  <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
    <div class="flex">
      <div class="ml-3">
        <p class="text-sm text-blue-700">
          This page tests the OpenTelemetry instrumentation setup. The tests simulate various operations
          and create traces that should appear in your configured observability backend (console, Jaeger, etc.).
        </p>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <button 
      on:click={testAPICall}
      disabled={isLoading}
      class="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
    >
      Test API Call Tracing
    </button>

    <button 
      on:click={testLLMTracing}
      disabled={isLoading}
      class="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
    >
      Test LLM Tracing
    </button>

    <button 
      on:click={testFileOperations}
      disabled={isLoading}
      class="bg-yellow-500 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
    >
      Test File Operations
    </button>

    <button 
      on:click={testSubtitleProcessing}
      disabled={isLoading}
      class="bg-purple-500 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
    >
      Test Subtitle Processing
    </button>
  </div>

  <div class="flex gap-4 mb-6">
    <button 
      on:click={runAllTests}
      disabled={isLoading}
      class="bg-indigo-600 hover:bg-indigo-800 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg"
    >
      {isLoading ? '🔄 Running Tests...' : '🚀 Run All Tests'}
    </button>

    <button 
      on:click={clearResults}
      disabled={isLoading}
      class="bg-gray-500 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg"
    >
      Clear Results
    </button>
  </div>

  {#if testResults.length > 0}
    <div class="bg-gray-100 border rounded-lg p-4">
      <h2 class="text-xl font-semibold mb-3">Test Results</h2>
      <div class="space-y-1 font-mono text-sm">
        {#each testResults as result}
          <div class="p-2 bg-white rounded border-l-2 border-gray-300">
            {result}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="mt-8 bg-gray-50 border rounded-lg p-6">
    <h2 class="text-xl font-semibold mb-3">Instrumentation Status</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <h3 class="font-medium text-gray-700 mb-2">Server-side Instrumentation</h3>
        <ul class="space-y-1 text-gray-600">
          <li>✅ HTTP requests (automatic)</li>
          <li>✅ SvelteKit hooks integration</li>
          <li>✅ Custom API tracing</li>
          <li>✅ LLM operation tracing</li>
        </ul>
      </div>
      <div>
        <h3 class="font-medium text-gray-700 mb-2">Client-side Instrumentation</h3>
        <ul class="space-y-1 text-gray-600">
          <li>✅ Fetch API calls (automatic)</li>
          <li>✅ User interactions (automatic)</li>
          <li>✅ Page load performance (automatic)</li>
          <li>✅ Custom telemetry functions</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <h3 class="font-medium text-yellow-800 mb-2">📋 How to View Traces</h3>
    <ul class="text-sm text-yellow-700 space-y-1">
      <li>• <strong>Browser Console:</strong> Open DevTools → Console to see trace logs</li>
      <li>• <strong>Jaeger:</strong> If enabled, visit <a href="http://localhost:16686" class="underline" target="_blank">http://localhost:16686</a></li>
      <li>• <strong>OTLP Collector:</strong> Check your configured observability backend</li>
    </ul>
  </div>
</div>

<style>
  .container {
    min-height: 100vh;
  }
</style>
