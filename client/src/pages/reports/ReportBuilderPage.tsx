import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Eye, 
  Settings, 
  Plus,
  Trash2,
  Filter,
  SortAsc,
  SortDesc,
  BarChart3,
  PieChart,
  LineChart,
  Table
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ReportColumn {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  label: string;
}

interface ReportAggregation {
  field: string;
  operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  label: string;
}

export const ReportBuilderPage: React.FC = () => {
  const { applicationId, reportId } = useParams<{ applicationId?: string; reportId?: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'settings'>('build');
  
  const [reportData, setReportData] = useState({
    name: 'Untitled Report',
    description: '',
    applicationId: applicationId || '',
    sourceForm: '',
    type: 'custom' as const
  });

  const [reportConfig, setReportConfig] = useState({
    columns: [] as ReportColumn[],
    filters: [] as ReportFilter[],
    sorting: { field: '', direction: 'asc' as 'asc' | 'desc' },
    grouping: { field: '', enabled: false },
    aggregations: [] as ReportAggregation[]
  });

  const [availableFields] = useState([
    { field: 'full_name', label: 'Full Name', type: 'text' },
    { field: 'email', label: 'Email', type: 'text' },
    { field: 'age', label: 'Age', type: 'number' },
    { field: 'gender', label: 'Gender', type: 'text' },
    { field: 'created_at', label: 'Created Date', type: 'date' },
    { field: 'status', label: 'Status', type: 'text' }
  ]);

  const addColumn = (field: any) => {
    const newColumn: ReportColumn = {
      field: field.field,
      label: field.label,
      type: field.type,
      sortable: true,
      filterable: true
    };

    setReportConfig(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn]
    }));
  };

  const removeColumn = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      field: '',
      operator: 'equals',
      value: '',
      label: 'New Filter'
    };

    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, ...updates } : filter
      )
    }));
  };

  const removeFilter = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const addAggregation = () => {
    const newAggregation: ReportAggregation = {
      field: '',
      operation: 'count',
      label: 'New Aggregation'
    };

    setReportConfig(prev => ({
      ...prev,
      aggregations: [...prev.aggregations, newAggregation]
    }));
  };

  const updateAggregation = (index: number, updates: Partial<ReportAggregation>) => {
    setReportConfig(prev => ({
      ...prev,
      aggregations: prev.aggregations.map((agg, i) => 
        i === index ? { ...agg, ...updates } : agg
      )
    }));
  };

  const removeAggregation = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      aggregations: prev.aggregations.filter((_, i) => i !== index)
    }));
  };

  const saveReport = async () => {
    setIsLoading(true);
    try {
      // API call to save report
      toast.success('Report saved successfully');
    } catch (error) {
      toast.error('Failed to save report');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = () => {
    // Mock data for preview
    return [
      { full_name: 'John Doe', email: 'john@example.com', age: 30, gender: 'Male', created_at: '2024-01-15', status: 'Active' },
      { full_name: 'Jane Smith', email: 'jane@example.com', age: 25, gender: 'Female', created_at: '2024-01-16', status: 'Active' },
      { full_name: 'Bob Johnson', email: 'bob@example.com', age: 35, gender: 'Male', created_at: '2024-01-17', status: 'Inactive' }
    ];
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={reportData.name}
              onChange={(e) => setReportData(prev => ({ ...prev, name: e.target.value }))}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            />
            <span className="badge badge-primary">{reportData.type}</span>
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
              onClick={saveReport}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Report
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'build' && (
          <>
            {/* Configuration Panel */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Available Fields */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Fields</h3>
                  <div className="space-y-2">
                    {availableFields.map((field) => (
                      <button
                        key={field.field}
                        onClick={() => addColumn(field)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900">{field.label}</span>
                          <p className="text-xs text-gray-500">{field.type}</p>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    <button
                      onClick={addFilter}
                      className="btn btn-outline btn-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Filter
                    </button>
                  </div>
                  <div className="space-y-3">
                    {reportConfig.filters.map((filter, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Filter {index + 1}</span>
                          <button
                            onClick={() => removeFilter(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={filter.field}
                            onChange={(e) => updateFilter(index, { field: e.target.value })}
                            className="select w-full text-sm"
                          >
                            <option value="">Select field</option>
                            {availableFields.map(field => (
                              <option key={field.field} value={field.field}>{field.label}</option>
                            ))}
                          </select>
                          <select
                            value={filter.operator}
                            onChange={(e) => updateFilter(index, { operator: e.target.value as any })}
                            className="select w-full text-sm"
                          >
                            <option value="equals">Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greater_than">Greater than</option>
                            <option value="less_than">Less than</option>
                            <option value="between">Between</option>
                          </select>
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            placeholder="Filter value"
                            className="input w-full text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aggregations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Aggregations</h3>
                    <button
                      onClick={addAggregation}
                      className="btn btn-outline btn-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {reportConfig.aggregations.map((agg, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Aggregation {index + 1}</span>
                          <button
                            onClick={() => removeAggregation(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={agg.field}
                            onChange={(e) => updateAggregation(index, { field: e.target.value })}
                            className="select w-full text-sm"
                          >
                            <option value="">Select field</option>
                            {availableFields.filter(f => f.type === 'number').map(field => (
                              <option key={field.field} value={field.field}>{field.label}</option>
                            ))}
                          </select>
                          <select
                            value={agg.operation}
                            onChange={(e) => updateAggregation(index, { operation: e.target.value as any })}
                            className="select w-full text-sm"
                          >
                            <option value="sum">Sum</option>
                            <option value="avg">Average</option>
                            <option value="count">Count</option>
                            <option value="min">Minimum</option>
                            <option value="max">Maximum</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Report Canvas */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Report Configuration</h2>
                  
                  {/* Selected Columns */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Columns</h3>
                    {reportConfig.columns.length > 0 ? (
                      <div className="space-y-2">
                        {reportConfig.columns.map((column, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">{column.label}</span>
                              <span className="text-sm text-gray-500 ml-2">({column.type})</span>
                            </div>
                            <button
                              onClick={() => removeColumn(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Table className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No columns selected. Add fields from the left panel.</p>
                      </div>
                    )}
                  </div>

                  {/* Sorting */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Sorting</h3>
                    <div className="flex items-center space-x-4">
                      <select
                        value={reportConfig.sorting.field}
                        onChange={(e) => setReportConfig(prev => ({
                          ...prev,
                          sorting: { ...prev.sorting, field: e.target.value }
                        }))}
                        className="select flex-1"
                      >
                        <option value="">No sorting</option>
                        {reportConfig.columns.map(column => (
                          <option key={column.field} value={column.field}>{column.label}</option>
                        ))}
                      </select>
                      <select
                        value={reportConfig.sorting.direction}
                        onChange={(e) => setReportConfig(prev => ({
                          ...prev,
                          sorting: { ...prev.sorting, direction: e.target.value as 'asc' | 'desc' }
                        }))}
                        className="select w-32"
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                    </div>
                  </div>

                  {/* Grouping */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Grouping</h3>
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={reportConfig.grouping.enabled}
                        onChange={(e) => setReportConfig(prev => ({
                          ...prev,
                          grouping: { ...prev.grouping, enabled: e.target.checked }
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">Enable grouping</label>
                      {reportConfig.grouping.enabled && (
                        <select
                          value={reportConfig.grouping.field}
                          onChange={(e) => setReportConfig(prev => ({
                            ...prev,
                            grouping: { ...prev.grouping, field: e.target.value }
                          }))}
                          className="select flex-1"
                        >
                          <option value="">Select field to group by</option>
                          {reportConfig.columns.map(column => (
                            <option key={column.field} value={column.field}>{column.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{reportData.name}</h2>
                
                {reportConfig.columns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          {reportConfig.columns.map((column) => (
                            <th key={column.field} className="table-cell">
                              <div className="flex items-center space-x-1">
                                <span>{column.label}</span>
                                {reportConfig.sorting.field === column.field && (
                                  reportConfig.sorting.direction === 'asc' ? 
                                    <SortAsc className="h-4 w-4" /> : 
                                    <SortDesc className="h-4 w-4" />
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {generatePreview().map((row, index) => (
                          <tr key={index} className="table-row">
                            {reportConfig.columns.map((column) => (
                              <td key={column.field} className="table-cell">
                                {row[column.field as keyof typeof row]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data to Preview</h3>
                    <p className="text-gray-600">
                      Configure your report columns and filters to see a preview.
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
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Report Settings</h2>
                
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Report Name</label>
                    <input
                      type="text"
                      value={reportData.name}
                      onChange={(e) => setReportData(prev => ({ ...prev, name: e.target.value }))}
                      className="input w-full"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      value={reportData.description}
                      onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                      className="textarea w-full"
                      rows={3}
                      placeholder="Describe what this report shows..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Report Type</label>
                    <select
                      value={reportData.type}
                      onChange={(e) => setReportData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="select w-full"
                    >
                      <option value="custom">Custom Report</option>
                      <option value="automated">Automated Report</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Source Form</label>
                    <select
                      value={reportData.sourceForm}
                      onChange={(e) => setReportData(prev => ({ ...prev, sourceForm: e.target.value }))}
                      className="select w-full"
                    >
                      <option value="">Select a form</option>
                      <option value="customer_form">Customer Registration Form</option>
                      <option value="feedback_form">Feedback Form</option>
                      <option value="survey_form">Survey Form</option>
                    </select>
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