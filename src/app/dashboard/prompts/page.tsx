'use client';

import React, { useState, useEffect } from 'react';

interface PromptVersion {
  version: string;
  status: string;
  prompt: string;
  isCurrent: boolean;
}

interface Agent {
  key: string;
  name: string;
  versions: PromptVersion[];
}

export default function PromptDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [promptText, setPromptText] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch prompt data on component mount
  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prompts');
      const result = await response.json();
      
      if (result.success) {
        setAgents(result.data);
        if (result.data.length > 0) {
          setSelectedAgent(result.data[0]);
          setSelectedVersion(result.data[0].versions[0]);
          setPromptText(result.data[0].versions[0].prompt);
        }
      } else {
        setError(result.error || 'Failed to fetch prompts');
      }
    } catch (err) {
      setError('Failed to fetch prompts');
      console.error('Error fetching prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle agent/version switching
  const handleAgentChange = (agentKey: string) => {
    const agent = agents.find(a => a.key === agentKey);
    if (agent) {
      setSelectedAgent(agent);
      setSelectedVersion(agent.versions[0]);
      setPromptText(agent.versions[0].prompt);
    }
  };

  const handleVersionChange = (version: string) => {
    if (selectedAgent) {
      const v = selectedAgent.versions.find(v => v.version === version);
      if (v) {
        setSelectedVersion(v);
        setPromptText(v.prompt);
      }
    }
  };

  // Save prompt changes
  const handleSave = async () => {
    if (!selectedAgent || !selectedVersion) return;

    try {
      setSaving(true);
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentKey: selectedAgent.key,
          version: selectedVersion.version,
          prompt: promptText,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Prompt saved successfully!');
        // Refresh the data to get any updates
        await fetchPrompts();
      } else {
        alert(`Error saving prompt: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to save prompt');
      console.error('Error saving prompt:', err);
    } finally {
      setSaving(false);
    }
  };

  // Set active version
  const handleSetActive = async () => {
    if (!selectedAgent || !selectedVersion) return;

    try {
      setSaving(true);
      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentKey: selectedAgent.key,
          version: selectedVersion.version,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Active version updated successfully!');
        // Refresh the data to get updated status
        await fetchPrompts();
      } else {
        alert(`Error setting active version: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to set active version');
      console.error('Error setting active version:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Prompt Management</h1>
        <div className="text-center">Loading prompts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Prompt Management</h1>
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={fetchPrompts}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!selectedAgent || !selectedVersion) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Prompt Management</h1>
        <div className="text-center">No prompts available</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Prompt Management</h1>
      
      <div className="flex gap-4 mb-4">
        <select 
          value={selectedAgent.key} 
          onChange={e => handleAgentChange(e.target.value)} 
          className="border rounded px-2 py-1"
        >
          {agents.map(agent => (
            <option key={agent.key} value={agent.key}>{agent.name}</option>
          ))}
        </select>
        
        <select 
          value={selectedVersion.version} 
          onChange={e => handleVersionChange(e.target.value)} 
          className="border rounded px-2 py-1"
        >
          {selectedAgent.versions.map(v => (
            <option key={v.version} value={v.version}>
              {v.version} ({v.status}) {v.isCurrent ? '(Current)' : ''}
            </option>
          ))}
        </select>
        
        <button 
          onClick={handleSetActive} 
          disabled={saving || selectedVersion.isCurrent}
          className="ml-2 px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {saving ? 'Setting...' : 'Set Active'}
        </button>
      </div>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          Status: {selectedVersion.status} {selectedVersion.isCurrent && '(Currently Active)'}
        </div>
      </div>
      
      <textarea
        className="w-full border rounded p-2 font-mono min-h-[400px] mb-4"
        value={promptText}
        onChange={e => setPromptText(e.target.value)}
        placeholder="Enter prompt content..."
      />
      
      <div className="flex justify-end gap-2">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
} 