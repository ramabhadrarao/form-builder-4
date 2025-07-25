import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Eye, 
  Settings, 
  Plus,
  Trash2,
  ArrowRight,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  GitBranch
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface WorkflowStage {
  id: string;
  name: string;
  role: string;
  users: string[];
  actions: string[];
  conditions?: any;
  notifications?: any;
}

interface WorkflowTransition {
  from: string;
  to: string;
  condition?: any;
  action: string;
}

export const WorkflowBuilderPage: React.FC = () => {
  const { applicationId, workflowId } = useParams<{ applicationId?: string; workflowId?: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'settings'>('build');
  
  const [workflowData, setWorkflowData] = useState({
    name: 'Untitled Workflow',
    description: '',
    applicationId: applicationId || '',
    formId: ''
  });

  const [workflowConfig, setWorkflowConfig] = useState({
    stages: [] as WorkflowStage[],
    transitions: [] as WorkflowTransition[],
    settings: {
      autoProgress: false,
      enableEscalation: false,
      escalationTime: 24
    }
  });

  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);

  const availableRoles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'staff', label: 'Staff' },
    { value: 'user', label: 'User' }
  ];

  const availableActions = [
    { value: 'submit', label: 'Submit' },
    { value: 'approve', label: 'Approve' },
    { value: 'reject', label: 'Reject' },
    { value: 'review', label: 'Review' },
    { value: 'finalize', label: 'Finalize' }
  ];

  const addStage = () => {
    const newStage: WorkflowStage = {
      id: `stage_${Date.now()}`,
      name: `Stage ${workflowConfig.stages.length + 1}`,
      role: '',
      users: [],
      actions: [],
      conditions: {},
      notifications: {}
    };

    setWorkflowConfig(prev => ({
      ...prev,
      stages: [...prev.stages, newStage]
    }));

    setSelectedStage(newStage);
  };

  const updateStage = (stageId: string, updates: Partial<WorkflowStage>) => {
    setWorkflowConfig(prev => ({
      ...prev,
      stages: prev.stages.map(stage => 
        stage.id === stageId ? { ...stage, ...updates } : stage
      )
    }));

    if (selectedStage?.id === stageId) {
      setSelectedStage(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const removeStage = (stageId: string) => {
    setWorkflowConfig(prev => ({
      ...prev,
      stages: prev.stages.filter(stage => stage.id !== stageId),
      transitions: prev.transitions.filter(t => t.from !== stageId && t.to !== stageId)
    }));

    if (selectedStage?.id === stageId) {
      setSelectedStage(null);
    }
  };

  const addTransition = (fromStage: string, toStage: string, action: string) => {
    const newTransition: WorkflowTransition = {
      from: fromStage,
      to: toStage,
      action
    };

    setWorkflowConfig(prev => ({
      ...prev,
      transitions: [...prev.transitions, newTransition]
    }));
  };

  const saveWorkflow = async () => {
    setIsLoading(true);
    try {
      // API call to save workflow
      toast.success('Workflow saved successfully');
    } catch (error) {
      toast.error('Failed to save workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWorkflowDiagram = () => {
    return (
      <div className="space-y-8">
        {workflowConfig.stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center">
            {/* Stage */}
            <div
              onClick={() => setSelectedStage(stage)}
              className={`workflow-node min-w-48 ${
                selectedStage?.id === stage.id ? 'workflow-node-active' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{stage.name}</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStage(stage.id);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{stage.role || 'No role assigned'}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>{stage.actions.length} actions</span>
                </div>
              </div>
            </div>

            {/* Arrow to next stage */}
            {index < workflowConfig.stages.length - 1 && (
              <div className="flex items-center mx-4">
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {/* Add Stage Button */}
        <button
          onClick={addStage}
          className="workflow-node border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center min-h-24"
        >
          <div className="text-center">
            <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Add Stage</span>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={workflowData.name}
              onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            />
            <span className="badge badge-primary">Workflow</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('build')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === 'build' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Build
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === 'preview' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="h-4 w-4 mr-1 inline" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="h-4 w-4 mr-1 inline" />
                Settings
              </button>
            </div>
            
            <button
              onClick={saveWorkflow}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'build' && (
          <>
            {/* Workflow Canvas */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-96">
                  {workflowConfig.stages.length === 0 ? (
                    <div className="text-center py-12">
                      <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building Your Workflow</h3>
                      <p className="text-gray-600 mb-6">
                        Create stages to define your approval process.
                      </p>
                      <button
                        onClick={addStage}
                        className="btn btn-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Stage
                      </button>
                    </div>
                  ) : (
                    renderWorkflowDiagram()
                  )}
                </div>
              </div>
            </div>

            {/* Stage Properties Panel */}
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                {selectedStage ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Properties</h3>
                    
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">Stage Name</label>
                        <input
                          type="text"
                          value={selectedStage.name}
                          onChange={(e) => updateStage(selectedStage.id, { name: e.target.value })}
                          className="input w-full"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Assigned Role</label>
                        <select
                          value={selectedStage.role}
                          onChange={(e) => updateStage(selectedStage.id, { role: e.target.value })}
                          className="select w-full"
                        >
                          <option value="">Select a role</option>
                          {availableRoles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Available Actions</label>
                        <div className="space-y-2">
                          {availableActions.map(action => (
                            <label key={action.value} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedStage.actions.includes(action.value)}
                                onChange={(e) => {
                                  const newActions = e.target.checked
                                    ? [...selectedStage.actions, action.value]
                                    : selectedStage.actions.filter(a => a !== action.value);
                                  updateStage(selectedStage.id, { actions: newActions });
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                              />
                              {action.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Specific Users (Optional)</label>
                        <textarea
                          value={selectedStage.users.join(', ')}
                          onChange={(e) => {
                            const users = e.target.value.split(',').map(u => u.trim()).filter(u => u);
                            updateStage(selectedStage.id, { users });
                          }}
                          className="textarea w-full"
                          rows={3}
                          placeholder="Enter user IDs or emails, separated by commas"
                        />
                        <p className="form-help">
                          Leave empty to use role-based assignment
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stage Selected</h3>
                    <p className="text-gray-600">
                      Click on a stage in the workflow to edit its properties.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{workflowData.name}</h2>
                
                {workflowConfig.stages.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {workflowConfig.stages.map((stage, index) => (
                        <div key={stage.id} className="relative">
                          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{stage.name}</h4>
                              <span className="text-sm text-gray-500">#{index + 1}</span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                <span>{stage.role || 'No role'}</span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1">
                                {stage.actions.map(action => (
                                  <span key={action} className="badge badge-primary text-xs">
                                    {action}
                                  </span>
                                ))}
                              </div>
                              
                              {stage.users.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  Specific users: {stage.users.length}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {index < workflowConfig.stages.length - 1 && (
                            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 z-10">
                              <div className="bg-white border-2 border-gray-300 rounded-full p-1">
                                <ArrowRight className="h-4 w-4 text-gray-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Workflow Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Total Stages:</span>
                          <span className="ml-2 font-medium">{workflowConfig.stages.length}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Auto Progress:</span>
                          <span className="ml-2 font-medium">
                            {workflowConfig.settings.autoProgress ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700">Escalation:</span>
                          <span className="ml-2 font-medium">
                            {workflowConfig.settings.enableEscalation 
                              ? `${workflowConfig.settings.escalationTime} hours` 
                              : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workflow to Preview</h3>
                    <p className="text-gray-600">
                      Add stages to your workflow to see a preview.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Workflow Settings</h2>
                
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Workflow Name</label>
                    <input
                      type="text"
                      value={workflowData.name}
                      onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
                      className="input w-full"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      value={workflowData.description}
                      onChange={(e) => setWorkflowData(prev => ({ ...prev, description: e.target.value }))}
                      className="textarea w-full"
                      rows={3}
                      placeholder="Describe what this workflow does..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Form</label>
                    <select
                      value={workflowData.formId}
                      onChange={(e) => setWorkflowData(prev => ({ ...prev, formId: e.target.value }))}
                      className="select w-full"
                    >
                      <option value="">Select a form</option>
                      <option value="customer_form">Customer Registration Form</option>
                      <option value="feedback_form">Feedback Form</option>
                      <option value="survey_form">Survey Form</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Automation Settings</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Auto Progress</label>
                        <p className="text-sm text-gray-500">Automatically move to next stage when conditions are met</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={workflowConfig.settings.autoProgress}
                        onChange={(e) => setWorkflowConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, autoProgress: e.target.checked }
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Enable Escalation</label>
                        <p className="text-sm text-gray-500">Escalate to next level if no action is taken</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={workflowConfig.settings.enableEscalation}
                        onChange={(e) => setWorkflowConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, enableEscalation: e.target.checked }
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    {workflowConfig.settings.enableEscalation && (
                      <div className="form-group">
                        <label className="form-label">Escalation Time (hours)</label>
                        <input
                          type="number"
                          value={workflowConfig.settings.escalationTime}
                          onChange={(e) => setWorkflowConfig(prev => ({
                            ...prev,
                            settings: { ...prev.settings, escalationTime: parseInt(e.target.value) || 24 }
                          }))}
                          className="input w-full"
                          min="1"
                          max="168"
                        />
                        <p className="form-help">Time to wait before escalating (1-168 hours)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};