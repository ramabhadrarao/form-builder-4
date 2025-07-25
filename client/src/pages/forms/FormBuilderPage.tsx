import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Eye, 
  Settings, 
  Plus,
  Type,
  Hash,
  Mail,
  Calendar,
  CheckSquare,
  List,
  Upload,
  MapPin,
  Calculator,
  Link as LinkIcon,
  Repeat,
  Heading1,
  Minus,
  Layout,
  Code
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  required: boolean;
  validation?: any;
  options?: any;
  permissions?: any;
  conditionalLogic?: any;
}

interface FormStructure {
  fields: FormField[];
  layout: 'single-column' | '2-column' | '3-column' | 'grid';
  sections: any[];
}

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: Type, category: 'Basic' },
  { type: 'textarea', label: 'Textarea', icon: Type, category: 'Basic' },
  { type: 'number', label: 'Number', icon: Hash, category: 'Basic' },
  { type: 'email', label: 'Email', icon: Mail, category: 'Basic' },
  { type: 'password', label: 'Password', icon: Type, category: 'Basic' },
  { type: 'tel', label: 'Phone', icon: Type, category: 'Basic' },
  { type: 'url', label: 'URL', icon: LinkIcon, category: 'Basic' },
  
  { type: 'select', label: 'Select', icon: List, category: 'Choice' },
  { type: 'radio', label: 'Radio', icon: CheckSquare, category: 'Choice' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, category: 'Choice' },
  { type: 'multiselect', label: 'Multi-select', icon: List, category: 'Choice' },
  
  { type: 'date', label: 'Date', icon: Calendar, category: 'Date/Time' },
  { type: 'time', label: 'Time', icon: Calendar, category: 'Date/Time' },
  { type: 'datetime', label: 'Date Time', icon: Calendar, category: 'Date/Time' },
  { type: 'daterange', label: 'Date Range', icon: Calendar, category: 'Date/Time' },
  
  { type: 'file', label: 'File Upload', icon: Upload, category: 'Files' },
  { type: 'image', label: 'Image Upload', icon: Upload, category: 'Files' },
  { type: 'signature', label: 'Signature', icon: Upload, category: 'Files' },
  
  { type: 'location', label: 'Location', icon: MapPin, category: 'Advanced' },
  { type: 'formula', label: 'Formula', icon: Calculator, category: 'Advanced' },
  { type: 'lookup', label: 'Lookup', icon: LinkIcon, category: 'Advanced' },
  { type: 'repeater', label: 'Repeater', icon: Repeat, category: 'Advanced' },
  
  { type: 'heading', label: 'Heading', icon: Heading1, category: 'Layout' },
  { type: 'divider', label: 'Divider', icon: Minus, category: 'Layout' },
  { type: 'section', label: 'Section', icon: Layout, category: 'Layout' },
  { type: 'html', label: 'HTML', icon: Code, category: 'Layout' }
];

