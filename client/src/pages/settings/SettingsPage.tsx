import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  Mail, 
  Key,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [settings, setSettings] = useState({
    general: {
      siteName: 'NoCode System',
      siteDescription: 'Enterprise No-Code Application Management System',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      language: 'en'
    },
    security: {
      requireTwoFactor: false,
      sessionTimeout: 30,
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      allowGuestAccess: false
    },
    notifications: {
      emailNotifications: true,
      formSubmissions: true,
      workflowUpdates: true,
      systemAlerts: true,
      weeklyReports: false
    },
    appearance: {
      theme: 'light',
      primaryColor: '#2563eb',
      sidebarCollapsed: false,
      compactMode: false
    },
    integrations: {
      apiKey: 'sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      webhookUrl: '',
      enableWebhooks: false,
      rateLimitPerHour: 1000
    }
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Database }
  ];

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Site Name</label>
            <input
              type="text"
              value={settings.general.siteName}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, siteName: e.target.value }
              }))}
              className="input w-full"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Timezone</label>
            <select
              value={settings.general.timezone}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, timezone: e.target.value }
              }))}
              className="select w-full"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Site Description</label>
          <textarea
            value={settings.general.siteDescription}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              general: { ...prev.general, siteDescription: e.target.value }
            }))}
            className="textarea w-full"
            rows={3}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Localization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Date Format</label>
            <select
              value={settings.general.dateFormat}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, dateFormat: e.target.value }
              }))}
              className="select w-full"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select
              value={settings.general.language}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, language: e.target.value }
              }))}
              className="select w-full"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Two-Factor Authentication</label>
              <p className="text-sm text-gray-500">Require all users to enable 2FA</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.requireTwoFactor}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, requireTwoFactor: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Allow Guest Access</label>
              <p className="text-sm text-gray-500">Allow unauthenticated users to access public forms</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.allowGuestAccess}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, allowGuestAccess: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Policy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Minimum Password Length</label>
            <input
              type="number"
              value={settings.security.passwordMinLength}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
              }))}
              className="input w-full"
              min="6"
              max="32"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Session Timeout (minutes)</label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
              }))}
              className="input w-full"
              min="5"
              max="480"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Require Special Characters</label>
            <p className="text-sm text-gray-500">Passwords must contain special characters</p>
          </div>
          <input
            type="checkbox"
            checked={settings.security.passwordRequireSpecial}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              security: { ...prev.security, passwordRequireSpecial: e.target.checked }
            }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Email Notifications</label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.emailNotifications}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, emailNotifications: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Form Submissions</label>
              <p className="text-sm text-gray-500">Notify when new forms are submitted</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.formSubmissions}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, formSubmissions: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Workflow Updates</label>
              <p className="text-sm text-gray-500">Notify when workflow stages change</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.workflowUpdates}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, workflowUpdates: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">System Alerts</label>
              <p className="text-sm text-gray-500">Notify about system issues and updates</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.systemAlerts}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, systemAlerts: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Weekly Reports</label>
              <p className="text-sm text-gray-500">Receive weekly activity summaries</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.weeklyReports}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, weeklyReports: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Color Theme</label>
            <select
              value={settings.appearance.theme}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                appearance: { ...prev.appearance, theme: e.target.value }
              }))}
              className="select w-full"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Primary Color</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={settings.appearance.primaryColor}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, primaryColor: e.target.value }
                }))}
                className="h-10 w-20 rounded border border-gray-300"
              />
              <input
                type="text"
                value={settings.appearance.primaryColor}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, primaryColor: e.target.value }
                }))}
                className="input flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Collapsed Sidebar</label>
              <p className="text-sm text-gray-500">Start with sidebar collapsed</p>
            </div>
            <input
              type="checkbox"
              checked={settings.appearance.sidebarCollapsed}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                appearance: { ...prev.appearance, sidebarCollapsed: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Compact Mode</label>
              <p className="text-sm text-gray-500">Use smaller spacing and elements</p>
            </div>
            <input
              type="checkbox"
              checked={settings.appearance.compactMode}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                appearance: { ...prev.appearance, compactMode: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">API Key</label>
            <div className="flex items-center space-x-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.integrations.apiKey}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  integrations: { ...prev.integrations, apiKey: e.target.value }
                }))}
                className="input flex-1"
                readOnly
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="btn btn-outline"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button className="btn btn-primary">
                <Key className="h-4 w-4 mr-2" />
                Regenerate
              </button>
            </div>
            <p className="form-help">Use this key to authenticate API requests</p>
          </div>

          <div className="form-group">
            <label className="form-label">Rate Limit (per hour)</label>
            <input
              type="number"
              value={settings.integrations.rateLimitPerHour}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                integrations: { ...prev.integrations, rateLimitPerHour: parseInt(e.target.value) }
              }))}
              className="input w-full"
              min="100"
              max="10000"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhooks</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Webhooks</label>
              <p className="text-sm text-gray-500">Send HTTP requests when events occur</p>
            </div>
            <input
              type="checkbox"
              checked={settings.integrations.enableWebhooks}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                integrations: { ...prev.integrations, enableWebhooks: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          {settings.integrations.enableWebhooks && (
            <div className="form-group">
              <label className="form-label">Webhook URL</label>
              <input
                type="url"
                value={settings.integrations.webhookUrl}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  integrations: { ...prev.integrations, webhookUrl: e.target.value }
                }))}
                className="input w-full"
                placeholder="https://your-app.com/webhook"
              />
              <p className="form-help">URL to receive webhook notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'integrations':
        return renderIntegrationsSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your system configuration and preferences.
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="card">
            <div className="card-body">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};