export const FormBuilderPage: React.FC = () => {
  const { applicationId, formId } = useParams<{ applicationId?: string; formId?: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'settings'>('build');
  const [selectedCategory, setSelectedCategory] = useState('Basic');
  
  const [formData, setFormData] = useState({
    name: 'Untitled Form',
    description: '',
    applicationId: applicationId || '',
    status: 'draft' as const
  });

  const [formStructure, setFormStructure] = useState<FormStructure>({
    fields: [],
    layout: 'single-column',
    sections: []
  });

  const [selectedField, setSelectedField] = useState<FormField | null>(null);

  const categories = [...new Set(fieldTypes.map(field => field.category))];

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldType,
      name: `${fieldType}_${Date.now()}`,
      label: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      required: false,
      validation: {},
      options: fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox' ? 
        { choices: [{ label: 'Option 1', value: 'option1' }] } : {},
      permissions: {},
      conditionalLogic: {}
    };

    setFormStructure(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));

    setSelectedField(newField);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormStructure(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));

    if (selectedField?.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const removeField = (fieldId: string) => {
    setFormStructure(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));

    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const saveForm = async () => {
    setIsLoading(true);
    try {
      // API call to save form
      toast.success('Form saved successfully');
    } catch (error) {
      toast.error('Failed to save form');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldPreview = (field: FormField) => {
    const commonProps = {
      className: "input w-full",
      placeholder: field.label,
      required: field.required
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
        return <input type={field.type} {...commonProps} />;
      
      case 'textarea':
        return <textarea {...commonProps} className="textarea w-full" rows={3} />;
      
      case 'number':
        return <input type="number" {...commonProps} />;
      
      case 'select':
        return (
          <select {...commonProps} className="select w-full">
            <option value="">Select an option</option>
            {field.options?.choices?.map((choice: any, index: number) => (
              <option key={index} value={choice.value}>{choice.label}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.choices?.map((choice: any, index: number) => (
              <label key={index} className="flex items-center">
                <input type="radio" name={field.name} value={choice.value} className="mr-2" />
                {choice.label}
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.choices?.map((choice: any, index: number) => (
              <label key={index} className="flex items-center">
                <input type="checkbox" value={choice.value} className="mr-2" />
                {choice.label}
              </label>
            ))}
          </div>
        );
      
      case 'date':
        return <input type="date" {...commonProps} />;
      
      case 'time':
        return <input type="time" {...commonProps} />;
      
      case 'datetime':
        return <input type="datetime-local" {...commonProps} />;
      
      case 'file':
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
          </div>
        );
      
      case 'heading':
        return <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>;
      
      case 'divider':
        return <hr className="border-gray-300" />;
      
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            />
            <span className="badge badge-secondary">{formData.status}</span>
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
              onClick={saveForm}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Form
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'build' && (
          <>
            {/* Field Palette */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Fields</h3>
                
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Field Types */}
                <div className="space-y-2">
                  {fieldTypes
                    .filter(field => field.category === selectedCategory)
                    .map(field => {
                      const Icon = field.icon;
                      return (
                        <button
                          key={field.type}
                          onClick={() => addField(field.type)}
                          className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                        >
                          <Icon className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">{field.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Form Canvas */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-96">
                  {formStructure.fields.length === 0 ? (
                    <div className="text-center py-12">
                      <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building Your Form</h3>
                      <p className="text-gray-600">
                        Drag and drop fields from the left panel to build your form.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formStructure.fields.map((field, index) => (
                        <div
                          key={field.id}
                          onClick={() => setSelectedField(field)}
                          className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                            selectedField?.id === field.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(field.id);
                              }}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                          {renderFieldPreview(field)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Field Properties Panel */}
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                {selectedField ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Properties</h3>
                    
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">Field Label</label>
                        <input
                          type="text"
                          value={selectedField.label}
                          onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                          className="input w-full"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Field Name</label>
                        <input
                          type="text"
                          value={selectedField.name}
                          onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                          className="input w-full"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedField.required}
                          onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        <label className="text-sm text-gray-700">Required field</label>
                      </div>

                      {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                        <div className="form-group">
                          <label className="form-label">Options</label>
                          <div className="space-y-2">
                            {selectedField.options?.choices?.map((choice: any, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={choice.label}
                                  onChange={(e) => {
                                    const newChoices = [...(selectedField.options?.choices || [])];
                                    newChoices[index] = { ...choice, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                                    updateField(selectedField.id, {
                                      options: { ...selectedField.options, choices: newChoices }
                                    });
                                  }}
                                  className="input flex-1"
                                  placeholder="Option label"
                                />
                                <button
                                  onClick={() => {
                                    const newChoices = selectedField.options?.choices?.filter((_: any, i: number) => i !== index);
                                    updateField(selectedField.id, {
                                      options: { ...selectedField.options, choices: newChoices }
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newChoices = [...(selectedField.options?.choices || []), { label: 'New Option', value: 'new_option' }];
                                updateField(selectedField.id, {
                                  options: { ...selectedField.options, choices: newChoices }
                                });
                              }}
                              className="btn btn-outline btn-sm w-full"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Option
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Field Selected</h3>
                    <p className="text-gray-600">
                      Click on a field in the form to edit its properties.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{formData.name}</h1>
                  {formData.description && (
                    <p className="text-gray-600">{formData.description}</p>
                  )}
                </div>

                <form className="space-y-6">
                  {formStructure.fields.map((field) => (
                    <div key={field.id} className="form-group">
                      <label className="form-label">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderFieldPreview(field)}
                    </div>
                  ))}

                  <div className="pt-4">
                    <button type="submit" className="btn btn-primary">
                      Submit Form
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Form Settings</h2>
                
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Form Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input w-full"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="textarea w-full"
                      rows={3}
                      placeholder="Describe what this form is for..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="select w-full"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Layout</label>
                    <select
                      value={formStructure.layout}
                      onChange={(e) => setFormStructure(prev => ({ ...prev, layout: e.target.value as any }))}
                      className="select w-full"
                    >
                      <option value="single-column">Single Column</option>
                      <option value="2-column">Two Columns</option>
                      <option value="3-column">Three Columns</option>
                      <option value="grid">Grid Layout</option>
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